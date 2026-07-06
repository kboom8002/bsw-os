"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  CheckCircle,
  FileText,
  ShieldCheck,
  Activity,
  Layers,
  Cpu,
  TrendingUp,
  ExternalLink,
  Info
} from "lucide-react";

interface JejuBrand {
  name: string;
  slug: string;
  industry: string;
}

const JEJU_BRANDS: JejuBrand[] = [
  { name: '돈사돈', slug: 'donsadon', industry: '흑돼지 맛집' },
  { name: '몽상드애월', slug: 'mongsang-aewol', industry: '카페' },
  { name: '오설록 티뮤지엄', slug: 'osulloc', industry: '체험/카페' },
  { name: '해녀의부엌', slug: 'haenyeo-kitchen', industry: '해산물 맛집' },
  { name: '제주맥주', slug: 'jeju-beer', industry: '크래프트 맥주' },
  { name: '수우동', slug: 'suwoondong', industry: '숙소/게스트하우스' },
];

export default function JejuSmbDemoFlow() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";

  const [activeBrandIdx, setActiveBrandIdx] = useState(0);
  const activeBrand = JEJU_BRANDS[activeBrandIdx];

  // Trace steps
  const steps = [
    {
      title: "1. Brand Truth & 지역 브랜드 진실",
      desc: `${activeBrand.name}의 전략적 브랜드 클레임이 Brand Truth Vault에 안전하게 잠금 처리되었습니다.`,
      status: "Verified",
      link: `/${locale}/${workspaceSlug}/truth`,
      meta: `Strategic Claim: ${activeBrand.industry} 분야 제주 소상공인 브랜드 진정성 검증`
    },
    {
      title: "2. 지역 특산물 & 리뷰 증거",
      desc: `'${activeBrand.name} 현장 검증' 증거 시트가 인증 및 검증되어 지역 브랜드 신뢰도를 보장합니다.`,
      status: "Verified",
      link: `/${locale}/${workspaceSlug}/truth/evidence`,
      meta: `Evidence Certificate: ${activeBrand.slug}-local-verification`
    },
    {
      title: "3. 제주 지역×업종 시그널",
      desc: `크롤 시그널이 '제주 ${activeBrand.industry} 추천' 질문에 매핑되었습니다.`,
      status: "Linked",
      link: `/${locale}/${workspaceSlug}/semantic-core/signals`,
      meta: "Signal Query intent: Informational + Navigational"
    },
    {
      title: "4. 소상공인 프레젠테이션 서피스",
      desc: `네이버 플레이스, 카카오맵, 구글 프로필 서피스가 등록되었습니다.`,
      status: "Ready",
      link: `/${locale}/${workspaceSlug}/objects`,
      meta: "Target surface set: [Naver Place, Kakao Map, Google Profile]"
    },
    {
      title: "5. 지역 패널 실측",
      desc: `제주도 거주/방문 의도 패널들을 대상으로 한 모의 검색 실험 결과가 기록되었습니다.`,
      status: "Monitored",
      link: `/${locale}/${workspaceSlug}/observatory/panels`,
      meta: "Panel criteria: Location(Jeju) AND Intention(Travel/Food)"
    },
    {
      title: "6. 브랜드 평판 보고서",
      desc: `경쟁 게스트하우스/식당 대비 AI 가시성 격차 리포트가 생성되었습니다.`,
      status: "Published",
      link: `/${locale}/${workspaceSlug}/reports`,
      meta: "Report type: Hyper-Local SMB Competitor Analysis"
    },
    {
      title: "7. 티켓 할당 (Fix-it)",
      desc: `리뷰 키워드 누락 및 평점 방어 실패 사례에 대한 개선 티켓이 발급되었습니다.`,
      status: "Assigned",
      link: `/${locale}/${workspaceSlug}/fixit`,
      meta: "Fix-it action: Request Review Highlights Updates"
    }
  ];

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/demo`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-emerald-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO DEMO HUB
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-emerald-400 font-mono font-bold tracking-wider uppercase mb-1">
            🏝️ 제주 지역×업종 소상공인 Flow
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <span className="text-3xl">🏝️</span>
            제주 소상공인 AI 가시성 데모
          </h1>
          <p className="text-slate-400 text-sm">
            제주도 지역×업종 소상공인 브랜드의 AI 검색 가시성을 측정합니다
          </p>
        </div>

        {/* Brand switcher */}
        <div className="flex flex-wrap gap-2">
          {JEJU_BRANDS.map((brand, idx) => (
            <button
              key={brand.slug}
              onClick={() => setActiveBrandIdx(idx)}
              className={`px-3 py-1.5 text-[10px] font-bold font-mono rounded-lg border transition-all ${
                activeBrandIdx === idx
                  ? "border-emerald-500 bg-emerald-500/10 text-white"
                  : "border-white/5 bg-slate-900 text-slate-400"
              }`}
            >
              {brand.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active brand info badge */}
      <div className="p-4 rounded-xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 to-teal-950/30 text-emerald-300 text-xs flex items-start gap-3">
        <CheckCircle className="w-4.5 h-4.5 text-emerald-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">현재 브랜드: {activeBrand.name}</span>
          <p className="leading-normal">
            업종: {activeBrand.industry} · 슬러그: {activeBrand.slug} · 지역: 제주
          </p>
        </div>
      </div>

      {/* standard warning banner about proxy caveats */}
      <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 text-amber-300 text-xs flex items-start gap-3">
        <Info className="w-4.5 h-4.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <span className="font-bold text-white block mb-0.5">Governed AI Proxy Notice</span>
          <p className="leading-normal">
            Observations are compiled from simulated cohort queries via panel-based proxies; results are statistical approximations and do not represent internal, proprietary LLM weighting systems.
          </p>
        </div>
      </div>

      {/* E2E Steps List */}
      <div className="space-y-6">
        {steps.map((step, idx) => (
          <div key={idx} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-3 relative overflow-hidden">
            
            <div className="flex justify-between items-start">
              <h3 className="font-bold text-base text-white">{step.title}</h3>
              <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 uppercase">
                {step.status}
              </span>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed font-sans leading-normal">
              {step.desc}
            </p>

            <div className="p-3 rounded-lg bg-white/5 border border-white/5 text-[10px] font-mono text-slate-300 italic">
              {step.meta}
            </div>

            <div className="flex justify-end pt-1">
              <Link
                href={step.link}
                className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-mono"
              >
                Inspect Artifact Module <ExternalLink className="w-3.5 h-3.5" />
              </Link>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}
