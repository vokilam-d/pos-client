import { inject, Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, catchError, distinctUntilChanged, finalize, Observable, of, tap, timeout } from 'rxjs';
import { CHECK_CONNECTION_STATUS_INTERVAL_MS } from '../constants';

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {

  private readonly _isOnline$ = new BehaviorSubject<boolean>(false);
  readonly isOnline$ = this._isOnline$.pipe(distinctUntilChanged());
  get isOnline(): boolean { return this._isOnline$.getValue(); }

  private readonly httpClient = inject(HttpClient);

  private readonly apiUrl = `${environment.apiUrl}/health`;

  constructor() {
  }

  checkConnectionStatus(timeoutMs: number = 1000): Observable<unknown> {
    return this.fetchHealth()
      .pipe(
        timeout(timeoutMs),
        tap({
          next: () => this._isOnline$.next(true),
          error: () => this._isOnline$.next(false),
        }),
        catchError(() => of(null)),
        // finalize(() => setTimeout(
        //   () => this.checkConnectionStatus(5000).subscribe(),
        //   CHECK_CONNECTION_STATUS_INTERVAL_MS,
        // )),
      );
  }

  private fetchHealth(): Observable<{ isHealthy: true }> {
    return this.httpClient.get<{ isHealthy: true }>(this.apiUrl);
  }
}
