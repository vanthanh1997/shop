import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  LOCALE_ID,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import {
  TitleStrategy,
  provideRouter,
  withComponentInputBinding,
  withInMemoryScrolling,
} from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';

import { API_BASE_URL } from '@core/api';
import { GlobalErrorHandler } from '@core/errors/global-error-handler';
import { errorInterceptor } from '@core/interceptors/error-interceptor';
import { langInterceptor } from '@core/interceptors/lang-interceptor';
import { loadingInterceptor } from '@core/interceptors/loading-interceptor';
import { DEFAULT_LANG, I18N_PREFIX, I18N_SUFFIX } from '@core/i18n/lang';
import { AppTitleStrategy } from '@core/seo/app-title-strategy';
import { environment } from '@env/environment';
import { routes } from './app.routes';
import { authInterceptor } from '@core/interceptors/auth-interceptor';
import { refreshInterceptor } from '@core/interceptors/refresh-interceptor';
import { AuthStore } from '@core/auth/auth-store';
import { LanguageService } from '@core/i18n/language-service';

function readStoredLang(): string {
  try {
    const raw = localStorage.getItem('shop.lang');
    return raw === 'vi' || raw === 'en' ? raw : 'vi';
  } catch {
    return 'vi';
  }
}

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),

    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({
        scrollPositionRestoration: 'enabled',
        anchorScrolling: 'enabled',
      }),
    ),
    provideHttpClient(
      withFetch(),
      withInterceptors([
        loadingInterceptor,
        langInterceptor, 
        authInterceptor,
        errorInterceptor,
        refreshInterceptor,
]),
    ),
    provideTranslateService({
      lang: DEFAULT_LANG,
      fallbackLang: DEFAULT_LANG,
      loader: provideTranslateHttpLoader({ prefix: I18N_PREFIX, suffix: I18N_SUFFIX }),
    }),
    provideAppInitializer(() => inject(AuthStore).restoreSession()),
    provideAppInitializer(() => inject(LanguageService).load()),
    
    { provide: API_BASE_URL, useValue: environment.apiBaseUrl },
    { provide: ErrorHandler, useClass: GlobalErrorHandler },
    { provide: LOCALE_ID, useFactory: readStoredLang },
    { provide: TitleStrategy, useClass: AppTitleStrategy },
  ],
};
