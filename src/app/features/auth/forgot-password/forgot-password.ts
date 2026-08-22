import { ChangeDetectionStrategy, Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { ApiError } from '@core/api';
import { AuthService } from '@core/auth/auth-service';
import { FieldError } from '@shared/forms/field-error';

@Component({
  selector: 'app-forgot-password',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, RouterLink, FieldError],
  templateUrl: './forgot-password.html',
})
export class ForgotPassword {
  private readonly fb = inject(FormBuilder).nonNullable;
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly submitting = signal(false);
  readonly sent = signal(false);
  readonly sentTo = signal('');

  /** CHỈ dùng cho 429. */
  readonly formError = signal<string | null>(null);
  readonly form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  isInvalid(): boolean {
    const control = this.form.controls.email;
    return control.invalid && (control.touched || control.dirty);
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

    const { email } = this.form.getRawValue();

    this.auth
      .forgotPassword({ email })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: () => {
          this.submitting.set(false);
          this.sentTo.set(email);
          this.sent.set(true);
        },
        error: (error: unknown) => {
          this.submitting.set(false);
          if (error instanceof ApiError && error.isTooManyRequests) {
            this.formError.set(error.message);
            return;
          }
          this.sentTo.set(email);
          this.sent.set(true);
        },
      });
  }
}
