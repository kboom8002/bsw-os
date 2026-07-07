"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { 
  Building2, 
  Search, 
  Plus, 
  Settings, 
  ArrowLeft,
  Loader2,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  ShieldCheck,
  Tag
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";

export default function BrandsManagementPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "bsw-main";
  const { locale } = useTranslation();

  const [brands, setBrands] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadBrands();
  }, [workspaceSlug]);

  const loadBrands = async () => {
    setLoading(true);
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('workspaces')
        .select('*')
        .eq('workspace_type', 'brand')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) setBrands(data);
    } catch (err: any) {
      console.error('Failed to load brand workspaces:', err);
      setStatusMessage({ type: 'error', text: `브랜드 목록 로딩 실패: ${err.message}` });
    } finally {
      setLoading(false);
    }
  };

  const toggleBrandActive = async (brandId: string, currentStatus: boolean) => {
    try {
      const { getSupabaseClient } = await import("@/lib/supabase");
      const supabase = getSupabaseClient();
      const { error } = await supabase
        .from('workspaces')
        .update({ is_active: !currentStatus })
        .eq('id', brandId);

      if (error) throw error;

      setBrands(prev => prev.map(b => b.id === brandId ? { ...b, is_active: !currentStatus } : b));
      setStatusMessage({ type: 'success', text: `워크스페이스 상태가 성공적으로 변경되었습니다.` });
    } catch (err: any) {
      console.error('Failed to toggle brand status:', err);
      setStatusMessage({ type: 'error', text: `상태 변경 실패: ${err.message}` });
    }
  };

  const filteredBrands = brands.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (b.brand_description && b.brand_description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto">
      {/* Breadcrumb & Header */}
      <div className="space-y-4">
        <Link 
          href={`/${locale}/${workspaceSlug}`} 
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          플랫폼 운영 대시보드로 돌아가기
        </Link>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="text-xs text-amber-400 font-mono font-bold tracking-wider uppercase mb-1">
              PLATFORM OPERATOR ONLY
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              브랜드 워크스페이스 관리
            </h1>
            <p className="text-slate-400 text-sm">
              플랫폼에 활성화된 모든 테넌트 공간을 모니터링하고 가용성을 관리합니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link 
              href={`/${locale}/onboarding`}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-sm"
            >
              <Plus className="w-4 h-4" /> 새 브랜드 워크스페이스 생성
            </Link>
          </div>
        </div>
      </div>

      {/* Notifications */}
      {statusMessage && (
        <div className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
          statusMessage.type === 'success' 
            ? 'bg-emerald-950/20 border-emerald-500/30 text-emerald-400' 
            : 'bg-rose-950/20 border-rose-500/30 text-rose-400'
        }`}>
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
          )}
          <span className="text-sm font-semibold">{statusMessage.text}</span>
          <button 
            onClick={() => setStatusMessage(null)}
            className="ml-auto text-xs opacity-75 hover:opacity-100 font-bold"
          >
            닫기
          </button>
        </div>
      )}

      {/* Search & Statistics */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="브랜드명, slug, 설명 검색..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-white/10 bg-slate-900/50 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-cyan-500/30 focus:border-cyan-500/50"
          />
        </div>
        <div className="flex gap-4 text-xs font-mono text-slate-400 bg-white/5 border border-white/5 px-4 py-2 rounded-xl">
          <div>전체: <span className="text-white font-bold">{brands.length}</span></div>
          <div>활성: <span className="text-emerald-400 font-bold">{brands.filter(b => b.is_active !== false).length}</span></div>
          <div>비활성: <span className="text-rose-400 font-bold">{brands.filter(b => b.is_active === false).length}</span></div>
        </div>
      </div>

      {/* Brand List */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <Loader2 className="w-8 h-8 animate-spin text-cyan-500" />
        </div>
      ) : filteredBrands.length === 0 ? (
        <div className="p-16 text-center border border-dashed border-white/10 rounded-2xl text-slate-500 text-sm">
          {searchQuery ? "검색 결과와 일치하는 브랜드가 없습니다." : "생성된 브랜드 워크스페이스가 없습니다."}
        </div>
      ) : (
        <div className="overflow-hidden border border-white/5 bg-slate-950/20 rounded-2xl">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left text-sm text-slate-300">
              <thead className="bg-slate-950 border-b border-white/5 font-mono text-xs uppercase text-slate-400">
                <tr>
                  <th className="px-6 py-4 font-bold">브랜드 정보</th>
                  <th className="px-6 py-4 font-bold">슬러그 (Slug)</th>
                  <th className="px-6 py-4 font-bold">구독 플랜</th>
                  <th className="px-6 py-4 font-bold">도메인 URL</th>
                  <th className="px-6 py-4 font-bold">생성 날짜</th>
                  <th className="px-6 py-4 font-bold">상태</th>
                  <th className="px-6 py-4 font-bold text-right">작업</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBrands.map((brand) => (
                  <tr key={brand.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/10 border border-cyan-500/30 flex items-center justify-center font-bold text-cyan-400 flex-shrink-0">
                          {brand.name.substring(0, 2)}
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-white text-base truncate max-w-[200px]">{brand.name}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[200px]">
                            {brand.brand_description || "설명 없음"}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {brand.slug}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-cyan-950/40 border border-cyan-500/20 text-cyan-400 uppercase font-mono">
                        <Tag className="w-3 h-3" />
                        {brand.subscription_tier || 'starter'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs">
                      {brand.brand_url ? (
                        <a 
                          href={brand.brand_url} 
                          target="_blank" 
                          rel="noreferrer"
                          className="text-slate-400 hover:text-cyan-400 hover:underline inline-flex items-center gap-1"
                        >
                          {brand.brand_url.replace(/^https?:\/\//, '')}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ) : (
                        <span className="text-slate-600">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs font-mono text-slate-500">
                      {new Date(brand.created_at).toLocaleDateString('ko-KR', {
                        year: 'numeric', month: '2-digit', day: '2-digit'
                      })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => toggleBrandActive(brand.id, brand.is_active !== false)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border transition-all ${
                          brand.is_active !== false
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-rose-500/10 hover:border-rose-500/20 hover:text-rose-400'
                            : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:text-emerald-400'
                        }`}
                      >
                        {brand.is_active !== false ? (
                          <>
                            <CheckCircle className="w-3.5 h-3.5" /> 활성화됨
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3.5 h-3.5" /> 비활성화됨
                          </>
                        )}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link 
                          href={`/${locale}/${brand.slug}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl border border-white/10 hover:bg-white/5 hover:border-white/20 text-xs font-bold transition-all"
                        >
                          워크스페이스 진입 <ExternalLink className="w-3.5 h-3.5" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
