import { PaymentType } from '../enums/payment-type.enum';
import { CreateOrderItemDto } from './create-order-item.dto';

export class CreateOrUpdateOrderDto {
  orderItems: CreateOrderItemDto[] = [];
  paymentType: PaymentType = null;
  createdAtIso: string = null;
}
