import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { CartService } from '../../services/cart.service';
import { FormsModule } from '@angular/forms';
import { PaymentType } from '../../enums/payment-type.enum';
import { KeyValuePipe } from '@angular/common';
import { MatDialog } from '@angular/material/dialog';
import { CashCalculatorComponent } from '../cash-calculator/cash-calculator.component';
import { PreloaderComponent } from '../page-preloader/preloader.component';
import { finalize } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    FormsModule,
    KeyValuePipe,
    PreloaderComponent,
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent {

  readonly cartService = inject(CartService);
  private readonly dialog = inject(MatDialog);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toastr = inject(ToastrService);

  paymentTypeEnum = PaymentType;

  isLoading = signal<boolean>(false);
  canOpenCashCalculator = computed<boolean>(() => {
    return this.cartService.cartItems().length && this.cartService.paymentType() === PaymentType.Cash;
  });
  canBuy = computed<boolean>(() => this.cartService.cartItems().length && !!this.cartService.paymentType());

  openCashCalculator() {
    const calcRef = this.dialog.open(CashCalculatorComponent);
    calcRef.componentInstance.buy$.subscribe(() => this.buy(calcRef.componentInstance));
  }

  buy(calcComponentInstance?: CashCalculatorComponent) {
    this.isLoading.set(true);
    this.cartService.buy()
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: response => {
          if (response) {
            this.toastr.success(`Замовлення успішно створене`);
          } else {
            this.toastr.info(`Замовлення авто-створиться після підключення до інтернету`);
          }

          if (calcComponentInstance) {
            calcComponentInstance.dialogRef.close();
          }
        },
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося створити замовлення`),
      });
  }
}
