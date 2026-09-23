import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import { STORAGE_KEYS } from '@/constants/storage';
import { en, type TxKey } from './translations_en';
import { am } from './translations_am';

export type Language = 'en' | 'am';

export type TranslateVars = Record<string, string | number>;

const DICTS: Record<Language, Record<TxKey, string>> = { en, am };

function deviceLanguage(): Language {
  try {
    const code = getLocales()?.[0]?.languageCode?.toLowerCase() ?? '';
    return code === 'am' || code.startsWith('am-') ? 'am' : 'en';
  } catch {
    return 'en';
  }
}

interface LanguageContextValue {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: Translate;
}

export type Translate = (key: TxKey, vars?: TranslateVars) => string;

const LanguageContext = createContext<LanguageContextValue>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => deviceLanguage());

  // Stored choice wins over the device locale (loads async after first paint).
  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.language)
      .then((stored) => {
        if (stored === 'en' || stored === 'am') setLanguageState(stored);
      })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    AsyncStorage.setItem(STORAGE_KEYS.language, lang).catch(() => {});
  }, []);

  const t = useCallback(
    (key: TxKey, vars?: TranslateVars) => {
      let template: string = DICTS[language][key] ?? en[key] ?? key;
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          template = template.replaceAll(`{${k}}`, String(v));
        }
      }
      return template;
    },
    [language],
  );

  const value = useMemo(
    () => ({ language, setLanguage, t }),
    [language, setLanguage, t],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
