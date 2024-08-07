import { computed, effect, EventEmitter, inject, Injectable, signal } from '@angular/core';
import { ICart } from '../interfaces/cart.interface';
import { PaymentType } from '../enums/payment-type.enum';
import { ProductDto } from '../dtos/product.dto';
import { OrderItemSelectedOptionDto } from '../dtos/order-item-selected-option.dto';
import { OrderService } from './order.service';
import { Observable, tap } from 'rxjs';
import { CreateOrUpdateOrderDto } from '../dtos/create-or-update-order.dto';
import { OrderDto } from '../dtos/order.dto';
import { CreateOrderItemSelectedOptionDto } from '../dtos/create-order-item-selected-option.dto';
import { CreateOrderItemDto } from '../dtos/create-order-item.dto';

@Injectable({
  providedIn: 'root',
})
export class CartService {

  private readonly orderService = inject(OrderService);
  private persistedCartsKey = `posh-carts`;

  private _carts = signal<ICart[]>([this.buildEmptyCart()]);
  carts = this._carts.asReadonly();
  currentCartIndex = signal<number>(0);

  paymentType = computed(() => this._carts()[this.currentCartIndex()].paymentType);
  cartItems = computed(() => this._carts()[this.currentCartIndex()].items);
  totalCost = computed(() => this.cartItems().reduce((acc, item) => acc + this.calcItemCost(item), 0));

  buy$ = new EventEmitter<void>();

  constructor() {
    this._carts.set(this.getPersistedCarts());

    effect(() => this.persistCarts(this._carts()));
  }

  addToCart(product: ProductDto, selectedOptions: CreateOrderItemSelectedOptionDto[] = []): void {
    this._carts.update(carts => {
      carts = structuredClone(carts);
      const cart = carts[this.currentCartIndex()];

      const existingCartItem = cart.items.find(cartItem => {
        return cartItem.productId === product.id
          && this.isSelectedOptionsSame(cartItem.selectedOptions, selectedOptions);
      });
      if (existingCartItem) {
        existingCartItem.qty += 1;
      } else {
        cart.items.push({
          productId: product.id,
          qty: 1,
          selectedOptions: selectedOptions,
          runtimeState: {
            name: product.name,
            price: this.calcItemPrice(product, selectedOptions),
          }
        });
      }

      return carts;
    });
  }

  incrementQty(cartItemIndex: number): void {
    this._carts.update(carts => {
      carts = structuredClone(carts);
      const cart = carts[this.currentCartIndex()];

      const existingCartItem = cart.items[cartItemIndex];
      if (existingCartItem) {
        existingCartItem.qty += 1;
      }

      return carts;
    });
  }

  decrementQty(cartItemIndex: number): void {
    this._carts.update(carts => {
      carts = structuredClone(carts);
      const cart = carts[this.currentCartIndex()];

      const existingCartItem = cart.items[cartItemIndex];
      if (existingCartItem) {
        existingCartItem.qty -= 1;
      }

      if (existingCartItem.qty <= 0) {
        cart.items.splice(cartItemIndex, 1);
      }

      return carts;
    });
  }

  onQtyManualChange(): void {
    this._carts.update(carts => structuredClone(carts));
  }

  calcItemCost(cartItem: CreateOrderItemDto): number {
    return cartItem.runtimeState.price * cartItem.qty;
  }

  setPaymentType(paymentType: PaymentType): void {
    this._carts.update(carts => {
      carts = structuredClone(carts);
      const cart = carts[this.currentCartIndex()];
      cart.paymentType = paymentType;
      return carts;
    });
  }

  buy(): Observable<OrderDto | null> {
    const dto: CreateOrUpdateOrderDto = {
      paymentType: this.paymentType(),
      orderItems: this.cartItems(),
      createdAtIso: new Date().toISOString(),
    };

    return this.orderService.create(dto).pipe(tap({
      next: () => {
        this.buy$.next();
        this.deleteCart(this.currentCartIndex());
      },
    }));
  }

  selectCart(cartIndex: number): void {
    this.currentCartIndex.set(cartIndex);
  }

  createNewCart(): void {
    const existingEmptyCart = this._carts().find(cart => !cart.items.length);
    if (existingEmptyCart) {
      alert(`Вже є пусте замовлення`);
      return;
    }

    this._carts.update(carts => {
      carts = structuredClone(carts);
      carts.push(this.buildEmptyCart());

      this.currentCartIndex.set(carts.length - 1);

      return carts;
    });
  }

  deleteCart(cartIndex: number): void {
    this._carts.update(carts => {
      carts = structuredClone(carts);

      carts.splice(cartIndex, 1);

      if (carts.length === 0) {
        carts.push(this.buildEmptyCart());
      }

      let currentCartIndex = this.currentCartIndex();
      while (currentCartIndex > carts.length - 1) {
        currentCartIndex -= 1;
      }
      this.currentCartIndex.set(currentCartIndex);

      return carts;
    });
  }

  calcItemPrice(product: ProductDto, selectedOptions: CreateOrderItemSelectedOptionDto[]): number {
    const variant = product.variants.find(variant => {
      return this.isSelectedOptionsSame(variant.selectedOptions, selectedOptions);
    });

    return variant.price;
  }

  private persistCarts(carts: ICart[]): void {
    localStorage.setItem(this.persistedCartsKey, JSON.stringify(carts));
  }

  private getPersistedCarts(): ICart[] {
    const persistedCarts = localStorage.getItem(this.persistedCartsKey);
    return persistedCarts ? JSON.parse(persistedCarts) : [this.buildEmptyCart()];
  }

  private isSelectedOptionsSame(
    selectedOptions1: CreateOrderItemSelectedOptionDto[],
    selectedOptions2: CreateOrderItemSelectedOptionDto[],
  ): boolean {
    if (selectedOptions1.length !== selectedOptions2.length) {
      return false;
    }

    return selectedOptions1.every(option1 => {
      return selectedOptions2.find(option2 => {
        return option2.optionId === option1.optionId && option2.optionValueId === option1.optionValueId;
      });
    });
  }

  private buildEmptyCart(): ICart {
    return {
      paymentType: null,
      items: [],
      createdAtIso: new Date().toISOString(),
    };
  }
}
