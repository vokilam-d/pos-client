import { Pipe, PipeTransform } from '@angular/core';
import { Unit } from '../enums/unit.enum';

@Pipe({
  name: 'unit',
  standalone: true,
})
export class IngredientUnitPipe implements PipeTransform {

  transform(unit: Unit): string {
    switch (unit) {
      case Unit.Pcs:
        return 'шт.';
      case Unit.Kg:
        return 'кг.';
      case Unit.G:
        return 'гр.';
      case Unit.L:
        return 'л.';
      case Unit.Ml:
        return 'мл.';
    }
  }

}
