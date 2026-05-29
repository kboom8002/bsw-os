'use client';

import React from 'react';
import { useTranslation } from '../lib/i18n/context';

export const LanguageToggle: React.FC = () => {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="relative flex items-center p-1 bg-slate-950/60 backdrop-blur-xl border border-white/5 rounded-full shadow-2xl shadow-cyan-500/5 select-none transition-all duration-300 hover:border-white/10 group">
      {/* Sliding Active Overlay */}
      <div 
        className="absolute top-1 bottom-1 w-[46px] rounded-full bg-gradient-to-r from-cyan-400/20 to-blue-500/25 border border-cyan-400/30 shadow-[0_0_12px_rgba(34,211,238,0.2)] transition-all duration-300 ease-out"
        style={{
          transform: locale === 'ko' ? 'translateX(4px)' : 'translateX(50px)'
        }}
      />
      
      {/* KO Button */}
      <button
        onClick={() => setLocale('ko')}
        className={`relative z-10 w-11 py-1.5 text-[10px] font-black tracking-widest text-center rounded-full transition-all duration-300 cursor-pointer ${
          locale === 'ko'
            ? 'text-cyan-400 font-extrabold'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        KO
      </button>
      
      {/* Divider */}
      <span className="w-px h-3 bg-white/5 relative z-10 mx-0.5" />
      
      {/* EN Button */}
      <button
        onClick={() => setLocale('en')}
        className={`relative z-10 w-11 py-1.5 text-[10px] font-black tracking-widest text-center rounded-full transition-all duration-300 cursor-pointer ${
          locale === 'en'
            ? 'text-cyan-400 font-extrabold'
            : 'text-slate-500 hover:text-slate-300'
        }`}
      >
        EN
      </button>
    </div>
  );
};
