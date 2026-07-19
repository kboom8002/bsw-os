/**
 * app/[locale]/(workspace)/[workspace_slug]/settings/packs/page.tsx
 *
 * "use client" 도메인 팩 관리 페이지
 * - 사용 가능한 YAML 팩 목록 조회
 * - 팩 상세 정보 (어트랙터/개념 수) 표시
 * - 원클릭 DB 동기화 (loadDomainPack)
 * - 번들 로드 (제주 소상공인 4종 묶음)
 */

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import {
  Database,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Package,
  Download,
  Layers,
  Tag,
  Sparkles,
  ChevronDown,
  ChevronRight,
  Zap,
  Info,
} from 'lucide-react';
import { resolveWorkspaceSlug } from '../../../../../actions/workspace';
import { loadDomainPack, listDomainPacks } from '../../../../../actions/semantic';

interface PackInfo {
  slug: string;
  name: string;
  description: string;
  attractor_count: number;
  concept_count: number;
  version: string;
  status: 'idle' | 'loading' | 'success' | 'error';
  result?: { created: number; updated: number };
  error?: string;
  expanded?: boolean;
}

/** 제주 소상공인 추천 번들 */
const JEJU_BUNDLE: string[] = [
  'jeju-context-travel',
  'aihompy-restaurant-cafe',
  'aihompy-accommodation',
  'aihompy-experience',
];

/** 팩 슬러그 → 사람 읽기 좋은 설명 */
const PACK_DESCRIPTIONS: Record<string, { emoji: string; tag: string; purpose: string }> = {
  'jeju-context-travel': {
    emoji: '🌧️',
    tag: '제주 여행 맥락',
    purpose: '비 오는 날, 어르신 동반, 외국인 관광객 등 제주 여행 상황별 어트랙터',
  },
  'aihompy-restaurant-cafe': {
    emoji: '☕',
    tag: '맛집·카페',
    purpose: '우천 방문, 주차 편의, 아이 동반, 외국인 메뉴 등 카페/식당 소상공인 AI 홈피용',
  },
  'aihompy-accommodation': {
    emoji: '🏠',
    tag: '숙박·펜션',
    purpose: '배리어프리, 공항 접근성, 반려동물 동반 숙박 소상공인 AI 홈피용',
  },
  'aihompy-experience': {
    emoji: '🎯',
    tag: '체험·레저',
    purpose: '당일 예약, 날씨 대응 체험, 어르신 안심 코스 등 체험업 소상공인 AI 홈피용',
  },
  'aihompy-wellness-kbeauty': {
    emoji: '💆',
    tag: 'K-뷰티·웰니스',
    purpose: '민감성 피부 케어, 외국인 영문 서비스, 한의원 등 웰니스 소상공인 AI 홈피용',
  },
  'aihompy-brand-ssot': {
    emoji: '🏢',
    tag: '브랜드 SSOT',
    purpose: '브랜드 단일 진실 소스(SSOT) 기반 범용 어트랙터',
  },
  'kbeauty-skincare': {
    emoji: '🧴',
    tag: 'K-뷰티 스킨케어',
    purpose: '글로벌 K-뷰티 브랜드 전용 어트랙터 (영문 포함)',
  },
  'wedding-studio': {
    emoji: '💍',
    tag: '웨딩·컨설팅',
    purpose: '웨딩 플래너, 스튜디오, 드레스숍 등 예식 업종 어트랙터',
  },
};

export default function DomainPacksPage() {
  const params = useParams();
  const locale = params.locale as string;
  const workspaceSlug = params.workspace_slug as string;

  const [workspaceId, setWorkspaceId] = useState('');
  const [packs, setPacks] = useState<PackInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [bundleLoading, setBundleLoading] = useState(false);
  const [bundleResult, setBundleResult] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      try {
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (wsId) setWorkspaceId(wsId);
        await loadPackList();
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [workspaceSlug]);

  const loadPackList = useCallback(async () => {
    try {
      const raw = await listDomainPacks();
      const enriched: PackInfo[] = raw.map((p: any) => {
        const desc = PACK_DESCRIPTIONS[p.id || p.slug] || {};
        return {
          slug: p.id || p.slug,
          name: p.name || p.id || p.slug,
          description: (desc as any).purpose || p.description || '설명 없음',
          attractor_count: p.attractors_count || 0,
          concept_count: p.concepts_count || 0,
          version: p.version || '0.1.0',
          status: 'idle' as const,
        };
      });
      setPacks(enriched);
    } catch (err) {
      console.error('팩 목록 로드 실패:', err);
    }
  }, []);

  const handleLoadPack = async (slug: string) => {
    if (!workspaceId) return;
    setPacks((prev) =>
      prev.map((p) => (p.slug === slug ? { ...p, status: 'loading', error: undefined } : p))
    );
    try {
      const result = await loadDomainPack(workspaceId, slug);
      setPacks((prev) =>
        prev.map((p) =>
          p.slug === slug ? { ...p, status: 'success', result } : p
        )
      );
    } catch (err: any) {
      setPacks((prev) =>
        prev.map((p) =>
          p.slug === slug ? { ...p, status: 'error', error: err.message || '로드 실패' } : p
        )
      );
    }
  };

  const handleLoadBundle = async (bundle: string[]) => {
    if (!workspaceId) return;
    setBundleLoading(true);
    setBundleResult(null);
    let totalCreated = 0;
    let totalUpdated = 0;
    const errors: string[] = [];

    for (const slug of bundle) {
      try {
        setPacks((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, status: 'loading' } : p))
        );
        const result = await loadDomainPack(workspaceId, slug);
        totalCreated += result.created;
        totalUpdated += result.updated;
        setPacks((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, status: 'success', result } : p))
        );
      } catch (err: any) {
        errors.push(`${slug}: ${err.message}`);
        setPacks((prev) =>
          prev.map((p) => (p.slug === slug ? { ...p, status: 'error', error: err.message } : p))
        );
      }
    }

    setBundleLoading(false);
    if (errors.length === 0) {
      setBundleResult(
        `✅ 번들 로드 완료! 어트랙터 ${totalCreated}개 신규 생성, ${totalUpdated}개 업데이트.`
      );
    } else {
      setBundleResult(`⚠️ 일부 오류 발생: ${errors.join(' | ')}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
          <p className="text-slate-400 text-sm">도메인 팩 목록 로드 중...</p>
        </div>
      </div>
    );
  }

  const jejuBundle = packs.filter((p) => JEJU_BUNDLE.includes(p.slug));

  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 max-w-5xl mx-auto">
      {/* 헤더 */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <Database size={22} className="text-cyan-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">도메인 팩 관리</h1>
            <p className="text-slate-400 text-sm">
              YAML 팩을 워크스페이스 DB에 동기화하여 어트랙터·개념 데이터를 활성화합니다
            </p>
          </div>
        </div>

        {/* 워크스페이스 정보 */}
        <div className="mt-4 px-4 py-2 rounded-lg bg-slate-900 border border-slate-800 inline-flex items-center gap-2 text-sm text-slate-400">
          <Info size={14} className="text-cyan-400" />
          Workspace ID: <code className="text-cyan-300 font-mono">{workspaceId || '로드 중...'}</code>
        </div>
      </div>

      {/* ── 제주 소상공인 번들 추천 ── */}
      <div className="mb-8 p-5 rounded-2xl bg-gradient-to-br from-cyan-950/60 to-indigo-950/60 border border-cyan-500/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap size={16} className="text-cyan-400" />
              <span className="text-cyan-300 font-semibold text-sm">🏝️ 제주 소상공인 추천 번들</span>
            </div>
            <p className="text-slate-400 text-xs">
              제주 지역 3대 진단 상품(AI홈피 Pack, 세일즈 자동화, 지자체 리포트) 실 운영에 필요한 팩 4종을 한 번에 로드합니다.
            </p>
          </div>
          <button
            onClick={() => handleLoadBundle(JEJU_BUNDLE)}
            disabled={bundleLoading || !workspaceId}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20"
          >
            {bundleLoading ? (
              <>
                <RefreshCw size={14} className="animate-spin" />
                로드 중...
              </>
            ) : (
              <>
                <Download size={14} />
                번들 로드 ({JEJU_BUNDLE.length}종)
              </>
            )}
          </button>
        </div>

        {/* 번들 팩 미리보기 */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          {jejuBundle.map((p) => {
            const desc = PACK_DESCRIPTIONS[p.slug] || {};
            return (
              <div key={p.slug} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/60 border border-slate-700/50 text-xs">
                <span>{(desc as any).emoji || '📦'}</span>
                <span className="text-slate-300 font-medium">{(desc as any).tag || p.slug}</span>
                {p.status === 'success' && <CheckCircle size={12} className="text-emerald-400 ml-auto" />}
                {p.status === 'loading' && <RefreshCw size={12} className="text-cyan-400 animate-spin ml-auto" />}
                {p.status === 'error' && <AlertCircle size={12} className="text-red-400 ml-auto" />}
              </div>
            );
          })}
        </div>

        {bundleResult && (
          <div className={`px-4 py-2 rounded-lg text-sm font-medium ${bundleResult.startsWith('✅') ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-300 border border-amber-500/20'}`}>
            {bundleResult}
          </div>
        )}
      </div>

      {/* ── 개별 팩 목록 ── */}
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Layers size={16} className="text-slate-400" />
          전체 팩 ({packs.length}종)
        </h2>
        <button
          onClick={loadPackList}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RefreshCw size={12} />
          새로고침
        </button>
      </div>

      <div className="space-y-3">
        {packs.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <Package size={32} className="mx-auto mb-3 opacity-40" />
            <p>packs/ 디렉터리에 팩이 없습니다.</p>
          </div>
        ) : (
          packs.map((pack) => {
            const desc = PACK_DESCRIPTIONS[pack.slug] || {};
            const isBundle = JEJU_BUNDLE.includes(pack.slug);
            return (
              <div
                key={pack.slug}
                className={`rounded-2xl border transition-all ${
                  isBundle
                    ? 'border-cyan-500/30 bg-cyan-950/20'
                    : 'border-slate-800 bg-slate-900/60'
                }`}
              >
                <div className="p-4 flex items-start gap-4">
                  {/* 이모지 아이콘 */}
                  <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-xl flex-shrink-0">
                    {(desc as any).emoji || '📦'}
                  </div>

                  {/* 팩 정보 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <span className="font-semibold text-white">{pack.name}</span>
                      <code className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                        {pack.slug}
                      </code>
                      {isBundle && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/20">
                          추천
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{pack.description}</p>

                    {/* 메타 정보 */}
                    <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <Sparkles size={11} /> 어트랙터 {pack.attractor_count}개
                      </span>
                      <span className="flex items-center gap-1">
                        <Tag size={11} /> 개념 {pack.concept_count}개
                      </span>
                      <span>v{pack.version}</span>
                    </div>

                    {/* 결과 표시 */}
                    {pack.status === 'success' && pack.result && (
                      <div className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 inline-flex items-center gap-1.5">
                        <CheckCircle size={12} />
                        신규 {pack.result.created}개 생성 · {pack.result.updated}개 업데이트
                      </div>
                    )}
                    {pack.status === 'error' && (
                      <div className="mt-2 text-xs px-3 py-1.5 rounded-lg bg-red-500/10 text-red-300 border border-red-500/20 inline-flex items-center gap-1.5">
                        <AlertCircle size={12} />
                        {pack.error}
                      </div>
                    )}
                  </div>

                  {/* 로드 버튼 */}
                  <button
                    onClick={() => handleLoadPack(pack.slug)}
                    disabled={pack.status === 'loading' || !workspaceId}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                      pack.status === 'success'
                        ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20'
                        : pack.status === 'error'
                        ? 'bg-red-500/10 text-red-300 border border-red-500/20 hover:bg-red-500/20'
                        : 'bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 hover:bg-indigo-500/20'
                    }`}
                  >
                    {pack.status === 'loading' ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        로드 중
                      </>
                    ) : pack.status === 'success' ? (
                      <>
                        <CheckCircle size={13} />
                        재동기화
                      </>
                    ) : (
                      <>
                        <Download size={13} />
                        DB 로드
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* 안내 섹션 */}
      <div className="mt-8 p-5 rounded-2xl bg-slate-900 border border-slate-800">
        <h3 className="text-sm font-semibold text-slate-300 mb-3 flex items-center gap-2">
          <Info size={14} className="text-cyan-400" />
          도메인 팩 실 운영 가이드
        </h3>
        <div className="space-y-2 text-xs text-slate-400">
          <p><span className="text-white font-medium">Step 1</span> — 제주 소상공인 번들 4종을 먼저 로드합니다. 팩은 <code className="text-cyan-300">packs/</code> 디렉터리의 YAML 파일에서 자동 발견됩니다.</p>
          <p><span className="text-white font-medium">Step 2</span> — 벤치마크(jeju_smb 도메인) 실측을 실행하면 질문 시그널이 자동 수집됩니다.</p>
          <p><span className="text-white font-medium">Step 3</span> — AI홈피 Pack / 세일즈 자동화 / 지자체 리포트 메뉴에서 실 데이터 기반 진단을 시작합니다.</p>
          <p className="text-slate-500">※ 팩 재동기화(업데이트) 시에는 기존 어트랙터 데이터를 덮어씁니다. 커스텀 수정 사항이 있다면 백업 후 진행하세요.</p>
        </div>
      </div>
    </div>
  );
}
