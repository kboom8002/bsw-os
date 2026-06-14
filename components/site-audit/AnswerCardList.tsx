"use client";

import React from "react";
import { ReversedAnswerCard } from "../../lib/schema";
import { HelpCircle, Columns, Play, List, Award, ShieldAlert, CheckCircle2 } from "lucide-react";

interface AnswerCardListProps {
  cards: ReversedAnswerCard[];
}

export default function AnswerCardList({ cards }: AnswerCardListProps) {
  const getCardIcon = (type: ReversedAnswerCard['card_type']) => {
    switch (type) {
      case "direct_answer": return <Play className="h-4 w-4 text-violet-400 rotate-90" />;
      case "comparison": return <Columns className="h-4 w-4 text-cyan-400" />;
      case "how_to": return <List className="h-4 w-4 text-emerald-400" />;
      case "faq": return <HelpCircle className="h-4 w-4 text-yellow-400" />;
      default: return <Award className="h-4 w-4 text-pink-400" />;
    }
  };

  const getStatusBadge = (status: ReversedAnswerCard['optimization_status']) => {
    switch (status) {
      case "optimized":
        return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1"><CheckCircle2 className="h-2.5 w-2.5" /> AEO 최적화됨</span>;
      case "partial":
        return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-yellow-500/10 text-yellow-400 border border-yellow-500/20">부분 최적화</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1"><ShieldAlert className="h-2.5 w-2.5" /> 미최적화</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 gap-3">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-400" />
            AI 검색엔진 답변 카드 역설계 (Answer Cards Reverse-Engineered)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            소비자의 특정 의도에 반응하여 AI 검색결과 상단에 출현할 수 있는 가상의 최적화 답변 모델입니다.
          </p>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
          총 {cards.length}개 답변 카드 설계됨
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {cards.length > 0 ? (
          cards.map((card, idx) => (
            <div
              key={idx}
              className="border border-slate-800/80 bg-slate-900/10 rounded-2xl p-5 hover:border-slate-700/80 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3.5 gap-2">
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-slate-300 uppercase tracking-wider border border-slate-700">
                    {card.card_type}
                  </span>
                  {getStatusBadge(card.optimization_status)}
                </div>

                <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 mb-4 leading-relaxed">
                  {getCardIcon(card.card_type)}
                  {card.headline}
                </h3>

                <div className="space-y-2 border-t border-slate-800/60 pt-3.5">
                  <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block">주요 호출 검색 쿼리 (Triggers)</span>
                  <div className="space-y-1">
                    {card.trigger_queries.map((q, qIdx) => (
                      <span key={qIdx} className="text-xs text-slate-300 block bg-slate-900/40 px-2 py-1 rounded border border-slate-800/50">
                        {q}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center border-t border-slate-850 pt-4 mt-4 text-[10px]">
                <div className="flex gap-4">
                  <span className="text-slate-500">
                    완전성: <strong className="text-slate-300">{card.completeness_score}%</strong>
                  </span>
                  <span className="text-slate-500">
                    신뢰도: <strong className="text-slate-300">{card.eeat_strength}%</strong>
                  </span>
                </div>
                <span className="text-slate-500">
                  자원 수: <strong className="text-slate-300">{card.body_entity_ids.length}개</strong>
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-2 py-16 text-center text-slate-500 text-sm">
            생성된 답변 카드가 없습니다.
          </div>
        )}
      </div>
    </div>
  );
}
