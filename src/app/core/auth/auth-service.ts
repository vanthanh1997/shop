import { inject, Injectable } from '@angular/core';
import { ApiClient, ApiResponse, httpFlags } from '@core/api';
import { AUTH_ENDPOINTS } from './auth.endpoints';
import {
  AuthResponse,
  ConfirmEmailRequest,
  CurrentUser,
  ForgotPasswordRequest,
  GoogleLoginRequest,
  LoginRequest,
  LogoutRequest,
  RefreshTokenRequest,
  RegisterRequest,
  ResetPasswordRequest,
} from './auth.models';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = inject(ApiClient);

  register(request: RegisterRequest): Observable<ApiResponse<string>> {
    return this.api.post<string>(AUTH_ENDPOINTS.REGISTER, request, {
      context: httpFlags({ skipAuth: true, skipErrorToast: true }),
    });
  }

  login(request: LoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.api.post<AuthResponse>(AUTH_ENDPOINTS.LOGIN, request, {
      context: httpFlags({ skipAuth: true, skipErrorToast: true }),
    });
  }

  loginWithGoogle(request: GoogleLoginRequest): Observable<ApiResponse<AuthResponse>> {
    return this.api.post<AuthResponse>('/auth/google', request, {
      context: httpFlags({ skipAuth: true, skipErrorToast: true }),
    });
  }

  me(): Observable<ApiResponse<CurrentUser>> {
    return this.api.get<CurrentUser>(AUTH_ENDPOINTS.ME, {
      context: httpFlags({ skipErrorToast: true }),
    });
  }

  refresh(request: RefreshTokenRequest): Observable<ApiResponse<AuthResponse>> {
    return this.api.post<AuthResponse>(AUTH_ENDPOINTS.REFRESH, request, {
      context: httpFlags({ skipAuth: true, skipErrorToast: true, skipLoading: true }),
    });
  }

  logout(request: LogoutRequest): Observable<ApiResponse<null>> {
    return this.api.post<null>(AUTH_ENDPOINTS.LOGOUT, request, {
      context: httpFlags({ skipAuth: true, skipErrorToast: true }),
    });
  }

  confirmEmail(request: ConfirmEmailRequest): Observable<ApiResponse<null>> {
    return this.api.post<null>(AUTH_ENDPOINTS.CONFIRM_EMAIL, request, {
      context: httpFlags({ skipAuth: true, skipErrorToast: true }),
    });
  }
  forgotPassword(request: ForgotPasswordRequest): Observable<ApiResponse<null>> {
    return this.api.post<null>(AUTH_ENDPOINTS.FORGOT_PASSWORD, request, {
      context: httpFlags({ skipAuth: true, skipErrorToast: true }),
    });
  }

  resetPassword(request: ResetPasswordRequest): Observable<ApiResponse<null>> {
    return this.api.post<null>(AUTH_ENDPOINTS.RESET_PASSWORD, request, {
      context: httpFlags({ skipAuth: true, skipErrorToast: true }),
    });
  }
}
