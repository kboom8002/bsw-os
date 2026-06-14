import React from 'react';
import { Target, Zap, AlertTriangle, Lightbulb, Search, Activity, ShieldCheck, Crosshair, ArrowRight } from 'lucide-react';
import type { BrandOpportunityReport, BrandOpportunity } from '../../lib/benchmark/opportunity-analyzer';

export default function OpportunityIntelligenceSection({ report }: { report: BrandOpportunityReport | null }) {
  if (!report) return null;

  const getTypeStyle = (type: BrandOpportunity['type']) => {
    switch (type) {
      case 'gap': return { icon: <Crosshair className="w-4 h-4 text-rose-400" />, color: 'text-rose-400', bg: 'bg-rose-500/10', border: 'border-rose-500/20', label: 'GAP' };
      case 'volatile': return { icon: <Activity className="w-4 h-4 text-orange-400" />, color: 'text-orange-400', bg: 'bg-orange-500/10', border: 'border-orange-500/20', label: 'VOLATILE' };
      case 'weak_mention': return { icon: <AlertTriangle className="w-4 h-4 text-yellow-400" />, color: 'text-yellow-400', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', label: 'WEAK' };
      case 'dominance': return { icon: <Target className="w-4 h-4 text-emerald-400" />, color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', label: 'DOMINANCE' };
      case 'blind_spot': return { icon: <Search className="w-4 h-4 text-cyan-400" />, color: 'text-cyan-400', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', label: 'BLIND SPOT' };
    }
  };

  return (
    <div className="border border-indigo-500/30 rounded-2xl bg-gradient-to-br from-indigo-950/40 to-slate-900 p-6 shadow-2xl shadow-indigo-950/40 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-indigo-500/20 rounded-xl">
          <Zap className="w-6 h-6 text-indigo-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            Opportunity Intelligence
            <span className="px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-[10px] uppercase font-black tracking-widest border border-indigo-500/30">
              {report.brand_name}
            </span>
          </h2>
          <p className="text-xs text-indigo-300/70 mt-1">
            원시 응답 데이터를 기반으로 E-E-A-T 관점의 브랜드 점유 기회를 포착합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="col-span-1 space-y-4">
          <div className="bg-slate-950/50 rounded-xl p-5 border border-slate-800">
            <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-violet-400" />
              E-E-A-T 취약점 요약
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Expertise (전문성)</span>
                <span className={`font-bold ${report.eeat_summary.expertise_gaps > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {report.eeat_summary.expertise_gaps} gaps
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Experience (경험)</span>
                <span className={`font-bold ${report.eeat_summary.experience_gaps > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {report.eeat_summary.experience_gaps} gaps
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Authority (권위)</span>
                <span className={`font-bold ${report.eeat_summary.authority_gaps > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {report.eeat_summary.authority_gaps} gaps
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Trust (신뢰성)</span>
                <span className={`font-bold ${report.eeat_summary.trust_gaps > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {report.eeat_summary.trust_gaps} gaps
                </span>
              </div>
            </div>
          </div>

          <div className="bg-indigo-500/10 rounded-xl p-5 border border-indigo-500/20">
            <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-indigo-400" />
              핵심 Action Items
            </h3>
            <ul className="space-y-3">
              {report.top_action_items.map((item, idx) => (
                <li key={idx} className="text-xs text-indigo-200/80 flex items-start gap-2 leading-relaxed">
                  <ArrowRight className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="col-span-1 lg:col-span-2">
          <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {report.opportunities.map((opp, idx) => {
              const style = getTypeStyle(opp.type);
              return (
                <div key={idx} className={`p-4 rounded-xl border bg-slate-900/40 backdrop-blur-sm ${style.border}`}>
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-lg ${style.bg} shrink-0`}>
                      {style.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1.5">
                        <span className={`text-[10px] font-black tracking-wider uppercase px-2 py-0.5 rounded ${style.bg} ${style.color}`}>
                          {style.label}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500 uppercase">
                          {opp.eeat_dimension}
                        </span>
                      </div>
                      <p className="text-sm font-medium text-slate-200 mb-2 leading-snug">
                        {opp.question_text}
                      </p>
                      
                      <div className="bg-slate-950/50 rounded-lg p-3 border border-slate-800">
                        <p className="text-xs text-slate-300 flex items-start gap-2">
                          <span className="shrink-0 pt-0.5">💡</span>
                          <span className="leading-relaxed">{opp.recommendation_ko}</span>
                        </p>
                        
                        {opp.competitors_present.length > 0 && (
                          <div className="mt-2 pt-2 border-t border-slate-800/50 text-[11px] text-slate-500">
                            발견된 경쟁사: <span className="text-slate-400">{opp.competitors_present.join(', ')}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            {report.opportunities.length === 0 && (
              <div className="p-8 text-center border border-slate-800 rounded-xl bg-slate-900/20">
                <Target className="w-8 h-8 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400 text-sm">발견된 주요 기회가 없습니다.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
