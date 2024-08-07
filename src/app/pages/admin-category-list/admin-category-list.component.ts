import { Component, inject, OnInit, signal } from '@angular/core';
import { CategoryService } from '../../services/category.service';
import { RouterLink } from '@angular/router';
import { CdkDrag, CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import { PageContentComponent } from '../../components/page-content/page-content.component';
import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
import { finalize } from 'rxjs';
import { CategoryDto } from '../../dtos/category.dto';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { ToastrService } from 'ngx-toastr';
import { ReorderCategoryDto } from '../../dtos/reorder-categories.dto';
import { buildPhotoUrl } from '../../utils/build-photo-url.util';
import { ProductService } from '../../services/product.service';

@Component({
  selector: 'app-admin-category-list',
  standalone: true,
  imports: [
    RouterLink,
    CdkDropList,
    CdkDrag,
    PageContentComponent,
    PreloaderComponent,
  ],
  templateUrl: './admin-category-list.component.html',
  styleUrl: './admin-category-list.component.scss'
})
export class AdminCategoryListComponent implements OnInit {

  private readonly categoryService = inject(CategoryService);
  private readonly productService = inject(ProductService);
  private readonly toastr = inject(ToastrService);

  isLoading = signal<boolean>(false);
  categories = signal<CategoryDto[]>([]);

  ngOnInit() {
    this.fetchCategories();
  }

  drop(event: CdkDragDrop<unknown>): void {
    if (event.previousIndex === event.currentIndex) {
      return;
    }

    const copyCategories = structuredClone(this.categories());
    const [movedCategory] = copyCategories.splice(event.previousIndex, 1);
    copyCategories.splice(event.currentIndex, 0, movedCategory);

    const from = Math.min(event.previousIndex, event.currentIndex);
    const to = Math.max(event.previousIndex, event.currentIndex);

    const reorderCategoryDtos: ReorderCategoryDto[] = copyCategories
      .slice(from, to + 1)
      .map((category, index) => ({ id: category.id, newSortOrder: index }));

    const originalCategories = this.categories();
    this.categories.set(copyCategories);

    this.isLoading.set(true);
    this.categoryService.reorderCategories(reorderCategoryDtos)
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(
        response => this.categories.set(response),
        error => {
          this.categories.set(originalCategories);
          this.toastr.error(getHttpErrorMessage(error), `Не вдалося пересортувати категорії`)
        },
      );
  }

  private fetchCategories() {
    this.isLoading.set(true);

    this.categoryService.fetchCategories()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(
        response => this.categories.set(response),
        error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати категорії`),
      );
  }

  protected readonly buildPhotoUrl = buildPhotoUrl;

  countProducts(category: CategoryDto) {
    return this.productService.cachedProducts().filter(product => product.categoryId === category.id).length;
  }
}
