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

  const [activeBrandIdx, setActiveBrandIdx] = useState(0);
  const activeBrand = JEJU_BRANDS[activeBrandIdx];

  // Trace steps
  const steps = [
    {
      title: "1. Brand Truth & 지역 브랜드 진실",
      desc: `${activeBrand.name}의 전략적 브랜드 클레임이 Brand Truth Vault에 안전하게 잠금 처리되었습니다.`,
      status: "Verified",
      link: `/${workspaceSlug}/truth`,
      meta: `Strategic Claim: ${activeBrand.industry} 분야 제주 소상공인 브랜드 진정성 검증`
    },
    {
      title: "2. 지역 특산물 & 리뷰 증거",
      desc: `'${activeBrand.name} 현장 검증' 증거 시트가 인증 및 검증되어 지역 브랜드 신뢰도를 보장합니다.`,
      status: "Verified",
      link: `/${workspaceSlug}/truth/evidence`,
      meta: `Evidence Certificate: ${activeBrand.slug}-local-verification`
    },
    {
      title: "3. 제주 지역×업종 시그널",
      desc: `크롤 시그널이 '제주 ${activeBrand.industry} 추천' 질문에 매핑되었습니다.`,
      status: "Linked",
      link: `/${workspaceSlug}/semantic-core/signals`,
      meta: "Signal Query intent: Informational + Navigational"
    },
    {
      title: "4. 소상공인 프레젠테이션 서피스",
      desc: `${activeBrand.name} 프레젠테이션 오브젝트가 LocalBusiness 시맨틱 스키마에 연결되었습니다.`,
      status: "Gates Passed",
      link: `/${workspaceSlug}/objects`,
      meta: `JSON-LD Struct: LocalBusiness/${activeBrand.industry}`
    },
    {
      title: "5. Observatory 제주 로컬 패널",
      desc: `제주 ${activeBrand.industry} 로컬 패널이 동결되어 검색 어시스턴트 인용 적합성을 검증합니다.`,
      status: "Frozen v1",
      link: `/${workspaceSlug}/observatory/panels`,
      meta: `Crawler Probe: 제주에서 ${activeBrand.name} 어떤가요?`
    },
    {
      title: "6. Benchmark AEO/GEO 리포트",
      desc: "지역×업종 AEO/GEO 리포트가 엄격한 게이트 하에 편찬되었으며, 방법론 공시가 포함됩니다.",
      status: "Published",
      link: `/${workspaceSlug}/reports`,
      meta: "AEO Readiness: 92.00% ARS"
    },
    {
      title: "7. Fix-It & 로컬 스키마 패치",
      desc: "RCA 예외 승인 후, 로컬 비즈니스 스키마 패치가 적용되어 +28% ARS 상승이 검증되었습니다.",
      status: "Completed",
      link: `/${workspaceSlug}/fixit`,
      meta: `Post-Patch Lift Snapshot: lift-jeju-${activeBrand.slug}`
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
