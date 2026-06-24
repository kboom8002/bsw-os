import React, { useState } from 'react';
import { Award, ChevronDown, ChevronUp, CheckCircle2, AlertCircle } from 'lucide-react';
import { EEATQuadScore } from '../../lib/surface/content-semantic-analyzer';

interface EEATQuadChartProps {
  score: EEATQuadScore;
}

export default function EEATQuadChart({ score }: EEATQuadChartProps) {
  const [expanded, setExpanded] = useState(false);

  const axes = [
    {
      name: 'Experience (경험)',
      sub: '직접적인 체험, 실제 사용기, UGC 리뷰 유무',
      val: score.experience,
      color: 'from-amber-400 to-orange-500',
      textColor: 'text-amber-400'
    },
    {
      name: 'Expertise (전문성)',
      sub: '저자 약력/학위 명시, 전문 자격 증명, 검증 필진',
      val: score.expertise,
      color: 'from-violet-400 to-indigo-500',
      textColor: 'text-violet-400'
    },
    {
      name: 'Authoritativeness (권위성)',
      sub: 'sameAs 소셜 채널 수, 정부/학술지 외부 인용, 특허/인증',
      val: score.authoritativeness,
      color: 'from-cyan-400 to-blue-500',
      textColor: 'text-cyan-400'
    },
    {
      name: 'Trustworthiness (신뢰성)',
      sub: 'HTTPS 보안, 개인정보/이용약관 페이지, 연락처 명확성',
      val: score.trustworthiness,
      color: 'from-emerald-400 to-teal-500',
      textColor: 'text-emerald-400'
    }
  ];

  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-lg text-white shadow-md">
            <Award className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-200">E-E-A-T 4축 신뢰성 상세 분석</h3>
            <p className="text-[11px] text-slate-500 mt-0.5">
              웹사이트의 검색엔진 대상 신뢰 자산(Experience, Expertise, Authority, Trust) 분포입니다.
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">E-E-A-T 종합</span>
          <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
            {score.overall}%
          </span>
        </div>
      </div>

      <div className="space-y-4">
        {axes.map((axis, idx) => (
          <div key={idx} className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <div>
                <span className="text-xs font-bold text-slate-200">{axis.name}</span>
                <span className="text-[10px] text-slate-500 ml-2 hidden sm:inline">{axis.sub}</span>
              </div>
              <span className={`text-xs font-black ${axis.textColor}`}>{axis.val}%</span>
            </div>
            <div className="w-full bg-slate-800/50 rounded-full h-2.5 overflow-hidden border border-slate-800/50">
              <div
                className={`h-2.5 rounded-full bg-gradient-to-r ${axis.color}`}
                style={{ width: `${axis.val}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 border-t border-slate-800/60 pt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs font-bold text-slate-400 hover:text-slate-200 transition-colors cursor-pointer py-1"
        >
          <span>E-E-A-T 감지된 시맨틱 신호 상세 ({score.signals.filter(s => s.found).length}개 감지됨)</span>
          {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        </button>

        {expanded && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
            {score.signals.map((sig, idx) => (
              <div
                key={idx}
                className={`flex items-start gap-2.5 p-3 rounded-xl border transition-all ${
                  sig.found
                    ? 'bg-emerald-950/10 border-emerald-900/30 text-slate-300'
                    : 'bg-slate-900/20 border-slate-900/60 text-slate-500'
                }`}
              >
                {sig.found ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-slate-700 shrink-0 mt-0.5" />
                )}
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-xs font-bold">{sig.signal}</span>
                    <span className={`text-[8px] font-bold px-1 py-0.5 rounded uppercase tracking-wider ${
                      sig.axis === 'Experience' ? 'bg-amber-950/30 text-amber-400' :
                      sig.axis === 'Expertise' ? 'bg-violet-950/30 text-violet-400' :
                      sig.axis === 'Authoritativeness' ? 'bg-cyan-950/30 text-cyan-400' :
                      'bg-emerald-950/30 text-emerald-400'
                    }`}>
                      {sig.axis}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    {sig.found ? `감지 소스: ${sig.source}` : '감지되지 않음'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
