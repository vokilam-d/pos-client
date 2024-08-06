import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PageContentComponent } from '../../components/page-content/page-content.component';
import { ProductDto } from '../../dtos/product.dto';
import { CreateOrUpdateProductDto } from '../../dtos/create-or-update-product.dto';
import { FormArray, FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { finalize } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
import { ActivatedRoute, Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatOption, MatSelect } from '@angular/material/select';
import { CategoryService } from '../../services/category.service';
import { MatCheckbox } from '@angular/material/checkbox';
import { PhotoAssetComponent } from '../../components/photo-asset/photo-asset.component';
import { PhotoUploaderComponent } from '../../components/photo-uploader/photo-uploader.component';
import { environment } from '../../../environments/environment';
import { SelectedIngredientDto } from '../../dtos/selected-ingredient.dto';
import { SelectedOptionDto } from '../../dtos/selected-option.dto';
import { OptionDto } from '../../dtos/option.dto';
import { OptionValueDto } from '../../dtos/option-value.dto';
import { OptionVariantDto } from '../../dtos/option-variant.dto';
import { IngredientDto } from '../../dtos/ingredient.dto';
import { IngredientUnitPipe } from '../../pipes/ingredient-unit.pipe';
import { JsonPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';


class ProductForm implements Record<keyof CreateOrUpdateProductDto, unknown> {
  name: FormControl<string>;
  categoryId: FormControl<string>;
  photoUrl: FormControl<string>;
  purchasePrice: FormControl<number>;
  sortOrder: FormControl<number>;
  ingredients: FormArray<FormGroup<IngredientForm>>;
  options: FormArray<FormGroup<OptionForm>>;
  variants: FormArray<FormGroup<VariantForm>>;
}
class OptionForm implements Record<keyof OptionDto, unknown> {
  id: FormControl<string>;
  name: FormControl<string>;
  values: FormArray<FormGroup<OptionValueForm>>;
  isAddingValue: FormControl<boolean>;
}
class OptionValueForm implements Record<keyof OptionValueDto, unknown> {
  id: FormControl<string>;
  name: FormControl<string>;
  isEditing: FormControl<boolean>;
}
class VariantForm implements Record<keyof OptionVariantDto, unknown> {
  selectedOptions: FormControl<SelectedOptionDto[]>;
  ingredients: FormArray<FormGroup<IngredientForm>>;
  basePrice: FormControl<number>;
  markupPercent: FormControl<number>;
  price: FormControl<number>;
}
class IngredientForm implements Record<keyof SelectedIngredientDto, unknown> {
  ingredientId: FormControl<string>;
  qty: FormControl<number>;
}

@Component({
  selector: 'app-admin-product',
  standalone: true,
  imports: [
    PageContentComponent,
    MatProgressSpinner,
    ReactiveFormsModule,
    PreloaderComponent,
    MatFormFieldModule,
    MatInputModule,
    MatSelect,
    MatOption,
    MatCheckbox,
    PhotoAssetComponent,
    PhotoUploaderComponent,
    IngredientUnitPipe,
    NgTemplateOutlet,
    NgIf,
    JsonPipe,
    MatButton,
    MatIcon,
    MatIconButton,
  ],
  templateUrl: './admin-product.component.html',
  styleUrl: './admin-product.component.scss'
})
export class AdminProductComponent {
  readonly productService = inject(ProductService);
  readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly photoUploadUrl = `${environment.apiUrl}/products/photo`;

  productId = signal<string | null>(null);
  isNewProduct = computed<boolean>(() => this.productId() === 'add');
  product = signal<ProductDto | CreateOrUpdateProductDto>(null);
  isLoading = signal<boolean>(false);

  form: FormGroup<ProductForm>;

  private readonly selectedOptionValueMap = new Map<OptionDto['id'], OptionValueDto['id']>();

  constructor() {
    this.route.params
      .pipe(takeUntilDestroyed())
      .subscribe(params => params['productId'] ? this.init(params['productId']) : null );
  }

  save() {
    const dto: CreateOrUpdateProductDto = {
      ...this.product(),
      ...this.form.getRawValue(),
    };

    const request = this.isNewProduct()
      ? this.productService.create(dto)
      : this.productService.update(this.productId(), dto);

    this.isLoading.set(true);
    request
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: response => {
          if (this.isNewProduct()) {
            this.router.navigate(['..', response.id], { relativeTo: this.route });
          } else {
            this.product.set(response);
          }
          this.toastr.success(`Успішно збережено`);
        },
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося зберегти товар`),
      });
  }

  private init(productId: string) {
    this.productId.set(productId);

    if (this.isNewProduct()) {
      this.product.set(new CreateOrUpdateProductDto());
      this.buildForm();
    } else {
      this.isLoading.set(true);
      this.productService.fetchProductById(this.productId())
        .pipe(
          finalize(() => this.isLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: response => {
            this.product.set(response);
            this.buildForm();
          },
          error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати товар`),
        });
    }
  }

  private buildForm() {
    this.form = this.formBuilder.group<ProductForm>({
      name: this.formBuilder.control(this.product().name),
      categoryId: this.formBuilder.control(this.product().categoryId),
      photoUrl: this.formBuilder.control(this.product().photoUrl),
      purchasePrice: this.formBuilder.control(this.product().purchasePrice),
      sortOrder: this.formBuilder.control(this.product().sortOrder),
      ingredients: this.formBuilder.array<FormGroup<IngredientForm>>(
        this.product().ingredients.map(ing => this.buildIngredientForm(ing)),
      ),
      options: this.formBuilder.array<FormGroup<OptionForm>>(
        this.product().options.map(option => this.buildOptionForm(option)),
      ),
      variants: this.formBuilder.array<FormGroup<VariantForm>>(
        this.product().variants.map(variant => this.buildVariantForm(variant)),
      ),
    });
  }

  deleteProduct() {
    if (
      this.isNewProduct()
      || !confirm(`Ви впевнені що хочете видалити товар "${this.product().name}"?`)
    ) {
      return;
    }

    this.isLoading.set(true);
    this.productService.deleteProduct(this.productId())
      .pipe(
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: () => {
          this.router.navigate(['..'], { relativeTo: this.route });
          this.toastr.success(`Успішно видалено`, undefined);
        },
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося видалити товар`),
      });
  }

  onPhotoUpload(photoUrl: string): void {
    this.form.controls.photoUrl.setValue(photoUrl);
  }

  addNewIngredient(ingredientArray: FormArray<FormGroup<IngredientForm>>) {
    ingredientArray.push(this.buildIngredientForm(new SelectedIngredientDto()));
  }

  addNewOption(): void {
    this.form.controls.options.push(this.buildOptionForm(new OptionDto()));
  }

  deleteOption(optionIndex: number): void {
    const optionForm = this.form.controls.options.at(optionIndex);
    const optionId = optionForm.controls.id.getRawValue();

    const variants = this.form.controls.variants.getRawValue().filter(variant => {
      const hasDeletedOption = variant.selectedOptions.find(selectedOption => {
        return selectedOption.optionId === optionId;
      });
      return !hasDeletedOption;
    });

    this.form.controls.variants.clear();
    variants.forEach(variant => {
      this.form.controls.variants.push(this.buildVariantForm(variant));
    })

    this.deleteControlFromArray(this.form.controls.options, optionIndex);
    this.selectedOptionValueMap.delete(optionId);
  }

  addNewOptionValue(optionIndex: number, newOptionValueInput: HTMLInputElement): void {
    const optionForm = this.form.controls.options.at(optionIndex);
    const optionId = optionForm.controls.id.getRawValue();

    const newOptionValue = new OptionValueDto(newOptionValueInput.value);
    optionForm.controls.values.push(this.buildOptionValueForm(newOptionValue));

    const options = this.form.controls.options.getRawValue();
    const newVariants: OptionVariantDto[] = [];
    const existingVariants = this.form.controls.variants.getRawValue();

    const addSelectedOption = (selectedOptions: SelectedOptionDto[], optionIndexArg: number): void => {
      let option = options[optionIndexArg];

      if (option?.values.length) {

        for (const optionValue of option.values) {
          console.log(optionValue.name);
          const selectedOptionsCopy = structuredClone(selectedOptions);
          selectedOptionsCopy.push({ optionId: option.id, optionValueId: optionValue.id, optionName: option.name, optionValueName: optionValue.name } as any);

          addSelectedOption(selectedOptionsCopy, optionIndexArg + 1);
        }
      } else {
        const variant = new OptionVariantDto();

        const existingVariant = existingVariants.find(existingVariant => {
          return existingVariant.selectedOptions.every(existingOption => {
            return selectedOptions.find(newOption => this.isSelectedOptionSame(newOption, existingOption));
          });
        });

        if (existingVariant) {
          Object.assign(variant, existingVariant);
        }
        variant.selectedOptions = selectedOptions;

        newVariants.push(variant);
      }
    };

    addSelectedOption([], 0);

    console.log('variants:');
    console.log(newVariants.map(variant => {
      return variant.selectedOptions;
      }));

    this.selectOptionValue(optionId, newOptionValue.id);


    if (!newVariants.length) {
      newVariants.push(existingVariants[0]);
    }
    this.form.controls.variants = this.formBuilder.array(newVariants.map(variant => this.buildVariantForm(variant)));

    optionForm.controls.isAddingValue.setValue(false);
    newOptionValueInput.value = '';
  }

  deleteOptionValue(optionIndex: number, optionValueIndex: number): void {
    const optionForm = this.form.controls.options.at(optionIndex);
    const optionId = optionForm.controls.id.getRawValue();

    const optionValueId = optionForm.controls.values.at(optionValueIndex).controls.id.getRawValue();

    const variants = this.form.controls.variants.getRawValue().filter(variant => {
      const hasDeletedOption = variant.selectedOptions.find(selectedOption => {
        return this.isSelectedOptionSame(selectedOption, { optionId, optionValueId });
      });
      return !hasDeletedOption;
    });

    this.form.controls.variants.clear();
    variants.forEach(variant => {
      this.form.controls.variants.push(this.buildVariantForm(variant));
    })

    this.deleteControlFromArray(optionForm.controls.values, optionValueIndex);

    if (this.isOptionValueSelected(optionId, optionValueId)) {
      if (optionForm.controls.values.length) {
        let newSelectedValueIndex = optionValueIndex;
        if (newSelectedValueIndex >= optionForm.controls.values.length) {
          newSelectedValueIndex = optionForm.controls.values.length - 1;
        }

        const newSelectedValueId = optionForm.controls.values.at(newSelectedValueIndex).controls.id.getRawValue();
        if (newSelectedValueId) {
          this.selectOptionValue(optionId, newSelectedValueId);
        }

      } else {
        this.selectedOptionValueMap.delete(optionId);
      }
    }
  }

  deleteControlFromArray(formArray: FormArray, index: number): void {
    formArray.removeAt(index);
  }

  getIngredientsForDropdown(ingredientsFormArray: FormArray<FormGroup<IngredientForm>>): IngredientDto[] {
    return [];
  }

  calcIngredientTotalPrice(ingredientForm: FormGroup<IngredientForm>, ingredientDto: IngredientDto): number {
    if (!ingredientForm.controls.ingredientId.getRawValue() || !ingredientDto) {
      return 0;
    }

    return ingredientForm.controls.qty.getRawValue() * ingredientDto.price;
  }

  isOptionValueSelected(optionId: string, optionValueId: string): boolean {
    return this.selectedOptionValueMap.get(optionId) === optionValueId;
  }

  selectOptionValue(optionId: string, optionValueId: string): void {
    this.selectedOptionValueMap.set(optionId, optionValueId);
  }

  getSelectedVariantForm(): FormGroup<VariantForm> {
    if (!this.form.controls.options.length) {
      return this.form.controls.variants.at(0);
    }

    return this.form.controls.variants.controls.find(variantForm => {
      const variant = variantForm.getRawValue();
      return variant.selectedOptions.every(option => {
        return this.isOptionValueSelected(option.optionId, option.optionValueId);
      });
    });
  }

  /**
   * Workaround for type-checking, see: https://stackoverflow.com/a/61682343/7499769
   */
  ifa(ingredientArray: FormArray<FormGroup<IngredientForm>>) { return ingredientArray; }

  private buildVariantForm(variant: OptionVariantDto): FormGroup<VariantForm> {
    return this.formBuilder.group<VariantForm>({
      basePrice: this.formBuilder.control(variant.basePrice),
      markupPercent: this.formBuilder.control(variant.markupPercent),
      price: this.formBuilder.control(variant.price),
      ingredients: this.formBuilder.array<FormGroup<IngredientForm>>(
        variant.ingredients.map(ing => this.buildIngredientForm(ing)),
      ),
      selectedOptions: this.formBuilder.control(structuredClone(variant.selectedOptions)),
    });
  }

  private buildOptionForm(option: OptionDto): FormGroup<OptionForm> {
    return this.formBuilder.group<OptionForm>({
      id: this.formBuilder.control(option.id),
      name: this.formBuilder.control(option.name),
      values: this.formBuilder.array(option.values.map(value => this.buildOptionValueForm(value))),
      isAddingValue: this.formBuilder.control(false),
    });
  }

  private buildOptionValueForm(optionValue: OptionValueDto): FormGroup<OptionValueForm> {
    return this.formBuilder.group<OptionValueForm>({
      id: this.formBuilder.control(optionValue.id),
      name: this.formBuilder.control(optionValue.name),
      isEditing: this.formBuilder.control(false),
    });
  }

  private buildIngredientForm(ingredient: SelectedIngredientDto): FormGroup<IngredientForm> {
    return this.formBuilder.group<IngredientForm>({
      ingredientId: this.formBuilder.control(ingredient.ingredientId),
      qty: this.formBuilder.control(ingredient.qty),
    });
  }

  getIngredientDto(ingredientForm: FormGroup<IngredientForm>): IngredientDto {
    return undefined;
  }

  getOption(optionId: string) {
    const options = this.form.controls.options.getRawValue();
    return options.find(option => option.id === optionId);
  }
  getOptionValue(optionId: string, optionValueId: string) {
    return this.getOption(optionId)?.values.find(value => value.id === optionValueId);
  }

  private isSelectedOptionSame(selectedOption1: SelectedOptionDto, selectedOption2: SelectedOptionDto): boolean {
    return selectedOption1.optionId === selectedOption2.optionId
      && selectedOption1.optionValueId === selectedOption2.optionValueId;
  }
}
