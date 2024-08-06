import { Component, inject, OnInit, signal } from '@angular/core';
import { OrderService } from '../../services/order.service';
import { RouterLink } from '@angular/router';
import { PageContentComponent } from '../../components/page-content/page-content.component';
import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
import { finalize } from 'rxjs';
import { OrderDto } from '../../dtos/order.dto';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { ToastrService } from 'ngx-toastr';
import {
  MatCell,
  MatCellDef,
  MatColumnDef,
  MatHeaderCell,
  MatHeaderCellDef,
  MatHeaderRow, MatHeaderRowDef, MatNoDataRow, MatRow, MatRowDef,
  MatTable,
} from '@angular/material/table';
import { OrderItemDto } from '../../dtos/order-item.dto';
import { DatePipe } from '@angular/common';
import { PaymentType } from '../../enums/payment-type.enum';

@Component({
  selector: 'app-admin-order-list',
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
    DatePipe,
  ],
  templateUrl: './admin-order-list.component.html',
  styleUrl: './admin-order-list.component.scss'
})
export class AdminOrderListComponent implements OnInit {

  private readonly orderService = inject(OrderService);
  private readonly toastr = inject(ToastrService);

  isLoading = signal<boolean>(false);
  orders = signal<OrderDto[]>([]);
  // displayedColumns: (keyof OrderDto)[] = ['id', 'createdAtIso', 'orderItems', 'paymentType', 'totalCost'];
  displayedColumns: (keyof OrderDto)[] = ['id', 'createdAtIso', 'orderItems', 'paymentType'];

  ngOnInit() {
    this.fetchOrders();
  }

  private fetchOrders() {
    this.isLoading.set(true);

    this.orderService.fetchOrders()
      .pipe(finalize(() => this.isLoading.set(false)))
      .subscribe(
        response => this.orders.set(response),
        error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати список замовлень`),
      );
  }

  getOrderItemNames(orderItems: OrderItemDto[]): string {
    // return orderItems.map(orderItem => orderItem.productName).join(', ');
    return null;
  }

  protected readonly paymentTypeEnum = PaymentType;
}
