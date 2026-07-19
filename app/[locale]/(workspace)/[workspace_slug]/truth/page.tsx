"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getTruthDashboardSummary } from "@/app/actions/truth";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import { 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Eye, 
  FileText, 
  ArrowRight,
  CheckCircle,
  AlertTriangle,
  Shield,
  RefreshCw,
  XCircle,
  Database,
  Target,
  Tag,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp
} from "lucide-react";

interface DashboardSummary {
  strategicTruth: { id: string; statement: string; core_pillars: string[] } | null;
  operational: { total: number; approved: number };
  evidence: { total: number; verified: number };
  boundaries: { active: number };
  observed: { total: number };
  deltas: { unresolved: number };
  gateStatus: { gate_level: string; is_passed: boolean; evaluated_at: string } | null;
}

interface BrandIdentityItem {
  slug: string;
  name: string;
  name_en: string;
  color: string;
  brand_identity?: string;
  product_categories?: string[];
}

export default function TruthDashboard() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [brands, setBrands] = useState<BrandIdentityItem[]>([]);
  const [expandedBrand, setExpandedBrand] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<string | null>(null);
  const [editUSP, setEditUSP] = useState("");
  const [editCategories, setEditCategories] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError(null);
        const id = await resolveWorkspaceSlug(workspaceSlug);
        if (!id) throw new Error("워크스페이스 정보를 불러올 수 없습니다.");
        const data = await getTruthDashboardSummary(id);
        setSummary(data as DashboardSummary);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    if (workspaceSlug) load();
  }, [workspaceSlug]);

  // 도메인 설정에서 브랜드 데이터 로드
  useEffect(() => {
    async function loadBrands() {
      try {
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (!wsId) return;
        // workspace 설정에서 industryKey 가져오기
        const { getWorkspaceIndustryKey } = await import("@/app/actions/workspace");
        let industryKey: string | null = null;
        try {
          industryKey = await getWorkspaceIndustryKey(wsId);
        } catch { /* fallback below */ }
        if (industryKey) {
          const { BENCHMARK_DOMAINS } = await import("@/lib/benchmark/domain-config");
          const cfg = BENCHMARK_DOMAINS[industryKey as keyof typeof BENCHMARK_DOMAINS];
          if (cfg?.brands) {
            setBrands(cfg.brands.map((b: any) => ({
              slug: b.slug,
              name: b.name,
              name_en: b.name_en,
              color: b.color,
              brand_identity: b.brand_identity || undefined,
              product_categories: b.product_categories || undefined,
            })));
          }
        }
      } catch (err) {
        console.warn('[TruthDashboard] Failed to load brand data:', err);
      }
    }
    if (workspaceSlug) loadBrands();
  }, [workspaceSlug]);

  const gateColor = summary?.gateStatus?.is_passed ? "cyan" : "red";
  const gateLabel = summary?.gateStatus
    ? `${summary.gateStatus.gate_level} ${summary.gateStatus.is_passed ? "통과" : "미통과"}`
    : "미평가";

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Studio Module
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Brand Truth Studio
          </h1>
          <p className="text-slate-400 text-sm">
            전략 브랜드 필라, 증거 기반 클레임, 안전 경계 규칙을 관리하는 그라운드 트루쓰 공급원입니다.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {loading && (
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <RefreshCw className="w-3 h-3 animate-spin" />
              <span>데이터 로딩 중...</span>
            </div>
          )}
          <Link
            href={`/${locale}/${workspaceSlug}/truth/gate`}
            className="px-4 py-2 text-sm font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-400/10 transition-all flex items-center gap-2"
          >
            <ShieldCheck className="w-4 h-4" />
            Truth Lock Gate 실행
          </Link>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl border border-red-500/20 bg-red-950/20 flex items-center gap-3 text-sm text-red-400">
          <XCircle className="w-4 h-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Strategic Truth Status Card */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-mono uppercase">Strategic Layer</span>
              <Sparkles className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Strategic Truth</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              핵심 미션, 비전, 마케팅 필라를 정의합니다.
            </p>
            {loading ? (
              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 h-10 animate-pulse" />
            ) : summary?.strategicTruth ? (
              <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-500/10 font-mono text-[10px] text-cyan-200 line-clamp-2">
                {summary.strategicTruth.core_pillars?.length > 0
                  ? `필라: ${summary.strategicTruth.core_pillars.slice(0, 3).join(", ")}`
                  : summary.strategicTruth.statement?.substring(0, 80)}
              </div>
            ) : (
              <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/10 font-mono text-[10px] text-amber-400">
                ⚠ 아직 전략적 진실이 설정되지 않았습니다.
              </div>
            )}
          </div>
          <Link
            href={`/${locale}/${workspaceSlug}/truth/strategic`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>전략적 진실 설정</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Operational Claims Card */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-mono uppercase">Factual Layer</span>
              <Layers className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Operational Claims</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              AI 검색 엔진에 전달되어야 하는 검증된 브랜드 클레임입니다.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
              {loading ? (
                <div className="h-4 w-24 bg-white/5 rounded animate-pulse" />
              ) : (
                <>
                  <div>전체: <span className="text-white font-bold">{summary?.operational.total ?? 0}</span></div>
                  <div>승인: <span className="text-green-400 font-bold">{summary?.operational.approved ?? 0}</span></div>
                </>
              )}
            </div>
          </div>
          <Link
            href={`/${locale}/${workspaceSlug}/truth/operational`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-purple-400 hover:underline"
          >
            <span>운영 클레임 관리</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Observed Claims Card */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs text-slate-500 font-mono uppercase">Crawled Layer</span>
              <Eye className="w-4 h-4 text-green-400" />
            </div>
            <h3 className="font-bold text-lg text-white mb-2">Observed Claims</h3>
            <p className="text-slate-400 text-xs leading-relaxed mb-4">
              외부 포털 크롤링으로 수집된 브랜드 클레임을 분석합니다.
            </p>
            <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
              {loading ? (
                <div className="h-4 w-28 bg-white/5 rounded animate-pulse" />
              ) : (
                <>
                  <div>수집: <span className="text-white font-bold">{summary?.observed.total ?? 0}</span></div>
                  {(summary?.deltas.unresolved ?? 0) > 0 ? (
                    <div className="flex items-center gap-1 text-amber-400">
                      <AlertTriangle className="w-3 h-3" />
                      {summary!.deltas.unresolved}개 불일치
                    </div>
                  ) : summary?.observed.total ?? 0 > 0 ? (
                    <div className="flex items-center gap-1 text-green-400">
                      <CheckCircle className="w-3 h-3" /> 정렬됨
                    </div>
                  ) : null}
                </>
              )}
            </div>
          </div>
          <Link
            href={`/${locale}/${workspaceSlug}/truth/observed`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-green-400 hover:underline"
          >
            <span>관찰 클레임 검토</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Brand Identity (USP) & Product Categories Section */}
      {brands.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <Target className="w-5 h-5 text-amber-400" />
                Brand Identity (USP) & Product Categories
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                S-OGDE Reverse Chaining에 활용되는 브랜드 USP와 제품/서비스 카테고리 정의
              </p>
            </div>
            <div className="text-xs text-slate-500 font-mono">
              {brands.filter(b => b.brand_identity).length}/{brands.length} USP 정의됨
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {brands.map(brand => {
              const isExpanded = expandedBrand === brand.slug;
              const isEditing = editingBrand === brand.slug;
              const hasUSP = !!brand.brand_identity;
              const hasCats = brand.product_categories && brand.product_categories.length > 0;

              return (
                <div
                  key={brand.slug}
                  className={`rounded-xl border transition-all ${
                    hasUSP
                      ? 'border-white/5 bg-slate-950/40'
                      : 'border-amber-500/20 bg-amber-950/10'
                  }`}
                >
                  {/* Brand Row Header */}
                  <button
                    onClick={() => setExpandedBrand(isExpanded ? null : brand.slug)}
                    className="w-full flex items-center justify-between p-3.5 text-left hover:bg-white/[0.02] transition-colors rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full flex-shrink-0"
                        style={{ backgroundColor: brand.color }}
                      />
                      <div>
                        <span className="font-semibold text-sm text-slate-200">{brand.name}</span>
                        <span className="text-[10px] text-slate-500 ml-2 font-mono">{brand.name_en}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {hasUSP ? (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 font-mono">USP ✓</span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 font-mono">USP 미정의</span>
                      )}
                      {hasCats && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-400 font-mono">
                          <Tag className="w-2.5 h-2.5 inline mr-0.5" />{brand.product_categories!.length}
                        </span>
                      )}
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-slate-500" /> : <ChevronDown className="w-3.5 h-3.5 text-slate-500" />}
                    </div>
                  </button>

                  {/* Expanded Detail */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5">
                      {/* USP */}
                      <div className="mt-3">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Brand Identity (USP)</span>
                          <button
                            onClick={() => {
                              if (isEditing) {
                                setEditingBrand(null);
                              } else {
                                setEditingBrand(brand.slug);
                                setEditUSP(brand.brand_identity || '');
                                setEditCategories((brand.product_categories || []).join(', '));
                              }
                            }}
                            className="text-[10px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 transition-colors"
                          >
                            <Edit3 className="w-3 h-3" />
                            {isEditing ? '취소' : '편집'}
                          </button>
                        </div>
                        {isEditing ? (
                          <textarea
                            value={editUSP}
                            onChange={(e) => setEditUSP(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-mono focus:outline-none focus:border-cyan-500 resize-none"
                            rows={2}
                            placeholder="브랜드 핵심 포지셔닝 + 차별화 요소 + 주요 제품/서비스 (50자 이내)"
                          />
                        ) : (
                          <div className={`text-xs leading-relaxed p-2.5 rounded-lg ${hasUSP ? 'text-slate-300 bg-white/[0.02]' : 'text-amber-400/70 italic bg-amber-500/5'}`}>
                            {brand.brand_identity || '아직 USP가 정의되지 않았습니다. 편집 버튼을 눌러 추가하세요.'}
                          </div>
                        )}
                      </div>

                      {/* Product Categories */}
                      <div>
                        <span className="text-[10px] text-slate-500 font-mono uppercase tracking-wider block mb-1.5">Product Categories</span>
                        {isEditing ? (
                          <input
                            type="text"
                            value={editCategories}
                            onChange={(e) => setEditCategories(e.target.value)}
                            className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 text-xs font-mono focus:outline-none focus:border-purple-500"
                            placeholder="쉼표로 구분: 흑돼지 구이, 연탄구이, 제주 맛집"
                          />
                        ) : hasCats ? (
                          <div className="flex flex-wrap gap-1.5">
                            {brand.product_categories!.map((cat, i) => (
                              <span key={i} className="text-[10px] px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-300 font-mono">
                                {cat}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <div className="text-[10px] text-slate-500 italic">카테고리 미정의</div>
                        )}
                      </div>

                      {/* Save Button (editing mode) */}
                      {isEditing && (
                        <div className="flex justify-end pt-1">
                          <button
                            onClick={() => {
                              // 클라이언트 상태 업데이트 (domain-config.ts는 정적이므로 UI 반영만)
                              setBrands(prev => prev.map(b =>
                                b.slug === brand.slug
                                  ? {
                                      ...b,
                                      brand_identity: editUSP.trim() || undefined,
                                      product_categories: editCategories.split(',').map(s => s.trim()).filter(Boolean)
                                    }
                                  : b
                              ));
                              setEditingBrand(null);
                              alert('UI에 반영되었습니다. 영구 저장을 위해 domain-config.ts를 업데이트하세요.');
                            }}
                            className="px-3 py-1.5 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 text-slate-950 hover:from-cyan-300 hover:to-blue-400 transition-all flex items-center gap-1"
                          >
                            <Save className="w-3 h-3" />
                            저장
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Gating & Evidence Blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Evidence & Boundaries Repository */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-6">
          <h3 className="font-bold text-lg text-white">Trust Assets Repository</h3>
          <p className="text-slate-400 text-xs leading-relaxed">
            증거 자료와 경계 규칙은 AEO/GEO 게이팅의 신뢰 근거입니다.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Link
              href={`/${locale}/${workspaceSlug}/truth/evidence`}
              className="p-4 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-900 transition-all space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-200">Evidence Library</div>
                <Database className="w-4 h-4 text-blue-400" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {loading ? "..." : `${summary?.evidence.total ?? 0}개 항목 · ${summary?.evidence.verified ?? 0}개 검증`}
              </div>
            </Link>
            <Link
              href={`/${locale}/${workspaceSlug}/truth/boundaries`}
              className="p-4 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-900 transition-all space-y-2 block"
            >
              <div className="flex items-center justify-between">
                <div className="font-bold text-sm text-slate-200">Boundary Rules</div>
                <Shield className="w-4 h-4 text-orange-400" />
              </div>
              <div className="text-[10px] text-slate-500 font-mono">
                {loading ? "..." : `${summary?.boundaries.active ?? 0}개 활성 규칙`}
              </div>
            </Link>
          </div>
          <Link
            href={`/${locale}/${workspaceSlug}/truth/deltas`}
            className="p-4 rounded-xl border border-white/5 bg-slate-900/60 hover:bg-slate-900 transition-all block"
          >
            <div className="flex items-center justify-between">
              <div className="font-bold text-sm text-slate-200">Truth Deltas</div>
              {(summary?.deltas.unresolved ?? 0) > 0 ? (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-bold">
                  {summary!.deltas.unresolved}개 미해결
                </span>
              ) : (
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">정상</span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-1">관찰 vs 운영 클레임 불일치 탐지</div>
          </Link>
        </div>

        {/* Truth Lock Gate Status */}
        <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm flex flex-col justify-between">
          <div className="space-y-4">
            <h3 className="font-bold text-lg text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyan-400" />
              Truth Lock 릴리스 상태
            </h3>
            {loading ? (
              <div className="p-4 rounded-xl border border-white/5 bg-white/5 h-20 animate-pulse" />
            ) : summary?.gateStatus ? (
              <div className={`p-4 rounded-xl border ${summary.gateStatus.is_passed ? "border-cyan-500/20 bg-cyan-950/20" : "border-red-500/20 bg-red-950/20"} flex items-start gap-3`}>
                {summary.gateStatus.is_passed ? (
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <div className={`text-sm font-semibold ${summary.gateStatus.is_passed ? "text-slate-100" : "text-red-300"}`}>
                    릴리스 게이트: {gateLabel}
                  </div>
                  <p className="text-[10px] text-slate-400 leading-normal mt-1">
                    마지막 평가: {new Date(summary.gateStatus.evaluated_at).toLocaleString("ko-KR")}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-slate-700/30 bg-slate-800/30 flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-semibold text-slate-300">아직 게이트 평가가 없습니다</div>
                  <p className="text-[10px] text-slate-500 mt-1">Truth Lock Gate를 실행하여 릴리스 준비 상태를 확인하세요.</p>
                </div>
              </div>
            )}
          </div>
          <Link
            href={`/${locale}/${workspaceSlug}/truth/gate`}
            className="mt-6 flex items-center justify-between text-xs font-bold text-cyan-400 hover:underline"
          >
            <span>게이트 평가기 상세보기</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
