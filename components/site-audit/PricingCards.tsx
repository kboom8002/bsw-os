import React from 'react';
import { Check, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { startAuditSession } from '../../app/actions/site-audit';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

interface PricingCardsProps {
  onSelectTier?: (tier: string) => void;
  currentUrl?: string;
  currentBrand?: string;
}

export default function PricingCards({ onSelectTier, currentUrl, currentBrand }: PricingCardsProps) {
  const [loadingTier, setLoadingTier] = useState<string | null>(null);
  const router = useRouter();

  const handleSelect = async (tier: string) => {
    if (onSelectTier) {
      onSelectTier(tier);
    } else {
      if (!currentUrl) return; // Cannot start without URL
      try {
        setLoadingTier(tier);
        const workspaceId = "c2498c4f-aee3-49e0-bb80-171a0852128f"; // hardcoded for demo
        const sessionId = await startAuditSession(workspaceId, currentUrl, currentBrand || "", [], tier as any);
        router.push(`/ko/site-audit/progress/${sessionId}?tier=${tier}`);
      } catch (err) {
        console.error("Failed to start session:", err);
        setLoadingTier(null);
      }
    }
  };

  return (
    <div className="w-full">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-100">당신의 브랜드에 맞는 진단을 선택하세요</h2>
        <p className="text-slate-400 mt-2 text-sm">더 깊은 분석으로 보이지 않던 최적화 기회를 발견하세요.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
        {/* Quick Scan */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-200">Quick Scan</h3>
          <div className="mt-4 mb-6">
            <span className="text-3xl font-black text-slate-100">무료</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 pb-6 border-b border-slate-800">소요 시간: ~30초</p>
          <ul className="space-y-3 text-sm text-slate-300 flex-1">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> AEPI 스코어 추정</li>
            <li className="flex items-center gap-2 text-slate-500"><X className="h-4 w-4" /> ERR 7축 실측</li>
            <li className="flex items-center gap-2 text-slate-500"><X className="h-4 w-4" /> V1/V2 페르소나 분석</li>
            <li className="flex items-center gap-2 text-slate-500"><X className="h-4 w-4" /> 시계열 트렌드</li>
          </ul>
          <button 
            onClick={() => handleSelect('free')}
            className="mt-8 w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            현재 결과
          </button>
        </div>

        {/* Lite */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-200">Lite</h3>
          <div className="mt-4 mb-6">
            <span className="text-3xl font-black text-slate-100">₩89K</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 pb-6 border-b border-slate-800">소요 시간: ~3분</p>
          <ul className="space-y-3 text-sm text-slate-300 flex-1">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> AEPI 실측</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> ERR 7축 분석</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> V1 페르소나 관측</li>
            <li className="flex items-center gap-2 text-slate-500"><X className="h-4 w-4" /> V2 파라메트릭 역설계</li>
          </ul>
          <button 
            onClick={() => handleSelect('tier1')}
            className="mt-8 w-full py-2.5 rounded-xl border border-indigo-500/50 hover:bg-indigo-500/10 text-indigo-400 font-semibold text-sm transition-colors cursor-pointer"
          >
            {loadingTier === 'tier1' ? <span className='flex items-center justify-center gap-2'><Loader2 className='h-4 w-4 animate-spin' /> 준비 중...</span> : 'Lite 시작하기'}
          </button>
        </div>

        {/* Pro */}
        <div className="bg-slate-900/80 border-2 border-indigo-500 rounded-2xl p-6 flex flex-col relative shadow-[0_0_30px_rgba(99,102,241,0.15)] transform md:-translate-y-2">
          <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-violet-500 to-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> BEST 추천
          </div>
          <h3 className="text-lg font-bold text-slate-200">Pro</h3>
          <div className="mt-4 mb-6">
            <span className="text-3xl font-black text-slate-100">₩249K</span>
          </div>
          <p className="text-xs text-indigo-300 mb-6 pb-6 border-b border-slate-800">소요 시간: ~8분</p>
          <ul className="space-y-3 text-sm text-slate-300 flex-1">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Lite 기능 전체 포함</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> V2 파라메트릭 역설계</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> B2B/B2C 간극 분석</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 시계열 트렌드 모니터링</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Deep-Dive 처방 (3회)</li>
          </ul>
          <button 
            onClick={() => handleSelect('tier1.5')}
            className="mt-8 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-colors shadow-lg shadow-indigo-500/25 cursor-pointer"
          >
            {loadingTier === 'tier1.5' ? <span className='flex items-center justify-center gap-2'><Loader2 className='h-4 w-4 animate-spin' /> 진단 준비 중...</span> : 'Pro 업그레이드'}
          </button>
        </div>

        {/* Enterprise */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 flex flex-col">
          <h3 className="text-lg font-bold text-slate-200">Enterprise</h3>
          <div className="mt-4 mb-6">
            <span className="text-3xl font-black text-slate-100">₩590K</span>
          </div>
          <p className="text-xs text-slate-400 mb-6 pb-6 border-b border-slate-800">소요 시간: ~15분</p>
          <ul className="space-y-3 text-sm text-slate-300 flex-1">
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Pro 기능 전체 포함</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 8D Fidelity 시뮬레이션</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Floor Risk 이중 게이트웨이</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> 기계판독 가능 PersonaSpec</li>
            <li className="flex items-center gap-2"><Check className="h-4 w-4 text-emerald-500" /> Deep-Dive 무제한</li>
          </ul>
          <button 
            onClick={() => handleSelect('tier3')}
            className="mt-8 w-full py-2.5 rounded-xl border border-slate-700 hover:bg-slate-800 text-slate-300 font-semibold text-sm transition-colors cursor-pointer"
          >
            {loadingTier === 'tier3' ? <span className='flex items-center justify-center gap-2'><Loader2 className='h-4 w-4 animate-spin' /> 준비 중...</span> : 'Enterprise 바로 시작'}
          </button>
        </div>
      </div>
    </div>
  );
}

function X({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
