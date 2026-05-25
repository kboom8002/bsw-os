'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n/context';

export const LanguageToggle: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-1 p-1 bg-slate-900/50 backdrop-blur-md border border-slate-800/80 rounded-full shadow-inner">
      <button
        onClick={() => setLocale('ko')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
          locale === 'ko'
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        KO
      </button>
      <button
        onClick={() => setLocale('en')}
        className={`px-3 py-1 text-xs font-semibold rounded-full transition-all duration-300 ${
          locale === 'en'
            ? 'bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
            : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        EN
      </button>
    </div>
  );
};
