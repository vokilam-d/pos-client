import { Component, inject, signal } from '@angular/core';
import { IngredientService } from '../../services/ingredient.service';
import { PageContentComponent } from '../../components/page-content/page-content.component';
import { IngredientDto } from '../../dtos/ingredient.dto';
import { CreateOrUpdateIngredientDto } from '../../dtos/create-or-update-ingredient.dto';
import { FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { finalize } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Unit } from '../../enums/unit.enum';
import { IngredientUnitPipe } from '../../pipes/ingredient-unit.pipe';
import { MatAnchor, MatButton } from '@angular/material/button';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { PAGE_ACTION_ADD } from '../../constants';
import { RouteDataKey } from '../../enums/route-data-key.enum';
import { RouteParamKey } from '../../enums/route-param-key.enum';

class IngredientForm implements Record<keyof CreateOrUpdateIngredientDto, unknown> {
  name: FormControl<string>;
  price: FormControl<number>;
  qty: FormControl<number>;
  unit: FormControl<Unit>;
}

@Component({
  selector: 'app-admin-ingredient',
  standalone: true,
  imports: [
    PageContentComponent,
    MatProgressSpinner,
    ReactiveFormsModule,
    PreloaderComponent,
    MatFormFieldModule,
    MatInputModule,
    IngredientUnitPipe,
    MatOption,
    MatSelect,
    MatButton,
    MatAnchor,
    RouterLink,
  ],
  templateUrl: './admin-ingredient.component.html',
  styleUrl: './admin-ingredient.component.scss'
})
export class AdminIngredientComponent {
  readonly ingredientService = inject(IngredientService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  ingredientId = signal<string | null>(null);
  ingredient = signal<IngredientDto>(null);
  isLoading = signal<boolean>(false);

  isNewIngredient: boolean = false;
  isNewIngredientBasedOnId: string = null;
  form: FormGroup<IngredientForm>;
  units = Object.values<Unit>(Unit);

  constructor() {
    this.isNewIngredient = this.route.snapshot.data[RouteDataKey.PageAction] === PAGE_ACTION_ADD;
    this.isNewIngredientBasedOnId = this.route.snapshot.params[RouteParamKey.NewItemBasedOn];

    if (this.isNewIngredient) {
      this.init();
    } else {
      this.route.params
        .pipe(takeUntilDestroyed(), )
        .subscribe(params => {
          this.ingredientId.set(params[RouteParamKey.NewItem]);
          this.init();
        });
    }
  }

  getBackToListUrl(): string[] {
    let commands: string = '../';
    if (this.isNewIngredient && this.isNewIngredientBasedOnId) {
      commands += '../';
    }
    return [commands];
  }

  save(postAction?: 'close') {
    const dto: CreateOrUpdateIngredientDto = {
      ...this.ingredient(),
      ...this.form.getRawValue(),
    };

    const request = this.isNewIngredient
      ? this.ingredientService.create(dto)
      : this.ingredientService.update(this.ingredientId(), dto);

    this.isLoading.set(true);
    request
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: response => {
          this.toastr.success(`Успішно збережено`);

          if (postAction === 'close') {
            this.router.navigate(this.getBackToListUrl(), { relativeTo: this.route }).then();
            return;
          }

          if (this.isNewIngredient) {
            const url = [this.getBackToListUrl(), response.id].join('');
            this.router.navigate([url], { relativeTo: this.route }).then();
          } else {
            this.ingredient.set(response);
            this.buildForm();
          }
        },
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося зберегти інгредієнт`),
      });
  }

  private init() {
    if (!this.isNewIngredient || (this.isNewIngredient && this.isNewIngredientBasedOnId)) {
      const ingredientId = (this.isNewIngredient && this.isNewIngredientBasedOnId) || this.ingredientId();

      this.isLoading.set(true);
      this.ingredientService.fetchIngredientById(ingredientId)
        .pipe(finalize(() => this.isLoading.set(false)))
        .subscribe({
          next: response => {
            this.ingredient.set(response);
            this.buildForm();
          },
          error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати інгредієнт`),
        });
    } else {
      this.ingredient.set(new IngredientDto());
      this.buildForm();
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group<IngredientForm>({
      name: this.formBuilder.control(this.ingredient().name),
      qty: this.formBuilder.control(this.ingredient().qty),
      price: this.formBuilder.control(this.ingredient().price),
      unit: this.formBuilder.control(this.ingredient().unit),
    });
  }

  deleteIngredient() {
    if (
      this.isNewIngredient
      || !confirm(`Ви впевнені що хочете видалити інгредієнт "${this.ingredient().name}"?`)
    ) {
      return;
    }

    this.isLoading.set(true);
    this.ingredientService.deleteIngredient(this.ingredientId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: () => {
          this.router.navigate(['..'], { relativeTo: this.route }).then();
          this.toastr.success(`Успішно видалено`, undefined);
        },
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося видалити інгредієнт`),
      });
  }
}
