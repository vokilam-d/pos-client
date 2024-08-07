import { PaymentType } from '../enums/payment-type.enum';
import { CreateOrderItemDto } from '../dtos/create-order-item.dto';

export interface ICart {
  paymentType: PaymentType;
  items: CreateOrderItemDto[];
  createdAtIso: string;
}
