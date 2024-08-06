// import { Component, inject, OnInit, signal } from '@angular/core';
// import { ProductOptionService } from '../../services/product-option.service';
// import { RouterLink } from '@angular/router';
// import { CdkDrag, CdkDropList } from '@angular/cdk/drag-drop';
// import { PageContentComponent } from '../../components/page-content/page-content.component';
// import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
// import { finalize } from 'rxjs';
// import { ProductOptionDto } from '../../dtos/product-option.dto';
// import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
// import { ToastrService } from 'ngx-toastr';
// import {
//   MatCell,
//   MatCellDef,
//   MatColumnDef,
//   MatHeaderCell,
//   MatHeaderCellDef,
//   MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef,
//   MatTable,
// } from '@angular/material/table';
// import { ProductOptionValueDto } from '../../dtos/product-option-value.dto';
//
// @Component({
//   selector: 'app-admin-product-option-list',
//   standalone: true,
//   imports: [
//     RouterLink,
//     PageContentComponent,
//     PreloaderComponent,
//     MatTable,
//     MatColumnDef,
//     MatHeaderCell,
//     MatHeaderCellDef,
//     MatCellDef,
//     MatCell,
//     MatHeaderRow,
//     MatRow,
//     MatHeaderRowDef,
//     MatRowDef,
//     MatNoDataRow,
//   ],
//   templateUrl: './admin-product-option-list.component.html',
//   styleUrl: './admin-product-option-list.component.scss'
// })
// export class AdminProductOptionListComponent implements OnInit {
//
//   private readonly productOptionService = inject(ProductOptionService);
//   private readonly toastr = inject(ToastrService);
//
//   isLoading = signal<boolean>(false);
//   productOptions = signal<ProductOptionDto[]>([]);
//   displayedColumns: (keyof ProductOptionDto)[] = ['name', 'values'];
//
//   ngOnInit() {
//     this.fetchProductOptions();
//   }
//
//   private fetchProductOptions() {
//     this.isLoading.set(true);
//
//     this.productOptionService.fetchProductOptions()
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe(
//         response => this.productOptions.set(response),
//         error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати опції товарів`),
//       );
//   }
//
//   getValueNames(values: ProductOptionValueDto[]): string {
//     return values.map(value => value.name).join(', ');
//   }
// }
