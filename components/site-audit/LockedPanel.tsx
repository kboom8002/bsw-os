import React from 'react';
import { Lock, Eye, ArrowRight, Sparkles } from 'lucide-react';
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
  /** 잠금 전 미리보기 인사이트 (최대 3개) */
  previewInsights?: { label: string; value: string; type?: 'positive' | 'warning' | 'neutral' }[];
  /** 잠겨있는 전체 항목 수 */
  totalLockedItems?: number;
}

export default function LockedPanel({
  children,
  title,
  description,
  requiredTierName,
  priceDelta,
  currentUrl,
  currentBrand,
  targetTierId,
  previewInsights,
  totalLockedItems,
}: LockedPanelProps) {
  const router = useRouter();

  const handleUpgrade = () => {
    const params = new URLSearchParams();
    if (currentUrl) params.set('url', currentUrl);
    if (currentBrand) params.set('brand', currentBrand);
    params.set('tier', targetTierId);
    router.push(`/ko/site-audit/checkout?${params.toString()}`);
  };

  const hasPreview = previewInsights && previewInsights.length > 0;

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
          <p className="text-sm text-slate-400 mb-4">{description}</p>

          {/* 미리보기 인사이트 (무료 사용자에게 가치 보여주기) */}
          {hasPreview && (
            <div className="mb-5 space-y-2">
              <div className="flex items-center gap-1.5 justify-center text-[10px] font-bold text-indigo-400 uppercase tracking-wider">
                <Eye className="h-3 w-3" />
                미리보기 인사이트
              </div>
              {previewInsights.map((insight, i) => (
                <div key={i} className={`flex items-center justify-between px-3 py-2 rounded-lg border text-xs ${
                  insight.type === 'positive' 
                    ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-400'
                    : insight.type === 'warning'
                    ? 'bg-amber-500/5 border-amber-500/20 text-amber-400'
                    : 'bg-slate-800/50 border-slate-700 text-slate-300'
                }`}>
                  <span className="font-semibold">{insight.label}</span>
                  <span className="font-bold">{insight.value}</span>
                </div>
              ))}
              {totalLockedItems && totalLockedItems > (previewInsights?.length || 0) && (
                <p className="text-[10px] text-slate-500 mt-1">
                  🔒 나머지 {totalLockedItems - previewInsights.length}건의 상세 분석이 잠겨있습니다
                </p>
              )}
            </div>
          )}
          
          <div className="bg-slate-950 rounded-xl p-4 mb-5 border border-slate-800">
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
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold transition-all shadow-lg shadow-indigo-500/20 cursor-pointer flex items-center justify-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            전체 결과 확인하기
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
