"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Globe, Search, ArrowRight, Sparkles, Building2, Zap, Brain, ShieldCheck, ChevronDown, Loader2 } from "lucide-react";
import PricingCards from "./PricingCards";

const EXAMPLES = [
  { url: "https://droanswer.com", brand: "DR.O (닥터오)" },
  { url: "https://drjart.com", brand: "닥터자르트" },
  { url: "https://roundlab.co.kr", brand: "라운드랩" },
  { url: "https://ephotoessay.com", brand: "이포토에세이" },
  { url: "https://lumierestudio.co.kr", brand: "루미에 스튜디오" },
];

type AuditTier = 'free' | 'tier1' | 'tier2' | 'tier3';

const AUDIT_TIERS: {
  id: AuditTier;
  label: string;
  description: string;
  duration: string;
  features: string[];
  color: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    id: 'free',
    label: '⚡ Quick Scan (무료)',
    description: 'HTML 파싱 기반 즉시 추정 — AI API 미사용',
    duration: '~8초',
    features: ['HTML/Schema.org 파싱', 'E-E-A-T 신호 감지', 'AEPI 추정치', '기본 처방전'],
    color: 'border-slate-700 bg-slate-800/40',
    icon: Zap,
  },
  {
    id: 'tier1',
    label: '🔬 Lite 정밀 진단',
    description: 'LLM 엔티티 추출 + AI 앤서카드 역설계',
    duration: '~3분',
    features: ['LLM 의미 엔티티 추출', 'AI 앤서카드 역설계', '지식 그래프 구축', 'QIS 교차 매핑'],
    color: 'border-indigo-500/40 bg-indigo-500/5',
    icon: Search,
  },
  {
    id: 'tier2',
    label: '🚀 Pro 전체 진단',
    description: 'Entity Reflection 실측 + 브랜드 페르소나 분석',
    duration: '~8분',
    features: ['ChatGPT/Gemini 실측 반영률', 'AEPI 정밀 측정', '브랜드 페르소나 역설계', '시계열 트렌드'],
    color: 'border-violet-500/40 bg-violet-500/5',
    icon: Brain,
  },
  {
    id: 'tier3',
    label: '🏆 Enterprise 완전 진단',
    description: '144회 반복 파라메트릭 + 8D 시뮬레이션',
    duration: '~15분',
    features: ['파라메트릭 페르소나 144회 측정', '8D Floor Risk 시뮬레이션', '전체 결과 PDF 출력', '고급 Gap 분석'],
    color: 'border-amber-500/40 bg-amber-500/5',
    icon: ShieldCheck,
  },
];

export default function SiteAuditLanding({ locale = "ko" }: { locale?: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [brand, setBrand] = useState("");
  const [industry, setIndustry] = useState("");
  const [selectedTier, setSelectedTier] = useState<AuditTier>('free');
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showTiers, setShowTiers] = useState(false);

  const [detectedIndustry, setDetectedIndustry] = useState<string | null>(null);

  const detectIndustryFromUrl = (inputUrl: string): string | null => {
    const lower = inputUrl.toLowerCase();
    const DOMAIN_INDUSTRY_MAP: Record<string, { key: string; label: string }> = {
      'skin': { key: 'skincare', label: '스킨케어' },
      'beauty': { key: 'skincare', label: '스킨케어' },
      'hair': { key: 'hair_salon', label: '헤어살롱' },
      'cafe': { key: 'cafe', label: '카페' },
      'restaurant': { key: 'restaurant', label: '레스토랑' },
      'law': { key: 'legal', label: '법률' },
      'clinic': { key: 'clinic', label: '병원/클리닉' },
      'dental': { key: 'clinic', label: '병원/클리닉' },
      'fitness': { key: 'fitness', label: '피트니스' },
      'academy': { key: 'education', label: '교육/학원' },
      'hotel': { key: 'travel', label: '여행/호텔' },
      'photo': { key: 'wedding_studio', label: '웨딩스튜디오' },
      'wedding': { key: 'wedding', label: '웨딩플래닝' },
    };
    for (const [keyword, info] of Object.entries(DOMAIN_INDUSTRY_MAP)) {
      if (lower.includes(keyword)) {
        return info.key;
      }
    }
    return null;
  };

  const getDetectedLabel = (key: string): string => {
    const labels: Record<string, string> = {
      'skincare': '스킨케어', 'hair_salon': '헤어살롱', 'cafe': '카페',
      'restaurant': '레스토랑', 'legal': '법률', 'clinic': '병원/클리닉',
      'fitness': '피트니스', 'education': '교육/학원', 'travel': '여행/호텔',
      'wedding_studio': '웨딩스튜디오', 'wedding': '웨딩플래닝',
    };
    return labels[key] || key;
  };

  const handleUrlBlur = () => {
    if (!url.trim()) {
      setDetectedIndustry(null);
      return;
    }
    const detected = detectIndustryFromUrl(url);
    if (detected && !industry) {
      setDetectedIndustry(detected);
      setIndustry(detected);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    const brandName = brand.trim() || new URL(normalized).hostname.replace(/^www\./, '');

    if (selectedTier === 'free') {
      // Quick Audit: direct URL navigation (server-side, synchronous)
      const params = new URLSearchParams({
        url: normalized,
        ...(brand.trim() ? { brand: brand.trim() } : {}),
        ...(industry.trim() ? { industry: industry.trim() } : {}),
      });
      router.push(`/${locale}/site-audit?${params.toString()}`);
      return;
    }

    // Full Audit: async session → progress → results
    setLoading(true);
    try {
      const res = await fetch('/api/audit/full-start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          websiteUrl: normalized,
          brandName,
          tier: selectedTier,
          industry: industry || undefined,
          competitors: [],
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || '진단 세션 생성 실패');
      }

      const { sessionId } = await res.json();
      router.push(`/${locale}/site-audit/progress/${sessionId}?tier=${selectedTier}`);
    } catch (err: any) {
      setError(err.message || '진단을 시작할 수 없습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setLoading(false);
    }
  };

  const handleExample = (ex: { url: string; brand: string }) => {
    setUrl(ex.url);
    setBrand(ex.brand);
    setError("");
  };

  const selectedTierInfo = AUDIT_TIERS.find(t => t.id === selectedTier)!;
  const TierIcon = selectedTierInfo.icon;

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
            ChatGPT, Gemini, Perplexity가 우리 브랜드를 어떻게 인식하고 평가하는지 진단합니다.
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
                  onBlur={handleUrlBlur}
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
              {detectedIndustry && (
                <div className="flex items-center gap-2 mt-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    🏷️ 자동 감지: {getDetectedLabel(detectedIndustry)}
                  </span>
                  <button
                    type="button"
                    onClick={() => { setDetectedIndustry(null); setIndustry(''); }}
                    className="text-xs text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  >
                    [수정]
                  </button>
                </div>
              )}
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

            {/* Tier Selection */}
            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wide">
                진단 방식 선택
              </label>
              <button
                type="button"
                onClick={() => setShowTiers(!showTiers)}
                className="w-full flex items-center justify-between px-4 py-3 bg-slate-800/60 border border-slate-700 rounded-xl text-sm transition-all hover:border-indigo-500/50"
              >
                <div className="flex items-center gap-2">
                  <TierIcon className="h-4 w-4 text-indigo-400" />
                  <span className="text-slate-100 font-semibold">{selectedTierInfo.label}</span>
                  <span className="text-slate-500 text-xs">{selectedTierInfo.duration}</span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-500 transition-transform ${showTiers ? 'rotate-180' : ''}`} />
              </button>

              {showTiers && (
                <div className="mt-2 space-y-2 border border-slate-700 rounded-xl p-2 bg-slate-900/80">
                  {AUDIT_TIERS.map((tier) => {
                    const Icon = tier.icon;
                    return (
                      <button
                        key={tier.id}
                        type="button"
                        onClick={() => { setSelectedTier(tier.id); setShowTiers(false); }}
                        className={`w-full text-left p-3 rounded-lg border transition-all ${selectedTier === tier.id ? 'border-indigo-500 bg-indigo-500/10' : `${tier.color} hover:border-slate-500`}`}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className="flex items-center gap-2">
                            <Icon className="h-3.5 w-3.5 text-slate-400" />
                            <span className="font-bold text-sm text-slate-100">{tier.label}</span>
                          </div>
                          <span className="text-xs text-slate-500 font-mono">{tier.duration}</span>
                        </div>
                        <p className="text-xs text-slate-400 mb-2 pl-5">{tier.description}</p>
                        <div className="flex flex-wrap gap-1 pl-5">
                          {tier.features.map(f => (
                            <span key={f} className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-md">{f}</span>
                          ))}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {error && (
              <p className="text-red-400 text-xs font-semibold flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-indigo-500/20 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  진단 세션 시작 중...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  {selectedTier === 'free' ? '빠른 진단 시작 (무료)' : '정밀 진단 시작'}
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
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
