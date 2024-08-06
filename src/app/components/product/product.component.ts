import { Component, computed, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ImgComponent } from '../img/img.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductDto } from '../../dtos/product.dto';
// import { ProductOptionService } from '../../services/product-option.service';
// import { SelectedProductOptionDto } from '../../dtos/selected-product-option.dto';
import { OrderItemSelectedOptionDto } from '../../dtos/order-item-selected-option.dto';

@Component({
  selector: 'app-product',
  standalone: true,
  imports: [
    NgOptimizedImage,
    ImgComponent,
  ],
  templateUrl: './product.component.html',
  styleUrl: './product.component.scss'
})
export class ProductComponent {

  product = input.required<ProductDto>();
  hasOptions = computed<boolean>(() => this.product().options.length > 0);
  selectedOptionsMap: Map<string, string> = new Map();

  private readonly cartService = inject(CartService);
  // readonly productOptionService = inject(ProductOptionService);

  constructor() {
    this.cartService.buy$
      .pipe(takeUntilDestroyed())
      .subscribe(() => this.selectedOptionsMap.clear());
  }
  onClick() {
    if (this.hasOptions()) {
      return;
    }

    this.cartService.addToCart(this.product());
  }

  isOptionValueSelected(optionId: string, optionValueId: string): boolean {
    return this.selectedOptionsMap.get(optionId) === optionValueId;
  }

  selectOptionValue(optionId: string, optionValueId: string): void {
    this.isOptionValueSelected(optionId, optionValueId)
      ? this.selectedOptionsMap.delete(optionId)
      : this.selectedOptionsMap.set(optionId, optionValueId);
  }

  addToCart(): void {
    if (!this.isAllOptionsSelected()) {
      return;
    }

    this.cartService.addToCart(this.product(), this.buildOrderItemSelectedOptions());
  }

  isAllOptionsSelected(): boolean {
    if (!this.hasOptions()) {
      return true;
    }

    return this.selectedOptionsMap.size === this.product().options.length;
  }

  calcPrice(): number {
    return 0;
    // return this.product().options.reduce(
    //   (acc, option) => {
    //     return this.selectedOptionsMap.has(option.optionId)
    //       ? acc + this.getPriceOfSelectedOptionValue(option)
    //       : acc;
    //   },
    //   this.product().price,
    // );
  }

  private buildOrderItemSelectedOptions(): OrderItemSelectedOptionDto[] {
    // return this.product().options
    //   .filter(option => this.selectedOptionsMap.has(option.optionId))
    //   .map(option => {
    //     const selectedValueId = this.selectedOptionsMap.get(option.optionId);
    //
    //     const optionDto = this.productOptionService.getProductOption(option.optionId);
    //     const optionValueDto = optionDto.values.find(valueDto => valueDto.id === selectedValueId);
    //
    //     return {
    //       optionId: optionDto.id,
    //       optionName: optionDto.name,
    //       optionValueId: optionValueDto.id,
    //       optionValueName: optionValueDto.name,
    //       priceDiff: this.getPriceOfSelectedOptionValue(option),
    //     };
    //   });
    return [];
  }

  // private getPriceOfSelectedOptionValue(selectedOption: SelectedProductOptionDto): number {
  //   const selectedValueId = this.selectedOptionsMap.get(selectedOption.optionId);
  //   const selectedValue = selectedOption.optionValues.find(value => value.optionValueId === selectedValueId);
  //
  //   const optionDto = this.productOptionService.getProductOption(selectedOption.optionId);
  //   const optionValueDto = optionDto.values.find(valueDto => valueDto.id === selectedValueId);
  //
  //   return selectedValue.isPriceDiffOverridden ? selectedValue.priceDiff : optionValueDto.priceDiff;
  // }
}
