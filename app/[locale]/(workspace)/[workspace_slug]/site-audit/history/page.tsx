"use client";

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { History, Clock, FileText, CheckCircle2, ArrowRight, ArrowDownUp, BarChart3, AlertCircle, Loader2, RefreshCw } from 'lucide-react';
import { getSupabaseClient } from '@/lib/supabase';

interface AuditSession {
  id: string;
  created_at: string;
  website_url: string;
  brand_name: string;
  status: string;
  tier: string;
  pages_crawled: number;
  aepi_score: number | null;
  result_summary: any;
}

export default function AuditHistoryPage() {
  const params = useParams();
  const workspaceSlug = params?.workspace_slug as string;
  const locale = (params?.locale as string) || 'ko';

  const [sessions, setSessions] = useState<AuditSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [compareSessions, setCompareSessions] = useState<string[]>([]);

  // DB에서 감사 이력 조회
  useEffect(() => {
    loadSessions();
  }, [workspaceSlug]);

  const loadSessions = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      const { data, error: dbError } = await supabase
        .from('audit_sessions')
        .select('id, created_at, website_url, brand_name, status, tier, pages_crawled, aepi_score, result_summary')
        .order('created_at', { ascending: false })
        .limit(50);

      if (dbError) throw dbError;
      setSessions(data || []);
    } catch (err: any) {
      console.error('감사 이력 조회 실패:', err);
      setError(err.message || '세션 이력을 불러올 수 없습니다.');
      // DB 연결 실패 시 빈 배열 (Mock 데이터 제거)
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCompare = (id: string) => {
    if (compareSessions.includes(id)) {
      setCompareSessions(compareSessions.filter(sid => sid !== id));
    } else if (compareSessions.length < 2) {
      setCompareSessions([...compareSessions, id]);
    }
  };

  const getTierLabel = (tier: string) => {
    switch (tier) {
      case 'tier3': return 'Enterprise';
      case 'tier2': return 'Pro';
      case 'tier1.5': return 'Pro Lite';
      case 'tier1': return 'Lite';
      default: return 'Free';
    }
  };

  const getTierColor = (tier: string) => {
    if (tier === 'tier3') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    if (tier === 'tier2' || tier === 'tier1.5') return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
    if (tier === 'tier1') return 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    return 'text-slate-400 bg-slate-800 border-slate-700';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed': return { icon: CheckCircle2, color: 'text-emerald-400', label: '완료' };
      case 'running': return { icon: Loader2, color: 'text-indigo-400 animate-spin', label: '진행 중' };
      case 'failed': return { icon: AlertCircle, color: 'text-red-400', label: '실패' };
      default: return { icon: Clock, color: 'text-slate-500', label: '대기' };
    }
  };

  // 비교 데이터 계산
  const getComparisonData = () => {
    if (compareSessions.length !== 2) return null;
    const [id1, id2] = compareSessions;
    const s1 = sessions.find(s => s.id === id1);
    const s2 = sessions.find(s => s.id === id2);
    if (!s1 || !s2) return null;

    // 날짜 기준 정렬 (이전 vs 최근)
    const older = new Date(s1.created_at) < new Date(s2.created_at) ? s1 : s2;
    const newer = s1 === older ? s2 : s1;
    const scoreDiff = (newer.aepi_score || 0) - (older.aepi_score || 0);

    return { older, newer, scoreDiff };
  };

  const compData = getComparisonData();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Title */}
      <div className="relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <History className="h-3.5 w-3.5" />
            Audit Logs
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
            서피스 감사 이력 및 비교 리포트
          </h1>
          <p className="text-xs text-slate-400">
            과거 실행된 실측 분석 세션 이력을 보관하고, 두 기간의 가시성 성과 변동폭(Diff)을 계측합니다.
          </p>
        </div>
        <button
          onClick={loadSessions}
          disabled={loading}
          className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          새로고침
        </button>
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="flex items-center justify-center py-20 gap-3 text-slate-500">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span className="text-sm font-semibold">감사 이력 불러오는 중...</span>
        </div>
      )}

      {error && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-6 text-center space-y-2">
          <AlertCircle className="h-8 w-8 text-red-400 mx-auto" />
          <p className="text-sm font-bold text-red-400">{error}</p>
          <p className="text-xs text-slate-500">Supabase 연결을 확인하거나, 첫 감사를 실행해주세요.</p>
        </div>
      )}

      {!loading && !error && sessions.length === 0 && (
        <div className="bg-slate-900/30 border border-dashed border-slate-700 rounded-2xl p-12 text-center space-y-3">
          <FileText className="h-12 w-12 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">아직 감사 이력이 없습니다</p>
          <p className="text-xs text-slate-500">사이트 감사를 실행하면 이곳에 이력이 자동 기록됩니다.</p>
          <a
            href={`/${locale}/site-audit`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-all mt-2"
          >
            첫 감사 실행하기 <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      )}

      {/* Main Content */}
      {!loading && sessions.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Session Table */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">이전 실행 결과 세션 목록</h3>
                <span className="text-[10px] text-slate-500">{sessions.length}개 세션 | 두 세션을 선택하여 비교</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-500 font-bold">
                      <th className="py-2.5 px-4">비교</th>
                      <th className="py-2.5 px-4">실행 일시</th>
                      <th className="py-2.5 px-4">분석 범위</th>
                      <th className="py-2.5 px-4">상태</th>
                      <th className="py-2.5 px-4">구독 티어</th>
                      <th className="py-2.5 px-4">페이지</th>
                      <th className="py-2.5 px-4 text-right">AEPI</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/40 text-slate-400">
                    {sessions.map((sess) => {
                      const isSelected = compareSessions.includes(sess.id);
                      const statusInfo = getStatusBadge(sess.status);
                      const StatusIcon = statusInfo.icon;
                      return (
                        <tr key={sess.id} className={`hover:bg-slate-800/10 transition-colors ${isSelected ? 'bg-indigo-500/5' : ''}`}>
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              disabled={compareSessions.length >= 2 && !isSelected}
                              onChange={() => handleSelectCompare(sess.id)}
                              className="accent-indigo-500 h-4 w-4 cursor-pointer"
                            />
                          </td>
                          <td className="py-3.5 px-4 font-bold text-slate-300">
                            {new Date(sess.created_at).toLocaleString('ko-KR', {
                              year: 'numeric', month: 'short', day: 'numeric',
                              hour: '2-digit', minute: '2-digit'
                            })}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-300">{sess.brand_name || '—'}</div>
                            <div className="text-[10px] text-slate-500 truncate max-w-[200px]">{sess.website_url}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 ${statusInfo.color}`}>
                              <StatusIcon className="h-3 w-3" />
                              {statusInfo.label}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getTierColor(sess.tier)}`}>
                              {getTierLabel(sess.tier)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">{sess.pages_crawled || '—'}</td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-200 text-sm">
                            {sess.aepi_score ? `${sess.aepi_score.toFixed(1)}%` : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Comparative card */}
          <div className="lg:col-span-1 space-y-6">
            <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-5">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">세션 성과 비교 뷰</h3>
              
              {compData ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    <div>
                      <span className="text-[10px] text-slate-500 block">이전 세션</span>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(compData.older.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="text-[10px] text-slate-600 block truncate max-w-[120px]">
                        {compData.older.brand_name}
                      </span>
                    </div>
                    <span className="text-lg font-black text-slate-300">
                      {compData.older.aepi_score?.toFixed(1) || '—'}%
                    </span>
                  </div>
                  
                  <div className="flex justify-center text-slate-600">
                    <ArrowDownUp className="h-5 w-5" />
                  </div>
                  
                  <div className="flex justify-between items-center bg-slate-950/40 p-4 rounded-xl border border-slate-900">
                    <div>
                      <span className="text-[10px] text-slate-500 block">최근 세션</span>
                      <span className="text-xs font-bold text-slate-400">
                        {new Date(compData.newer.created_at).toLocaleDateString('ko-KR')}
                      </span>
                      <span className="text-[10px] text-slate-600 block truncate max-w-[120px]">
                        {compData.newer.brand_name}
                      </span>
                    </div>
                    <span className="text-lg font-black text-slate-300">
                      {compData.newer.aepi_score?.toFixed(1) || '—'}%
                    </span>
                  </div>

                  <div className={`p-4 ${
                    compData.scoreDiff > 0
                      ? 'bg-emerald-950/10 border-l-2 border-emerald-500'
                      : compData.scoreDiff < 0
                      ? 'bg-red-950/10 border-l-2 border-red-500'
                      : 'bg-slate-800/10 border-l-2 border-slate-500'
                  } rounded-r-xl space-y-1`}>
                    <span className="text-[10px] font-extrabold uppercase tracking-wide text-slate-400">
                      가시성 성과 변동폭 (Diff)
                    </span>
                    <p className={`text-base font-black ${
                      compData.scoreDiff > 0 ? 'text-emerald-400' : compData.scoreDiff < 0 ? 'text-red-400' : 'text-slate-400'
                    }`}>
                      {compData.scoreDiff > 0 ? '+' : ''}{compData.scoreDiff.toFixed(1)}%{' '}
                      {compData.scoreDiff > 0 ? '상승' : compData.scoreDiff < 0 ? '하락' : '변동 없음'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 font-semibold flex flex-col items-center justify-center gap-2 border border-dashed border-slate-800 rounded-xl">
                  <AlertCircle className="h-6 w-6 text-slate-600 animate-pulse" />
                  <span className="text-xs leading-relaxed">
                    비교를 위해 목록에서 두 개의 세션을 선택하세요.
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
