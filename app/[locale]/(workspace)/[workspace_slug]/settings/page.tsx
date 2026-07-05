"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { 
  Building2, Save, Globe, Target, Wrench, ShieldCheck, 
  Loader2, Plus, Trash, CheckCircle2, CreditCard
} from "lucide-react";
import { updateBrandProfile } from "@/app/actions/settings";

export default function SettingsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "";
  const { locale, t } = useTranslation();

  const [wsId, setWsId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form Fields
  const [brandName, setBrandName] = useState("");
  const [brandUrl, setBrandUrl] = useState("");
  const [brandDescription, setBrandDescription] = useState("");
  const [keywords, setKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [competitors, setCompetitors] = useState<string[]>([]);
  const [newCompetitor, setNewCompetitor] = useState("");
  const [subscriptionTier, setSubscriptionTier] = useState("starter");

  useEffect(() => {
    loadWorkspaceInfo();
  }, [workspaceSlug]);

  const loadWorkspaceInfo = async () => {
    setLoading(true);
    setError(null);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();
      const { data: ws, error: wsError } = await supabase
        .from('workspaces')
        .select('*')
        .eq('slug', workspaceSlug)
        .single();

      if (wsError || !ws) {
        setError("워크스페이스 정보를 불러오지 못했습니다.");
        return;
      }

      setWsId(ws.id);
      setBrandName(ws.name);
      setBrandUrl(ws.brand_url || "");
      setBrandDescription(ws.brand_description || "");
      setKeywords(ws.primary_keywords || []);
      setCompetitors(ws.competitor_slugs || []);
      setSubscriptionTier(ws.subscription_tier || "starter");
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !keywords.includes(newKeyword.trim())) {
      setKeywords([...keywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (kw: string) => {
    setKeywords(keywords.filter(k => k !== kw));
  };

  const addCompetitor = () => {
    if (newCompetitor.trim() && !competitors.includes(newCompetitor.trim())) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor("");
    }
  };

  const removeCompetitor = (comp: string) => {
    setCompetitors(competitors.filter(c => c !== comp));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    setError(null);

    try {
      const res = await updateBrandProfile(wsId, {
        name: brandName.trim(),
        brand_url: brandUrl.trim(),
        brand_description: brandDescription.trim(),
        primary_keywords: keywords,
        competitor_slugs: competitors
      });

      if (res.success) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(res.error || "설정 저장 실패");
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Workspace Configuration
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Workspace Settings
          </h1>
          <p className="text-slate-400 text-sm">
            브랜드 기본 프로필 정보 및 AI 분석 타겟을 업데이트합니다.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>성공적으로 설정이 저장되었습니다!</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* 일반 설정 카드 */}
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="w-4.5 h-4.5 text-cyan-400" />
            일반 브랜드 프로필
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">브랜드 공식 명칭</label>
              <input 
                type="text" 
                value={brandName}
                onChange={(e) => setBrandName(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">공식 웹사이트 URL</label>
              <input 
                type="url" 
                value={brandUrl}
                onChange={(e) => setBrandUrl(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none text-white"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">브랜드 설명</label>
              <textarea 
                value={brandDescription}
                onChange={(e) => setBrandDescription(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none text-white resize-none"
              />
            </div>
          </div>
        </div>

        {/* 업종 및 키워드 */}
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600" />
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Globe className="w-4.5 h-4.5 text-indigo-400" />
            타겟 도메인 & 키워드 설정
          </h3>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">핵심 타겟 키워드</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  placeholder="예: 세라마이드"
                  className="flex-1 px-3 py-2 text-sm bg-slate-950 border border-white/10 rounded-xl outline-none text-white"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addKeyword(); } }}
                />
                <button type="button" onClick={addKeyword} className="px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 text-xs font-medium">
                  추가
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/50 rounded-xl border border-white/5 min-h-[50px] items-start">
                {keywords.map(kw => (
                  <span key={kw} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-medium">
                    {kw}
                    <button type="button" onClick={() => removeKeyword(kw)} className="hover:text-red-400 font-bold ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">경쟁사 브랜드명</label>
              <div className="flex gap-2 mb-2">
                <input 
                  type="text" 
                  value={newCompetitor}
                  onChange={(e) => setNewCompetitor(e.target.value)}
                  placeholder="예: 닥터자르트"
                  className="flex-1 px-3 py-2 text-sm bg-slate-950 border border-white/10 rounded-xl outline-none text-white"
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCompetitor(); } }}
                />
                <button type="button" onClick={addCompetitor} className="px-4 bg-white/5 border border-white/10 text-white rounded-xl hover:bg-white/10 text-xs font-medium">
                  추가
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 p-2 bg-slate-950/50 rounded-xl border border-white/5 min-h-[50px] items-start">
                {competitors.map(comp => (
                  <span key={comp} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white/5 border border-white/10 text-slate-300 text-xs font-medium">
                    {comp}
                    <button type="button" onClick={() => removeCompetitor(comp)} className="hover:text-red-400 font-bold ml-0.5">×</button>
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 요금제 / 구독 정보 */}
        <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-pink-500" />
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <CreditCard className="w-4.5 h-4.5 text-purple-400" />
            구독 정보 및 결제
          </h3>

          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5">
            <div>
              <div className="text-sm font-bold text-white uppercase">{subscriptionTier} Plan</div>
              <div className="text-xs text-slate-400 mt-0.5">사용 중인 워크스페이스 플랜입니다.</div>
            </div>
            <div className="text-xs text-slate-400 font-mono">
              Level: <span className="text-cyan-400 font-bold">Standard</span>
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end pt-4">
          <button 
            type="submit" 
            disabled={saving}
            className="px-6 py-2.5 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/10 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> 변경사항 저장</>}
          </button>
        </div>
      </form>
    </div>
  );
}
