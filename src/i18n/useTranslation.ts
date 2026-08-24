import { useStore } from '../store/useStore';
import { translations } from './translations';
import { enUS, vi, zhCN, ko } from 'date-fns/locale';
import { type Locale } from 'date-fns';

const locales: Record<string, Locale> = {
  en: enUS,
  vi: vi,
  zh: zhCN,
  ko: ko,
};

export function useTranslation() {
  const language = useStore(s => s.language) || 'en';
  
  const t = (key: string, params?: Record<string, string | number>) => {
    const keys = key.split('.');
    let value: any = translations[language];
    for (const k of keys) {
      if (value === undefined) break;
      value = value[k];
    }
    
    // Fallback to English if missing in current language
    if ((value === undefined || typeof value !== 'string') && language !== 'en') {
      value = translations['en'];
      for (const k of keys) {
        if (value === undefined) break;
        value = value[k];
      }
    }
    let res = typeof value === 'string' ? value : (keys[keys.length - 1] || key).replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
    if (typeof value !== 'string') console.warn(`Missing translation for key: ${key}`);
    if (params) {
      Object.keys(params).forEach(k => {
        res = res.replace(`{{${k}}}`, String(params[k]));
      });
    }
    return res;
  };

  const dateLocale = locales[language] || enUS;

  return { t, language, dateLocale };
}
