export const SUPPORTED_LANGS = ['vi', 'en'] as const;

export type AppLang = (typeof SUPPORTED_LANGS)[number];

export const DEFAULT_LANG: AppLang = 'vi';

export const LANG_STORAGE_KEY = 'shop.lang';

export const LANG_LABELS: Record<AppLang, string> = {
  vi: 'Tiếng Việt',
  en: 'English',
};

export const LANG_SHORT_LABELS: Record<AppLang, string> = {
  vi: 'VI',
  en: 'EN',
};

export const INTL_LOCALES: Record<AppLang, string> = {
  vi: 'vi-VN',
  en: 'en-US',
};

export const ACCEPT_LANGUAGE: Record<AppLang, string> = {
  vi: 'vi-VN,vi;q=0.9',
  en: 'en-US,en;q=0.9',
};

export const CURRENCY_CODE = 'VND';

export const LOADER_TIMEOUT_MS = 1500;
export const LOADER_RETRY_DELAY_MS = 400;
export const BOOT_TIMEOUT_MS = 4000;

export const I18N_PREFIX = '/i18n/';
export const I18N_SUFFIX = '.json';

export function isAppLang(value: unknown): value is AppLang {
  return typeof value === 'string' && (SUPPORTED_LANGS as readonly string[]).includes(value);
}

export type TranslateFn = (key: string, params?: Record<string, unknown>) => string;
