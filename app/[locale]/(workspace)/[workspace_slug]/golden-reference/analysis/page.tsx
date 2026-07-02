"use client";

/**
 * app/[locale]/(workspace)/[workspace_slug]/golden-reference/analysis/page.tsx
 * 사이트별 비주얼 분석 결과 상세 페이지
 */

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Palette,
  Layers,
  Grid3X3,
  Search,
  Loader2,
  ChevronRight,
  CheckCircle2,
  XCircle,
  BarChart2,
  RefreshCw,
  Microscope,
  Globe,
  Type,
  Circle,
} from "lucide-react";

const INDUSTRIES = [
  { key: "skincare", label: "스킨케어/뷰티", emoji: "💄" },
  { key: "wedding", label: "웨딩", emoji: "💍" },
  { key: "medical_clinic", label: "병원/클리닉", emoji: "🏥" },
  { key: "restaurant_cafe", label: "식당/카페", emoji: "☕" },
  { key: "hotel", label: "호텔/숙박", emoji: "🏨" },
  { key: "place_brand", label: "지역 브랜드", emoji: "🗺️" },
];

const PSYCHOLOGY_COLORS: Record<string, string> = {
  attention: "from-red-500/20 to-red-500/5 text-red-300 border-red-500/30",
  value: "from-blue-500/20 to-blue-500/5 text-blue-300 border-blue-500/30",
  proof: "from-yellow-500/20 to-yellow-500/5 text-yellow-300 border-yellow-500/30",
  trust: "from-green-500/20 to-green-500/5 text-green-300 border-green-500/30",
  action: "from-violet-500/20 to-violet-500/5 text-violet-300 border-violet-500/30",
};

interface SiteSnapshot {
  url: string;
  brand_name: string;
  positioning: string;
  design_tokens: any;
  layout_structure: any;
  section_sequence: any;
  content_templates: any;
  image_references: any;
  analyzed_at: string;
}

export default function GoldenAnalysisPage() {
  const [selectedIndustry, setSelectedIndustry] = useState("skincare");
  const [search, setSearch] = useState("");
  const [snapshots, setSnapshots] = useState<SiteSnapshot[]>([]);
  const [selectedSite, setSelectedSite] = useState<SiteSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [analyzing, setAnalyzing] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<"tokens" | "layout" | "sections" | "images">("tokens");

  const fetchSnapshots = useCallback(async (industry: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/golden/batch?subIndustryKey=${industry}`);
      if (res.ok) {
        const data = await res.json();
        const analyzed = (data.sites ?? [])
          .filter((s: any) => s.analyzed && s.snapshot)
          .map((s: any) => s.snapshot);
        setSnapshots(analyzed);
        if (analyzed.length > 0 && !selectedSite) {
          setSelectedSite(analyzed[0]);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [selectedSite]);

  useEffect(() => {
    fetchSnapshots(selectedIndustry);
    setSelectedSite(null);
  }, [selectedIndustry]);

  // 단일 사이트 재분석
  const handleAnalyzeSite = async (url: string, brandName: string) => {
    setAnalyzing(url);
    try {
      const res = await fetch("/api/golden/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, brandName, subIndustryKey: selectedIndustry }),
      });
      const data = await res.json();
      if (data.ok && data.snapshot) {
        setSelectedSite(data.snapshot);
        await fetchSnapshots(selectedIndustry);
      }
    } finally {
      setAnalyzing(null);
    }
  };

  const filtered = snapshots.filter(s =>
    !search || s.brand_name.toLowerCase().includes(search.toLowerCase()) || s.url.includes(search)
  );

  const snap = selectedSite;

  return (
    <div className="flex h-[calc(100vh-100px)]">

      {/* 왼쪽: 사이트 목록 */}
      <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col">
        {/* 업종 선택 */}
        <div className="p-3 border-b border-white/5 space-y-2">
          <div className="flex flex-wrap gap-1">
            {INDUSTRIES.map(ind => (
              <button
                key={ind.key}
                onClick={() => setSelectedIndustry(ind.key)}
                className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-all ${
                  selectedIndustry === ind.key
                    ? "bg-violet-500/20 text-violet-300"
                    : "text-slate-500 hover:text-white hover:bg-white/5"
                }`}
              >
                {ind.emoji} {ind.label}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 bg-slate-800/60 rounded-lg border border-white/10">
            <Search className="w-3.5 h-3.5 text-slate-500" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="사이트 검색..."
              className="bg-transparent text-xs text-white placeholder-slate-600 outline-none flex-1"
            />
          </div>
        </div>

        {/* 사이트 리스트 */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Loader2 className="w-5 h-5 animate-spin text-slate-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-center text-slate-600 text-xs">
              분석된 사이트가 없습니다
            </div>
          ) : (
            filtered.map(s => (
              <button
                key={s.url}
                onClick={() => setSelectedSite(s)}
                className={`w-full text-left p-3 border-b border-white/5 hover:bg-white/5 transition-all ${
                  selectedSite?.url === s.url ? "bg-violet-500/10 border-l-2 border-l-violet-500" : ""
                }`}
              >
                <div className="flex items-start gap-2">
                  <Globe className="w-3.5 h-3.5 text-slate-500 mt-0.5 flex-shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{s.brand_name}</p>
                    <p className="text-xs text-slate-600 truncate">{s.url}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-600">{s.positioning}</span>
                      <div className="flex gap-1">
                        {s.design_tokens && <div className="w-1.5 h-1.5 rounded-full bg-violet-400" title="토큰" />}
                        {s.layout_structure && <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="레이아웃" />}
                        {s.section_sequence && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" title="섹션" />}
                      </div>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* 오른쪽: 상세 */}
      <div className="flex-1 overflow-y-auto">
        {!snap ? (
          <div className="flex flex-col items-center justify-center h-full space-y-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center">
              <Microscope className="w-8 h-8 text-slate-600" />
            </div>
            <div>
              <p className="text-white font-medium">사이트를 선택하세요</p>
              <p className="text-slate-500 text-sm">왼쪽 목록에서 분석 결과를 볼 사이트를 클릭하세요.</p>
            </div>
          </div>
        ) : (
          <div className="p-5 space-y-5">

            {/* 사이트 헤더 */}
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-xl font-bold text-white">{snap.brand_name}</h2>
                <a href={snap.url} target="_blank" rel="noopener noreferrer"
                  className="text-sm text-slate-400 hover:text-cyan-400 transition-colors"
                >
                  {snap.url}
                </a>
                <div className="flex items-center gap-3 mt-2">
                  <span className="text-xs bg-slate-800 text-slate-400 px-2 py-0.5 rounded">
                    {snap.positioning}
                  </span>
                  <span className="text-xs text-slate-600">
                    분석: {new Date(snap.analyzed_at).toLocaleDateString("ko-KR")}
                  </span>
                </div>
              </div>
              <button
                onClick={() => handleAnalyzeSite(snap.url, snap.brand_name)}
                disabled={analyzing === snap.url}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-indigo-600/20 hover:bg-indigo-600/30 border border-indigo-500/30 text-indigo-300 text-xs transition-all"
              >
                {analyzing === snap.url
                  ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  : <RefreshCw className="w-3.5 h-3.5" />
                }
                재분석
              </button>
            </div>

            {/* 탭 */}
            <div className="flex gap-2 border-b border-white/5 pb-3">
              {(["tokens", "layout", "sections", "images"] as const).map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveSection(tab)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    activeSection === tab
                      ? "bg-white/10 text-white"
                      : "text-slate-500 hover:text-white hover:bg-white/5"
                  }`}
                >
                  {tab === "tokens" && <Palette className="w-3.5 h-3.5" />}
                  {tab === "layout" && <Layers className="w-3.5 h-3.5" />}
                  {tab === "sections" && <BarChart2 className="w-3.5 h-3.5" />}
                  {tab === "images" && <Grid3X3 className="w-3.5 h-3.5" />}
                  {{tokens: "디자인 토큰", layout: "레이아웃", sections: "섹션 시퀀스", images: "이미지"}[tab]}
                  {!snap[{ tokens: "design_tokens", layout: "layout_structure", sections: "section_sequence", images: "image_references" }[tab] as keyof SiteSnapshot] && (
                    <XCircle className="w-3 h-3 text-slate-700" />
                  )}
                </button>
              ))}
            </div>

            {/* 토큰 뷰 */}
            {activeSection === "tokens" && snap.design_tokens && (
              <div className="space-y-4">
                {/* 색상 팔레트 */}
                <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Circle className="w-4 h-4 text-violet-400" />
                    색상 팔레트
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(snap.design_tokens?.colors?.computedPalette ?? {}).map(([pos, colors]) => (
                      <div key={pos} className="flex items-center gap-3">
                        <span className="text-xs text-slate-500 w-20">{pos}</span>
                        <div className="flex gap-1">
                          {(colors as string[]).map((c, i) => (
                            <div
                              key={i}
                              className="w-8 h-8 rounded-lg border border-white/20 shadow-sm"
                              style={{ backgroundColor: c }}
                              title={c}
                            />
                          ))}
                        </div>
                        <span className="text-xs text-slate-600 font-mono">
                          {(colors as string[])[0]}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 타이포그래피 */}
                <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Type className="w-4 h-4 text-cyan-400" />
                    타이포그래피
                  </h3>
                  <div className="space-y-2">
                    {snap.design_tokens?.typography?.fontFamilies?.slice(0, 5).map((f: any, i: number) => (
                      <div key={i} className="flex items-center gap-3 px-3 py-2 bg-slate-800/60 rounded-xl">
                        <span className="text-xs text-slate-500 w-16">{f.usage}</span>
                        <span className="text-sm text-white" style={{ fontFamily: f.family }}>{f.family}</span>
                        <span className="text-xs text-slate-600 ml-auto">{f.frequency}회</span>
                      </div>
                    ))}
                    {snap.design_tokens?.typography?.googleFontsUsed?.length > 0 && (
                      <p className="text-xs text-slate-500 mt-2">
                        Google Fonts: {snap.design_tokens.typography.googleFontsUsed.join(", ")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Border Radius */}
                {snap.design_tokens?.shape?.borderRadius?.length > 0 && (
                  <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Border Radius</h3>
                    <div className="flex flex-wrap gap-3">
                      {snap.design_tokens.shape.borderRadius.slice(0, 5).map((r: any, i: number) => (
                        <div
                          key={i}
                          className="w-12 h-12 bg-violet-500/20 border border-violet-500/30 flex items-center justify-center"
                          style={{ borderRadius: r.value }}
                          title={`${r.value} (${r.frequency}회)`}
                        >
                          <span className="text-xs text-violet-300">{r.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 레이아웃 뷰 */}
            {activeSection === "layout" && snap.layout_structure && (
              <div className="space-y-4">
                {/* GNB */}
                <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-3">GNB 구조</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">스타일</span>
                        <span className="text-white">{snap.layout_structure.gnb?.style}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">메뉴 수</span>
                        <span className="text-white">{snap.layout_structure.gnb?.itemCount}개</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">포지션</span>
                        <span className="text-white">{snap.layout_structure.gnb?.position}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">검색</span>
                        <span>{snap.layout_structure.gnb?.hasSearch ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 inline" />}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500">CTA</span>
                        <span>{snap.layout_structure.gnb?.hasCta ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 inline" /> : <XCircle className="w-3.5 h-3.5 text-slate-600 inline" />}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-2">메뉴 아이템</p>
                      <div className="flex flex-wrap gap-1">
                        {snap.layout_structure.gnb?.items?.slice(0, 10).map((item: any, i: number) => (
                          <span key={i} className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                            {item.label}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Shell + Footer */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Shell</h3>
                    <div className="space-y-2">
                      {[
                        ["유형", snap.layout_structure.shell?.type],
                        ["최대 너비", snap.layout_structure.shell?.maxWidth],
                        ["Hero 유형", snap.layout_structure.hero?.type],
                      ].map(([label, value]) => (
                        <div key={label} className="flex justify-between text-xs">
                          <span className="text-slate-500">{label}</span>
                          <span className="text-white">{value ?? "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-white mb-3">Footer</h3>
                    <div className="space-y-2">
                      {[
                        ["뉴스레터", snap.layout_structure.footer?.hasNewsletter],
                        ["소셜 링크", snap.layout_structure.footer?.hasSocialLinks],
                        ["사이트맵", snap.layout_structure.footer?.hasSitemap],
                        ["인증 배지", snap.layout_structure.footer?.hasCertifications],
                      ].map(([label, value]) => (
                        <div key={String(label)} className="flex items-center justify-between text-xs">
                          <span className="text-slate-500">{label}</span>
                          {value
                            ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            : <XCircle className="w-3.5 h-3.5 text-slate-700" />
                          }
                        </div>
                      ))}
                      {snap.layout_structure.footer?.socialPlatforms?.length > 0 && (
                        <div className="flex gap-1 flex-wrap mt-1">
                          {snap.layout_structure.footer.socialPlatforms.map((p: string) => (
                            <span key={p} className="text-xs bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded">{p}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 섹션 시퀀스 뷰 */}
            {activeSection === "sections" && snap.section_sequence && (
              <div className="space-y-4">
                <div className="bg-slate-900/60 border border-white/8 rounded-2xl p-4">
                  <h3 className="text-sm font-semibold text-white mb-4">
                    홈페이지 섹션 시퀀스
                    <span className="text-slate-500 font-normal text-xs ml-2">
                      ({snap.section_sequence.homepage?.totalSectionCount ?? 0}개 섹션)
                    </span>
                  </h3>
                  <div className="space-y-2">
                    {(snap.section_sequence.homepage?.sections ?? []).map((section: any, i: number) => (
                      <div key={i} className={`flex items-center gap-3 p-2.5 rounded-xl border bg-gradient-to-r ${PSYCHOLOGY_COLORS[section.psychologyLayer] ?? "from-slate-800/60 to-slate-800/30 border-slate-700 text-slate-400"}`}>
                        <span className="text-xs font-mono w-4 text-center opacity-60">{section.order + 1}</span>
                        <div className="flex-1">
                          <span className="text-xs font-medium">{section.type}</span>
                          {section.headingText && (
                            <p className="text-xs opacity-60 truncate max-w-xs mt-0.5">"{section.headingText}"</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs opacity-70">
                          {section.hasImages && <span>🖼️</span>}
                          {section.hasCtaButton && <span>🔘</span>}
                          <span className="opacity-50">{section.psychologyLayer}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* 분석 결과 없음 */}
            {activeSection === "tokens" && !snap.design_tokens && (
              <EmptySection label="디자인 토큰 분석 없음" />
            )}
            {activeSection === "layout" && !snap.layout_structure && (
              <EmptySection label="레이아웃 분석 없음" />
            )}
            {activeSection === "sections" && !snap.section_sequence && (
              <EmptySection label="섹션 시퀀스 분석 없음" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function EmptySection({ label }: { label: string }) {
  return (
    <div className="flex items-center gap-3 p-5 bg-slate-800/40 border border-slate-700/50 rounded-2xl">
      <XCircle className="w-5 h-5 text-slate-600" />
      <p className="text-slate-500 text-sm">{label}. 재분석을 실행해 주세요.</p>
    </div>
  );
}
