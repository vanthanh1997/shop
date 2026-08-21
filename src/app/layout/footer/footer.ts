import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-footer',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink],
  template: `
    <footer class="bg-base-200 text-base-content">
      <div class="footer sm:footer-horizontal mx-auto max-w-5xl p-10">
        <aside>
          <p class="text-lg font-bold">Shop</p>
          <p class="max-w-xs text-sm opacity-70">
            Cửa hàng trực tuyến chạy trên Angular 21 và .NET 8.
          </p>
        </aside>

        <nav aria-label="Liên kết cửa hàng">
          <h2 class="footer-title">Cửa hàng</h2>
          <a class="link link-hover" routerLink="/">Trang chủ</a>
        </nav>

        <nav aria-label="Liên kết tài khoản">
          <h2 class="footer-title">Tài khoản</h2>
          <a class="link link-hover" routerLink="/login">Đăng nhập</a>
          <a class="link link-hover" routerLink="/register">Đăng ký</a>
        </nav>

        <nav aria-label="Liên kết hỗ trợ">
          <h2 class="footer-title">Hỗ trợ</h2>
          <a class="link link-hover" href="mailto:support@shop.local">support@shop.local</a>
        </nav>
      </div>

      <div class="mx-auto max-w-5xl px-10">
        <div class="divider my-0" aria-hidden="true"></div>
      </div>

      <div class="footer footer-center p-4 text-sm opacity-70">
        <p>© {{ year }} Shop. Bản quyền thuộc về chủ cửa hàng.</p>
      </div>
    </footer>
  `,
})
export class Footer {
  protected readonly year = new Date().getFullYear();
}
