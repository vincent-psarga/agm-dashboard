import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { LANGUAGES, translations } from './translations';
import type { Language, TranslationKey } from './translations';

const STORAGE_KEY = 'agm-dashboard.language';

export type Translate = (key: TranslationKey, params?: Record<string, string | number>) => string;

interface I18nContextValue {
  language: Language;
  locale: string;
  setLanguage: (language: Language) => void;
  t: Translate;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initialLanguage,
}: {
  children: ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(
    () => initialLanguage ?? detectLanguage(),
  );

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Storage may be unavailable (private mode): the choice is simply not remembered.
    }
  }, []);

  const value = useMemo<I18nContextValue>(
    () => ({
      language,
      locale: language === 'fr' ? 'fr-FR' : 'en-GB',
      setLanguage,
      t: (key, params = {}) =>
        translations[language][key].replace(/\{(\w+)\}/g, (match, name: string) =>
          name in params ? String(params[name]) : match,
        ),
    }),
    [language, setLanguage],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const context = useContext(I18nContext);
  if (!context) throw new Error('useI18n must be used inside an I18nProvider');
  return context;
}

function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && (LANGUAGES as string[]).includes(stored)) return stored as Language;
  } catch {
    // Ignore storage errors and fall back to the browser language.
  }
  return navigator.language.toLowerCase().startsWith('en') ? 'en' : 'fr';
}
