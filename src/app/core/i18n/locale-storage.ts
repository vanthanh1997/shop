import { AppLang, DEFAULT_LANG, LANG_STORAGE_KEY, isAppLang } from '@core/i18n/lang';

let memoryLang: AppLang | null = null;
let storageWritable: boolean | null = null;

function probeStorage(): boolean {
  try {
    const probeKey = `${LANG_STORAGE_KEY}.probe`;
    localStorage.setItem(probeKey, '1');
    localStorage.removeItem(probeKey);
    return true;
  } catch {
    return false;
  }
}

function isWritable(): boolean {
  if (storageWritable === null) {
    storageWritable = probeStorage();
  }
  return storageWritable;
}

export function readStoredLang(): AppLang {
  if (isWritable()) {
    try {
      const raw = localStorage.getItem(LANG_STORAGE_KEY);
      return isAppLang(raw) ? raw : DEFAULT_LANG;
    } catch {
      storageWritable = false;
    }
  }
  return memoryLang ?? DEFAULT_LANG;
}

export function writeStoredLang(lang: AppLang): void {
  memoryLang = lang;

  if (!isWritable()) {
    return;
  }
  try {
    localStorage.setItem(LANG_STORAGE_KEY, lang);
  } catch {
    storageWritable = false;
  }
}

export function applyDocumentLang(lang: AppLang): void {
  try {
    document.documentElement.setAttribute('lang', lang);
  } catch(err) {
    console.log(err);
  }
}

export function onExternalLangChange(handler: (lang: AppLang) => void): () => void {
  const listener = (event: StorageEvent): void => {
    if (event.key !== null && event.key !== LANG_STORAGE_KEY) {
      return;
    }
    handler(readStoredLang());
  };

  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
}
