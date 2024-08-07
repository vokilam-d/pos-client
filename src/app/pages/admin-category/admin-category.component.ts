import { Component, DestroyRef, inject, signal } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { PageContentComponent } from '../../components/page-content/page-content.component';
import { CategoryDto } from '../../dtos/category.dto';
import { CreateOrUpdateCategoryDto } from '../../dtos/create-or-update-category.dto';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { finalize } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { PhotoUploaderComponent } from '../../components/photo-uploader/photo-uploader.component';
import { environment } from '../../../environments/environment';
import { PhotoAssetComponent } from '../../components/photo-asset/photo-asset.component';
import { MatButton } from '@angular/material/button';
import { MatFormField, MatLabel } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { RouteDataKey } from '../../enums/route-data-key.enum';
import { PAGE_ACTION_ADD } from '../../constants';
import { RouteParamKey } from '../../enums/route-param-key.enum';

type CategoryForm = Record<keyof CreateOrUpdateCategoryDto, FormControl>;

@Component({
  selector: 'app-admin-category',
  standalone: true,
  imports: [
    PageContentComponent,
    MatProgressSpinner,
    ReactiveFormsModule,
    PreloaderComponent,
    PhotoUploaderComponent,
    PhotoAssetComponent,
    MatButton,
    MatFormField,
    MatInput,
    MatLabel,
  ],
  templateUrl: './admin-category.component.html',
  styleUrl: './admin-category.component.scss'
})
export class AdminCategoryComponent {
  categoryId = signal<string | null>(null);
  category = signal<CategoryDto | CreateOrUpdateCategoryDto>(null);
  isLoading = signal<boolean>(false);

  form: FormGroup<CategoryForm>;

  readonly isNewCategory: boolean = false;
  readonly isNewCategoryBasedOnId: string = null;

  readonly photoUploadUrl = `${environment.apiUrl}/categories/photo`;

  readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.isNewCategory = this.route.snapshot.data[RouteDataKey.PageAction] === PAGE_ACTION_ADD;
    this.isNewCategoryBasedOnId = this.route.snapshot.params[RouteParamKey.NewItemBasedOn];

    if (this.isNewCategory) {
      this.init();
    } else {
      this.route.params
        .pipe(takeUntilDestroyed(), )
        .subscribe(params => {
          this.categoryId.set(params[RouteParamKey.NewItem]);
          this.init();
        });
    }
  }

  save() {
    const dto: CreateOrUpdateCategoryDto = {
      ...this.category(),
      ...this.form.getRawValue(),
    };

    const request = this.isNewCategory
      ? this.categoryService.create(dto)
      : this.categoryService.update(this.categoryId(), dto);

    this.isLoading.set(true);
    request
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: response => {
          if (this.isNewCategory) {
            this.router.navigate(['..', response.id], { relativeTo: this.route }).then();
          } else {
            this.category.set(response);
          }
          this.toastr.success(`Успішно збережено`);
        },
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося зберегти категорію`),
      });
  }

  private init() {
    if (!this.isNewCategory || (this.isNewCategory && this.isNewCategoryBasedOnId)) {
      const categoryId = (this.isNewCategory && this.isNewCategoryBasedOnId) || this.categoryId();

      this.isLoading.set(true);
      this.categoryService.fetchCategoryById(categoryId)
        .pipe(
          finalize(() => this.isLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: response => {
            this.category.set(response);
            this.buildForm();
          },
          error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати категорію`),
        });
    } else {
      this.category.set(new CreateOrUpdateCategoryDto());
      this.buildForm();
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group<CreateOrUpdateCategoryDto>({
      name: this.category().name,
      photoUrl: this.category().photoUrl,
      sortOrder: this.category().sortOrder,
    });
  }

  deleteCategory() {
    if (
      this.isNewCategory
      || !confirm(`Ви впевнені що хочете видалити категорію "${this.category().name}"?`)
    ) {
      return;
    }

    this.isLoading.set(true);
    this.categoryService.deleteCategory(this.categoryId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['..'], { relativeTo: this.route }).then();
          this.toastr.success(`Успішно видалено`, undefined);
        },
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося видалити категорію`),
      });
  }

  onPhotoUpload(photoUrl: string): void {
    this.form.controls.photoUrl.setValue(photoUrl);
  }
}
