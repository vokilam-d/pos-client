// import { computed, inject, Injectable } from '@angular/core';
// import { HttpClient } from '@angular/common/http';
// import { environment } from '../../environments/environment';
// import { ToastrService } from 'ngx-toastr';
// import { getHttpErrorMessage } from '../utils/get-http-error-message.util';
// import { filter, Observable, tap } from 'rxjs';
// import { ProductOptionDto } from '../dtos/product-option.dto';
// import { CreateOrUpdateProductOptionDto } from '../dtos/create-or-update-product-option.dto';
// import { ProductOptionValueDto } from '../dtos/product-option-value.dto';
// import { ConnectionService } from './connection.service';
// import { CacheService } from './cache.service';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
//
// @Injectable({
//   providedIn: 'root'
// })
// export class ProductOptionService {
//
//   cachedProductOptions = computed<ProductOptionDto[]>(() => {
//     return this.cacheService.getFromCache<ProductOptionDto[]>(this.cacheTypeKey, []);
//   });
//
//   private readonly httpClient = inject(HttpClient);
//   private readonly toastr = inject(ToastrService);
//   private readonly connectionService = inject(ConnectionService);
//   private readonly cacheService = inject(CacheService);
//
//   private readonly apiUrl = `${environment.apiUrl}/product-options`;
//   private readonly cacheTypeKey = `product-options`;
//
//   constructor() {
//     this.fetchAndCacheProductOptions();
//     if (this.connectionService.isOnline) {
//       this.fetchAndCacheProductOptions();
//     } else {
//       this.connectionService.isOnline$
//         .pipe(
//           filter(isOnline => isOnline),
//           takeUntilDestroyed(),
//         )
//         .subscribe(() => this.fetchAndCacheProductOptions());
//     }
//   }
//
//   private fetchAndCacheProductOptions(): void {
//     this.fetchProductOptions().subscribe(
//       response => this.addToCache(response),
//       error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося закешувати опції товарів`),
//     );
//   }
//
//   getProductOption(optionId: string): ProductOptionDto {
//     return this.cachedProductOptions().find(option => option.id === optionId);
//   }
//
//   getProductOptionName(optionId: string): string {
//     return this.getProductOption(optionId)?.name;
//   }
//
//   getProductOptionValue(optionId: string, valueId: string): ProductOptionValueDto {
//     return this.cachedProductOptions()
//       .find(option => option.id === optionId)
//       ?.values
//       .find(value => value.id === valueId);
//   }
//
//   getProductOptionValueName(optionId: string, valueId: string): string {
//     return this.getProductOptionValue(optionId, valueId)?.name;
//   }
//
//   fetchProductOptions(): Observable<ProductOptionDto[]> {
//     return this.httpClient.get<ProductOptionDto[]>(this.apiUrl);
//   }
//
//   fetchProductOptionById(productOptionId: string): Observable<ProductOptionDto> {
//     return this.httpClient.get<ProductOptionDto>(`${this.apiUrl}/${productOptionId}`);
//   }
//
//   create(productOptionDto: CreateOrUpdateProductOptionDto): Observable<ProductOptionDto> {
//     return this.httpClient.post<ProductOptionDto>(this.apiUrl, productOptionDto)
//       .pipe(tap(() => this.fetchAndCacheProductOptions()));
//   }
//
//   update(productOptionId: string, productOptionDto: CreateOrUpdateProductOptionDto): Observable<ProductOptionDto> {
//     return this.httpClient.put<ProductOptionDto>(`${this.apiUrl}/${productOptionId}`, productOptionDto)
//       .pipe(tap(() => this.fetchAndCacheProductOptions()));
//   }
//
//   deleteProductOption(productOptionId: string): Observable<ProductOptionDto> {
//     return this.httpClient.delete<ProductOptionDto>(`${this.apiUrl}/${productOptionId}`)
//       .pipe(tap(() => this.fetchAndCacheProductOptions()));
//   }
//
//   private addToCache(productOptions: ProductOptionDto[]): void {
//     this.cacheService.addToCache(this.cacheTypeKey, productOptions);
//   }
// }
