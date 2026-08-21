import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { firstValueFrom, timeout } from 'rxjs';
import {
  AppLang,
  BOOT_TIMEOUT_MS,
  INTL_LOCALES,
  TranslateFn,
} from '@core/i18n/lang';
import { environment } from '@env/environment';
import { applyDocumentLang, onExternalLangChange, readStoredLang, writeStoredLang } from '@core/i18n/locale-storage';
import { BOOTSTRAP_MESSAGES } from '@core/i18n/bootstrap-messages';

const isUsable = (value: unknown, key: string): value is string =>
  typeof value === 'string' && value.trim() !== '' && value !== key;

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);
  private readonly destroyRef = inject(DestroyRef);
  readonly active = signal<AppLang>(readStoredLang());
  readonly intlLocale = computed(() => INTL_LOCALES[this.active()]);
  readonly i18nState = signal<'loading' | 'ok' | 'failed'>('loading');
  readonly t: TranslateFn = (key, params) => {
    const fallback = BOOTSTRAP_MESSAGES[this.active()][key];
    if (fallback !== undefined) {
      return fallback;
    }

    const value: unknown = this.translate.instant(key, params);
    if (isUsable(value, key)) {
      return value;
    }

    if (!environment.production) {
      console.warn('[i18n] khoá không dịch được:', key);
    }
    return key;
  };

  async load(): Promise<void> {
    const lang = this.active();
    applyDocumentLang(lang);
    this.destroyRef.onDestroy(
      onExternalLangChange((next) => {
        void this.switchTo(next, false);
      }),
    );

    this.translate.onLangChange.subscribe(() => this.i18nState.set('ok'));

    try {
      await firstValueFrom(this.translate.use(lang).pipe(timeout(BOOT_TIMEOUT_MS)));
      this.i18nState.set('ok');
    } catch (error) {
      if ((error as Error | undefined)?.name === 'TimeoutError') {
        console.error(`[i18n] hết ngân sách khởi động ${BOOT_TIMEOUT_MS}ms cho '${lang}'`);
      }
      this.i18nState.set('failed');
    }
  }

  async switchTo(lang: AppLang, persist = true): Promise<boolean> {
    if (lang === this.active()) {
      return true;
    }

    try {
      await firstValueFrom(this.translate.use(lang).pipe(timeout(BOOT_TIMEOUT_MS)));
    } catch {
      return false;
    }

    this.active.set(lang);
    applyDocumentLang(lang);
    if (persist) {
      writeStoredLang(lang);
    }
    this.i18nState.set('ok');
    return true;
  }
}
