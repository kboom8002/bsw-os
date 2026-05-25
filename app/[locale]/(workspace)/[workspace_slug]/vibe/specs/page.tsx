"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ShieldCheck, 
  Sparkles, 
  Layers, 
  ArrowRight,
  Shield,
  Activity,
  AlertTriangle,
  Sliders,
  CheckCircle,
  FileText,
  FileCheck,
  Zap,
  Plus
} from "lucide-react";

export default function VibeSpecsDashboard() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Mock list of Vibe specs
  const [specs, setSpecs] = useState([
    {
      id: "vibe-1",
      vibe_name: "Premium Clinical Sophistication",
      slug: "premium-clinical-sophistication",
      target_vector: { clinical: 50, warm: 30, luxury: 20 },
      assignments: [
        { id: "page-1", title: "Active Retinol Booster Serum page", type: "page" },
        { id: "page-2", title: "Clinical Ingredients Index page", type: "page" }
      ],
      vcs: 95.50,
      vpa: 92.20,
      vmri: 12.40
    },
    {
      id: "vibe-2",
      vibe_name: "Warm Wellness Nurture",
      slug: "warm-wellness-nurture",
      target_vector: { clinical: 20, warm: 60, luxury: 20 },
      assignments: [
        { id: "page-3", title: "Daily Moisturizer Treatment page", type: "page" }
      ],
      vcs: 88.00,
      vpa: 85.40,
      vmri: 22.80
    },
    {
      id: "vibe-3",
      vibe_name: "Luxury Holistic Sanctuary",
      slug: "luxury-holistic-sanctuary",
      target_vector: { clinical: 15, warm: 25, luxury: 60 },
      assignments: [
        { id: "page-4", title: "Royal Orchid Absolute Balm page", type: "page" }
      ],
      vcs: 97.20,
      vpa: 96.50,
      vmri: 5.20
    }
  ]);

  // Dark pattern rules
  const forbiddenTriggers = [
    "limited time only",
    "only 2 left",
    "buy now or lose forever",
    "immediate action required",
    "hurry before it is gone",
    "while supplies last"
  ];

  const [scanText, setScanText] = useState("");
  const [scanResults, setScanResults] = useState<{ flagged: boolean, violations: string[] } | null>(null);

  const handleScanText = () => {
    if (!scanText.trim()) {
      setScanResults(null);
      return;
    }
    const textLower = scanText.toLowerCase();
    const violations: string[] = [];

    for (const trigger of forbiddenTriggers) {
      if (textLower.includes(trigger)) {
        violations.push(trigger);
      }
    }

    setScanResults({
      flagged: violations.length > 0,
      violations
    });
  };

  const handleVectorChange = (specId: string, dimension: "clinical" | "warm" | "luxury", value: number) => {
    setSpecs(prev => prev.map(spec => {
      if (spec.id === specId) {
        const otherDims = Object.keys(spec.target_vector).filter(d => d !== dimension) as ("clinical" | "warm" | "luxury")[];
        const remaining = 100 - value;
        const ratio = remaining / (spec.target_vector[otherDims[0]] + spec.target_vector[otherDims[1]]);
        
        const updated = {
          ...spec.target_vector,
          [dimension]: value,
          [otherDims[0]]: Math.round(spec.target_vector[otherDims[0]] * ratio),
          [otherDims[1]]: Math.round(spec.target_vector[otherDims[1]] * ratio)
        };

        // Guarantee exactly 100
        const sum = updated.clinical + updated.warm + updated.luxury;
        if (sum !== 100) {
          updated[otherDims[0]] += (100 - sum);
        }

        return { ...spec, target_vector: updated };
      }
      return spec;
    }));
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-rose-400 font-mono font-bold tracking-wider uppercase mb-1">
            Clinical Warm Luxury Vector SPACE
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Vibe OS Studio
          </h1>
          <p className="text-slate-400 text-sm">
            Map luxury vector space specifications, enforce strictly verified clinical evidence references, and scan pages for dark patterns triggers.
          </p>
        </div>
        <div>
          <button className="px-4 py-2 text-sm font-bold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Define Vibe Profile
          </button>
        </div>
      </div>

      {/* Grid Specs and Knobs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {specs.map(spec => (
          <div 
            key={spec.id} 
            className="p-6 rounded-2xl border border-white/5 bg-slate-950/50 flex flex-col justify-between hover:border-white/10 transition-all duration-200"
          >
            <div>
              {/* Top Details */}
              <div className="flex items-center justify-between mb-4 border-b border-white/5 pb-3">
                <h3 className="font-bold text-lg text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-rose-400" />
                  {spec.vibe_name}
                </h3>
                <span className="text-[10px] text-slate-500 font-mono uppercase bg-white/5 border border-white/5 px-2 py-0.5 rounded">
                  VMRI: <span className="text-rose-400 font-bold">{spec.vmri}%</span>
                </span>
              </div>

              {/* Vector Ratios Knobs Grid */}
              <div className="space-y-4 mb-6">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Target Vector Space ratios:</div>
                
                {/* Clinical Knob */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-cyan-400 font-semibold">🧬 Clinical Precision</span>
                    <span className="text-slate-300 font-bold">{spec.target_vector.clinical}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={spec.target_vector.clinical}
                    onChange={(e) => handleVectorChange(spec.id, "clinical", parseInt(e.target.value))}
                    className="w-full accent-cyan-400 bg-white/10 h-1 rounded-lg outline-none cursor-pointer"
                  />
                </div>

                {/* Warm Knob */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-amber-400 font-semibold">☀️ Warm Empathy</span>
                    <span className="text-slate-300 font-bold">{spec.target_vector.warm}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={spec.target_vector.warm}
                    onChange={(e) => handleVectorChange(spec.id, "warm", parseInt(e.target.value))}
                    className="w-full accent-amber-400 bg-white/10 h-1 rounded-lg outline-none cursor-pointer"
                  />
                </div>

                {/* Luxury Knob */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-purple-400 font-semibold">✨ Luxury Sophistication</span>
                    <span className="text-slate-300 font-bold">{spec.target_vector.luxury}%</span>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={spec.target_vector.luxury}
                    onChange={(e) => handleVectorChange(spec.id, "luxury", parseInt(e.target.value))}
                    className="w-full accent-purple-400 bg-white/10 h-1 rounded-lg outline-none cursor-pointer"
                  />
                </div>
              </div>

              {/* Assignments List */}
              <div className="space-y-2 mb-6">
                <div className="text-[10px] text-slate-500 font-mono uppercase">Assigned Representation Surfaces:</div>
                <div className="space-y-1.5">
                  {spec.assignments.map(a => (
                    <div key={a.id} className="p-2.5 rounded-lg border border-white/5 bg-slate-900/60 flex items-center justify-between">
                      <span className="text-xs text-slate-300 flex items-center gap-2">
                        <FileCheck className="w-3.5 h-3.5 text-slate-500" />
                        {a.title}
                      </span>
                      <span className="text-[8px] font-mono rounded bg-white/5 px-1 py-0.5 uppercase text-slate-500">
                        {a.type}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* View Details Link */}
            <Link
              href={`/${workspaceSlug}/vibe/specs/${spec.id}`}
              className="mt-6 flex items-center justify-between text-xs font-bold text-rose-400 hover:underline"
            >
              <span>VPA/VCS/VMRI performance & Evidence checks</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        ))}
      </div>

      {/* Dark Pattern Scanner Panel */}
      <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 backdrop-blur-sm space-y-6">
        <h3 className="font-bold text-lg text-white flex items-center gap-2">
          <Shield className="w-5 h-5 text-rose-400" />
          Linguistic Dark Pattern Guardrails Scanner
        </h3>
        <p className="text-slate-400 text-xs leading-relaxed">
          Submit composed representation copies or semantic visible sections to verify compliance. Aggressive commercial scarcity words or urgency triggers will block the release gate immediately.
        </p>

        <div className="space-y-4">
          <textarea
            value={scanText}
            onChange={(e) => setScanText(e.target.value)}
            placeholder="Paste semantic page content copy here... (e.g. 'Order now! Limited time only! Only 2 left in stock!')"
            className="w-full h-24 p-3.5 rounded-xl border border-white/10 bg-slate-900/60 text-slate-200 text-xs focus:border-rose-500 outline-none transition-all resize-none font-mono"
          />
          <button 
            onClick={handleScanText}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-all shadow-md shadow-rose-500/10 flex items-center gap-2"
          >
            <Zap className="w-3.5 h-3.5" />
            Run Compliance Scan
          </button>
        </div>

        {scanResults && (
          <div className={`p-4 rounded-xl border transition-all text-xs font-mono flex items-start gap-3 backdrop-blur-sm ${
            scanResults.flagged 
              ? "border-red-500/20 bg-red-950/20 text-red-300"
              : "border-emerald-500/20 bg-emerald-950/20 text-emerald-300"
          }`}>
            {scanResults.flagged ? (
              <>
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-400" />
                <div>
                  <span className="font-bold text-white block mb-1">SCAN FAILURE: Forbidden linguistic dark patterns triggered!</span>
                  <p className="leading-normal">
                    The copy contains these blocked triggers: <span className="font-bold text-red-200">{scanResults.violations.map(v => `"${v}"`).join(", ")}</span>.
                  </p>
                </div>
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block mb-1">SCAN COMPLETED: Flawless Compliance Pass!</span>
                  <p className="leading-normal">
                    No fake urgency or false scarcity patterns were detected. Fully compliant with BSW-OS brand rules.
                  </p>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
