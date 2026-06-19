"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { 
  createClaimNode, 
  createLineageRecord, 
  evaluateLineageCompleteness 
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
  ShieldAlert
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
  is_verified: boolean;
}

interface BoundaryRule {
  id: string;
  rule_name: string;
  is_active: boolean;
}

export default function ClaimLineagePage() {
  const params = useParams();
  const { t } = useTranslation();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";

  // Simulated DB Tables
  const [operationalTruths] = useState<OperationalTruth[]>([
    { id: "oper-1", claim: "Niacinamide at 5% reduces skin inflammation barriers", risk_level: "high" },
    { id: "oper-2", claim: "Sandwich ingredients are prepared inside zero-waste boundaries", risk_level: "low" },
    { id: "oper-3", claim: "Active probiotics stabilize sensitive micro-dermal flora", risk_level: "critical" }
  ]);

  const [evidenceItems] = useState<EvidenceItem[]>([
    { id: "ev-1", title: "Dermatological Safety Review 2025 PDF", is_verified: true },
    { id: "ev-2", title: "Internal Kitchen Waste Log Excel", is_verified: false },
    { id: "ev-3", title: "Clinical Probiotics Trial 2026", is_verified: true }
  ]);

  const [boundaryRules] = useState<BoundaryRule[]>([
    { id: "rule-1", rule_name: "Redness Claims Disclosure Safety", is_active: true },
    { id: "rule-2", rule_name: "Probiotics Clinical Warning Banner", is_active: false }
  ]);

  const [claims, setClaims] = useState<ClaimItem[]>([
    {
      id: "claim-1",
      claim_summary: "Clinical Niacinamide accelerates stratum corneum barrier repair in under 7 days",
      operational_truth_id: "oper-1",
      risk_level: "high",
      evidence_title: "Dermatological Safety Review 2025 PDF",
      is_verified: true,
      boundary_rule_name: "Redness Claims Disclosure Safety",
      is_publishable: false,
      verification_signature: null
    },
    {
      id: "claim-2",
      claim_summary: "Eco sandwich sandwich wrap is composted fully in retail locations",
      operational_truth_id: "oper-2",
      risk_level: "low",
      evidence_title: "Internal Kitchen Waste Log Excel",
      is_verified: false,
      boundary_rule_name: undefined,
      is_publishable: false,
      verification_signature: null
    }
  ]);

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

  const resetForm = () => {
    setClaimSummary("");
    setSelectedOperId("");
    setSelectedClaimId("");
    setSelectedEvId("");
    setSelectedRuleId("");
    setFeedback(null);
    setEvalResult(null);
  };

  const handleCreateClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimSummary.trim() || !selectedOperId) return;

    try {
      const result = await createClaimNode(mockWorkspaceId, {
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
      setFeedback({ type: "success", message: `Factual Claim Node successfully declared in Vault.` });
      setIsCreatingClaim(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const handleCreateLineage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClaimId) return;

    try {
      const data = {
        claim_node_id: selectedClaimId,
        evidence_item_id: selectedEvId || null,
        boundary_rule_id: selectedRuleId || null,
        is_publishable: false,
        verification_signature: null
      };

      await createLineageRecord(mockWorkspaceId, data);
      
      const ev = evidenceItems.find(x => x.id === selectedEvId);
      const rule = boundaryRules.find(x => x.id === selectedRuleId);

      setClaims(prev => prev.map(c => c.id === selectedClaimId ? {
        ...c,
        evidence_title: ev?.title,
        is_verified: ev?.is_verified,
        boundary_rule_name: rule?.rule_name
      } : c));

      setFeedback({ type: "success", message: `Lineage Trace links mapped! Ready to evaluate.` });
      setIsCreatingLineage(false);
      resetForm();
    } catch (err) {
      setFeedback({ type: "error", message: `Failure: ${(err as Error).message}` });
    }
  };

  const triggerVerification = async (claimId: string) => {
    setFeedback(null);
    setEvalResult(null);

    try {
      // Trigger the secure cryptographic server action
      const result = await evaluateLineageCompleteness(mockWorkspaceId, claimId);
      
      setClaims(prev => prev.map(c => c.id === claimId ? {
        ...c,
        is_publishable: result.isPublishable,
        verification_signature: result.verificationSignature
      } : c));

      if (result.isPublishable) {
        setFeedback({ 
          type: "success", 
          message: `CRITICAL PASS: Cryptographic seal successfully signed!` 
        });
        setEvalResult({ blockers: [], signature: result.verificationSignature });
      } else {
        setFeedback({ 
          type: "error", 
          message: "LINEAGE BLOCK: Safety validation constraints failed." 
        });
        setEvalResult({ blockers: result.blockers, signature: null });
      }
    } catch (err) {
      setFeedback({ type: "error", message: `Evaluation Error: ${(err as Error).message}` });
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
