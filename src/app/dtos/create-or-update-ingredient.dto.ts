import { Unit } from '../enums/unit.enum';

export class CreateOrUpdateIngredientDto {
  name: string = '';
  unit: Unit = Unit.Pcs;
  price: number = 0;
  qty: number = 0;
}
