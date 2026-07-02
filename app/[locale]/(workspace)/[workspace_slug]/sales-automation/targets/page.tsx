/**
 * app/[locale]/(workspace)/[workspace_slug]/sales-automation/targets/page.tsx
 *
 * "use client" 영업 대상 및 맞춤 제안 메시지 상세 관리 뷰
 */

'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { 
  Megaphone, ArrowLeft, Send, Sparkles, Check, Copy, 
  Store, AlertTriangle, ShieldCheck, Mail, RefreshCw 
} from 'lucide-react';
import { resolveWorkspaceSlug } from '../../../../../actions/workspace';
import { 
  getSalesDashboardData, generateOutreachMessage, updateOutreachStatus 
} from '../../../../../actions/sales-automation';

export default function SalesTargetsManager() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const workspaceSlug = params.workspace_slug as string;
  
  // URL 쿼리에 특정 타깃 ID가 있으면 그 업체를 자동 선택
  const targetQueryId = searchParams.get('id');

  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [targets, setTargets] = useState<any[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<any>(null);
  
  // 영업 메시지 생성 관련 상태
  const [outreachMessage, setOutreachMessage] = useState('');
  const [generatingMessage, setGeneratingMessage] = useState(false);
  const [statusUpdating, setStatusUpdating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadTargets() {
      try {
        const wsId = await resolveWorkspaceSlugWrapper(workspaceSlug);
        if (wsId) {
          setWorkspaceId(wsId);
          const data = await getSalesDashboardData(wsId, undefined);
          const bizList = data.recommendedBusinesses || [];
          setTargets(bizList);
          
          // 자동 선택 매핑
          if (targetQueryId) {
            const matched = bizList.find((b: any) => b.id === targetQueryId);
            if (matched) {
              setSelectedTarget(matched);
              setOutreachMessage(matched.outreach_message || '');
            }
          } else if (bizList.length > 0) {
            setSelectedTarget(bizList[0]);
            setOutreachMessage(bizList[0].outreach_message || '');
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadTargets();
  }, [workspaceSlug, targetQueryId]);

  const resolveWorkspaceSlugWrapper = async (slug: string) => {
    const { resolveWorkspaceSlug } = await import('../../../../../actions/workspace');
    return await resolveWorkspaceSlug(slug);
  };

  const handleSelectTarget = (target: any) => {
    setSelectedTarget(target);
    setOutreachMessage(target.outreach_message || '');
  };

  const handleGenerateCopy = async () => {
    if (!selectedTarget?.id) return;
    setGeneratingMessage(true);
    try {
      const copy = await generateOutreachMessage(workspaceId, selectedTarget.id);
      setOutreachMessage(copy);
      
      // 로컬 타깃 리스트도 메시지 캐싱 업데이트
      setTargets(targets.map(t => t.id === selectedTarget.id ? { ...t, outreach_message: copy } : t));
    } catch (e) {
      alert('세일즈 메시지 생성 실패');
    } finally {
      setGeneratingMessage(false);
    }
  };

  const handleStatusChange = async (newStatus: any) => {
    if (!selectedTarget?.id) return;
    setStatusUpdating(true);
    try {
      const ok = await updateOutreachStatus(workspaceId, selectedTarget.id, newStatus);
      if (ok) {
        setSelectedTarget({ ...selectedTarget, outreach_status: newStatus });
        setTargets(targets.map(t => t.id === selectedTarget.id ? { ...t, outreach_status: newStatus } : t));
      }
    } catch (e) {
      alert('상태 업데이트 실패');
    } finally {
      setStatusUpdating(false);
    }
  };

  const handleCopyMessage = () => {
    if (!outreachMessage) return;
    navigator.clipboard.writeText(outreachMessage);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 영업 성공 혹은 팩 생성으로 바로 이동 (상품 A 연동)
  const handleGoToPackCreation = () => {
    if (!selectedTarget) return;
    
    // 영업 대상 기본 필드 매핑
    const dummyIntake = {
      business_name: selectedTarget.business_name,
      address: selectedTarget.business_address || '제주특별자치도 제주시 애월읍',
      phone: '064-000-0000',
      business_hours: '매일 09:00 - 18:00',
      description: `포털 검색 갭인 [${selectedTarget.matched_gap_types.join(', ')}]을 완전 해소하는 맞춤 로컬 매장입니다.`,
      industry_type: selectedTarget.business_type || 'restaurant_cafe',
      facilities: selectedTarget.business_attributes,
      menu_items: [],
      photos: [],
      faq_entries: []
    };

    sessionStorage.setItem('aihompy_pack_prefill', JSON.stringify(dummyIntake));
    sessionStorage.setItem('aihompy_pack_prefill_tier', selectedTarget.recommended_tier);
    
    // 리다이렉트
    router.push(`/${locale}/${workspaceSlug}/aihompy-pack`);
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#090b10] text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b10] text-[#e2e8f0] px-8 py-10 font-sans">
      
      {/* Header */}
      <div className="mb-8 flex items-center justify-between border-b border-[#1e293b] pb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => router.push(`/${locale}/${workspaceSlug}/sales-automation`)}
            className="p-2.5 bg-[#111622] hover:bg-[#1e293b] rounded-xl border border-[#1e293b] text-[#94a3b8] hover:text-white transition-all"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-extrabold text-white flex items-center gap-2">
              <Megaphone className="h-6 w-6 text-orange-400" />
              영업 대상 관리 및 카피 발송
            </h1>
            <p className="text-xs text-[#64748b] mt-1">포털 갭 매칭 정보를 기반으로 영업 파이프라인 진행 상태를 추적하고 맞춤 세일즈 제안을 관리합니다.</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Targets List */}
        <div className="space-y-4">
          <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-5 backdrop-blur-md shadow-lg space-y-4">
            <h2 className="text-sm font-extrabold text-[#94a3b8] uppercase tracking-wider">영업 타깃 리스트</h2>
            
            <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
              {targets.map((t, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectTarget(t)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex justify-between items-center ${
                    selectedTarget?.id === t.id
                      ? 'bg-orange-600/10 border-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.15)]'
                      : 'bg-[#090b10] border-[#1e293b] hover:border-indigo-500'
                  }`}
                >
                  <div>
                    <h3 className="text-sm font-bold text-white">{t.business_name}</h3>
                    <span className="text-[10px] text-[#64748b] mt-1 block">매칭 적합도: {t.match_score}점</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                    t.outreach_status === 'converted' 
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : t.outreach_status === 'contacted'
                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                      : 'bg-slate-800 text-[#64748b]'
                  }`}>
                    {t.outreach_status.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Columns: Target Detail & Proposal Copy */}
        {selectedTarget ? (
          <div className="lg:col-span-2 space-y-6">
            
            {/* Target Details */}
            <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-6">
              <div className="flex justify-between items-start border-b border-[#1e293b] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-extrabold text-white">{selectedTarget.business_name}</h2>
                    <span className="px-2 py-0.5 bg-orange-950 text-orange-400 border border-orange-800/30 rounded text-[9px] font-bold uppercase">
                      {selectedTarget.business_type}
                    </span>
                  </div>
                  <p className="text-xs text-[#64748b] mt-1">{selectedTarget.business_address}</p>
                </div>

                <div className="flex gap-2">
                  <select
                    value={selectedTarget.outreach_status}
                    disabled={statusUpdating}
                    onChange={(e) => handleStatusChange(e.target.value)}
                    className="px-3 py-1.5 bg-[#090b10] border border-[#334155] rounded-xl text-xs text-[#e2e8f0] focus:outline-none"
                  >
                    <option value="pending">대기 (Pending)</option>
                    <option value="contacted">연락완료 (Contacted)</option>
                    <option value="interested">흥미있음 (Interested)</option>
                    <option value="converted">유치성공 (Converted)</option>
                    <option value="declined">거절 (Declined)</option>
                  </select>
                </div>
              </div>

              {/* 갭 리포트 분석 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#64748b] block">매칭된 갭 분석</span>
                  <div className="flex flex-wrap gap-1.5">
                    {selectedTarget.matched_gap_types?.map((g: string, i: number) => (
                      <span key={i} className="px-2 py-1 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-[10px] font-bold flex items-center gap-1">
                        <AlertTriangle className="h-3 w-3" /> {g}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs font-bold text-[#64748b] block">연동할 추천 상품</span>
                  <div className="p-3 bg-[#090b10] border border-[#1e293b] rounded-xl flex justify-between items-center">
                    <div>
                      <span className="text-xs font-bold text-white block">{selectedTarget.recommended_product}</span>
                      <span className="text-[9px] text-[#64748b]">{selectedTarget.recommended_tier.toUpperCase()} 패키지 제안</span>
                    </div>
                    <button
                      onClick={handleGoToPackCreation}
                      className="px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white rounded-lg text-[10px] font-bold transition-all flex items-center gap-1"
                    >
                      <Store className="h-3.5 w-3.5" /> 팩 바로 조립
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales outreach copy (LLM) */}
            <div className="bg-[#111622]/80 border border-[#1e293b] rounded-2xl p-6 backdrop-blur-md shadow-lg space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Mail className="h-5 w-5 text-indigo-400" />
                  자동 제안 영업 메시지 카피
                </h3>
                
                <div className="flex gap-2">
                  <button
                    onClick={handleGenerateCopy}
                    disabled={generatingMessage}
                    className="px-3.5 py-1.5 bg-[#090b10] hover:bg-[#1e293b] border border-[#334155] rounded-xl text-xs font-semibold text-orange-400 flex items-center gap-1.5 transition-all"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${generatingMessage ? 'animate-spin' : ''}`} />
                    {outreachMessage ? '카피 다시 작성' : '영업 메시지 작성'}
                  </button>

                  {outreachMessage && (
                    <button
                      onClick={handleCopyMessage}
                      className="px-3.5 py-1.5 bg-[#090b10] hover:bg-[#1e293b] border border-[#334155] rounded-xl text-xs font-semibold text-indigo-300 flex items-center gap-1.5 transition-all"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-400" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? '복사 완료' : '메시지 복사'}
                    </button>
                  )}
                </div>
              </div>

              {outreachMessage ? (
                <div className="p-4 bg-[#090b10] border border-[#1e293b] rounded-xl text-xs leading-relaxed text-[#e2e8f0] font-sans whitespace-pre-wrap">
                  {outreachMessage}
                </div>
              ) : (
                <div className="text-center py-12 text-xs text-[#64748b] border border-dashed border-[#334155] rounded-xl flex flex-col items-center justify-center gap-2">
                  <Sparkles className="h-6 w-6 text-orange-400" />
                  "영업 메시지 작성" 버튼을 클릭하시면 이 업체의 갭 분석 결과에 딱 맞춘 AI 제안 메시지를 3초 만에 생성합니다.
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="lg:col-span-2 text-center py-20 text-xs text-[#64748b] border border-[#1e293b] rounded-2xl bg-[#111622]/80 backdrop-blur-md">
            타겟 업체 목록이 비어 있거나 로드되지 않았습니다.
          </div>
        )}
      </div>
    </div>
  );
}
