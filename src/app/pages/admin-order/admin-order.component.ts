import { Component, inject, signal } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { PageContentComponent } from '../../components/page-content/page-content.component';
import { OrderDto } from '../../dtos/order.dto';
import { ToastrService } from 'ngx-toastr';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { finalize } from 'rxjs';
import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DatePipe } from '@angular/common';
import { PaymentType } from '../../enums/payment-type.enum';
import { MatButton } from '@angular/material/button';

@Component({
  selector: 'app-admin-order',
  standalone: true,
  imports: [
    PageContentComponent,
    PreloaderComponent,
    DatePipe,
    MatButton,
  ],
  templateUrl: './admin-order.component.html',
  styleUrl: './admin-order.component.scss'
})
export class AdminOrderComponent {
  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  orderId = signal<string | null>(null);
  order = signal<OrderDto>(null);
  isLoading = signal<boolean>(false);

  readonly paymentTypeEnum = PaymentType;

  constructor() {
    this.route.params
      .pipe(takeUntilDestroyed())
      .subscribe(params => params['orderId'] ? this.init(params['orderId']) : null );
  }

  private init(orderId: string) {
    this.orderId.set(orderId);

    this.isLoading.set(true);
    this.orderService.fetchOrderById(this.orderId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(
        response => {
          this.order.set(response);
        },
        error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати замовлення`),
      );
  }

  deleteOrder() {
    if (!confirm(`Ви впевнені що хочете видалити це замовлення?`)
    ) {
      return;
    }

    this.isLoading.set(true);
    this.orderService.deleteOrder(this.orderId())
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(
        () => {
          this.router.navigate(['..'], { relativeTo: this.route });
          this.toastr.success(`Успішно видалено`, undefined);
        },
        error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося видалити замовлення`),
      );
  }
}
