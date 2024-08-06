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
  MatHeaderRowDef, MatNoDataRow,
  MatRow,
  MatRowDef,
  MatTable,
} from '@angular/material/table';
// import { SelectedProductOptionDto } from '../../dtos/selected-product-option.dto';
// import { ProductOptionService } from '../../services/product-option.service';
import { CategoryService } from '../../services/category.service';
import { buildPhotoUrl } from '../../utils/build-photo-url.util';

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
  ],
  templateUrl: './admin-product-list.component.html',
  styleUrl: './admin-product-list.component.scss'
})
export class AdminProductListComponent implements OnInit {

  private readonly productService = inject(ProductService);
  readonly categoryService = inject(CategoryService);
  // private readonly productOptionService = inject(ProductOptionService);
  private readonly toastr = inject(ToastrService);

  isLoading = signal<boolean>(false);
  products = signal<ProductDto[]>([]);
  // displayedColumns: (keyof ProductDto)[] = ['photoUrl', 'name', 'price', 'categoryId', 'options'];
  displayedColumns: (keyof ProductDto)[] = ['photoUrl', 'name', 'categoryId', 'options'];

  ngOnInit() {
    this.fetchProducts();
  }

  private fetchProducts() {
    this.isLoading.set(true);

    this.productService.fetchProducts()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(
        response => this.products.set(response),
        error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати товари`),
      );
  }

  // getOptionsNames(options: SelectedProductOptionDto[]): string {
  getOptionsNames(options): string {
    // return options?.map(option => this.productOptionService.getProductOptionName(option.optionId)).join(', ');
    return null;
  }

  protected readonly buildPhotoUrl = buildPhotoUrl;
}
