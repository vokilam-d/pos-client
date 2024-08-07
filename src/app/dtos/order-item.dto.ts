import { OrderItemSelectedOptionDto } from './order-item-selected-option.dto';
import { OrderItemIngredientDto } from './order-item-ingredient.dto';
import { CreateOrderItemDto } from './create-order-item.dto';


export class OrderItemDto extends CreateOrderItemDto {
  name: string;
  photoUrl: string;
  override selectedOptions: OrderItemSelectedOptionDto[];
  ingredients: OrderItemIngredientDto[];
  primeCost: number;
  markupPercent: number;
  price: number;
  profit: number;
  totalPrice: number;
  totalProfit: number;
}
