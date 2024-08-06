import { SelectedIngredientDto } from './selected-ingredient.dto';
import { OptionVariantDto } from './option-variant.dto';
import { OptionDto } from './option.dto';

export class CreateOrUpdateProductDto {
  name: string = '';
  categoryId: string = null;
  ingredients: SelectedIngredientDto[] = [];
  options: OptionDto[] = [];
  variants: OptionVariantDto[] = [new OptionVariantDto()];
  purchasePrice: number = 0;
  photoUrl: string = null;
  sortOrder: number = 0;
}
