import { CreateOrderItemSelectedOptionDto } from './create-order-item-selected-option.dto';

export class CreateOrderItemDto {
  productId: string = null;
  selectedOptions: CreateOrderItemSelectedOptionDto[] = [];
  qty: number = 0;
}
