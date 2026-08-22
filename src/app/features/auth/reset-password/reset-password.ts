import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
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
import { applyServerErrors, clearServerError, FieldError } from '@shared/forms/field-error';

export function newPasswordsMatch(group: AbstractControl): ValidationErrors | null {
  const newPassword = group.get('newPassword')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (typeof newPassword !== 'string' || typeof confirmPassword !== 'string') {
    return null;
  }

  if (confirmPassword.length === 0) {
    return null;
  }

  return newPassword === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-reset-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './reset-password.html',
})
export class ResetPassword {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly email = input<string>('');
  readonly token = input<string>('');
  /** Link hỏng: thiếu một trong hai tham số. */
  readonly linkBroken = computed(() => this.email().length === 0 || this.token().length === 0);

  readonly submitting = signal(false);
  readonly formError = signal<string | null>(null);
  readonly done = signal(false);

  readonly form = this.fb.group(
    {
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]],
    },
    { validators: newPasswordsMatch },
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
  isInvalid(name: 'newPassword' | 'confirmPassword'): boolean {
    const control = this.form.controls[name];
    return control.invalid && (control.touched || control.dirty);
  }

  get showMismatch(): boolean {
    const confirmPassword = this.form.controls.confirmPassword;
    return (
      this.form.hasError('passwordMismatch') && (confirmPassword.touched || confirmPassword.dirty)
    );
  }

  submit(): void {
    if (this.submitting() || this.linkBroken()) {
      return;
    }

    this.formError.set(null);

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.submitting.set(true);

    const { newPassword } = this.form.getRawValue();

    this.auth
      .resetPassword({ email: this.email(), token: this.token(), newPassword })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.done.set(true);
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
          this.formError.set(error.message);
        },
      });
  }
}
