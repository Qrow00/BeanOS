import { I18nManager } from 'react-native';
import { useSettingsStore } from '../store/settingsStore';
import en from './locales/en';
import fil from './locales/fil';
import es from './locales/es';
import id from './locales/id';
import ja from './locales/ja';
import ko from './locales/ko';
import zh from './locales/zh';
import ar from './locales/ar';

export const translations: Record<string, Record<string, string>> = {
  'en-US': en,
  'en-PH': en,
  'en-GB': en,
  'fil-PH': fil,
  'es-ES': es,
  'id-ID': id,
  'ja-JP': ja,
  'ko-KR': ko,
  'zh-CN': zh,
  'ar-SA': ar,
};

export type TranslationKey = keyof typeof en;

const interpolate = (str: string, params?: Record<string, any>) => {
  if (!params) return str;
  return str.replace(/\{(\w+)\}/g, (_, key) => String(params[key] ?? ''));
};

export function translate(locale: string, key: string, params?: Record<string, any>): string {
  const dict = translations[locale] || translations['en-US'];
  const dictEn = translations['en-US'];
  return interpolate(dict[key] ?? dictEn[key] ?? key, params);
}

export function useTranslation() {
  const locale = useSettingsStore(s => s.locale);
  const t = (key: string, params?: Record<string, any>) => translate(locale, key, params);
  return { t, locale };
}

export function applyLocale(locale: string) {
  const dict = translations[locale] || translations['en-US'];
  const needsRtl = dict._rtl === 'true';
  try {
    if (needsRtl !== I18nManager.isRTL) {
      I18nManager.allowRTL(needsRtl);
      I18nManager.forceRTL(needsRtl);
    }
  } catch {}
}
