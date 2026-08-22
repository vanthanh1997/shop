import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiError } from '@core/api';
import { AuthService } from '@core/auth/auth-service';
import { applyServerErrors, clearServerError, FieldError, SERVER_ERROR_KEY } from '@shared/forms/field-error';

export function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;
  if (typeof password !== 'string' || typeof confirmPassword !== 'string') {
    return null;
  }
  if (confirmPassword.length === 0) {
    return null;
  }
  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-register',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './register.html',
})
export class Register {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

    readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);

  /** Đã đăng ký xong. Khi true, template đổi hẳn sang màn "kiểm tra hộp thư". */
  readonly registered = signal(false);

  /** Email vừa đăng ký, để nhắc lại trên màn kiểm tra hộp thư. */
  readonly registeredEmail = signal('');

  readonly form = this.fb.group(
    {
      email: ['', [Validators.required, Validators.email, Validators.maxLength(256)]],
      password: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );

    constructor() {
    for (const name of Object.keys(this.form.controls)) {
      const control = this.form.get(name);
      if (control === null) {
        continue;
      }
      control.valueChanges.pipe(takeUntilDestroyed()).subscribe(() => clearServerError(control));
    }
  }

  isInvalid(name: 'email' | 'password' | 'confirmPassword'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

    /** Hai mật khẩu không khớp VÀ người dùng đã chạm ô xác nhận. */
  get showMismatch(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;
    return (
      this.form.hasError('passwordMismatch') && (confirmPassword.touched || confirmPassword.dirty)
    );
  }

   submit(): void {
    if (this.submitting()) {
      return;
    }

    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const { email, password } = this.form.getRawValue();

    this.auth
      .register({ email, password })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.registeredEmail.set(email);
          // KHÔNG điều hướng. Xem giải thích.
          this.registered.set(true);
        },
        error: (error: unknown) => {
          this.submitting.set(false);

          if (!(error instanceof ApiError)) {
            this.formError.set('Đã xảy ra lỗi. Vui lòng thử lại.');
            return;
          }

          if (error.isValidation && applyServerErrors(this.form, error)) {
            return;
          }
          if (error.isConflict) {
            this.form.controls.email.setErrors({ [SERVER_ERROR_KEY]: error.message });
            return;
          }

          this.formError.set(error.message);
        },
      });
  }

}
