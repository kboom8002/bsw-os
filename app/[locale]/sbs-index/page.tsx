"use client";

import React, { useState } from "react";
import { 
  Tv, 
  TrendingUp, 
  ShieldCheck, 
  Award, 
  Search, 
  Sparkles, 
  Activity, 
  ArrowRight, 
  ChevronRight,
  HelpCircle
} from "lucide-react";

export default function SBSIndexDashboard() {
  const [activeTab, setActiveTab] = useState<"beauty" | "wedding" | "clinic">("beauty");
  const [mriBaselines] = useState({
    beauty: 0.88,
    wedding: 0.82,
    clinic: 0.85,
  });

  const aiprRankings = {
    beauty: [
      { rank: 1, brand: "PureBarrier (피디브)", score: 85.4, bsf: 62, aas: 88, ocr: 40, swel: 1.15 },
      { rank: 2, brand: "레티놀랩", score: 72.1, bsf: 50, aas: 82, ocr: 30, swel: 1.10 },
      { rank: 3, brand: "더마뷰티", score: 64.8, bsf: 48, aas: 79, ocr: 25, swel: 1.08 },
      { rank: 4, brand: "민감장벽", score: 58.2, bsf: 42, aas: 75, ocr: 20, swel: 1.05 },
    ],
    wedding: [
      { rank: 1, brand: "Lumiere Hall (루미에르)", score: 82.6, bsf: 58, aas: 85, ocr: 38, swel: 1.12 },
      { rank: 2, brand: "아펠가모", score: 74.3, bsf: 52, aas: 81, ocr: 32, swel: 1.10 },
      { rank: 3, brand: "더채플", score: 68.1, bsf: 49, aas: 78, ocr: 28, swel: 1.07 },
      { rank: 4, brand: "베뉴지", score: 55.4, bsf: 40, aas: 72, ocr: 18, swel: 1.05 },
    ],
    clinic: [
      { rank: 1, brand: "더마피부과", score: 88.2, bsf: 64, aas: 90, ocr: 42, swel: 1.16 },
      { rank: 2, brand: "아이디클리닉", score: 79.5, bsf: 56, aas: 84, ocr: 34, swel: 1.11 },
      { rank: 3, brand: "톡스앤필", score: 70.3, bsf: 51, aas: 80, ocr: 26, swel: 1.09 },
      { rank: 4, brand: "뮤즈클리닉", score: 61.8, bsf: 45, aas: 76, ocr: 22, swel: 1.06 },
    ],
  };

  const activeRankings = aiprRankings[activeTab];
  const activeMri = mriBaselines[activeTab];

  // KAIVI = Avg BAIR * Avg MRI
  const avgBair = activeRankings.reduce((sum, item) => sum + item.score, 0) / activeRankings.length;
  const kaiviScore = Number((avgBair * activeMri).toFixed(1));

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Banner */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <Tv className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                SBS × BSW-OS
              </span>
              <span className="text-xs block text-slate-400 font-semibold">KOREA AI INDEX BOARD</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
              실시간 산출 활성화
            </span>
            <button className="px-4 py-1.5 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/25 transition-all">
              지표 편입 신청
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Title Section */}
        <div className="relative mb-12 text-center md:text-left">
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 blur-3xl rounded-3xl -z-10"></div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            AEO 시대의 대한민국 표준 브랜드 평판
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none mb-4">
            국가 AI 가시성 및<br className="md:hidden" /> 브랜드 평판지수
          </h1>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl leading-relaxed">
            인공지능 검색 엔진(ChatGPT Search, Google Search Grounding 등) 내 브랜드의 점유율, 호감도, 최적 추천도를 실시간으로 추적하여 산출하는 공신력 있는 표준 종합 평판 보드입니다.
          </p>
        </div>

        {/* Top 3 Core Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Card 1: KAIVI */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:border-slate-700/60 shadow-xl shadow-slate-950/40">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <Activity className="h-24 w-24 text-blue-500" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">KAIVI (국가 AI 가시성 지수)</span>
              <TrendingUp className="h-5 w-5 text-blue-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                {kaiviScore}
              </span>
              <span className="text-xs font-bold text-slate-500">/ 100 pt</span>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              업종 내 최고 BAIR 지수와 기업의 의미적 준비도(MRI) 데이터를 융합해 가시성을 가중 정산한 국가 표준 점수.
            </p>
          </div>

          {/* Card 2: AITI */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl transition-all hover:border-slate-700/60 shadow-xl shadow-slate-950/40">
            <div className="absolute top-0 right-0 p-8 opacity-10">
              <ShieldCheck className="h-24 w-24 text-indigo-500" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">AITI (AI 답변 신뢰도 지수)</span>
              <ShieldCheck className="h-5 w-5 text-indigo-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                {(activeMri * 100).toFixed(0)}
              </span>
              <span className="text-xs font-bold text-slate-500">/ 100 pt</span>
            </div>
            <p className="text-xs text-slate-400 mt-4 leading-relaxed">
              AI 검색 엔진 답변이 브랜드의 사실 검증된 증거(Evidence)와 일치하는 신뢰성 매칭 비율 지표.
            </p>
          </div>

          {/* Card 3: Free Diagnostics CTA */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-950 p-6 backdrop-blur-xl transition-all hover:border-indigo-500/50 shadow-xl shadow-indigo-950/10">
            <div className="absolute top-0 right-0 p-8 opacity-25">
              <Award className="h-24 w-24 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">AI Reputation 진단</span>
              <Award className="h-5 w-5 text-indigo-400" />
            </div>
            <h3 className="text-lg font-black leading-tight mb-2">우리 브랜드 BAIR 지수 무료 산정</h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              검색 엔진 관측과 VPA 코사인 튜닝 분석을 통해 24시간 내 무료 분석 리포트를 메일로 전송해 드립니다.
            </p>
            <button className="w-full py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white flex items-center justify-center gap-1 shadow-lg shadow-indigo-950/30 transition-all">
              무료 진단 리포트 신청
              <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* AIPR Leaderboard & Filters */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-6 shadow-2xl shadow-slate-950/60 mb-12">
          {/* Tab Selector */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-4">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Search className="h-5 w-5 text-indigo-400" />
                업종별 AI 파워랭킹 (AIPR Leaderboard)
              </h2>
              <p className="text-xs text-slate-400 mt-1">지표 탭을 전환하여 업종 대표 브랜드들의 가중 BAIR 평가 순위를 확인하세요.</p>
            </div>

            <div className="flex bg-slate-900/80 p-1.5 rounded-lg border border-slate-800 self-start sm:self-auto">
              <button 
                onClick={() => setActiveTab("beauty")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-md transition-all ${activeTab === "beauty" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                K-Beauty 스킨케어
              </button>
              <button 
                onClick={() => setActiveTab("wedding")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-md transition-all ${activeTab === "wedding" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                웨딩홀 서비스
              </button>
              <button 
                onClick={() => setActiveTab("clinic")}
                className={`px-3 py-1.5 text-xs font-extrabold rounded-md transition-all ${activeTab === "clinic" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-slate-200"}`}
              >
                피부과 리프팅
              </button>
            </div>
          </div>

          {/* Table Container */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 border-b border-slate-800">
                  <th className="pb-3 font-semibold uppercase tracking-wider pl-4">순위</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider">브랜드 이름</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-right">종합 BAIR 점수</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-center">점유율 (BSF)</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-center">호감도 (AAS)</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-center">추천도 (OCR)</th>
                  <th className="pb-3 font-semibold uppercase tracking-wider text-center">시맨틱 웹 가중 (SWEL)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {activeRankings.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-900/20 transition-colors">
                    <td className="py-4 pl-4 font-black text-sm">
                      {item.rank === 1 ? (
                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20">
                          1
                        </span>
                      ) : (
                        <span className="text-slate-400">{item.rank}</span>
                      )}
                    </td>
                    <td className="py-4 font-bold text-slate-200 flex items-center gap-1.5">
                      {item.brand}
                      {item.rank === 1 && (
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                          Top Tier
                        </span>
                      )}
                    </td>
                    <td className="py-4 font-black text-right text-slate-100 text-sm">
                      {item.score} <span className="text-[10px] text-slate-500">pt</span>
                    </td>
                    <td className="py-4 text-center font-semibold">{item.bsf}%</td>
                    <td className="py-4 text-center font-semibold">{(item.aas * 100).toFixed(0)}%</td>
                    <td className="py-4 text-center font-semibold">{(item.ocr * 100).toFixed(0)}%</td>
                    <td className="py-4 text-center font-mono text-indigo-400 font-bold">x{item.swel.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Methodology Footer Alert */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-200">지표 공시 및 프록시 면책 고시 (Methodology Disclosure)</h4>
            <p className="text-[10px] text-slate-400 leading-relaxed mt-1">
              본 SBS 공동 인덱스는 BSW-OS 관측 시스템 내 샌드박스 크롤링 검증 및 시뮬레이션 데이터를 근거로 산출된 종합 평판 지표입니다. 실제 상용 AI 검색 모델의 점유 지표는 환경적 변수 및 시간대에 따라 유동적일 수 있습니다. 본 데이터는 기업의 AEO(인공지능 엔진 최적화) 의사결정을 돕는 전략 분석용 기준 자료입니다.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-900/30 py-8 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 SBS × Brand Semantic Website OS Joint-Venture Partnership. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
