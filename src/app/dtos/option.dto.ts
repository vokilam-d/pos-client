import { OptionValueDto } from './option-value.dto';
import { uuid } from '../utils/uuid.util';

export class OptionDto {
  id: string = uuid();
  name: string = '';
  values: OptionValueDto[] = [];
}
