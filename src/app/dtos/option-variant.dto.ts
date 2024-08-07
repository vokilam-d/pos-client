import { SelectedOptionDto } from './selected-option.dto';
import { SelectedIngredientDto } from './selected-ingredient.dto';

export class OptionVariantDto {
  selectedOptions: SelectedOptionDto[] = [];
  ingredients: SelectedIngredientDto[] = [];
  primeCost: number = 0;
  markupPercent: number = 0;
  price: number = 0;
}
