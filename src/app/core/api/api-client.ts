import { HttpClient, HttpContext, HttpHeaders, HttpParams } from '@angular/common/http';
import { ApiResponse } from '@core/api/api-response.model';
import { ApiError } from '@core/api/api-error';
import { TranslateFn } from '@core/i18n/lang';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from '@core/api/api.tokens';
import { LanguageService } from '@core/i18n/language-service';
import { map, Observable } from 'rxjs';

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue | QueryValue[]>;
export interface ApiRequestOptions {
  readonly params?: QueryParams;
  readonly context?: HttpContext;
  readonly headers?: HttpHeaders | Record<string, string | string[]>;
}

export function unwrap<T>(response: ApiResponse<T>, translate: TranslateFn): ApiResponse<T> {
  if (!response.success) {
    throw new ApiError(
      200,
      response.message ?? translate('errors.requestFailed'),
      response.errors,
      response.traceId,
    );
  }
  return response;
}

export function toHttpParams(query: QueryParams | undefined): HttpParams | undefined {
  if (query === undefined) {
    return undefined;
  }

  let params = new HttpParams();

  for (const key of Object.keys(query)) {
    const value = query[key];

    if (value === null || value === undefined) {
      continue;
    }

    if (Array.isArray(value)) {
      for (const item of value) {
        if (item === null || item === undefined) continue;
        params = params.append(key, item);
      }
      continue;
    }

    params = params.set(key, value);
  }

  return params;
}

@Injectable({ providedIn: 'root' })
export class ApiClient {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(API_BASE_URL);
  private readonly t = inject(LanguageService).t;

  private url(path: string): string {
    return path.startsWith('/') ? `${this.baseUrl}${path}` : `${this.baseUrl}/${path}`;
  }

  get<T>(path: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .get<ApiResponse<T>>(this.url(path), {
        params: toHttpParams(options?.params),
        context: options?.context,
        headers: options?.headers,
      })
      .pipe(map((response) => unwrap(response, this.t)));
  }

  post<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .post<ApiResponse<T>>(this.url(path), {
        params: toHttpParams(options?.params),
        context: options?.context,
        headers: options?.headers,
      })
      .pipe(map((response) => unwrap(response, this.t)));
  }

  put<T>(path: string, body: unknown, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .put<ApiResponse<T>>(this.url(path), body, {
        params: toHttpParams(options?.params),
        context: options?.context,
        headers: options?.headers,
      })
      .pipe(map((response) => unwrap(response, this.t)));
  }

  delete<T>(path: string, options?: ApiRequestOptions): Observable<ApiResponse<T>> {
    return this.http
      .delete<ApiResponse<T>>(this.url(path), {
        params: toHttpParams(options?.params),
        context: options?.context,
        headers: options?.headers,
      })
      .pipe(map((response) => unwrap(response, this.t)));
  }
}
