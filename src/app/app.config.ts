import { ApplicationConfig, ErrorHandler, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { loadingInterceptor } from '@core/interceptors/loading-interceptor';
import { langInterceptor } from '@core/interceptors/lang-interceptor';
import { errorInterceptor } from '@core/interceptors/error-interceptor';
import { API_BASE_URL } from '@core/api';
import { environment } from '@env/environment';
import { GlobalErrorHandler } from '@core/errors/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(
      withFetch(),
      withInterceptors([loadingInterceptor, langInterceptor, errorInterceptor]),
    ),
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },

    // Thay ErrorHandler mặc định (chỉ console.error) bằng bản có toast.
    { provide: ErrorHandler, useClass: GlobalErrorHandler },

  ]
};
