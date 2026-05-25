"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  Eye, 
  ArrowRight,
  Shield,
  Activity,
  AlertOctagon,
  FileText,
  UserCheck,
  CheckCircle,
  HelpCircle,
  Plus
} from "lucide-react";

export default function PersonaSpecsDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock list of persona specs
  const [specs, setSpecs] = useState([
    {
      id: "11111111-1111-4111-a111-111111111111",
      persona_name: "Clinical Wellness Advocate",
      slug: "clinical-wellness-advocate",
      version: 4,
      current_mode: "standard",
      allowed_modes: ["standard", "advisory", "crisis"],
      authority_scope: ["clinical", "warm", "scientific"],
      legal_guardrails: [
        "Include FDA clinical trial disclaimer",
        "Block treatment prescription statements"
      ],
      pmri: 15,
      prompt_text: "You are an authoritative clinical research agent communicating with scientific empathy..."
    },
    {
      id: "22222222-2222-4222-b222-222222222222",
      persona_name: "Warm Advisory Companion",
      slug: "warm-advisory-companion",
      version: 2,
      current_mode: "advisory",
      allowed_modes: ["standard", "advisory"],
      authority_scope: ["warm", "empathy"],
      legal_guardrails: [
        "Do not offer clinical diagnostic feedback",
        "Refer severe cases to Clinical Wellness spec"
      ],
      pmri: 35,
      prompt_text: "You are a warm, luxury-oriented brand voice focusing on customer wellness journeys..."
    },
    {
      id: "33333333-3333-4333-c333-333333333333",
      persona_name: "Severe Crisis Companion",
      slug: "severe-crisis-companion",
      version: 3,
      current_mode: "crisis",
      allowed_modes: ["standard", "crisis"],
      authority_scope: ["warm", "clinical", "safety"],
      legal_guardrails: [
        "Strictly suppress commercial CTA words (buy, sale, discount)",
        "Mandatory immediate medical practitioner referral links"
      ],
      pmri: 75,
      prompt_text: "You are a crisis responder. Strictly suppress all marketing metrics and focus on user safety..."
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);

  const handleModeChange = (specId: string, newMode: string) => {
    setSpecs(prev => prev.map(spec => {
      if (spec.id === specId) {
        if (!spec.allowed_modes.includes(newMode)) {
          setNotification(`Error: Mode "${newMode}" is not allowed for this spec.`);
          setTimeout(() => setNotification(null), 3000);
          return spec;
        }

        let updatedPmri = spec.pmri;
        if (newMode === "crisis") updatedPmri = 75;
        else if (newMode === "advisory") updatedPmri = 35;
        else updatedPmri = 15;

        // If crisis mode active, commercial CTA suppression alert
        if (newMode === "crisis") {
          setNotification(`⚠️ CRISIS Mode Activated for "${spec.persona_name}"! Commercial CTA triggers (buy, discount, sale) are now strictly suppressed.`);
          setTimeout(() => setNotification(null), 5000);
        } else {
          setNotification(`Successfully switched "${spec.persona_name}" to ${newMode.toUpperCase()} mode.`);
          setTimeout(() => setNotification(null), 3000);
        }

        return { ...spec, current_mode: newMode, pmri: updatedPmri };
      }
      return spec;
    }));
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            Governance & Safety
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            PersonaSpec Studio
          </h1>
          <p className="text-slate-400 text-sm">
            Govern versioned AI brand runtimes. Set strict authority bounds, design legal guardrails, and audit P-MRI safety risk indices.
          </p>
        </div>
        <div>
          <button className="px-4 py-2 text-sm font-bold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Synthesize New Spec
          </button>
        </div>
      </div>

      {/* Notifications Alert Panel */}
      {notification && (
        <div className={`p-4 rounded-xl border transition-all text-xs font-mono flex items-start gap-3 backdrop-blur-sm ${
          notification.includes("⚠️") 
            ? "border-amber-500/20 bg-amber-950/20 text-amber-300"
            : "border-emerald-500/20 bg-emerald-950/20 text-emerald-300"
        }`}>
          <AlertOctagon className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      {/* Spec Checklist Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {specs.map(spec => (
          <div 
            key={spec.id} 
            className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-white/10 transition-all hover:translate-y-[-2px] duration-200"
          >
            <div>
              {/* Top Meta */}
              <div className="flex items-center justify-between mb-4">
                <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-white/5 border border-white/5 text-slate-400">
                  Version v{spec.version}
                </span>
                <span className={`px-2.5 py-0.5 text-[10px] font-mono font-bold rounded-full uppercase tracking-wider ${
                  spec.current_mode === "crisis" 
                    ? "bg-red-500/10 border border-red-500/20 text-red-400"
                    : spec.current_mode === "advisory"
                    ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                    : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                }`}>
                  {spec.current_mode}
                </span>
              </div>

              {/* Title & PMRI */}
              <div className="mb-4">
                <h3 className="font-bold text-lg text-white mb-1 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-indigo-400" />
                  {spec.persona_name}
                </h3>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-[10px] text-slate-500 font-mono uppercase">P-MRI Index:</span>
                  <div className="w-24 bg-white/5 rounded-full h-1.5 overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${
                        spec.pmri > 60 
                          ? "bg-red-500" 
                          : spec.pmri > 30 
                          ? "bg-amber-500" 
                          : "bg-emerald-500"
                      }`}
                      style={{ width: `${spec.pmri}%` }}
                    />
                  </div>
                  <span className={`text-[10px] font-mono font-bold ${
                    spec.pmri > 60 
                      ? "text-red-400" 
                      : spec.pmri > 30 
                      ? "text-amber-400" 
                      : "text-emerald-400"
                  }`}>
                    {spec.pmri}%
                  </span>
                </div>
              </div>

              {/* Persona Authority Scope */}
              <div className="mb-4 space-y-1.5">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Authority Scope:</div>
                <div className="flex flex-wrap gap-1.5">
                  {spec.authority_scope.map(scope => (
                    <span key={scope} className="px-2 py-0.5 text-[10px] font-mono rounded-md bg-indigo-500/5 border border-indigo-500/10 text-indigo-300">
                      {scope}
                    </span>
                  ))}
                </div>
              </div>

              {/* Legal Guardrails */}
              <div className="mb-5 space-y-1.5">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Legal Guardrails:</div>
                <ul className="text-slate-400 text-xs space-y-1 pl-4 list-disc leading-relaxed">
                  {spec.legal_guardrails.map((g, idx) => (
                    <li key={idx}>{g}</li>
                  ))}
                </ul>
              </div>

              {/* Interactive Mode Control Panel */}
              <div className="mt-4 pt-4 border-t border-white/5 space-y-2">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Switch Runtime Mode:</div>
                <div className="grid grid-cols-3 gap-1">
                  {["standard", "advisory", "crisis"].map(mode => {
                    const isAllowed = spec.allowed_modes.includes(mode);
                    const isActive = spec.current_mode === mode;
                    return (
                      <button
                        key={mode}
                        onClick={() => handleModeChange(spec.id, mode)}
                        disabled={!isAllowed}
                        className={`py-1 text-[10px] font-bold rounded-lg border transition-all uppercase tracking-wider ${
                          isActive
                            ? mode === "crisis"
                              ? "bg-red-500/20 border-red-500 text-red-400"
                              : mode === "advisory"
                              ? "bg-amber-500/20 border-amber-500 text-amber-400"
                              : "bg-emerald-500/20 border-emerald-500 text-emerald-400"
                            : isAllowed
                            ? "bg-white/5 border-white/5 text-slate-300 hover:bg-white/10"
                            : "bg-transparent border-transparent text-slate-700 cursor-not-allowed"
                        }`}
                      >
                        {mode}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* View Details Link */}
            <Link
              href={`/${workspaceSlug}/persona/specs/${spec.id}`}
              className="mt-6 flex items-center justify-between text-xs font-bold text-indigo-400 hover:underline"
            >
              <span>Audit logs & detailed config</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Safety Bottom Box */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-4">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-indigo-400" />
          BSW-OS Persona Spec Governance Architecture
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          Unlike ordinary AI systems that inject unstructured prompts, BSW-OS utilizes version-controlled PersonaSpecs.
          Every spec implements a programmatic constraint layer. If an agent attempts to publish details about treating clinical conditions without holds, BSW's **Authority Overreach Checker** immediately quarantines the thread.
        </p>
      </div>
    </div>
  );
}
