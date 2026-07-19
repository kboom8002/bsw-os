"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  listOperationalTruths,
  upsertOperationalTruth,
  deleteOperationalTruth,
  listEvidenceItems,
  listBoundaryRules,
} from "@/app/actions/truth";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import {
  ArrowLeft, Plus, Layers, ShieldAlert, FileCheck,
  CheckCircle, Trash2, Edit3, X, Loader2, RefreshCw
} from "lucide-react";

const RISK_COLORS = {
  low: "green",
  medium: "amber",
  high: "orange",
  critical: "red",
} as const;
const RISK_LABELS = { low: "낮음", medium: "보통", high: "높음", critical: "위험" } as const;
const STATUS_LABELS = { draft: "초안", in_review: "검토중", approved: "승인", rejected: "거부" } as const;
const STATUS_COLORS = { draft: "slate", in_review: "blue", approved: "green", rejected: "red" } as const;

interface ClaimItem {
  id: string;
  claim: string;
  description?: string | null;
  risk_level: "low" | "medium" | "high" | "critical";
  confidence_score: number;
  review_status: "draft" | "in_review" | "approved" | "rejected";
  evidence_count?: Array<{ count: number }>;
  boundary_count?: Array<{ count: number }>;
}

export default function OperationalClaimsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [claims, setClaims] = useState<ClaimItem[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<any[]>([]);
  const [boundaryRules, setBoundaryRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [claimText, setClaimText] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [reviewStatus, setReviewStatus] = useState<"draft" | "in_review" | "approved" | "rejected">("draft");
  const [confidenceScore, setConfidenceScore] = useState(70);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [selectedBoundaryIds, setSelectedBoundaryIds] = useState<string[]>([]);

  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return;
      try {
        setLoading(true);
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (!wsId) throw new Error("워크스페이스를 찾을 수 없습니다.");
        setWorkspaceId(wsId);
        const [c, ev, br] = await Promise.all([
          listOperationalTruths(wsId),
          listEvidenceItems(wsId),
          listBoundaryRules(wsId),
        ]);
        setClaims(c as ClaimItem[]);
        setEvidenceItems(ev);
        setBoundaryRules(br);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceSlug]);

  const resetForm = () => {
    setEditId(undefined);
    setClaimText("");
    setDescription("");
    setRiskLevel("medium");
    setReviewStatus("draft");
    setConfidenceScore(70);
    setSelectedEvidenceIds([]);
    setSelectedBoundaryIds([]);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSaving(true);
    setError(null);
    try {
      const result = await upsertOperationalTruth(
        workspaceId,
        { id: editId, claim: claimText, description, risk_level: riskLevel, confidence_score: confidenceScore, review_status: reviewStatus },
        selectedEvidenceIds,
        selectedBoundaryIds
      );
      // Refresh list
      const updated = await listOperationalTruths(workspaceId);
      setClaims(updated as ClaimItem[]);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!workspaceId || !confirm("이 클레임을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await deleteOperationalTruth(workspaceId, id);
      setClaims(prev => prev.filter(c => c.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const toggleMulti = (id: string, arr: string[], setter: (v: string[]) => void) => {
    setter(arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/${workspaceSlug}/truth`} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">운영 클레임 관리</h1>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-indigo-500 text-white font-bold text-sm flex items-center gap-2 hover:from-purple-400 hover:to-indigo-400 transition-all"
        >
          <Plus className="w-4 h-4" /> 클레임 추가
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-slate-950/60 rounded-2xl border border-purple-500/20 p-6 space-y-4 relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-t-2xl" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{editId ? "클레임 수정" : "새 운영 클레임 추가"}</h3>
            <button onClick={resetForm} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">클레임 내용 *</label>
              <textarea required rows={3} value={claimText} onChange={e => setClaimText(e.target.value)}
                placeholder="브랜드가 공식적으로 주장하는 구체적인 사실..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">설명</label>
              <input value={description} onChange={e => setDescription(e.target.value)} placeholder="클레임 근거 설명..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500/50" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">리스크 등급</label>
                <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500/50">
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                  <option value="critical">위험</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">검토 상태</label>
                <select value={reviewStatus} onChange={e => setReviewStatus(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-purple-500/50">
                  <option value="draft">초안</option>
                  <option value="in_review">검토중</option>
                  <option value="approved">승인</option>
                  <option value="rejected">거부</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">신뢰도 ({confidenceScore}%)</label>
                <input type="range" min={0} max={100} value={confidenceScore} onChange={e => setConfidenceScore(Number(e.target.value))}
                  className="w-full accent-purple-400 mt-2" />
              </div>
            </div>
            {/* Evidence selector */}
            {evidenceItems.length > 0 && (
              <div>
                <label className="block text-xs text-slate-400 mb-2">연결 증거 (다중 선택)</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-32 overflow-y-auto">
                  {evidenceItems.map(ev => (
                    <label key={ev.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all ${selectedEvidenceIds.includes(ev.id) ? "border-blue-500/40 bg-blue-950/20 text-blue-300" : "border-white/5 text-slate-400 hover:border-white/10"}`}>
                      <input type="checkbox" className="sr-only" checked={selectedEvidenceIds.includes(ev.id)}
                        onChange={() => toggleMulti(ev.id, selectedEvidenceIds, setSelectedEvidenceIds)} />
                      <FileCheck className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{ev.title}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            {/* Boundary selector */}
            {boundaryRules.length > 0 && (
              <div>
                <label className="block text-xs text-slate-400 mb-2">연결 경계 규칙 (다중 선택)</label>
                <div className="grid grid-cols-2 gap-1.5 max-h-28 overflow-y-auto">
                  {boundaryRules.map(br => (
                    <label key={br.id} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer text-xs transition-all ${selectedBoundaryIds.includes(br.id) ? "border-orange-500/40 bg-orange-950/20 text-orange-300" : "border-white/5 text-slate-400 hover:border-white/10"}`}>
                      <input type="checkbox" className="sr-only" checked={selectedBoundaryIds.includes(br.id)}
                        onChange={() => toggleMulti(br.id, selectedBoundaryIds, setSelectedBoundaryIds)} />
                      <ShieldAlert className="w-3 h-3 flex-shrink-0" />
                      <span className="line-clamp-1">{br.rule_name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">취소</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Claims List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 클레임 로딩 중...
        </div>
      ) : claims.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Layers className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 운영 클레임이 없습니다.</p>
          <p className="text-xs mt-1">위 버튼을 눌러 첫 번째 클레임을 추가하세요.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {claims.map((claim) => {
            const evCount = claim.evidence_count?.[0]?.count ?? 0;
            const bdCount = claim.boundary_count?.[0]?.count ?? 0;
            const riskColor = RISK_COLORS[claim.risk_level];
            const statusColor = STATUS_COLORS[claim.review_status];
            return (
              <div key={claim.id} className="p-5 rounded-2xl border border-white/5 bg-slate-950/40 hover:border-white/10 transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-slate-100 font-medium leading-relaxed">{claim.claim}</p>
                    {claim.description && (
                      <p className="text-xs text-slate-500 mt-1">{claim.description}</p>
                    )}
                    <div className="flex flex-wrap items-center gap-2 mt-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${riskColor}-500/10 text-${riskColor}-400 border border-${riskColor}-500/20 font-mono`}>
                        리스크: {RISK_LABELS[claim.risk_level]}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${statusColor}-500/10 text-${statusColor}-400 border border-${statusColor}-500/20 font-mono`}>
                        {STATUS_LABELS[claim.review_status]}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">신뢰도 {Number(claim.confidence_score).toFixed(1)}%</span>
                      {evCount > 0 && <span className="text-[10px] text-blue-400 font-mono">증거 {evCount}개</span>}
                      {bdCount > 0 && <span className="text-[10px] text-orange-400 font-mono">경계 {bdCount}개</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => {
                        setEditId(claim.id);
                        setClaimText(claim.claim);
                        setDescription(claim.description || "");
                        setRiskLevel(claim.risk_level);
                        setReviewStatus(claim.review_status);
                        setConfidenceScore(Number(claim.confidence_score));
                        setShowForm(true);
                      }}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-950/20 transition-all"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(claim.id)}
                      disabled={deletingId === claim.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all disabled:opacity-40"
                    >
                      {deletingId === claim.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
