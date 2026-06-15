"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  TrendingUp, TrendingDown, Minus,
  Search, Activity, Award, ChevronRight,
  HelpCircle, Sparkles, Camera, Droplets,
  BarChart3, Clock, RefreshCw
} from "lucide-react";
// runLightBenchmark는 API Route(/api/benchmark/run)로 호출합니다 (maxDuration=60s)
import type { DomainLeaderboardResult, BenchmarkLeaderboardEntry, BenchmarkHistoryPoint } from "../../app/actions/benchmark";
import { BENCHMARK_DOMAINS } from "../../lib/benchmark/domain-config";
import { calculatePerLayerMetrics } from "../../lib/benchmark/per-layer-metrics";
import { OpportunityAnalyzer, type BrandOpportunityReport } from "../../lib/benchmark/opportunity-analyzer";
import type { QuestionDetail } from "../../lib/benchmark/lightweight-metric-runner";
import OpportunityIntelligenceSection from "./OpportunityIntelligenceSection";
import EvidenceExplorer from "./EvidenceExplorer";
import BrandDetailDrawer from "./BrandDetailDrawer";

interface BenchmarkDashboardProps {
  summaries: Record<string, DomainLeaderboardResult | null>;
}

// ─── Mini SVG Line Chart ────────────────────────────────────────
function MiniLineChart({
  data, brandSlug, color, metricKey = 'aas'
}: {
  data: BenchmarkHistoryPoint[];
  brandSlug: string;
  color: string;
  metricKey?: 'aas' | 'ocr';
}) {
  const brandData = data.filter(d => d.brand_slug === brandSlug);
  if (brandData.length < 2) {
    return (
      <div className="w-full h-16 flex items-center justify-center text-slate-600 text-xs">
        데이터 수집 중...
      </div>
    );
  }

  const values = brandData.map(d => d[metricKey]);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const w = 200;
  const h = 60;

  const points = brandData.map((d, i) => {
    const x = (i / (brandData.length - 1)) * w;
    const y = h - ((d[metricKey] - min) / range) * (h - 10) - 5;
    return `${x},${y}`;
  });

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-16">
      <defs>
        <linearGradient id={`grad-${brandSlug}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polyline
        points={points.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      {brandData.length > 0 && (() => {
        const last = brandData[brandData.length - 1];
        const x = w;
        const y = h - ((last[metricKey] - min) / range) * (h - 10) - 5;
        return <circle cx={x} cy={y} r="3" fill={color} />;
      })()}
    </svg>
  );
}

// ─── Metric Badge ────────────────────────────────────────────────
function MetricBadge({ value, label, color }: { value: number | null; label: string; color: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{label}</span>
      <span className="text-base font-black" style={{ color }}>
        {value !== null ? `${value}%` : "—"}
      </span>
    </div>
  );
}

// ─── Trend Icon ──────────────────────────────────────────────────
function TrendIcon({ trend }: { trend: number }) {
  if (trend > 0.5) return <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />;
  if (trend < -0.5) return <TrendingDown className="h-3.5 w-3.5 text-rose-400" />;
  return <Minus className="h-3.5 w-3.5 text-slate-500" />;
}

// ─── Leaderboard Table ───────────────────────────────────────────
function LeaderboardTable({
  entries, history, onBrandClick
}: {
  entries: BenchmarkLeaderboardEntry[];
  history: BenchmarkHistoryPoint[];
  onBrandClick: (brand: BenchmarkLeaderboardEntry) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead>
          <tr className="text-slate-400 border-b border-slate-800">
            <th className="pb-3 font-semibold uppercase tracking-wider pl-4 w-12">순위</th>
            <th className="pb-3 font-semibold uppercase tracking-wider">브랜드</th>
            <th className="pb-3 font-semibold uppercase tracking-wider text-center">Answer Share</th>
            <th className="pb-3 font-semibold uppercase tracking-wider text-center">Citation Rate</th>
            <th className="pb-3 font-semibold uppercase tracking-wider text-center">BDR / CWR</th>
            <th className="pb-3 font-semibold uppercase tracking-wider text-center">BAIR</th>
            <th className="pb-3 font-semibold uppercase tracking-wider text-center w-36">30일 트렌드</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/50">
          {entries.map((entry) => (
            <tr key={entry.brand_slug} className="hover:bg-slate-800/30 transition-colors cursor-pointer" onClick={() => onBrandClick(entry)}>
              <td className="py-4 pl-4 font-black text-sm">
                {entry.rank === 1 ? (
                  <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-gradient-to-tr from-yellow-400 to-amber-500 text-slate-950 font-extrabold shadow-lg shadow-amber-500/20">
                    1
                  </span>
                ) : (
                  <span className="text-slate-400 ml-2">{entry.rank}</span>
                )}
              </td>
              <td className="py-4">
                <div className="flex items-center gap-2">
                  <div
                    className="h-3 w-3 rounded-full flex-shrink-0"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="font-bold text-slate-100 text-sm leading-tight">{entry.brand_name}</span>
                  {entry.rank === 1 && (
                    <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                      Top
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 mt-0.5 ml-5">
                  <TrendIcon trend={entry.aas_trend} />
                  <span className={`text-[10px] font-semibold ${entry.aas_trend > 0 ? 'text-emerald-400' : entry.aas_trend < 0 ? 'text-rose-400' : 'text-slate-500'}`}>
                    {entry.aas_trend > 0 ? '+' : ''}{entry.aas_trend}%
                  </span>
                </div>
              </td>
              <td className="py-4 text-center">
                <span className="font-black text-slate-100 text-sm">{entry.aas}%</span>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 mx-auto max-w-16">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${entry.aas}%`, backgroundColor: entry.color }}
                  />
                </div>
              </td>
              <td className="py-4 text-center">
                <span className="font-black text-slate-100 text-sm">{entry.ocr}%</span>
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 mx-auto max-w-16">
                  <div
                    className="h-1.5 rounded-full transition-all"
                    style={{ width: `${entry.ocr}%`, backgroundColor: entry.color, opacity: 0.7 }}
                  />
                </div>
              </td>
              <td className="py-4 text-center">
                <div className="flex flex-col gap-1 items-center">
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                    BDR {entry.bdr !== null ? `${entry.bdr}%` : '-'}
                  </span>
                  <span className="text-[11px] font-bold text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">
                    CWR {entry.cwr !== null ? `${entry.cwr}%` : '-'}
                  </span>
                </div>
              </td>
              <td className="py-4 text-center">
                {entry.bair !== null ? (
                  <span className="font-black text-lg" style={{ color: entry.color }}>
                    {entry.bair}
                    <span className="text-[10px] text-slate-500 font-semibold ml-0.5">pt</span>
                  </span>
                ) : (
                  <span className="text-slate-500">측정 중</span>
                )}
              </td>
              <td className="py-4 px-2">
                <MiniLineChart
                  data={history}
                  brandSlug={entry.brand_slug}
                  color={entry.color}
                  metricKey="aas"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Domain Icon ──────────────────────────────────────────────────
function DomainIcon({ slug }: { slug: string }) {
  if (slug === 'skincare') return <Droplets className="h-4 w-4" />;
  if (slug === 'wedding_studio') return <Camera className="h-4 w-4" />;
  return <BarChart3 className="h-4 w-4" />;
}

// ─── Main Dashboard ──────────────────────────────────────────────
export default function BenchmarkDashboard({ summaries }: BenchmarkDashboardProps) {
  const router = useRouter();
  const domainSlugs = Object.keys(BENCHMARK_DOMAINS);

  // URL hash에서 활성 탭 복원 (예: #tab=wedding_studio)
  const getInitialTab = () => {
    if (typeof window !== 'undefined') {
      const hash = window.location.hash;
      const match = hash.match(/tab=([a-z_]+)/);
      if (match && domainSlugs.includes(match[1])) return match[1];
    }
    return domainSlugs[0];
  };

  const [activeTab, setActiveTab] = useState(domainSlugs[0]);
  const [selectedBrand, setSelectedBrand] = useState<BenchmarkLeaderboardEntry | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [elapsedSec, setElapsedSec] = useState(0);
  const [opportunities, setOpportunities] = useState<BrandOpportunityReport | null>(null);
  const [questionDetails, setQuestionDetails] = useState<QuestionDetail[]>([]);
  const [rawQueryResults, setRawQueryResults] = useState<{questionIdx:number;text:string;citations:{url:string;domain:string;title:string}[]}[]>([]);
  const [runBrands, setRunBrands] = useState<{slug:string;name:string}[]>([]);

  // 마운트 시 URL hash에서 탭 복원
  React.useEffect(() => {
    setActiveTab(getInitialTab());
  }, []);

  // 탭 전환 시 URL hash 업데이트
  const handleTabChange = (slug: string) => {
    setActiveTab(slug);
    if (typeof window !== 'undefined') {
      window.location.hash = `tab=${slug}`;
    }
  };

  const handleRunMeasurement = async () => {
    setIsRunning(true);
    setElapsedSec(0);
    setProgressMsg('측정 설정 로딩 중...');

    const timer = setInterval(() => {
      setElapsedSec(prev => prev + 1);
    }, 1000);

    try {
      // Step 1: 설정 + API 키 가져오기
      setProgressMsg('도메인 설정 및 API 키 로딩 중...');

      let config: any;
      let geminiKey = '';

      try {
        const configRes = await fetch(`/api/benchmark/config?domain=${activeTab}`);
        if (!configRes.ok) {
          const txt = await configRes.text();
          throw new Error(`설정 로드 실패 (${configRes.status}): ${txt.substring(0, 100)}`);
        }
        config = await configRes.json();
      } catch (e: any) {
        throw new Error(`Config API 에러: ${e.message}`);
      }

      try {
        const keysRes = await fetch('/api/benchmark/keys');
        if (keysRes.ok) {
          const keys = await keysRes.json();
          geminiKey = keys.gemini || '';
        }
      } catch {
        // keys 엔드포인트 실패는 무시 — 아래에서 키 부재를 처리
      }

      if (!geminiKey) {
        throw new Error('GEMINI_API_KEY가 Vercel Production 환경변수에 설정되지 않았거나, /api/benchmark/keys 응답이 비어있습니다. Vercel 대시보드에서 환경변수를 확인하세요.');
      }

      const { brands, questions } = config;
      const totalCalls = questions.length; // Gemini만 사용 (1 engine)
      let completedCalls = 0;

      // Step 2: 브라우저에서 직접 Gemini API 호출 (Vercel 타임아웃 우회)
      type QueryResult = { questionIdx: number; text: string; citations: { url: string; domain: string; title: string }[] };
      const queryResults: QueryResult[] = [];

      for (let qi = 0; qi < questions.length; qi++) {
        const q = questions[qi];
        completedCalls++;
        setProgressMsg(`[${completedCalls}/${totalCalls}] Gemini에 직접 질문 전송 중: "${q.question_text.substring(0, 25)}..."`);

        try {
          // Gemini REST API 직접 호출 (브라우저 → Google API, Vercel 무관)
          const geminiRes = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: q.question_text }] }],
                tools: [{ google_search: {} }],
                generationConfig: { temperature: 0.2 },
              }),
            }
          );

          if (geminiRes.ok) {
            const data = await geminiRes.json();
            const candidate = data.candidates?.[0];
            const rawText = candidate?.content?.parts?.map((p: any) => p.text || '').join('') || '';
            const meta = candidate?.groundingMetadata || {};
            const chunks: any[] = meta.groundingChunks || [];
            const citations = chunks
              .filter((c: any) => c.web?.uri)
              .map((c: any, idx: number) => {
                try {
                  const url = c.web.uri;
                  let domain = new URL(url).hostname;
                  if ((domain.includes('google.com') || domain.includes('google.cloud')) && c.web.title && !c.web.title.includes(' ') && c.web.title.includes('.')) {
                    domain = c.web.title;
                  }
                  return { url, domain, title: c.web.title || 'Source' };
                } catch { return null; }
              })
              .filter(Boolean) as { url: string; domain: string; title: string }[];

            queryResults.push({ questionIdx: qi, text: rawText, citations });
          } else {
            const errText = await geminiRes.text();
            let errMsg = `Gemini API error (${geminiRes.status}): ${errText.substring(0, 300)}`;
            try {
              const errJson = JSON.parse(errText);
              if (errJson.error?.message) {
                errMsg = `Gemini API Error: ${errJson.error.message}`;
              }
            } catch {}
            throw new Error(errMsg);
          }
        } catch (err: any) {
          console.error(`Gemini call failed:`, err.message);
          throw err;
        }
      }

      // Step 3: AAS/OCR/BSF/BAIR 집계
      setProgressMsg('브랜드별 AAS/OCR/BSF/BAIR 산출 중...');
      const measuredAt = new Date().toISOString();
      // ── 기회 분석(Opportunity Intelligence) 및 고급 지표 계산용 데이터 생성 ──
      const questionDetails: QuestionDetail[] = questions.map((q: any, idx: number) => {
        const qr = queryResults.find((r: any) => r.questionIdx === idx);
        const engineRes = qr ? {
          raw_response_text: qr.text,
          brands_mentioned: brands.filter((b: any) => b.keywords.some((kw: string) => qr.text.toLowerCase().includes(kw.toLowerCase()))).map((b: any) => b.name),
          citation_domains: qr.citations.map((c: any) => c.domain),
          bsf_score: parseFloat((((q.must_include || []).filter((t: string) => qr.text.toLowerCase().includes(t.toLowerCase())).length / Math.max(1, (q.must_include || []).length) * 70) + ((q.should_include || []).filter((t: string) => qr.text.toLowerCase().includes(t.toLowerCase())).length / Math.max(1, (q.should_include || []).length) * 30)).toFixed(2))
        } : { raw_response_text: '', brands_mentioned: [], citation_domains: [], bsf_score: 0 };
        return {
          question_text: q.question_text,
          question_type: q.question_type,
          layer: q.layer || 'unknown',
          per_engine: { 'gemini_grounding': engineRes }
        };
      });

      const brandResults = brands.map((brand: any) => {
        const compositeResults: { aas: boolean; ocr: boolean; bsf: number }[] = [];
        let brandedResponseCount = 0;

        for (const qr of queryResults) {
          const q = questions[qr.questionIdx];
          const text = qr.text.toLowerCase();

          const anyBrandHit = brands.some((b: any) => b.keywords.some((kw: string) => text.includes(kw.toLowerCase())));
          if (anyBrandHit) brandedResponseCount++;

          const aasHit = brand.keywords.some((kw: string) => text.includes(kw.toLowerCase()));
          const ocrHit = qr.citations.some((c: any) => {
            const citDomain = c.domain.toLowerCase().replace(/^www\./, '');
            return brand.domains.some((bd: string) => citDomain.includes(bd.replace(/^www\./, '')));
          });

          const mustTerms = (q.must_include || []).filter((t: string) => !t.includes('{brand}'));
          const shouldTerms = (q.should_include || []).filter((t: string) => !t.includes('{brand}'));
          const mustCount = mustTerms.filter((t: string) => text.includes(t.toLowerCase())).length;
          const shouldCount = shouldTerms.filter((t: string) => text.includes(t.toLowerCase())).length;
          const mustRatio = mustTerms.length > 0 ? mustCount / mustTerms.length : 1.0;
          const shouldRatio = shouldTerms.length > 0 ? shouldCount / shouldTerms.length : 1.0;
          const bsf = parseFloat(((mustRatio * 70) + (shouldRatio * 30)).toFixed(2));

          compositeResults.push({ aas: aasHit, ocr: ocrHit, bsf });
        }

        if (compositeResults.length === 0) {
          return { brand_slug: brand.slug, brand_name: brand.name, aas: 0, ocr: 0, bsf: 0, bair: 0, bdr: 0, cwr: 0, iri: 0, opp: 0, mention_count: 0, citation_count: 0, sample_size: questions.length, measured_at: measuredAt };
        }

        const mentionCount = compositeResults.filter(r => r.aas).length;
        const citationCount = compositeResults.filter(r => r.ocr).length;
        const aiprDenominator = brandedResponseCount > 0 ? brandedResponseCount : compositeResults.length;
        const aas = parseFloat(((mentionCount / aiprDenominator) * 100).toFixed(1));
        const ocr = parseFloat(((citationCount / compositeResults.length) * 100).toFixed(1));
        const bsf = parseFloat((compositeResults.reduce((s, r) => s + r.bsf, 0) / compositeResults.length).toFixed(1));
        const bair = parseFloat((aas * (bsf / 100)).toFixed(1));

        const advanced = calculatePerLayerMetrics(brand, questionDetails, questions, 'gemini_grounding');

        return { brand_slug: brand.slug, brand_name: brand.name, aas, ocr, bsf, bair, bdr: advanced.bdr, cwr: advanced.cwr, iri: advanced.iri, opp: advanced.opp, mention_count: mentionCount, citation_count: citationCount, sample_size: questions.length, measured_at: measuredAt };
      });

      // 타겟 브랜드로 분석 (기본 1위 브랜드 또는 첫번째 브랜드)
      const targetBrand = brands[0]; // TODO: 사용자가 선택할 수 있도록 개선
      if (targetBrand) {
        const report = OpportunityAnalyzer.analyze(targetBrand.name, targetBrand.slug, questionDetails, undefined);
        setOpportunities(report);
      }

      // Persist raw query results and question details in state for Evidence UI
      setQuestionDetails(questionDetails);
      setRawQueryResults(queryResults);
      setRunBrands(brands.map((b: any) => ({ slug: b.slug, name: b.name })));

      // Step 4: 결과 저장
      setProgressMsg('Supabase에 결과 저장 중...');
      const saveRes = await fetch('/api/benchmark/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domainSlug: activeTab, brandResults }),
      });

      if (!saveRes.ok) {
        const txt = await saveRes.text();
        throw new Error(`결과 저장 실패 (${saveRes.status}): ${txt}`);
      }

      clearInterval(timer);
      setProgressMsg('✅ 측정 완료! 데이터를 불러오는 중...');
      router.refresh();
      await new Promise(r => setTimeout(r, 1500));
    } catch (err: any) {
      clearInterval(timer);
      setProgressMsg('');
      alert(`에러 발생: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const activeSummary = summaries[activeTab];
  const activeDomainConfig = BENCHMARK_DOMAINS[activeTab];

  // 전체 도메인 평균 AAS
  const allEntries = activeSummary?.leaderboard ?? [];
  const avgAAS = allEntries.length > 0
    ? parseFloat((allEntries.reduce((s, e) => s + e.aas, 0) / allEntries.length).toFixed(1))
    : 0;
  const avgOCR = allEntries.length > 0
    ? parseFloat((allEntries.reduce((s, e) => s + e.ocr, 0) / allEntries.length).toFixed(1))
    : 0;
  const topBrand = allEntries[0];
  const industryIRI = topBrand?.iri ?? 0;
  const industryOPP = topBrand?.opp ?? 0;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* ── Measurement Progress Overlay ── */}
      {isRunning && (
        <div className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-slate-900 border border-indigo-500/30 rounded-2xl p-8 max-w-md mx-4 text-center shadow-2xl shadow-indigo-950/40">
            <div className="relative mx-auto w-16 h-16 mb-6">
              <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
              <div className="absolute inset-0 rounded-full border-4 border-t-indigo-500 border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-2 rounded-full border-4 border-t-transparent border-r-violet-500 border-b-transparent border-l-transparent animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }} />
            </div>
            <h3 className="text-lg font-bold text-slate-100 mb-2">
              {activeDomainConfig?.name} 실측 진행 중
            </h3>
            <p className="text-sm text-indigo-400 font-semibold mb-4">
              {progressMsg}
            </p>
            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Clock className="h-3.5 w-3.5" />
              <span>경과 시간: {elapsedSec}초</span>
            </div>
            <p className="text-xs text-slate-500 mt-4">
              ChatGPT Search + Gemini Grounding에 질문을 보내고<br/>
              응답을 분석하는 중입니다. 약 10~60초 소요됩니다.
            </p>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-lg shadow-lg shadow-indigo-500/20">
              <BarChart3 className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                AI Brand Benchmark
              </span>
              <span className="text-xs block text-slate-400 font-semibold">
                BSW-OS 업종별 AI 가시성 지표 공개 보드
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRunMeasurement}
              disabled={isRunning}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                isRunning
                  ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                  : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20 hover:border-emerald-500/40"
              }`}
            >
              <RefreshCw className={`h-3 w-3 ${isRunning ? "animate-spin" : ""}`} />
              {isRunning ? "실측 진행 중..." : "즉시 실측 실행"}
            </button>
            <a
              href="/ko/sbs-index"
              className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-700 text-slate-300 hover:border-indigo-500 hover:text-indigo-300 transition-all"
            >
              SBS Index →
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
        {/* Hero */}
        <div className="relative mb-10 text-center md:text-left">
          <div className="absolute inset-0 bg-gradient-to-r from-violet-500/10 to-indigo-500/10 blur-3xl rounded-3xl -z-10" />
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20 mb-4">
            <Sparkles className="h-3.5 w-3.5" />
            ChatGPT Search + Gemini Grounding 실측
          </div>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight leading-tight mb-3">
            업종별 브랜드 AI 가시성<br className="md:hidden" /> 정기 지표 보드
          </h1>
          <p className="text-slate-400 text-sm max-w-2xl leading-relaxed">
            AI 검색 엔진이 답변할 때 각 브랜드가 얼마나 자주 언급되는지(AAS),
            공식 도메인이 인용되는지(OCR)를 텍스트 매칭 기반으로 정기 측정하여 공개합니다.
          </p>
        </div>

        {/* Domain Tab Selector */}
        <div className="flex gap-2 mb-8 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800 w-fit">
          {domainSlugs.map(slug => {
            const cfg = BENCHMARK_DOMAINS[slug];
            return (
              <button
                key={slug}
                id={`tab-${slug}`}
                onClick={() => handleTabChange(slug)}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-bold rounded-lg transition-all ${
                  activeTab === slug
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <DomainIcon slug={slug} />
                {cfg.name}
              </button>
            );
          })}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
          {/* AAS */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/40">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Search className="h-20 w-20 text-violet-500" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                평균 AAS
              </span>
              <Activity className="h-4 w-4 text-violet-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                {avgAAS}
              </span>
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              AI 응답에서 도메인 내 브랜드가 언급된 평균 비율 (Brand Answer Share)
            </p>
          </div>

          {/* OCR */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/40">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <ChevronRight className="h-20 w-20 text-cyan-500" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                평균 OCR
              </span>
              <TrendingUp className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                {avgOCR}
              </span>
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <p className="text-xs text-slate-400 mt-3 leading-relaxed">
              AI 답변 Citations에 공식 도메인이 인용된 평균 비율 (Observed Citation Rate)
            </p>
          </div>

          {/* Top Brand */}
          <div className="relative overflow-hidden rounded-2xl border border-indigo-500/30 bg-gradient-to-br from-indigo-950/40 to-slate-950 p-6 backdrop-blur-xl shadow-xl">
            <div className="absolute top-0 right-0 p-6 opacity-20">
              <Award className="h-20 w-20 text-indigo-400 animate-pulse" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-indigo-400">
                1위 브랜드
              </span>
              <Award className="h-4 w-4 text-indigo-400" />
            </div>
            {topBrand ? (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: topBrand.color }}
                  />
                  <span className="text-lg font-black text-slate-100">{topBrand.brand_name}</span>
                </div>
                <div className="flex gap-4">
                  <MetricBadge value={topBrand.aas} label="AAS" color={topBrand.color} />
                  <MetricBadge value={topBrand.ocr} label="OCR" color={topBrand.color} />
                  <MetricBadge value={topBrand.bair} label="BAIR" color={topBrand.color} />
                </div>
              </>
            ) : (
              <p className="text-slate-400 text-sm">측정 데이터 없음</p>
            )}
          </div>

          {/* Industry Readiness */}
          <div className="relative overflow-hidden rounded-2xl border border-slate-800 bg-slate-900/40 p-6 backdrop-blur-xl shadow-xl shadow-slate-950/40">
            <div className="absolute top-0 right-0 p-6 opacity-10">
              <Activity className="h-20 w-20 text-emerald-500" />
            </div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                업계 준비도 (IRI)
              </span>
              <Activity className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                {industryIRI}
              </span>
              <span className="text-xs font-bold text-slate-500">%</span>
            </div>
            <div className="mt-3 flex items-center justify-between text-xs text-slate-400">
              <span>기회 지수 (OPP)</span>
              <span className="font-bold text-slate-300">{industryOPP}%</span>
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1 mt-1">
              <div className="bg-rose-400 h-1 rounded-full" style={{ width: `${industryOPP}%` }} />
            </div>
            <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">
              제네릭 질문 방어율(IRI)과 아무도 노출되지 않은 레드오션 기회(OPP) 지표
            </p>
          </div>
        </div>

        {/* Leaderboard */}
        <div className="border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-6 shadow-2xl shadow-slate-950/60 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-4 mb-6 gap-3">
            <div>
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Search className="h-5 w-5 text-violet-400" />
                {activeDomainConfig?.name} — 브랜드 AI 가시성 리더보드
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                ChatGPT Search + Gemini Grounding 합산 실측 기반.
                텍스트 매칭으로 산출되는 AAS/OCR 지표입니다.
              </p>
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <Clock className="h-3.5 w-3.5" />
              {activeSummary?.measured_at
                ? new Date(activeSummary.measured_at).toLocaleDateString('ko-KR', {
                    year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                  })
                : '최신 측정 데이터'}
            </div>
          </div>

          {activeSummary?.leaderboard && activeSummary.leaderboard.length > 0 ? (
            <LeaderboardTable
              entries={activeSummary.leaderboard}
              history={activeSummary.history ?? []}
              onBrandClick={setSelectedBrand}
            />
          ) : (
            <div className="py-16 text-center">
              <RefreshCw className="h-10 w-10 text-slate-600 mx-auto mb-4 animate-spin" style={{ animationDuration: '3s' }} />
              <p className="text-slate-400 text-sm">측정 데이터 초기화 중...</p>
              <p className="text-slate-600 text-xs mt-2">첫 번째 측정 실행 후 리더보드가 표시됩니다.</p>
            </div>
          )}
        </div>

        {/* Opportunity Intelligence */}
        {opportunities && <OpportunityIntelligenceSection report={opportunities} />}

        {/* Evidence Explorer */}
        {questionDetails.length > 0 && (
          <EvidenceExplorer
            questionDetails={questionDetails}
            rawQueryResults={rawQueryResults}
            allBrandNames={runBrands.map(b => b.name)}
          />
        )}

        {/* Methodology Disclosure */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/20 backdrop-blur-md flex items-start gap-3">
          <HelpCircle className="h-5 w-5 text-violet-400 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-slate-200">
              지표 산출 방법론 공시 (Methodology Disclosure)
            </h4>
            <div className="text-[10px] text-slate-400 leading-relaxed mt-1 space-y-1">
              <p>
                <strong className="text-slate-300">AAS (Brand Answer Share)</strong>: AI 검색 엔진(ChatGPT Search, Gemini Grounding)의 응답 텍스트에서 각 브랜드 키워드가 등장하는 비율을 텍스트 매칭으로 산출합니다. AI Judge LLM은 사용하지 않습니다.
              </p>
              <p>
                <strong className="text-slate-300">OCR (Observed Citation Rate)</strong>: AI 답변의 Citations에 브랜드 공식 도메인이 포함되는 비율입니다. 인용 여부를 도메인 문자열 매칭으로 판별합니다.
              </p>
              <p>
                <strong className="text-slate-300">BAIR (Brand AI Recommendation Index)</strong>: AAS × (BSF/100) 으로 파생 산출합니다. BSF는 must_include 용어 매칭 비율입니다.
              </p>
              <p className="text-slate-500">
                본 데이터는 샘플링된 프로브 질문 세트에 기반한 정기 관측 지표이며, 실제 AI 모델 내부 상태와 다를 수 있습니다. AEO(AI 엔진 최적화) 전략 수립을 위한 참고 자료로 활용되어야 합니다.
              </p>
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-slate-800 bg-slate-900/30 py-8 text-center text-xs text-slate-500 mt-12">
        <p>© 2026 BSW-OS Brand Semantic Website OS. All Rights Reserved.</p>
        <p className="mt-1">
          Powered by ChatGPT Search API + Google Gemini Grounding API
        </p>
      </footer>

      {/* Brand Detail Drawer */}
      <BrandDetailDrawer
        brand={selectedBrand}
        domainSlug={activeTab}
        domainName={activeDomainConfig?.name ?? ''}
        history={activeSummary?.history ?? []}
        onClose={() => setSelectedBrand(null)}
        questionDetails={questionDetails}
        rawQueryResults={rawQueryResults}
      />
    </div>
  );
}
