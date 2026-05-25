"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createBoundaryRule } from "@/app/actions/truth";
import { 
  ArrowLeft, 
  Plus, 
  Save, 
  ShieldAlert, 
  CheckCircle,
  HelpCircle,
  EyeOff
} from "lucide-react";

interface BoundaryItem {
  id: string;
  rule_name: string;
  forbidden_terms: string[];
  required_disclosures: string[];
  risk_level: "low" | "medium" | "high" | "critical";
  is_active: boolean;
}

export default function BoundariesPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [rules, setRules] = useState<BoundaryItem[]>([
    {
      id: "rule-201",
      rule_name: "FDA Skincare Compliance Guard",
      forbidden_terms: ["cures acne", "permanent wrinkle removal", "heals eczema"],
      required_disclosures: ["Results may vary", "Not intended to diagnose disease"],
      risk_level: "critical",
      is_active: true
    },
    {
      id: "rule-202",
      rule_name: "Convenience Alcohol Sale Guard",
      forbidden_terms: ["unrestricted night sale", "alcohol promo pricing"],
      required_disclosures: ["Must be over 19", "Valid identification required"],
      risk_level: "high",
      is_active: true
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [ruleName, setRuleName] = useState("");
  const [forbiddenText, setForbiddenText] = useState("");
  const [disclosureText, setDisclosureText] = useState("");
  const [riskLevel, setRiskLevel] = useState<"low" | "medium" | "high" | "critical">("medium");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleName.trim()) return;

    setSaving(true);
    try {
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";
      const forbed = forbiddenText.split(",").map(t => t.trim()).filter(Boolean);
      const discls = disclosureText.split(",").map(t => t.trim()).filter(Boolean);

      const newRule = {
        rule_name: ruleName,
        forbidden_terms: forbed,
        required_disclosures: discls,
        risk_level: riskLevel,
        is_active: true
      };

      await createBoundaryRule(mockWorkspaceId, newRule);

      // Append locally for fluid interactive demo
      const newLocalRule: BoundaryItem = {
        id: "rule-" + Math.floor(Math.random() * 1000),
        rule_name: ruleName,
        forbidden_terms: forbed,
        required_disclosures: discls,
        risk_level: riskLevel,
        is_active: true
      };
      setRules([newLocalRule, ...rules]);

      // Reset
      setRuleName("");
      setForbiddenText("");
      setDisclosureText("");
      setRiskLevel("medium");
      setShowAddForm(false);
    } catch (err) {
      alert("Error saving boundary rule: " + (err as Error).message);
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
            <h1 className="text-2xl font-extrabold text-white">Boundary Rules</h1>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Create Boundary Rule
        </button>
      </div>

      {/* Add rule inline form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">New Safety Boundary Specification</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Rule Name</label>
              <input
                type="text"
                value={ruleName}
                onChange={(e) => setRuleName(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="e.g. FDA Cosmetic Boundary..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Rule Risk Level</label>
              <select
                value={riskLevel}
                onChange={(e: any) => setRiskLevel(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="low">Low Risk</option>
                <option value="medium">Medium Risk</option>
                <option value="high">High Risk</option>
                <option value="critical">Critical Risk</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Forbidden Keyword Phrases (comma separated)</label>
              <input
                type="text"
                value={forbiddenText}
                onChange={(e) => setForbiddenText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="e.g. cures eczema, heals scars"
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Required Risk Disclosures (comma separated)</label>
              <input
                type="text"
                value={disclosureText}
                onChange={(e) => setDisclosureText(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="e.g. Results may vary, Must be over 19"
              />
            </div>
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
              {saving ? "Creating..." : "Save Rule"}
            </button>
          </div>
        </form>
      )}

      {/* Rules list grid */}
      <div className="grid grid-cols-1 gap-6">
        {rules.map((rule) => (
          <div key={rule.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 relative overflow-hidden space-y-4">
            <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-cyan-400 to-purple-500" />
            
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-cyan-400" />
                {rule.rule_name}
              </h3>
              <span className={`inline-block px-2.5 py-0.5 rounded-full border text-[10px] uppercase font-mono ${getRiskBadgeColor(rule.risk_level)}`}>
                {rule.risk_level}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
              <div className="p-4 rounded-xl border border-red-500/10 bg-red-950/10 space-y-2">
                <div className="font-semibold text-red-400 flex items-center gap-1">
                  <EyeOff className="w-3.5 h-3.5" /> Forbidden Terms
                </div>
                {rule.forbidden_terms.length === 0 ? (
                  <div className="text-slate-500 font-mono">None configured</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {rule.forbidden_terms.map((term, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-red-950/40 text-red-400 border border-red-900/30">
                        {term}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 rounded-xl border border-green-500/10 bg-green-950/10 space-y-2">
                <div className="font-semibold text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3.5 h-3.5" /> Required Disclosures
                </div>
                {rule.required_disclosures.length === 0 ? (
                  <div className="text-slate-500 font-mono">None configured</div>
                ) : (
                  <div className="flex flex-wrap gap-1.5">
                    {rule.required_disclosures.map((disc, i) => (
                      <span key={i} className="px-2 py-0.5 rounded bg-green-950/40 text-green-400 border border-green-900/30">
                        {disc}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="text-[10px] font-mono text-slate-500 text-right pt-2 border-t border-white/5">
              Rule ID: {rule.id} • Status: Active
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
