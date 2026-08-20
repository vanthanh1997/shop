import data from './bootstrap-messages.json';
import { AppLang } from '@core/i18n/lang';

export const BOOTSTRAP_MESSAGES = data as Record<AppLang, Readonly<Record<string, string>>>;
