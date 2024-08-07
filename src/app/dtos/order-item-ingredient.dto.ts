import { Unit } from '../enums/unit.enum';

export class OrderItemIngredientDto {
  ingredientId: string;
  name: string;
  unit: Unit;
  price: number;
  qty: number;
  cost: number;
}
