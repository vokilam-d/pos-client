import { computed, inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { ToastrService } from 'ngx-toastr';
import { getHttpErrorMessage } from '../utils/get-http-error-message.util';
import { filter, Observable, tap } from 'rxjs';
import { IngredientDto } from '../dtos/ingredient.dto';
import { CreateOrUpdateIngredientDto } from '../dtos/create-or-update-ingredient.dto';
import { ConnectionService } from './connection.service';
import { CacheService } from './cache.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Injectable({
  providedIn: 'root'
})
export class IngredientService {

  cachedIngredients = computed<IngredientDto[]>(() => {
    return this.cacheService.getFromCache<IngredientDto[]>(this.cacheTypeKey, []);
  });

  private readonly httpClient = inject(HttpClient);
  private readonly toastr = inject(ToastrService);
  private readonly connectionService = inject(ConnectionService);
  private readonly cacheService = inject(CacheService);

  private readonly apiUrl = `${environment.apiUrl}/ingredients`;
  private readonly cacheTypeKey = `ingredients`;

  constructor() {
    if (this.connectionService.isOnline) {
      this.fetchAndCacheIngredients();
    } else {
      this.connectionService.isOnline$
        .pipe(
          filter(isOnline => isOnline),
          takeUntilDestroyed(),
        )
        .subscribe(() => this.fetchAndCacheIngredients());
    }
  }

  private fetchAndCacheIngredients(): void {
    this.fetchIngredients().subscribe(
      response => this.addToCache(response),
      error => this.toastr.error(getHttpErrorMessage(error), `Не вдалося закешувати опції товарів`),
    );
  }

  getIngredient(ingredientId: string): IngredientDto {
    return this.cachedIngredients().find(ingredient => ingredient.id === ingredientId);
  }

  getIngredientName(ingredientId: string): string {
    return this.getIngredient(ingredientId)?.name;
  }

  fetchIngredients(): Observable<IngredientDto[]> {
    return this.httpClient.get<IngredientDto[]>(this.apiUrl);
  }

  fetchIngredientById(ingredientId: string): Observable<IngredientDto> {
    return this.httpClient.get<IngredientDto>(`${this.apiUrl}/${ingredientId}`);
  }

  create(ingredientDto: CreateOrUpdateIngredientDto): Observable<IngredientDto> {
    return this.httpClient.post<IngredientDto>(this.apiUrl, ingredientDto)
      .pipe(tap(() => this.fetchAndCacheIngredients()));
  }

  update(ingredientId: string, ingredientDto: CreateOrUpdateIngredientDto): Observable<IngredientDto> {
    return this.httpClient.put<IngredientDto>(`${this.apiUrl}/${ingredientId}`, ingredientDto)
      .pipe(tap(() => this.fetchAndCacheIngredients()));
  }

  deleteIngredient(ingredientId: string): Observable<IngredientDto> {
    return this.httpClient.delete<IngredientDto>(`${this.apiUrl}/${ingredientId}`)
      .pipe(tap(() => this.fetchAndCacheIngredients()));
  }

  private addToCache(ingredients: IngredientDto[]): void {
    this.cacheService.addToCache(this.cacheTypeKey, ingredients);
  }
}
