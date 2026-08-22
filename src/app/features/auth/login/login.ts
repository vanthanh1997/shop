import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiError } from '@core/api';
import { AuthStore } from '@core/auth/auth-store';
import { LoginRequest } from '@core/auth/auth.models';
import { applyServerErrors, clearServerError, FieldError } from '@shared/forms/field-error';

@Component({
  selector: 'app-login',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './login.html',
})
export class Login {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

   submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly cooldown = signal<number | null>(null);
  private cooldownTimer: ReturnType<typeof setInterval> | null = null;

  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  constructor() {
    for (const name of Object.keys(this.form.controls)) {
      const control = this.form.get(name);
      if (control === null) {
        continue;
      }
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => clearServerError(control));
    }
    this.destroyRef.onDestroy(() => this.stopCooldown());
  }

  isInvalid(name: 'email' | 'password'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }
  submit(): void {
    if (this.submitting() || this.cooldown() !== null) {
      return;
    }
    this.formError.set(null);
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting.set(true);
    const { email, password } = this.form.getRawValue();
    const loginRequest: LoginRequest = {
      email: email,
      password: password,
    };
    void this.runLogin(loginRequest);
  }
  private async runLogin(loginRequest: LoginRequest): Promise<void> {
    try {
      await this.store.login(loginRequest);
      void this.router.navigateByUrl('/');
    } catch (error: unknown) {
      this.submitting.set(false);
      this.showError(error);
    }
  }

  private showError(error: unknown): void {
    if (!(error instanceof ApiError)) {
      this.formError.set('Đã xảy ra lỗi. Vui lòng thử lại.');
      return;
    }
    if (error.isTooManyRequests) {
      this.startCooldown(error.retryAfterSeconds ?? 60);
      this.formError.set(error.message);
      return;
    }
    if (error.isValidation && applyServerErrors(this.form, error)) {
      return;
    }
    this.formError.set(error.message);
  }
  private startCooldown(seconds: number): void {
    this.stopCooldown();
    this.cooldown.set(seconds);

    this.cooldownTimer = setInterval(() => {
      const remaining = this.cooldown();
      if (remaining === null || remaining <= 1) {
        this.stopCooldown();
        this.cooldown.set(null);
        return;
      }

      this.cooldown.set(remaining - 1);
    }, 1000);
  }

  private stopCooldown(): void {
    if (this.cooldownTimer !== null) {
      clearInterval(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }
}
