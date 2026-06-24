"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { History, Clock, FileText, CheckCircle2, ArrowRight, ArrowDownUp, BarChart3, AlertCircle } from 'lucide-react';

export default function AuditHistoryPage() {
  const params = useParams();
  const workspaceSlug = params?.workspace_slug as string;

  const [compareSessions, setCompareSessions] = useState<string[]>([]);
  const [showDiff, setShowDiff] = useState(false);

  // Mock sessions list
  const sessions = [
    { id: 'sess-001', date: '2026-06-24T09:40:00Z', tier: 'Pro (Tier 2)', score: 78.4, pages: 18, status: 'completed', brand: 'Dr. O Skin Lab' },
    { id: 'sess-002', date: '2026-06-17T03:12:00Z', tier: 'Pro (Tier 2)', score: 71.2, pages: 15, status: 'completed', brand: 'Dr. O Skin Lab' },
    { id: 'sess-003', date: '2026-06-03T11:45:00Z', tier: 'Lite (Tier 1)', score: 64.0, pages: 8, status: 'completed', brand: 'Dr. O Skin Lab' },
    { id: 'sess-004', date: '2026-05-19T02:00:00Z', tier: 'Free (Tier 0)', score: 45.5, pages: 5, status: 'completed', brand: 'Dr. O Skin Lab' },
  ];

  const handleSelectCompare = (id: string) => {
    if (compareSessions.includes(id)) {
      setCompareSessions(compareSessions.filter(sid => sid !== id));
    } else if (compareSessions.length < 2) {
      setCompareSessions([...compareSessions, id]);
    }
  };

  const getTierColor = (tier: string) => {
    if (tier.includes('Pro')) return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
    if (tier.includes('Lite')) return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Title */}
      <div className="relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <History className="h-3.5 w-3.5" />
            Audit Logs
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
            서피스 감사 이력 및 비교 리포트
          </h1>
          <p className="text-xs text-slate-400">
            과거 실행된 실측 분석 세션 이력을 보관하고, 두 기간의 가시성 성과 변동폭(Diff)을 계측합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Session Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">이전 실행 결과 세션 목록</h3>
              <span className="text-[10px] text-slate-500">두 세션을 선택하여 성과 변동 비교 리포트 생성</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-500 font-bold">
                    <th className="py-2.5 px-4">비교</th>
                    <th className="py-2.5 px-4">실행 일시</th>
                    <th className="py-2.5 px-4">분석 범위</th>
                    <th className="py-2.5 px-4">구독 티어</th>
                    <th className="py-2.5 px-4">수집 페이지</th>
                    <th className="py-2.5 px-4 text-right">AEPI 지수</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-400">
                  {sessions.map((sess, idx) => {
                    const isSelected = compareSessions.includes(sess.id);
                    return (
                      <tr key={idx} className="hover:bg-slate-800/10">
                        <td className="py-3.5 px-4">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            disabled={compareSessions.length >= 2 && !isSelected}
                            onChange={() => handleSelectCompare(sess.id)}
                            className="accent-indigo-500 h-4 w-4 cursor-pointer"
                          />
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-300">
                          {new Date(sess.date).toLocaleString('ko-KR')}
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-slate-400">{sess.brand}</td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getTierColor(sess.tier)}`}>
                            {sess.tier}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">{sess.pages} pages</td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-200 text-sm">
                          {sess.score}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Comparative card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">세션 성과 비교 뷰</h3>
            
            {compareSessions.length === 2 ? (
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <div>
                    <span className="text-[10px] text-slate-500 block">이전 세션</span>
                    <span className="text-xs font-bold text-slate-400">2026-06-17 세션</span>
                  </div>
                  <span className="text-lg font-black text-slate-300">71.2%</span>
                </div>
                
                <div className="flex justify-center text-slate-600">
                  <ArrowDownUp className="h-5 w-5" />
                </div>
                
                <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                  <div>
                    <span className="text-[10px] text-slate-500 block">최근 세션</span>
                    <span className="text-xs font-bold text-slate-400">2026-06-24 세션</span>
                  </div>
                  <span className="text-lg font-black text-slate-300">78.4%</span>
                </div>

                <div className="p-4 bg-emerald-950/10 border-l-2 border-emerald-500 rounded-r-xl space-y-1">
                  <span className="text-[10px] text-emerald-400 font-extrabold uppercase tracking-wide">
                    가시성 성과 변동폭 (Diff)
                  </span>
                  <p className="text-base font-black text-emerald-400">
                    +7.2% 상승 완료
                  </p>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    robots.txt 수정 및 FAQ 구조화 마크다운 추가를 통하여 인덱싱 유도가 개선되었습니다.
                  </p>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 font-semibold flex flex-col items-center justify-center gap-2 border border-dashed border-slate-800 rounded-xl">
                <AlertCircle className="h-6 w-6 text-slate-600 animate-pulse" />
                <span className="text-xs leading-relaxed">
                  비교를 위해 목록에서 두 개의 세션을 선택하세요.
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
