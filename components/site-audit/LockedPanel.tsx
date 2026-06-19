import React from 'react';
import { Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface LockedPanelProps {
  children: React.ReactNode;
  title: string;
  description: string;
  requiredTierName: string;
  priceDelta: string;
  currentUrl?: string;
  currentBrand?: string;
  targetTierId: string;
}

export default function LockedPanel({
  children,
  title,
  description,
  requiredTierName,
  priceDelta,
  currentUrl,
  currentBrand,
  targetTierId
}: LockedPanelProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    const params = new URLSearchParams();
    if (currentUrl) params.set('url', currentUrl);
    if (currentBrand) params.set('brand', currentBrand);
    params.set('tier', targetTierId);
    router.push(`/ko/site-audit/checkout?${params.toString()}`);
  };

  return (
    <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/40">
      <div className="opacity-30 blur-[6px] pointer-events-none select-none transition-all duration-500 grayscale group-hover:grayscale-0 group-hover:blur-[4px]">
        {children}
      </div>
      
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 bg-slate-950/40 backdrop-blur-sm">
        <div className="bg-slate-900/90 border border-slate-700 p-8 rounded-2xl max-w-md w-full text-center shadow-2xl transform transition-transform hover:scale-105">
          <div className="mx-auto w-12 h-12 bg-indigo-500/20 rounded-full flex items-center justify-center mb-4 border border-indigo-500/30">
            <Lock className="h-6 w-6 text-indigo-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-100 mb-2">{title}</h3>
          <p className="text-sm text-slate-400 mb-6">{description}</p>
          
          <div className="bg-slate-950 rounded-xl p-4 mb-6 border border-slate-800">
            <div className="flex justify-between items-center text-sm mb-1">
              <span className="text-slate-400">필요한 플랜</span>
              <span className="font-bold text-indigo-400">{requiredTierName} 이상</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-400">추가 비용</span>
              <span className="font-bold text-slate-200">{priceDelta}</span>
            </div>
          </div>
          
          <button 
            onClick={handleUpgrade}
            className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition-colors shadow-lg shadow-indigo-500/20 cursor-pointer"
          >
            {requiredTierName} 플랜으로 업그레이드
          </button>
        </div>
      </div>
    </div>
  );
}
