import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';

import { ApiError } from '@core/api';
import { AuthService } from '@core/auth/auth-service';

type ConfirmState = 'verifying' | 'success' | 'failed';

@Component({
  selector: 'app-confirm-email',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <div class="flex flex-col items-center gap-4 text-center">
      @switch (state()) {
        @case ('verifying') {
          <span
            class="loading loading-spinner loading-lg text-primary"
            role="status"
            aria-label="Đang xác nhận email"
          ></span>
          <h1 class="card-title text-2xl">Đang xác nhận email</h1>
          <p class="fieldset-label">Vui lòng chờ trong giây lát.</p>
        }

        @case ('success') {
          <div class="avatar avatar-placeholder">
            <div class="bg-success text-success-content w-16 rounded-full">
              <span class="text-2xl">✓</span>
            </div>
          </div>
          <h1 class="card-title text-2xl">Xác nhận thành công</h1>
          <p>Địa chỉ email của bạn đã được xác nhận. Bạn có thể đăng nhập ngay bây giờ.</p>
          <div class="card-actions mt-2 w-full">
            <a class="btn btn-primary w-full" routerLink="/login">Đăng nhập</a>
          </div>
        }

        @case ('failed') {
          <h1 class="card-title text-2xl">Không xác nhận được</h1>
          <div role="alert" class="alert alert-error alert-soft">
            <span>{{ message() }}</span>
          </div>
          <p class="fieldset-label">
            Liên kết xác nhận có thời hạn. Nếu nó đã hết hạn, hãy đăng ký lại hoặc liên hệ hỗ trợ.
          </p>
          <div class="card-actions mt-2 w-full">
            <a class="btn btn-primary w-full" routerLink="/login">Tới trang đăng nhập</a>
          </div>
        }
      }
    </div>
  `,
})
export class ConfirmEmail {
  private readonly auth = inject(AuthService);
  private readonly destroyRef = inject(DestroyRef);

  readonly userId = input<string>('');
  readonly token = input<string>('');

  readonly state = signal<ConfirmState>('verifying');
  readonly message = signal('Liên kết xác nhận không hợp lệ hoặc đã hết hạn.');

  private requestedKey: string | null = null;

  constructor() {
    effect(() => {
      const userId = this.userId();
      const token = this.token();

      if (userId.length === 0 || token.length === 0) {
        this.message.set('Liên kết xác nhận thiếu tham số. Hãy bấm trực tiếp vào liên kết trong email.');
        this.state.set('failed');
        return;
      }

      const key = `${userId}|${token}`;
      if (this.requestedKey === key) {
        return;
      }
      this.requestedKey = key;

      this.state.set('verifying');

      this.auth
        .confirmEmail({ userId, token })
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe({
          next: () => this.state.set('success'),
          error: (error: unknown) => {
            if (error instanceof ApiError) {
              this.message.set(error.message);
            }
            this.state.set('failed');
          },
        });
    });
  }
}
