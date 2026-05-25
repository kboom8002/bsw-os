"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { upsertOperationalTruth } from "@/app/actions/truth";
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  Layers, 
  ShieldAlert, 
  FileText, 
  FileCheck,
  CheckCircle,
  HelpCircle
} from "lucide-react";

interface ClaimItem {
  id: string;
  claim: string;
  description: string;
  risk_level: "low" | "medium" | "high" | "critical";
  confidence_score: number;
  review_status: "draft" | "in_review" | "approved" | "rejected";
  evidenceCount: number;
}

export default function OperationalClaimsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Pre-seed mock operational claims list
  const [claims, setClaims] = useState<ClaimItem[]>([
    { 
      id: "claim-101", 
      claim: "Active skincare contains 10% pure clinical Niacinamide.", 
      description: "Validated for cell renewal active ingredients.", 
      risk_level: "critical", 
      confidence_score: 98.4, 
      review_status: "approved",
      evidenceCount: 1
    },
    { 
      id: "claim-102", 
      claim: "Reduces skin barrier inflammation in under 7 days.", 
      description: "Tested on 45 clinical test volunteers.", 
      risk_level: "high", 
      confidence_score: 87.5, 
      review_status: "approved",
      evidenceCount: 1
    },
    { 
      id: "claim-103", 
      claim: "Self-checkout is active 24/7 across city store branches.", 
      description: "Convenience store action parameters.", 
      risk_level: "low", 
      confidence_score: 95.0, 
      review_status: "draft",
      evidenceCount: 0
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [claimText, setClaimText] = useState("");
  const [description, setDescription] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim()) return;

    setSaving(true);
    try {
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";
      const newClaimData = {
        claim: claimText,
        description,
        risk_level: riskLevel,
        confidence_score: 80.0,
        review_status: "draft"
      };

      // Call server action
      await upsertOperationalTruth(mockWorkspaceId, newClaimData);

      // Append locally for fluid interactive demo
      const newLocalClaim: ClaimItem = {
        id: "claim-" + Math.floor(Math.random() * 1000),
        claim: claimText,
        description,
        risk_level: riskLevel,
        confidence_score: 80.0,
        review_status: "draft",
        evidenceCount: 0
      };
      setClaims([newLocalClaim, ...claims]);

      // Reset form
      setClaimText("");
      setDescription("");
      setRiskLevel("medium");
      setShowAddForm(false);
    } catch (err) {
      alert("Error creating claim: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const getRiskBadgeColor = (risk: string) => {
    switch (risk) {
      case "critical": return "border-red-500/30 text-red-400 bg-red-950/40 font-bold";
      case "high": return "border-orange-500/30 text-orange-400 bg-orange-950/40";
      case "medium": return "border-blue-500/30 text-blue-400 bg-blue-950/40";
      default: return "border-slate-500/30 text-slate-400 bg-slate-950/40";
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Breadcrumbs Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${workspaceSlug}/truth`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
            <h1 className="text-2xl font-extrabold text-white">Operational Claims</h1>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Factual Claim
        </button>
      </div>

      {/* Inline Form to add claim */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">New Operational Claim Specification</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Core Claim Statement</label>
              <input
                type="text"
                value={claimText}
                onChange={(e) => setClaimText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="e.g. 10% clinical Niacinamide compound..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Risk Severity Level</label>
              <select
                value={riskLevel}
                onChange={(e: any) => setRiskLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk (Strict verification gate)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">Claim Description / Trace Details</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              placeholder="Add lab parameters or vision boundaries..."
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 transition-all text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-all text-xs flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {saving ? "Creating..." : "Save Claim"}
            </button>
          </div>
        </form>
      )}

      {/* Claims List Table Grid */}
      <div className="border border-white/5 rounded-2xl overflow-hidden bg-slate-950/20">
        <table className="w-full text-left text-sm border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-slate-950/40 font-mono text-xs text-slate-400">
              <th className="p-4">Operational Claim</th>
              <th className="p-4">Risk Level</th>
              <th className="p-4">Confidence</th>
              <th className="p-4">Evidence Status</th>
              <th className="p-4 text-right">Gate Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {claims.map((item) => (
              <tr key={item.id} className="hover:bg-white/[0.02] transition-colors">
                <td className="p-4">
                  <div className="font-bold text-slate-200">{item.claim}</div>
                  {item.description && (
                    <div className="text-xs text-slate-500 mt-1">{item.description}</div>
                  )}
                </td>
                <td className="p-4">
                  <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-mono ${getRiskBadgeColor(item.risk_level)}`}>
                    {item.risk_level}
                  </span>
                </td>
                <td className="p-4 font-mono text-xs text-slate-300">
                  {item.confidence_score}%
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2 text-xs">
                    {item.evidenceCount > 0 ? (
                      <span className="text-green-400 flex items-center gap-1">
                        <FileCheck className="w-3.5 h-3.5" /> {item.evidenceCount} Linked File
                      </span>
                    ) : (
                      <span className="text-slate-500 flex items-center gap-1 font-mono">
                        <FileText className="w-3.5 h-3.5" /> None
                      </span>
                    )}
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="inline-flex items-center gap-1.5 text-xs">
                    {item.risk_level === "critical" || item.risk_level === "high" ? (
                      item.evidenceCount > 0 ? (
                        <span className="text-green-400 flex items-center gap-1 font-semibold">
                          <CheckCircle className="w-4 h-4" /> Locked & Ready
                        </span>
                      ) : (
                        <span className="text-red-400 flex items-center gap-1 font-semibold">
                          <ShieldAlert className="w-4 h-4" /> Blocked (No Evidence)
                        </span>
                      )
                    ) : (
                      <span className="text-slate-400 flex items-center gap-1 font-mono">
                        <CheckCircle className="w-4 h-4 text-slate-600" /> Low Risk
                      </span>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
