import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { LoadingService } from '@core/services/loading-service';

@Component({
  selector: 'app-top-progress-bar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [],
  template: `
    @if (loading.isLoading()) {
      <progress
        class="progress progress-primary fixed inset-x-0 top-0 z-1200 h-1 rounded-none"
        aria-label="Đang tải dữ liệu"
      ></progress>
    }
  `,
})
export class TopProgressBar {
  protected readonly loading = inject(LoadingService);
}
