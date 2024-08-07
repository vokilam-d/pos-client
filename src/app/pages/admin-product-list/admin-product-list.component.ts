import { Component, inject, OnInit, signal } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { RouterLink } from '@angular/router';
import { PageContentComponent } from '../../components/page-content/page-content.component';
import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
import { finalize } from 'rxjs';
import { ProductDto } from '../../dtos/product.dto';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { ToastrService } from 'ngx-toastr';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow,
  MatHeaderRowDef,
  MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
import { CategoryService } from '../../services/category.service';
import { buildPhotoUrl } from '../../utils/build-photo-url.util';
import { MatAnchor } from '@angular/material/button';

@Component({
  selector: 'app-admin-product-list',
  standalone: true,
  imports: [
    RouterLink,
    PageContentComponent,
    PreloaderComponent,
    MatTable,
    MatColumnDef,
    MatHeaderCell,
    MatHeaderCellDef,
    MatCellDef,
    MatCell,
    MatHeaderRow,
    MatRow,
    MatHeaderRowDef,
    MatRowDef,
    MatNoDataRow,
    MatAnchor,
  ],
  templateUrl: './admin-product-list.component.html',
  styleUrl: './admin-product-list.component.scss'
})
export class AdminProductListComponent implements OnInit {

  private readonly productService = inject(ProductService);
  readonly categoryService = inject(CategoryService);
  private readonly toastr = inject(ToastrService);

  isLoading = signal<boolean>(false);
  products = signal<ProductDto[]>([]);
  displayedColumns: ((keyof ProductDto) | string)[] = ['photoUrl', 'name', 'price', 'categoryId', 'options'];

  ngOnInit() {
    this.fetchProducts();
  }

  private fetchProducts() {
    this.isLoading.set(true);

    this.productService.fetchProducts()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe({
        next: response => this.products.set(response),
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати товари`),
      });
  }

  getPriceRange(productDto: ProductDto): string {
    const prices = productDto.variants.map(variant => variant.price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);

    let range = `${min}`;
    if (min !== max) {
      range += `-${max}`;
    }
    return range;
  }

  /**
   * Workaround for type-checking, see: https://stackoverflow.com/a/61682343/7499769
   */
  p(product: ProductDto) { return product; }

  protected readonly buildPhotoUrl = buildPhotoUrl;
}
