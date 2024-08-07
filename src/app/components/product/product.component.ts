import { Component, computed, inject, input } from '@angular/core';
import { NgOptimizedImage } from '@angular/common';
import { CartService } from '../../services/cart.service';
import { ImgComponent } from '../img/img.component';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ProductDto } from '../../dtos/product.dto';
import { CreateOrderItemSelectedOptionDto } from '../../dtos/create-order-item-selected-option.dto';

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
    if (!this.isAllOptionsSelected()) {
      return this.product().variants[0].price;
    }

    const selectedOptions = [...this.selectedOptionsMap.entries()].map(([optionId, optionValueId]) => ({
      optionId: optionId,
      optionValueId: optionValueId,
    }));

    return this.cartService.calcItemPrice(this.product(), selectedOptions);
  }

  private buildOrderItemSelectedOptions(): CreateOrderItemSelectedOptionDto[] {
    return [...this.selectedOptionsMap.entries()].map(([optionId, optionValueId]) => {
      const option = this.product().options.find(option => option.id === optionId);
      const optionValue = option.values.find(optionValue => optionValue.id === optionValueId);

      return {
        optionId: optionId,
        optionValueId: optionValueId,

        runtimeState: {
          optionName: option.name,
          optionValueName: optionValue.name,
        },
      };
    });
  }
}
