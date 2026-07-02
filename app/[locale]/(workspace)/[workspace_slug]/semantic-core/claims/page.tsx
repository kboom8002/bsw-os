"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { 
  createClaimNode, 
  createLineageRecord, 
  evaluateLineageCompleteness,
  createOperationalTruth,
  createEvidenceItem,
  createBoundaryRule
} from "@/app/actions/semantic";
import { 
  ArrowLeft, 
  Lock, 
  Plus, 
  ShieldCheck, 
  FileText, 
  AlertOctagon, 
  Fingerprint, 
  CheckCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronDown,
  ChevronRight,
  Database,
  BookOpen,
  Shield
} from "lucide-react";

interface ClaimItem {
  id: string;
  claim_summary: string;
  operational_truth_id: string;
  risk_level: "low" | "medium" | "high" | "critical";
  evidence_title?: string;
  is_verified?: boolean;
  boundary_rule_name?: string;
  is_publishable?: boolean;
  verification_signature?: string | null;
}

interface OperationalTruth {
  id: string;
  claim: string;
  risk_level: "low" | "medium" | "high" | "critical";
}

interface EvidenceItem {
  id: string;
  title: string;
  source_url?: string;
  is_verified: boolean;
}

interface BoundaryRule {
  id: string;
  rule_name: string;
  description?: string;
  is_active: boolean;
}

export default function ClaimLineagePage() {
  const params = useParams();
  const { t } = useTranslation();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const [workspaceId, setWorkspaceId] = useState<string>('');
  const [dbLoading, setDbLoading] = useState(true);

  const [operationalTruths, setOperationalTruths] = useState<OperationalTruth[]>([]);
  const [evidenceItems, setEvidenceItems] = useState<EvidenceItem[]>([]);
  const [boundaryRules, setBoundaryRules] = useState<BoundaryRule[]>([]);
  const [claims, setClaims] = useState<ClaimItem[]>([]);

  useEffect(() => { loadFromDb(); }, [workspaceSlug]);

  const loadFromDb = async () => {
    setDbLoading(true);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();
      const { data: ws } = await supabase.from('workspaces').select('id').eq('slug', workspaceSlug).single();
      const resolvedWsId = ws?.id || '11111111-1111-1111-1111-111111111111';
      setWorkspaceId(resolvedWsId);

      const [otRes, evRes, brRes, clRes] = await Promise.all([
        supabase.from('brand_operational_truths').select('id, claim, risk_level').eq('workspace_id', resolvedWsId).order('created_at', { ascending: false }),
        supabase.from('evidence_items').select('id, title, is_verified').eq('workspace_id', resolvedWsId).order('created_at', { ascending: false }),
        supabase.from('boundary_rules').select('id, rule_name, is_active').eq('workspace_id', resolvedWsId),
        supabase.from('claim_nodes').select('id, claim_summary, operational_truth_id, risk_level, evidence_title, is_verified, boundary_rule_name, is_publishable, verification_signature').eq('workspace_id', resolvedWsId).order('created_at', { ascending: false }),
      ]);

      setOperationalTruths(otRes.data ?? []);
      setEvidenceItems(evRes.data ?? []);
      setBoundaryRules(brRes.data ?? []);
      setClaims(clRes.data ?? []);
    } catch (err) {
      console.error('Claims DB 로드 실패:', err);
    } finally {
      setDbLoading(false);
    }
  };

  const [isCreatingClaim, setIsCreatingClaim] = useState(false);
  const [isCreatingLineage, setIsCreatingLineage] = useState(false);

  // New Claim Form
  const [claimSummary, setClaimSummary] = useState("");
  const [selectedOperId, setSelectedOperId] = useState("");

  // New Lineage Form
  const [selectedClaimId, setSelectedClaimId] = useState("");
  const [selectedEvId, setSelectedEvId] = useState("");
  const [selectedRuleId, setSelectedRuleId] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);
  const [evalResult, setEvalResult] = useState<{ blockers: string[]; signature: string | null } | null>(null);

  // Prerequisite inline form states
  const [openPrereqSection, setOpenPrereqSection] = useState<"ot" | "ev" | "br" | null>(null);
  const [otClaim, setOtClaim] = useState("");
  const [otRiskLevel, setOtRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [evTitle, setEvTitle] = useState("");
  const [evSourceUrl, setEvSourceUrl] = useState("");
  const [evIsVerified, setEvIsVerified] = useState(false);
  const [brRuleName, setBrRuleName] = useState("");
  const [brDescription, setBrDescription] = useState("");
  const [brIsActive, setBrIsActive] = useState(true);
  const [prereqSubmitting, setPrereqSubmitting] = useState(false);

  const resetForm = () => {
    setClaimSummary("");
    setSelectedOperId("");
    setSelectedClaimId("");
    setSelectedEvId("");
    setSelectedRuleId("");
    setFeedback(null);
    setEvalResult(null);
  };

  const resetPrereqForms = () => {
    setOtClaim(""); setOtRiskLevel("medium");
    setEvTitle(""); setEvSourceUrl(""); setEvIsVerified(false);
    setBrRuleName(""); setBrDescription(""); setBrIsActive(true);
  };

  const handleCreateOT = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otClaim.trim()) return;
    setPrereqSubmitting(true);
    try {
      const result = await createOperationalTruth(workspaceId, { claim: otClaim, risk_level: otRiskLevel });
      setOperationalTruths(prev => [{ id: result.id, claim: result.claim, risk_level: result.risk_level as OperationalTruth["risk_level"] }, ...prev]);
      setFeedback({ type: "success", message: "운영 진실이 성공적으로 등록되었습니다." });
      setOtClaim(""); setOtRiskLevel("medium");
      setOpenPrereqSection(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401') || msg.includes('UNAUTHORIZED')) {
        const demoId = "demo-ot-" + Math.floor(Math.random() * 10000);
        setOperationalTruths(prev => [{ id: demoId, claim: otClaim, risk_level: otRiskLevel }, ...prev]);
        setFeedback({ type: "success", message: "[데모] 운영 진실 등록됨 (로그인 시 실제 저장)" });
        setOtClaim(""); setOtRiskLevel("medium");
        setOpenPrereqSection(null);
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    } finally {
      setPrereqSubmitting(false);
    }
  };

  const handleCreateEV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!evTitle.trim()) return;
    setPrereqSubmitting(true);
    try {
      const result = await createEvidenceItem(workspaceId, { title: evTitle, source_url: evSourceUrl || undefined, is_verified: evIsVerified });
      setEvidenceItems(prev => [{ id: result.id, title: result.title, is_verified: result.is_verified }, ...prev]);
      setFeedback({ type: "success", message: "근거 자료가 성공적으로 등록되었습니다." });
      setEvTitle(""); setEvSourceUrl(""); setEvIsVerified(false);
      setOpenPrereqSection(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401') || msg.includes('UNAUTHORIZED')) {
        const demoId = "demo-ev-" + Math.floor(Math.random() * 10000);
        setEvidenceItems(prev => [{ id: demoId, title: evTitle, is_verified: evIsVerified }, ...prev]);
        setFeedback({ type: "success", message: "[데모] 근거 자료 등록됨 (로그인 시 실제 저장)" });
        setEvTitle(""); setEvSourceUrl(""); setEvIsVerified(false);
        setOpenPrereqSection(null);
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    } finally {
      setPrereqSubmitting(false);
    }
  };

  const handleCreateBR = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brRuleName.trim()) return;
    setPrereqSubmitting(true);
    try {
      const result = await createBoundaryRule(workspaceId, { rule_name: brRuleName, description: brDescription || undefined, is_active: brIsActive });
      setBoundaryRules(prev => [{ id: result.id, rule_name: result.rule_name, is_active: result.is_active }, ...prev]);
      setFeedback({ type: "success", message: "안전 경계 규칙이 성공적으로 등록되었습니다." });
      setBrRuleName(""); setBrDescription(""); setBrIsActive(true);
      setOpenPrereqSection(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401') || msg.includes('UNAUTHORIZED')) {
        const demoId = "demo-br-" + Math.floor(Math.random() * 10000);
        setBoundaryRules(prev => [{ id: demoId, rule_name: brRuleName, is_active: brIsActive }, ...prev]);
        setFeedback({ type: "success", message: "[데모] 안전 경계 규칙 등록됨 (로그인 시 실제 저장)" });
        setBrRuleName(""); setBrDescription(""); setBrIsActive(true);
        setOpenPrereqSection(null);
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    } finally {
      setPrereqSubmitting(false);
    }
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimSummary.trim() || !selectedOperId) return;

    try {
      const result = await createClaimNode(workspaceId, {
        claim_summary: claimSummary,
        operational_truth_id: selectedOperId
      });
      const parentOper = operationalTruths.find(o => o.id === selectedOperId);
      const created: ClaimItem = {
        id: result.id || "claim-" + Math.floor(Math.random() * 1000),
        claim_summary: result.claim_summary,
        operational_truth_id: result.operational_truth_id,
        risk_level: parentOper?.risk_level || "medium",
        is_publishable: false,
        verification_signature: null
      };
      setClaims(prev => [...prev, created]);
      setFeedback({ type: "success", message: `클레임 노드가 볼트에 성공적으로 등록되었습니다.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        const parentOper = operationalTruths.find(o => o.id === selectedOperId);
        setClaims(prev => [...prev, {
          id: "demo-claim-" + Math.floor(Math.random() * 1000),
          claim_summary: claimSummary,
          operational_truth_id: selectedOperId,
          risk_level: parentOper?.risk_level || "medium",
          is_publishable: false,
          verification_signature: null
        }]);
        setFeedback({ type: "success", message: `[데모] Claim 등록됨 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    }
    setIsCreatingClaim(false);
    resetForm();
  };

  const handleCreateLineage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimId) return;

    const data = {
      claim_node_id: selectedClaimId,
      evidence_item_id: selectedEvId || null,
      boundary_rule_id: selectedRuleId || null,
      is_publishable: false,
      verification_signature: null
    };
    const ev = evidenceItems.find(x => x.id === selectedEvId);
    const rule = boundaryRules.find(x => x.id === selectedRuleId);

    try {
      await createLineageRecord(workspaceId, data);
      setClaims(prev => prev.map(c => c.id === selectedClaimId ? {
        ...c,
        evidence_title: ev?.title,
        is_verified: ev?.is_verified,
        boundary_rule_name: rule?.rule_name
      } : c));
      setFeedback({ type: "success", message: `Lineage Trace links mapped! Ready to evaluate.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        setClaims(prev => prev.map(c => c.id === selectedClaimId ? {
          ...c,
          evidence_title: ev?.title,
          is_verified: ev?.is_verified,
          boundary_rule_name: rule?.rule_name
        } : c));
        setFeedback({ type: "success", message: `[데모] Lineage 연결 완료 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `Failure: ${msg}` });
      }
    }
    setIsCreatingLineage(false);
    resetForm();
  };

  const triggerVerification = async (claimId: string) => {
    setFeedback(null);
    setEvalResult(null);

    try {
      const result = await evaluateLineageCompleteness(workspaceId, claimId);
      setClaims(prev => prev.map(c => c.id === claimId ? {
        ...c,
        is_publishable: result.isPublishable,
        verification_signature: result.verificationSignature
      } : c));
      if (result.isPublishable) {
        setFeedback({ type: "success", message: `CRITICAL PASS: Cryptographic seal successfully signed!` });
        setEvalResult({ blockers: [], signature: result.verificationSignature });
      } else {
        setFeedback({ type: "error", message: "LINEAGE BLOCK: Safety validation constraints failed." });
        setEvalResult({ blockers: result.blockers, signature: null });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        // 데모: 맨다 통과 시뮬레이션
        const demoSig = Math.random().toString(36).substring(2, 18);
        setClaims(prev => prev.map(c => c.id === claimId ? {
          ...c, is_publishable: true, verification_signature: `demo-${demoSig}`
        } : c));
        setFeedback({ type: "success", message: `[데모] PASS: 데모 시물레이션 시그니처 발급 (로그인 시 실제 전호)` });
        setEvalResult({ blockers: [], signature: `demo-${demoSig}` });
      } else {
        setFeedback({ type: "error", message: `Evaluation Error: ${msg}` });
      }
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "border-red-500/20 text-red-400 bg-red-950/20";
      case "high": return "border-orange-500/20 text-orange-400 bg-orange-950/20";
      case "medium": return "border-yellow-500/20 text-yellow-400 bg-yellow-950/20";
      default: return "border-green-500/20 text-green-400 bg-green-950/20";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">{t('semantic_core.studio_title')}</div>
            <h1 className="text-2xl font-extrabold text-white">{t('semantic_core.claims_page_title')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsCreatingLineage(true);
              setIsCreatingClaim(false);
              setFeedback(null);
              setEvalResult(null);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-purple-500/20 text-purple-400 hover:bg-purple-950/20 bg-purple-950/10 flex items-center gap-1.5 transition-all"
          >
            <Clock className="w-4 h-4" /> {t('semantic_core.claims_map_trace')}
          </button>
          <button
            onClick={() => {
              setIsCreatingClaim(true);
              setIsCreatingLineage(false);
              resetForm();
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" /> {t('semantic_core.claims_declare')}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          feedback.type === "success" 
            ? "border-green-500/20 text-green-400 bg-green-950/20" 
            : "border-red-500/20 text-red-400 bg-red-950/20"
        }`}>
          {feedback.type === "success" ? <ShieldCheck className="w-5 h-5 text-green-400" /> : <ShieldAlert className="w-5 h-5 text-red-400" />}
          <span className="font-semibold">{feedback.message}</span>
        </div>
      )}

      {/* Blockers list */}
      {evalResult && evalResult.blockers.length > 0 && (
        <div className="p-5 rounded-2xl border border-red-500/20 bg-red-950/10 space-y-3">
          <h4 className="text-xs font-bold font-mono text-red-400 flex items-center gap-1.5 uppercase">
            <AlertOctagon className="w-4 h-4" />
            Verification Failures Mapped:
          </h4>
          <ul className="space-y-1.5 pl-5 list-disc text-xs text-slate-300">
            {evalResult.blockers.map((b, i) => (
              <li key={i}>{b}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Claims Table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Lock className="w-5 h-5 text-cyan-400" />
              {t('semantic_core.claims_vault')}
            </h3>

            <div className="space-y-4">
              {claims.map((claim) => (
                <div key={claim.id} className="p-5 rounded-xl border border-white/5 bg-slate-900/60 space-y-4 relative overflow-hidden">
                  <div className="absolute top-4 right-4 flex items-center gap-2">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-mono font-bold ${getRiskColor(claim.risk_level)}`}>
                      {claim.risk_level} RISK
                    </span>
                  </div>

                  <div className="space-y-1.5">
                    <h4 className="font-bold text-white text-sm pr-20">{claim.claim_summary}</h4>
                    <p className="text-[10px] text-slate-500 font-mono">Claim ID: {claim.id}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                    {/* Evidence Info */}
                    <div className="p-3 rounded-lg border border-white/5 bg-slate-950/40 text-xs">
                      <span className="block font-mono text-[9px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <FileText className="w-3 h-3 text-cyan-400" /> {t('semantic_core.claims_linked_evidence')}
                      </span>
                      {claim.evidence_title ? (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-200 truncate block">{claim.evidence_title}</span>
                          <span className={`inline-block text-[9px] font-mono font-bold ${
                            claim.is_verified ? "text-green-400" : "text-yellow-500"
                          }`}>
                            {claim.is_verified ? "● Document Verified" : "● Awaiting Verification"}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500">No evidence document attached.</span>
                      )}
                    </div>

                    {/* Safety boundary Info */}
                    <div className="p-3 rounded-lg border border-white/5 bg-slate-950/40 text-xs">
                      <span className="block font-mono text-[9px] text-slate-500 uppercase mb-1 flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3 text-purple-400" /> {t('semantic_core.claims_disclosures')}
                      </span>
                      {claim.boundary_rule_name ? (
                        <div className="space-y-1">
                          <span className="font-bold text-slate-200 truncate block">{claim.boundary_rule_name}</span>
                          <span className="text-[9px] text-purple-400 font-mono font-bold">● Active safety rule</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">No safety rule attached.</span>
                      )}
                    </div>
                  </div>

                  {/* Verification Signature / Action row */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-t border-white/5 pt-4">
                    {claim.verification_signature ? (
                      <div className="flex-1 min-w-0">
                        <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider mb-0.5">Cryptographic system verification signature seal</div>
                        <div className="px-3 py-2 rounded-lg border border-green-500/20 bg-green-950/20 font-mono text-[10px] text-green-400 flex items-center gap-2 select-all shadow-md shadow-green-500/5">
                          <Fingerprint className="w-4 h-4 flex-shrink-0 animate-pulse text-green-400" />
                          <span className="truncate">{claim.verification_signature}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-xs text-slate-500 flex items-center gap-1.5">
                        <AlertTriangle className="w-4 h-4 text-yellow-500" />
                        <span>Awaiting system signature validation.</span>
                      </div>
                    )}

                    <button
                      onClick={() => triggerVerification(claim.id)}
                      className="px-4 py-2 text-xs font-bold rounded-lg bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md transition-all flex items-center justify-center gap-1.5 self-end md:self-auto"
                    >
                      <Lock className="w-3.5 h-3.5" /> {t('semantic_core.claims_verify')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          {/* ─── Prerequisite Data Creation Section ─── */}
          <div className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 space-y-3">
            <h3 className="font-bold text-xs text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Database className="w-4 h-4 text-amber-400" />
              사전 데이터 등록
            </h3>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              클레임 생성 전 운영 진실, 근거 자료, 안전 경계 규칙을 먼저 등록하세요.
            </p>

            {/* ── Operational Truth Toggle ── */}
            <div className="border border-white/5 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenPrereqSection(openPrereqSection === 'ot' ? null : 'ot')}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
                  운영 진실 추가
                  <span className="text-[10px] text-slate-500 font-mono">({operationalTruths.length})</span>
                </span>
                {openPrereqSection === 'ot' ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              {openPrereqSection === 'ot' && (
                <form onSubmit={handleCreateOT} className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">운영 진실 명제</label>
                    <textarea
                      value={otClaim}
                      onChange={(e) => setOtClaim(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 text-xs h-20 resize-none"
                      placeholder="브랜드의 핵심 운영 진실을 입력하세요..."
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">위험 수준</label>
                    <select
                      value={otRiskLevel}
                      onChange={(e) => setOtRiskLevel(e.target.value as typeof otRiskLevel)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none focus:border-cyan-500/50 text-xs"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={prereqSubmitting}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-slate-950 font-bold transition-all text-[11px] text-center"
                    >
                      {prereqSubmitting ? '저장 중...' : '등록'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenPrereqSection(null); setOtClaim(''); setOtRiskLevel('medium'); }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[11px]"
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Evidence Item Toggle ── */}
            <div className="border border-white/5 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenPrereqSection(openPrereqSection === 'ev' ? null : 'ev')}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-emerald-400" />
                  근거 자료 추가
                  <span className="text-[10px] text-slate-500 font-mono">({evidenceItems.length})</span>
                </span>
                {openPrereqSection === 'ev' ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              {openPrereqSection === 'ev' && (
                <form onSubmit={handleCreateEV} className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">근거 자료 제목</label>
                    <input
                      type="text"
                      value={evTitle}
                      onChange={(e) => setEvTitle(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-xs"
                      placeholder="근거 문서 제목..."
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">출처 URL <span className="text-slate-600">(선택)</span></label>
                    <input
                      type="url"
                      value={evSourceUrl}
                      onChange={(e) => setEvSourceUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 text-xs"
                      placeholder="https://..."
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={evIsVerified}
                      onChange={(e) => setEvIsVerified(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-slate-900 text-emerald-500 focus:ring-emerald-500/30 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-300 font-semibold">검증 완료</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={prereqSubmitting}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-bold transition-all text-[11px] text-center"
                    >
                      {prereqSubmitting ? '저장 중...' : '등록'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenPrereqSection(null); setEvTitle(''); setEvSourceUrl(''); setEvIsVerified(false); }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[11px]"
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* ── Boundary Rule Toggle ── */}
            <div className="border border-white/5 rounded-xl overflow-hidden">
              <button
                type="button"
                onClick={() => setOpenPrereqSection(openPrereqSection === 'br' ? null : 'br')}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs font-semibold text-slate-200 hover:bg-white/5 transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Shield className="w-3.5 h-3.5 text-purple-400" />
                  안전 경계 규칙 추가
                  <span className="text-[10px] text-slate-500 font-mono">({boundaryRules.length})</span>
                </span>
                {openPrereqSection === 'br' ? <ChevronDown className="w-3.5 h-3.5 text-slate-500" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
              </button>
              {openPrereqSection === 'br' && (
                <form onSubmit={handleCreateBR} className="px-4 pb-4 pt-1 space-y-3 border-t border-white/5">
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">규칙 이름</label>
                    <input
                      type="text"
                      value={brRuleName}
                      onChange={(e) => setBrRuleName(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 text-xs"
                      placeholder="안전 규칙 이름..."
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-400">설명 <span className="text-slate-600">(선택)</span></label>
                    <textarea
                      value={brDescription}
                      onChange={(e) => setBrDescription(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-purple-500/50 text-xs h-16 resize-none"
                      placeholder="규칙에 대한 상세 설명..."
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={brIsActive}
                      onChange={(e) => setBrIsActive(e.target.checked)}
                      className="w-3.5 h-3.5 rounded border-white/20 bg-slate-900 text-purple-500 focus:ring-purple-500/30 focus:ring-offset-0 cursor-pointer"
                    />
                    <span className="text-[11px] text-slate-300 font-semibold">규칙 활성화</span>
                  </label>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="submit"
                      disabled={prereqSubmitting}
                      className="flex-1 px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:opacity-50 text-slate-950 font-bold transition-all text-[11px] text-center"
                    >
                      {prereqSubmitting ? '저장 중...' : '등록'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setOpenPrereqSection(null); setBrRuleName(''); setBrDescription(''); setBrIsActive(true); }}
                      className="px-3 py-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-[11px]"
                    >
                      취소
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
          {/* Manual Claim Declaration */}
          {isCreatingClaim && (
            <form onSubmit={handleCreateClaim} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200">{t('semantic_core.claims_declare_factual')}</h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.claims_summary_statement')}</label>
                <textarea
                  value={claimSummary}
                  onChange={(e) => setClaimSummary(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold h-24 resize-none"
                  placeholder="Precise factual claim statement to publish on web surfaces..."
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.claims_parent_truth')}</label>
                <select
                  value={selectedOperId}
                  onChange={(e) => setSelectedOperId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                  required
                >
                  <option value="">-- Select Operational Truth --</option>
                  {operationalTruths.map(ot => (
                    <option key={ot.id} value={ot.id}>{ot.claim.substring(0, 45)}...</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  {t('semantic_core.claims_save')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingClaim(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  {t('semantic_core.btn_cancel')}
                </button>
              </div>
            </form>
          )}

          {/* Lineage Record Trace Formulation */}
          {isCreatingLineage && (
            <form onSubmit={handleCreateLineage} className="p-6 rounded-2xl border border-purple-500/20 bg-slate-950/40 space-y-4">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1">
                <Clock className="w-4 h-4 text-purple-400" />
                {t('semantic_core.claims_map_trace')}
              </h3>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.claims_select_claim')}</label>
                <select
                  value={selectedClaimId}
                  onChange={(e) => setSelectedClaimId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs font-semibold"
                  required
                >
                  <option value="">-- Choose Claim --</option>
                  {claims.map(c => (
                    <option key={c.id} value={c.id}>{c.claim_summary.substring(0, 40)}...</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.claims_attach_evidence')}</label>
                <select
                  value={selectedEvId}
                  onChange={(e) => setSelectedEvId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs font-semibold"
                >
                  <option value="">-- None (Blocks publish if high risk) --</option>
                  {evidenceItems.map(ev => (
                    <option key={ev.id} value={ev.id}>{ev.title}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-semibold text-slate-400">{t('semantic_core.claims_attach_boundary')}</label>
                <select
                  value={selectedRuleId}
                  onChange={(e) => setSelectedRuleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 text-xs font-semibold"
                >
                  <option value="">-- None --</option>
                  {boundaryRules.map(rule => (
                    <option key={rule.id} value={rule.id}>{rule.rule_name}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-1">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  {t('semantic_core.claims_map_trace_links')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingLineage(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  {t('semantic_core.btn_cancel')}
                </button>
              </div>
            </form>
          )}

          {!isCreatingClaim && !isCreatingLineage && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                {t('semantic_core.claims_safety_gates')}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {t('semantic_core.claims_safety_gates_desc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
