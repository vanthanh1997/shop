export interface RegisterRequest {
  readonly email: string;
  readonly password: string;
}

export interface LoginRequest {
  readonly email: string;
  readonly password: string;
}

export interface GoogleLoginRequest {
  readonly idToken: string;
}

export interface RefreshTokenRequest {
  readonly refreshToken: string;
}

export interface LogoutRequest {
  readonly refreshToken: string;
}

export interface ConfirmEmailRequest {
  readonly userId: string;
  readonly token: string;
}

export interface ForgotPasswordRequest {
  readonly email: string;
}

export interface ResetPasswordRequest {
  readonly email: string;
  readonly token: string;
  readonly newPassword: string;
}

export interface AuthResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
  readonly expiresAt: string;
  readonly roles: readonly string[];
}

export interface CurrentUser {
  readonly id: string;
  readonly email: string | null;
  readonly roles: readonly string[];
  readonly permissions: readonly string[];
}

