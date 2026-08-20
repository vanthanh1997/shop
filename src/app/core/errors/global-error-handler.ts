import { ErrorHandler, Injectable, Injector, inject } from '@angular/core';
import { ApiError } from '@core/api/api-error';
import { ToastService } from '@core/services/toast-service';

@Injectable()
export class GlobalErrorHandler implements ErrorHandler {
  private readonly injector = inject(Injector);

  handleError(error: unknown): void {
    console.error('[GlobalErrorHandler]', error);

    if (error instanceof ApiError) {
      return;
    }
    try {
      this.injector
        .get(ToastService)
        .error('Ứng dụng gặp lỗi không mong muốn. Vui lòng tải lại trang.');
    } catch (err) {
      console.log(err);
    }
  }
}
