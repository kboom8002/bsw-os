"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Globe, Search, ArrowRight, Sparkles, Building2 } from "lucide-react";
import PricingCards from "./PricingCards";

const EXAMPLES = [
  { url: "https://droanswer.com", brand: "DR.O (닥터오)" },
  { url: "https://drjart.com", brand: "닥터자르트" },
  { url: "https://roundlab.co.kr", brand: "라운드랩" },
  { url: "https://ephotoessay.com", brand: "이포토에세이" },
  { url: "https://lumierestudio.co.kr", brand: "루미에 스튜디오" },
];

export default function SiteAuditLanding({ locale = "ko" }: { locale?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [industry, setIndustry] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    let normalized = url.trim();
    if (!normalized) {
      setError("웹사이트 URL을 입력해주세요.");
      return;
    }
    if (!normalized.startsWith("http")) {
      normalized = "https://" + normalized;
    }
    try {
      new URL(normalized);
    } catch {
      setError("유효한 URL 형식을 입력해주세요. (예: https://example.com)");
      return;
    }

    const params = new URLSearchParams({
      url: normalized,
      ...(brand.trim() ? { brand: brand.trim() } : {}),
      ...(industry.trim() ? { industry: industry.trim() } : {}),
    });
    router.push(`/${locale}/site-audit?${params.toString()}`);
  };

  const handleExample = (ex: { url: string; brand: string }) => {
    setUrl(ex.url);
    setBrand(ex.brand);
    setError("");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center gap-3">
          <div className="p-2 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
            <BarChart3 className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              AEO/GEO Surface Auditor
            </span>
            <span className="text-xs block text-slate-400 font-semibold">
              웹사이트 AI 검색엔진 노출 서피스 역설계 및 최적화 점검 도구
            </span>
          </div>
        </div>
      </header>

      {/* Main landing */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-16">
        {/* Hero */}
        <div className="text-center mb-12 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-6">
            <Sparkles className="h-3.5 w-3.5" />
            ChatGPT Search + Gemini Grounding 역설계
          </div>
          <h1 className="text-4xl font-black text-slate-100 tracking-tight leading-tight mb-4">
            AI가 당신의 브랜드를<br />
            <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              정확히 알고 있을까?
            </span>
          </h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            ChatGPT, Gemini, Perplexity가 우리 브랜드를 어떻게 인식하고 평가하는지 30초 만에 무료로 진단합니다.
          </p>
        </div>

        {/* Input card */}
        <div className="w-full max-w-xl bg-slate-900/60 border border-slate-800 rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* URL input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                대상 웹사이트 URL
              </label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
                />
              </div>
            </div>

                        {/* Industry input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                업종 <span className="text-slate-600 normal-case font-normal">(선택 · 미입력 시 자동 감지)</span>
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <select
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-100 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all appearance-none"
                >
                  <option value="">자동 감지 (Auto-detect)</option>
                  <option value="wedding_studio">웨딩/스튜디오</option>
                  <option value="skincare">스킨케어/코스메틱</option>
                  <option value="clinic">병원/클리닉</option>
                  <option value="restaurant">레스토랑/F&B</option>
                  <option value="it_software">IT/SaaS</option>
                  <option value="fashion_ecommerce">패션/쇼핑몰</option>
                </select>
              </div>
            </div>

            {/* Brand name input */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                브랜드 이름 <span className="text-slate-600 normal-case font-normal">(선택 · 미입력 시 도메인명 사용)</span>
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="예: 닥터오, 루미에 스튜디오, Dr.Jart+"
                className="w-full px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-slate-100 text-sm placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/40 transition-all"
              />
            </div>

            {error && (
              <p className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer"
            >
              <Search className="h-4 w-4" />
              30초 무료 진단 시작
              <ArrowRight className="h-4 w-4" />
            </button>
          </form>

          {/* Examples */}
          <div className="mt-6 pt-6 border-t border-slate-800">
            <p className="text-xs text-slate-500 font-semibold mb-3 uppercase tracking-wide">예시 사이트</p>
            <div className="flex flex-wrap gap-2">
              {EXAMPLES.map((ex) => (
                <button
                  key={ex.url}
                  onClick={() => handleExample(ex)}
                  className="px-3 py-1.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700 hover:border-slate-600 rounded-lg text-xs text-slate-300 transition-all cursor-pointer"
                >
                  {ex.brand}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-3 mt-10 justify-center">
          {[
            "🔍 지식 그래프 추출",
            "📊 AEPI 가시성 지수",
            "🃏 앤서카드 역설계",
            "🎯 E-E-A-T 분석",
            "💊 최적화 처방전",
            "👤 AI 페르소나 측정",
          ].map((f) => (
            <span
              key={f}
              className="px-3 py-1.5 text-xs font-semibold text-slate-400 bg-slate-900/60 border border-slate-800 rounded-full"
            >
              {f}
            </span>
          ))}
        </div>
              {/* Pricing Section */}
        <div className="mt-24 w-full">
          <PricingCards />
        </div>
</main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-6 text-center text-xs text-slate-500">
        <p>© 2026 BSW-OS Brand Semantic Website OS. All Rights Reserved.</p>
      </footer>
    </div>
  );
}
