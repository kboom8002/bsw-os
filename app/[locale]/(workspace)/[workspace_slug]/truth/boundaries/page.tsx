"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  listBoundaryRules,
  createBoundaryRule,
  updateBoundaryRule,
  deleteBoundaryRule,
} from "@/app/actions/truth";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import {
  ArrowLeft, Plus, Shield, ShieldAlert, X,
  Trash2, Edit3, CheckCircle, Loader2, Tag, MessageSquare
} from "lucide-react";

const RISK_COLORS = { low: "green", medium: "amber", high: "orange", critical: "red" } as const;
const RISK_LABELS = { low: "낮음", medium: "보통", high: "높음", critical: "위험" } as const;

interface BoundaryRule {
  id: string;
  rule_name: string;
  forbidden_terms: string[];
  required_disclosures: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  is_active: boolean;
  created_at: string;
}

export default function BoundaryRulesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [rules, setRules] = useState<BoundaryRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Form state
  const [editId, setEditId] = useState<string | undefined>(undefined);
  const [ruleName, setRuleName] = useState("");
  const [forbiddenText, setForbiddenText] = useState("");
  const [disclosureText, setDisclosureText] = useState("");
  const [riskLevel, setRiskLevel] = useState<BoundaryRule["risk_level"]>("medium");
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return;
      try {
        setLoading(true);
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (!wsId) throw new Error("워크스페이스를 찾을 수 없습니다.");
        setWorkspaceId(wsId);
        const data = await listBoundaryRules(wsId);
        setRules(data as BoundaryRule[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceSlug]);

  const parseTags = (text: string) => text.split(/[,\n]/).map(t => t.trim()).filter(Boolean);

  const resetForm = () => {
    setEditId(undefined);
    setRuleName(""); setForbiddenText(""); setDisclosureText("");
    setRiskLevel("medium"); setIsActive(true);
    setShowForm(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSaving(true); setError(null);
    try {
      const data = {
        rule_name: ruleName,
        forbidden_terms: parseTags(forbiddenText),
        required_disclosures: parseTags(disclosureText),
        risk_level: riskLevel,
        is_active: isActive,
      };
      if (editId) {
        await updateBoundaryRule(workspaceId, editId, { id: editId, ...data });
      } else {
        await createBoundaryRule(workspaceId, data);
      }
      const updated = await listBoundaryRules(workspaceId);
      setRules(updated as BoundaryRule[]);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!workspaceId || !confirm("이 경계 규칙을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await deleteBoundaryRule(workspaceId, id);
      setRules(prev => prev.filter(r => r.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (rule: BoundaryRule) => {
    setEditId(rule.id);
    setRuleName(rule.rule_name);
    setForbiddenText(rule.forbidden_terms.join(", "));
    setDisclosureText(rule.required_disclosures.join(", "));
    setRiskLevel(rule.risk_level);
    setIsActive(rule.is_active);
    setShowForm(true);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/${workspaceSlug}/truth`} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">경계 규칙 관리</h1>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold text-sm flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> 규칙 추가
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs">{error}</div>}

      {showForm && (
        <div className="bg-slate-950/60 rounded-2xl border border-orange-500/20 p-6 space-y-4 relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-t-2xl" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">{editId ? "경계 규칙 수정" : "새 경계 규칙 추가"}</h3>
            <button onClick={resetForm} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-400 mb-1">규칙 이름 *</label>
              <input required value={ruleName} onChange={e => setRuleName(e.target.value)} placeholder="예: FDA 스킨케어 규정 준수"
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">금지 용어 (쉼표 또는 줄바꿈으로 구분)</label>
              <textarea rows={2} value={forbiddenText} onChange={e => setForbiddenText(e.target.value)} placeholder="예: 치료, 100% 효과 보장, 의학적 증명"
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 resize-none" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">필수 공시 (쉼표 또는 줄바꿈으로 구분)</label>
              <textarea rows={2} value={disclosureText} onChange={e => setDisclosureText(e.target.value)} placeholder="예: 개인차가 있을 수 있습니다, 전문가 상담 권고"
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-orange-500/50 resize-none" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">리스크 등급</label>
                <select value={riskLevel} onChange={e => setRiskLevel(e.target.value as any)}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-orange-500/50">
                  <option value="low">낮음</option>
                  <option value="medium">보통</option>
                  <option value="high">높음</option>
                  <option value="critical">위험</option>
                </select>
              </div>
              <div className="flex items-end gap-2 pb-0.5">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input type="checkbox" checked={isActive} onChange={e => setIsActive(e.target.checked)} className="accent-orange-400 w-4 h-4" />
                  활성 상태
                </label>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">취소</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Rules List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 경계 규칙 로딩 중...
        </div>
      ) : rules.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <Shield className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 경계 규칙이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {rules.map(rule => {
            const riskColor = RISK_COLORS[rule.risk_level];
            return (
              <div key={rule.id} className={`p-5 rounded-2xl border transition-all ${rule.is_active ? "border-white/5 bg-slate-950/40" : "border-white/5 bg-slate-950/20 opacity-60"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <ShieldAlert className={`w-4 h-4 text-${riskColor}-400 flex-shrink-0`} />
                      <p className="font-semibold text-sm text-white">{rule.rule_name}</p>
                      {!rule.is_active && <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-700/30 text-slate-500">비활성</span>}
                    </div>
                    {rule.forbidden_terms.length > 0 && (
                      <div className="flex items-start gap-1.5 mb-1.5 flex-wrap">
                        <Tag className="w-3 h-3 text-red-400 flex-shrink-0 mt-0.5" />
                        {rule.forbidden_terms.map(term => (
                          <span key={term} className="text-[10px] px-1.5 py-0.5 rounded bg-red-950/30 text-red-400 border border-red-500/10 font-mono">{term}</span>
                        ))}
                      </div>
                    )}
                    {rule.required_disclosures.length > 0 && (
                      <div className="flex items-start gap-1.5 flex-wrap">
                        <MessageSquare className="w-3 h-3 text-blue-400 flex-shrink-0 mt-0.5" />
                        {rule.required_disclosures.map(disc => (
                          <span key={disc} className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950/30 text-blue-400 border border-blue-500/10 font-mono">{disc}</span>
                        ))}
                      </div>
                    )}
                    <div className="mt-2">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full bg-${riskColor}-500/10 text-${riskColor}-400 border border-${riskColor}-500/20 font-mono`}>
                        리스크: {RISK_LABELS[rule.risk_level]}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button onClick={() => startEdit(rule)} className="p-1.5 rounded-lg text-slate-500 hover:text-blue-400 hover:bg-blue-950/20 transition-all">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(rule.id)}
                      disabled={deletingId === rule.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all disabled:opacity-40"
                    >
                      {deletingId === rule.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
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
