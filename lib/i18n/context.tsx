'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import ko from '../../dictionaries/ko.json';
import en from '../../dictionaries/en.json';

type Locale = 'ko' | 'en';

type Translations = typeof ko;

interface TranslationContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (key: string) => string;
}

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

const dictionaries: Record<Locale, any> = { ko, en };

export const TranslationProvider: React.FC<{
  children: React.ReactNode;
  initialLocale: Locale;
}> = ({ children, initialLocale }) => {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Sync cookie on load
    document.cookie = `NEXT_LOCALE=${locale}; path=/; max-age=31536000; SameSite=Lax`;
  }, [locale]);

  const setLocale = (newLocale: Locale) => {
    if (newLocale === locale) return;

    setLocaleState(newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale}; path=/; max-age=31536000; SameSite=Lax`;

    // Rewrite path to use the new locale
    const segments = pathname.split('/');
    if (segments[1] === 'ko' || segments[1] === 'en') {
      segments[1] = newLocale;
    } else {
      // In case we don't have a locale prefix yet
      segments.splice(1, 0, newLocale);
    }
    const newPath = segments.join('/');
    router.push(newPath);
  };

  const t = (key: string): string => {
    const keys = key.split('.');
    let current: any = dictionaries[locale];

    for (const k of keys) {
      if (current && typeof current === 'object' && k in current) {
        current = current[k];
      } else {
        // Fallback to English dictionary if key is missing in Korean
        let enFallback: any = dictionaries['en'];
        for (const kEn of keys) {
          if (enFallback && typeof enFallback === 'object' && kEn in enFallback) {
            enFallback = enFallback[kEn];
          } else {
            return key; // Return raw key as absolute fallback
          }
        }
        return enFallback;
      }
    }

    return typeof current === 'string' ? current : key;
  };

  return (
    <TranslationContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error('useTranslation must be used within a TranslationProvider');
  }
  return context;
};
