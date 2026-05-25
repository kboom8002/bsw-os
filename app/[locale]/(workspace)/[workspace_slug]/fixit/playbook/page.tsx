"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  BookOpen,
  Plus,
  CheckCircle,
  Database,
  Trash2
} from "lucide-react";

export default function PlaybookRules() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock initial playbook trigger rules
  const [rules, setRules] = useState([
    {
      id: "rule-1",
      rule_name: "ARS Readiness Fallback Trigger",
      trigger_metric: "ARS",
      threshold_operator: "<",
      threshold_value: 60.00,
      recommended_action: "Examine surface contracts for unlinked clinical credentials or certificates."
    },
    {
      id: "rule-2",
      rule_name: "OCR Citation Volatility Guard",
      trigger_metric: "OCR",
      threshold_operator: "<",
      threshold_value: 40.00,
      recommended_action: "Inject in vivo certifications and correct official outbound canonical links."
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [metric, setMetric] = useState("ARS");
  const [op, setOp] = useState("<");
  const [val, setVal] = useState(70.00);
  const [action, setAction] = useState("");

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !action) return;

    const newRule = {
      id: `rule-${Date.now()}`,
      rule_name: name,
      trigger_metric: metric,
      threshold_operator: op,
      threshold_value: Number(val),
      recommended_action: action
    };

    setRules(prev => [...prev, newRule]);
    setName("");
    setAction("");
    setNotification("✨ Success: Fix-It playbook trigger rule registered successfully!");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/fixit`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO FIX-IT CENTRAL
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            Governed Remediation maps
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <BookOpen className="w-8 h-8 text-indigo-400" />
            Remediation Playbook Rules
          </h1>
          <p className="text-slate-400 text-sm">
            Persist automatic metric thresholds triggering Root Cause Analysis proposals and AI Agent Remediation tasks.
          </p>
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Rules list */}
        <div className="lg:col-span-2 space-y-4">
          <h3 className="font-bold text-lg text-white">Active Playbook Triggers</h3>

          <div className="space-y-4">
            {rules.map(rule => (
              <div key={rule.id} className="p-5 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4 text-xs font-mono text-slate-300">
                
                <div className="flex items-center justify-between border-b border-white/5 pb-2">
                  <span className="font-sans font-bold text-white text-sm">{rule.rule_name}</span>
                  <span className="px-2 py-0.5 rounded text-[8px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                    {rule.trigger_metric} {rule.threshold_operator} {rule.threshold_value}%
                  </span>
                </div>

                <div className="space-y-1 font-sans text-xs">
                  <span className="text-[10px] text-slate-500 uppercase font-mono block">Recommended Remediation Action:</span>
                  <p className="text-slate-300 leading-relaxed font-sans">{rule.recommended_action}</p>
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Rule Append Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-indigo-400" />
              Append Trigger Rule
            </h3>

            <form onSubmit={handleCreateRule} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Rule Registry Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Squalane Efficacy Volatility Trigger"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Metric</label>
                  <select
                    value={metric}
                    onChange={(e) => setMetric(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="ARS">ARS</option>
                    <option value="OCR">OCR</option>
                    <option value="AAS">AAS</option>
                    <option value="BSF">BSF</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Operator</label>
                  <select
                    value={op}
                    onChange={(e) => setOp(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                  >
                    <option value="<">&lt;</option>
                    <option value="<=">&lt;=</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Threshold Value (%)</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  value={val}
                  onChange={(e) => setVal(Number(e.target.value))}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Recommended Remedy Instructions</label>
                <textarea
                  required
                  value={action}
                  onChange={(e) => setAction(e.target.value)}
                  placeholder="Define step-by-step remediation plans..."
                  className="w-full h-24 p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all font-mono"
              >
                Register Rule
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
