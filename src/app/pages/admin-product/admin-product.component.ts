import { Component, DestroyRef, inject, signal } from '@angular/core';
import { ProductService } from '../../services/product.service';
import { PageContentComponent } from '../../components/page-content/page-content.component';
import { ProductDto } from '../../dtos/product.dto';
import { CreateOrUpdateProductDto } from '../../dtos/create-or-update-product.dto';
import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ToastrService } from 'ngx-toastr';
import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
import { BehaviorSubject, finalize, map, merge, Observable, startWith } from 'rxjs';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
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
import { AsyncPipe, JsonPipe, NgIf, NgTemplateOutlet } from '@angular/common';
import { MatAnchor, MatButton, MatIconAnchor, MatIconButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { IngredientService } from '../../services/ingredient.service';
import { RouteDataKey } from '../../enums/route-data-key.enum';
import { PAGE_ACTION_ADD } from '../../constants';
import { RouteParamKey } from '../../enums/route-param-key.enum';
import { MatMenu, MatMenuItem, MatMenuTrigger } from '@angular/material/menu';
import { MatTooltip } from '@angular/material/tooltip';
import { AutofocusDirective } from '../../directives/autofocus.directive';
import { roundPriceNumber } from '../../utils/round-price-number.util';


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
  primeCost: FormControl<number>;
  markupPercent: FormControl<number>;
  price: FormControl<number>;
}
class IngredientForm implements Record<keyof SelectedIngredientDto, unknown> {
  ingredientId: FormControl<string>;
  qty: FormControl<number>;
}

type VariantForCopy = {
  name: string;
  variantFormIndex: number;
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
    MatAnchor,
    RouterLink,
    AsyncPipe,
    MatIconAnchor,
    MatMenuTrigger,
    MatMenu,
    MatMenuItem,
    MatTooltip,
    AutofocusDirective,
  ],
  templateUrl: './admin-product.component.html',
  styleUrl: './admin-product.component.scss'
})
export class AdminProductComponent {
  readonly productService = inject(ProductService);
  readonly categoryService = inject(CategoryService);
  readonly ingredientService = inject(IngredientService);
  private readonly formBuilder = inject(FormBuilder);
  private readonly toastr = inject(ToastrService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly destroyRef = inject(DestroyRef);

  readonly photoUploadUrl = `${environment.apiUrl}/products/photo`;

  productId = signal<string | null>(null);
  product = signal<ProductDto | CreateOrUpdateProductDto>(null);
  isLoading = signal<boolean>(false);

  readonly isNewProduct: boolean = false;
  readonly isNewProductBasedOnId: string = null;
  form: FormGroup<ProductForm>;

  private readonly selectedOptionValueMap$ = new BehaviorSubject<Map<OptionDto['id'], OptionValueDto['id']>>(new Map());
  get selectedVariant$(): Observable<{ form: FormGroup<VariantForm>, index: number }> {
    return this.selectedOptionValueMap$.pipe(
      startWith(this.selectedOptionValueMap$.getValue()),
      map(selectedOptionValueMap => {
        const index = this.getSelectedVariantIndex(selectedOptionValueMap);
        return {
          index: index,
          form: this.form.controls.variants.at(index),
        };
      }),
    );
  }

  constructor() {
    this.isNewProduct = this.route.snapshot.data[RouteDataKey.PageAction] === PAGE_ACTION_ADD;
    this.isNewProductBasedOnId = this.route.snapshot.params[RouteParamKey.NewItemBasedOn];

    if (this.isNewProduct) {
      this.init();
    } else {
      this.route.params
        .pipe(takeUntilDestroyed(), )
        .subscribe(params => {
          this.productId.set(params[RouteParamKey.NewItem]);
          this.init();
        });
    }
  }

  getBackToListUrl(): string[] {
    let commands: string = '../';
    if (this.isNewProduct && this.isNewProductBasedOnId) {
      commands += '../';
    }
    return [commands];
  }

  save(postAction?: 'close') {
    const dto: CreateOrUpdateProductDto = {
      ...this.product(),
      ...this.form.getRawValue(),
    };

    const request = this.isNewProduct
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
          this.toastr.success(`Успішно збережено`);

          if (postAction === 'close') {
            this.router.navigate(this.getBackToListUrl(), { relativeTo: this.route }).then();
            return;
          }

          if (this.isNewProduct) {
            const url = [this.getBackToListUrl(), response.id].join('');
            this.router.navigate([url], { relativeTo: this.route }).then();
          } else {
            this.product.set(response);
            this.buildForm();
          }
        },
        error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося зберегти товар`),
      });
  }

  private init() {
    if (!this.isNewProduct || (this.isNewProduct && this.isNewProductBasedOnId)) {
      const productId = (this.isNewProduct && this.isNewProductBasedOnId) || this.productId();

      this.isLoading.set(true);
      this.productService.fetchProductById(productId)
        .pipe(
          finalize(() => this.isLoading.set(false)),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe({
          next: response => {
            this.product.set(response);
            this.buildForm();
            const selectedOptionValueMap = this.selectedOptionValueMap$.getValue();
            for (const option of this.product().options) {
              selectedOptionValueMap.set(option.id, option.values[0].id);
            }
            this.selectedOptionValueMap$.next(selectedOptionValueMap);
          },
          error: error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати товар`),
        });
    } else {
      this.product.set(new CreateOrUpdateProductDto());
      this.buildForm();
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
      variants: this.formBuilder.array<FormGroup<VariantForm>>([]),
    });

    // add later, so "this.buildVariantForm()" has reference to "this.form"
    this.product().variants.forEach(variant => {
      this.form.controls.variants.push(this.buildVariantForm(variant));
    });
  }

  deleteProduct() {
    if (
      this.isNewProduct
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
          this.router.navigate(['..'], { relativeTo: this.route }).then();
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

    this.rebuildVariants(optionId);
    this.deleteControlFromArray(this.form.controls.options, optionIndex);

    const selectedOptionValueMap = this.selectedOptionValueMap$.getValue();
    selectedOptionValueMap.delete(optionId);
    this.selectedOptionValueMap$.next(selectedOptionValueMap);
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

    this.rebuildVariants(optionId, optionValueId);
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
        const selectedOptionValueMap = this.selectedOptionValueMap$.getValue();
        selectedOptionValueMap.delete(optionId);
        this.selectedOptionValueMap$.next(selectedOptionValueMap);
      }
    }
  }

  deleteControlFromArray(formArray: FormArray, index: number): void {
    formArray.removeAt(index);
  }

  getIngredientsForDropdown(
    ingredientsFormArray: FormArray<FormGroup<IngredientForm>>,
    currentIngredientIndex: number,
  ): IngredientDto[] {
    const selectedIngredientIds = ingredientsFormArray.getRawValue().map(ing => ing.ingredientId);
    return this.ingredientService.cachedIngredients().filter(ingredient => {
      const indexOfSelected = selectedIngredientIds.indexOf(ingredient.id);
      return indexOfSelected === currentIngredientIndex || indexOfSelected === -1;
    });
  }

  calcIngredientTotalPrice(selectedIngredient: SelectedIngredientDto): number {
    if (!selectedIngredient.ingredientId) {
      return 0;
    }
    const ingredientDto: IngredientDto = this.ingredientService.getIngredient(selectedIngredient.ingredientId);
    if (!ingredientDto) {
      return 0;
    }

    const totalPrice = selectedIngredient.qty * ingredientDto.price;
    return roundPriceNumber(totalPrice);
  }

  isOptionValueSelected(optionId: string, optionValueId: string): boolean {
    const selectedOptionValueMap = this.selectedOptionValueMap$.getValue();
    return selectedOptionValueMap.get(optionId) === optionValueId;
  }

  selectOptionValue(optionId: string, optionValueId: string): void {
    const selectedOptionValueMap = this.selectedOptionValueMap$.getValue();
    selectedOptionValueMap.set(optionId, optionValueId);
    this.selectedOptionValueMap$.next(selectedOptionValueMap);
  }

  private getSelectedVariantIndex(
    selectedOptionValueMap = this.selectedOptionValueMap$.getValue(),
  ): number {
    if (!this.form.controls.options.at(0)?.controls.values.length) {
      return 0;
    }

    return this.form.controls.variants.controls.findIndex(variantForm => {
      const variant = variantForm.getRawValue();
      return variant.selectedOptions.every(option => {
        return selectedOptionValueMap.get(option.optionId) === option.optionValueId;
      });
    });
  }

  getIngredientDto(ingredientForm: FormGroup<IngredientForm>): IngredientDto {
    const ingredientId = ingredientForm.controls.ingredientId.getRawValue();
    return this.ingredientService.getIngredient(ingredientId);
  }

  hasVariantIngredients(variantFormIndex: number): boolean {
    const variant = this.form.controls.variants.at(variantFormIndex).getRawValue();
    return !!variant.ingredients.length;
  }

  onCopySelected(currentVariant: FormGroup<VariantForm>, variantFormIndex: number): void {
    const variantForCopy = this.form.controls.variants.at(variantFormIndex).getRawValue();

    currentVariant.controls.ingredients.clear();
    variantForCopy.ingredients.forEach(ingredient => {
      // create empty first and then set value, so .valueChanges() dependencies will trigger
      currentVariant.controls.ingredients.push(this.buildIngredientForm(new SelectedIngredientDto()));
      currentVariant.controls.ingredients.at(currentVariant.controls.ingredients.length - 1).setValue(ingredient);
    });
    currentVariant.controls.markupPercent.setValue(variantForCopy.markupPercent);
  }

  getVariantsForCopy(variantFormIndex: number): VariantForCopy[] {
    const options = this.form.controls.options.getRawValue();
    return this.form.controls.variants.getRawValue()
      .map<VariantForCopy>((variant, i) => {
        const names: string[] = variant.selectedOptions.map(selectedOption => {
          const option = options.find(option => option.id === selectedOption.optionId);
          const optionValue = option.values.find(value => value.id === selectedOption.optionValueId);

         return `${optionValue.name}`;
        });

        return {
          name: names.join(', '),
          variantFormIndex: i,
        };
      })
      .filter((_, i) => i !== variantFormIndex && this.hasVariantIngredients(i));
  }

  /**
   * Workaround for type-checking, see: https://stackoverflow.com/a/61682343/7499769
   */
  ifa(ingredientArray: FormArray<FormGroup<IngredientForm>>) { return ingredientArray; }

  private rebuildVariants(optionId: string, optionValueId?: string): void {
    const variants = this.form.controls.variants.getRawValue().filter(variant => {
      const hasDeletedOption = variant.selectedOptions.find(selectedOption => {
        return optionValueId
          ? this.isSelectedOptionSame(selectedOption, { optionId, optionValueId })
          : selectedOption.optionId === optionId;
      });
      return !hasDeletedOption;
    });

    const firstVariantForm = this.form.controls.variants.at(0);
    this.form.controls.variants.clear();
    if (variants.length) {
      variants.forEach(variant => {
        this.form.controls.variants.push(this.buildVariantForm(variant));
      });
    } else {
      this.form.controls.variants.push(firstVariantForm);
    }
  }

  private buildVariantForm(variant: OptionVariantDto): FormGroup<VariantForm> {
    const variantForm = this.formBuilder.group<VariantForm>({
      primeCost: this.formBuilder.control(variant.primeCost),
      markupPercent: this.formBuilder.control(variant.markupPercent),
      price: this.formBuilder.control(variant.price),
      ingredients: this.formBuilder.array<FormGroup<IngredientForm>>(
        variant.ingredients.map(ing => this.buildIngredientForm(ing)),
      ),
      selectedOptions: this.formBuilder.control(structuredClone(variant.selectedOptions)),
    });

    const baseIngredients$ = this.form.controls.ingredients.valueChanges
    const variantIngredients$ = variantForm.controls.ingredients.valueChanges
    merge(baseIngredients$, variantIngredients$)
      .pipe(startWith(null), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const baseIngredients = this.form.controls.ingredients.getRawValue();
        const variantIngredients = variantForm.controls.ingredients.getRawValue();

        if (!baseIngredients.length && !variantIngredients.length) {
          variantForm.controls.primeCost.enable({ emitEvent: false });
        } else {
          variantForm.controls.primeCost.disable({ emitEvent: false });
        }
      });


    const primeCost$ = variantForm.controls.primeCost.valueChanges
    const price$ = variantForm.controls.price.valueChanges;
    merge(primeCost$, price$)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const primeCost = variantForm.controls.primeCost.getRawValue();
        const price = variantForm.controls.price.getRawValue();
        if (primeCost === 0) {
          return;
        }

        const markupPercent = ((price - primeCost) / primeCost) * 100;
        variantForm.controls.markupPercent.setValue(roundPriceNumber(markupPercent), { emitEvent: false });
      });

    variantForm.controls.markupPercent.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(markupPercent => {
        const primeCost = variantForm.controls.primeCost.getRawValue();
        const markup = primeCost * (markupPercent / 100);
        const price = roundPriceNumber(primeCost + markup);

        variantForm.controls.price.setValue(price, { emitEvent: false });
      });

    return variantForm;
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
    const formGroup = this.formBuilder.group<IngredientForm>({
      ingredientId: this.formBuilder.control(ingredient.ingredientId),
      qty: this.formBuilder.control(ingredient.qty),
    });

    formGroup.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        const baseIngredients = this.form.controls.ingredients.getRawValue();

        this.form.controls.variants.controls.forEach(variantForm => {
          const variantIngredients = variantForm.controls.ingredients.getRawValue();
          if (baseIngredients.length || variantIngredients.length) {
            const calcIngredientsTotalPrice = (ingredients: SelectedIngredientDto[]): number => {
              return ingredients.reduce((acc, ing) => acc + this.calcIngredientTotalPrice(ing), 0);
            };

            const primeCost = calcIngredientsTotalPrice(baseIngredients) + calcIngredientsTotalPrice(variantIngredients);

            variantForm.controls.primeCost.setValue(primeCost);
          }
        });
      });

    return formGroup;
  }

  private isSelectedOptionSame(selectedOption1: SelectedOptionDto, selectedOption2: SelectedOptionDto): boolean {
    return selectedOption1.optionId === selectedOption2.optionId
      && selectedOption1.optionValueId === selectedOption2.optionValueId;
  }
}
