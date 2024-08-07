export class CreateOrderItemSelectedOptionDto {
  optionId: string = null;
  optionValueId: string = null;

  // custom transforms
  runtimeState?: {
    optionName: string;
    optionValueName: string;
  } = {
    optionName: '',
    optionValueName: '',
  };
}
