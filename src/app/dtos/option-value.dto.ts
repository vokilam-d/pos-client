import { uuid } from '../utils/uuid.util';

export class OptionValueDto {
  id: string = uuid();
  name: string = '';

  constructor(name: string = '') {
    this.name = name;
  }
}
