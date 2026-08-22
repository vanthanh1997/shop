import { computed, inject, Injectable, signal } from '@angular/core';
import { AuthService } from './auth-service';
import { CurrentUser, LoginRequest } from './auth.models';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  Observable,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { StoredTokens, TokenStorage } from './token-storage';
import { ApiError, ApiResponse } from '@core/api';
import { HttpStatusCode } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthStore {
  private readonly auth = inject(AuthService);
  private readonly tokens = inject(TokenStorage);
  private readonly userState = signal<CurrentUser | null>(null);
  private readonly restoringState = signal(false);

  readonly user = this.userState.asReadonly();
  readonly isRestoring = this.restoringState.asReadonly();
  readonly isLoggedIn = computed(() => this.user() !== null);
  readonly roles = computed<readonly string[]>(() => this.user()?.roles ?? []);
  readonly permissions = computed<readonly string[]>(() => this.user()?.permissions ?? []);

  private refreshInFlight: Observable<string> | null = null;

  accessToken(): string | null {
    return this.tokens.accessToken;
  }
  hasRefreshToken(): boolean {
    return this.tokens.refreshToken !== null;
  }

  hasRole(role: string): boolean {
    return this.roles().includes(role);
  }
  hasAnyRole(roles: readonly string[]): boolean {
    return roles.some((role) => this.hasRole(role));
  }

  hasPermission(permission: string): boolean {
    return this.permissions().includes(permission);
  }

  hasAllPermissions(list: readonly string[]): boolean {
    return list.every((permission) => this.hasPermission(permission));
  }

  hasAnyPermission(list: readonly string[]): boolean {
    return list.some((permission) => this.hasPermission(permission));
  }

  async login(loginRequest: LoginRequest): Promise<void> {
    try {
      await this.handleAuthSuccess(this.auth.login(loginRequest));
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  async loginWithGoogle(idToken: string): Promise<void> {
    try {
      await this.handleAuthSuccess(this.auth.loginWithGoogle({ idToken }));
    } catch (error) {
      this.clearSession();
      throw error;
    }
  }

  /**
   * Hàm dùng chung để lưu token và tải thông tin user vào Signal
   */
  private async handleAuthSuccess(
    loginObservable: Observable<ApiResponse<StoredTokens>>,
  ): Promise<void> {
    // 1. Chờ kết quả login và lưu token vào Storage
    const authResponse = await firstValueFrom(loginObservable);
    this.tokens.save(authResponse.data!);

    // 2. Gọi API lấy profile và gán vào Signal userState
    const meResponse = await firstValueFrom(this.auth.me());
    this.userState.set(meResponse.data!);
  }
  async logout(): Promise<void> {
    const refreshToken = this.tokens.refreshToken;

    this.clearSession();

    if (refreshToken === null) {
      return;
    }

    try {
      await firstValueFrom(this.auth.logout({ refreshToken }));
    } catch (error) {
      console.log(error);
    }
  }

  async restoreSession(): Promise<void> {
    if (!this.tokens.hasSession) {
      return;
    }

    this.restoringState.set(true);

    try {
      this.userState.set((await firstValueFrom(this.auth.me())).data!);
    } catch {
      this.clearSession();
    } finally {
      this.restoringState.set(false);
    }
  }
  
  refreshAccessToken(): Observable<string> {
    const inFlight = this.refreshInFlight;
    if (inFlight !== null) {
      return inFlight;
    }

    const refreshToken = this.tokens.refreshToken;
    if (refreshToken === null) {
      return throwError(
        () => new ApiError(HttpStatusCode.Unauthorized, 'Phiên đăng nhập đã hết hạn.'),
      );
    }

    const request = this.auth.refresh({ refreshToken }).pipe(
      tap((response) => this.tokens.save(response.data!)),
      map((response) => response.data!.accessToken),
      catchError((error: unknown) => {
        this.clearSession();
        return throwError(() => error);
      }),
      finalize(() => {
        this.refreshInFlight = null;
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    this.refreshInFlight = request;
    return request;
  }

  clearSession(): void {
    this.userState.set(null);
    this.tokens.clear();
    this.refreshInFlight = null;
  }
}
