// import { Component, computed, inject, signal } from '@angular/core';
// import { ProductOptionService } from '../../services/product-option.service';
// import { PageContentComponent } from '../../components/page-content/page-content.component';
// import { ProductOptionDto } from '../../dtos/product-option.dto';
// import { CreateOrUpdateProductOptionDto } from '../../dtos/create-or-update-product-option.dto';
// import { FormArray, FormBuilder, FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
// import { ToastrService } from 'ngx-toastr';
// import { getHttpErrorMessage } from '../../utils/get-http-error-message.util';
// import { finalize } from 'rxjs';
// import { MatProgressSpinner } from '@angular/material/progress-spinner';
// import { PreloaderComponent } from '../../components/page-preloader/preloader.component';
// import { ActivatedRoute, Router } from '@angular/router';
// import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
// import { ProductOptionValueDto } from '../../dtos/product-option-value.dto';
// import { MatFormFieldModule } from '@angular/material/form-field';
// import { MatInputModule } from '@angular/material/input';
//
// type ProductOptionValueForm = Record<keyof ProductOptionValueDto, FormControl>;
// interface ProductOptionForm {
//   id: FormControl<string>;
//   name: FormControl<string>;
//   values: FormArray<FormGroup<ProductOptionValueForm>>;
// }
//
// @Component({
//   selector: 'app-admin-product-option',
//   standalone: true,
//   imports: [
//     PageContentComponent,
//     MatProgressSpinner,
//     ReactiveFormsModule,
//     PreloaderComponent,
//     MatFormFieldModule,
//     MatInputModule,
//   ],
//   templateUrl: './admin-product-option.component.html',
//   styleUrl: './admin-product-option.component.scss'
// })
// export class AdminProductOptionComponent {
//   readonly productOptionService = inject(ProductOptionService);
//   private readonly formBuilder = inject(FormBuilder);
//   private readonly toastr = inject(ToastrService);
//   private readonly router = inject(Router);
//   private readonly route = inject(ActivatedRoute);
//
//   productOptionId = signal<string | null>(null);
//   isNewProductOption = computed<boolean>(() => this.productOptionId() === 'add');
//
//   form: FormGroup<ProductOptionForm>;
//   get valuesFormArray(): FormArray<FormGroup<ProductOptionValueForm>> { return this.form.get('values') as FormArray; }
//   productOption = signal<ProductOptionDto | CreateOrUpdateProductOptionDto>(null);
//   isLoading = signal<boolean>(false);
//
//   constructor() {
//     this.route.params
//       .pipe(takeUntilDestroyed())
//       .subscribe(params => params['productOptionId'] ? this.init(params['productOptionId']) : null );
//   }
//
//   save() {
//     const dto: CreateOrUpdateProductOptionDto = {
//       ...this.form.getRawValue(),
//     };
//
//     const request = this.isNewProductOption()
//       ? this.productOptionService.create(dto)
//       : this.productOptionService.update(this.productOptionId(), dto);
//
//     this.isLoading.set(true);
//     request
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe(
//         response => {
//           if (this.isNewProductOption()) {
//             this.router.navigate(['..', response.id], { relativeTo: this.route });
//           } else {
//             this.productOption.set(response);
//             this.buildForm();
//           }
//           this.toastr.success(`Успішно збережено`);
//         },
//         error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося зберегти опцію`),
//       );
//   }
//
//   private init(productOptionId: string) {
//     this.productOptionId.set(productOptionId);
//
//     if (this.isNewProductOption()) {
//       this.productOption.set(new CreateOrUpdateProductOptionDto());
//       this.buildForm();
//     } else {
//       this.isLoading.set(true);
//       this.productOptionService.fetchProductOptionById(this.productOptionId())
//         .pipe(finalize(() => this.isLoading.set(false)))
//         .subscribe(
//           response => {
//             this.productOption.set(response);
//             this.buildForm();
//           },
//           error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося отримати опцію`),
//         );
//     }
//   }
//
//   private buildForm() {
//     this.form = this.formBuilder.group<ProductOptionForm>({
//       id: this.formBuilder.control(this.productOption().name),
//       name: this.formBuilder.control(this.productOption().name),
//       values: this.formBuilder.array(
//         this.productOption().values.map(value => this.formBuilder.group<ProductOptionValueDto>(value))
//       ),
//     });
//   }
//
//   deleteProductOption() {
//     if (
//       this.isNewProductOption()
//       || !confirm(`Ви впевнені що хочете видалити опцію "${this.productOption().name}"?`)
//     ) {
//       return;
//     }
//
//     this.isLoading.set(true);
//     this.productOptionService.deleteProductOption(this.productOptionId())
//       .pipe(finalize(() => this.isLoading.set(false)))
//       .subscribe(
//         () => {
//           this.router.navigate(['..'], { relativeTo: this.route });
//           this.toastr.success(`Успішно видалено`, undefined);
//         },
//         error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося видалити опцію`),
//       );
//   }
//
//   deleteOptionValue(index: number) {
//     this.valuesFormArray.removeAt(index);
//   }
//
//   addOptionValue() {
//     this.valuesFormArray.push(this.formBuilder.group({ id: undefined, name: '', priceDiff: 0 }));
//   }
// }
