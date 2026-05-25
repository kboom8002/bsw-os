"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  CheckCircle,
  AlertTriangle,
  Database,
  FileText,
  Save,
  Link2,
  AlertOctagon,
  Info,
  Check
} from "lucide-react";

export default function MethodologySpecWorkspace() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const reportId = (params?.reportId as string) || "rep-1";

  // Mock disclosures database
  const disclosures = [
    {
      id: "md-1",
      title: "Standard SEO/AEO Panel Disclosure v1",
      description: "Applies 10,000 panel-based web crawler proxies across Google Search and OpenAI SearchGPT. Measures raw citation rates and answer sharing patterns without tracking personally identifiable user search history.",
      proxy_caveat: "BSW-OS Standard Caveat: Report scores are based on observed panel-based proxies and do not represent internal, proprietary LLM weighting systems."
    },
    {
      id: "md-2",
      title: "Enterprise Deep-Observation Audit Spec v2",
      description: "Leverages a distributed cohort of 50,000 multi-region residential proxy nodes. Simulates complex multi-hop transactional shopping queries across AI search assistants.",
      proxy_caveat: "BSW-OS Enterprise Caveat: Observations are compiled from simulated cohort queries via panel-based proxies; results are statistical approximations."
    }
  ];

  // State
  const [selectedDisclosureId, setSelectedDisclosureId] = useState<string | null>(
    reportId === "rep-2" ? null : "md-1"
  );
  
  const [hasCaveat, setHasCaveat] = useState(
    reportId === "rep-2" ? false : true
  );

  const [notification, setNotification] = useState<string | null>(null);

  const handleLinkDisclosure = (disclosureId: string) => {
    setSelectedDisclosureId(disclosureId);
    setNotification("🔗 Methodology appendix successfully connected to report model!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleUnlinkDisclosure = () => {
    setSelectedDisclosureId(null);
    setNotification("⚠️ Methodology disclosure unlinked. Export gate will block publishing.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleInjectCaveat = () => {
    setHasCaveat(true);
    setNotification("✨ Standard proxy caveat disclaimer injected into methodology section copy!");
    setTimeout(() => setNotification(null), 3000);
  };

  const activeDisclosure = disclosures.find(d => d.id === selectedDisclosureId);

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/reports/${reportId}`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-indigo-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO PORTAL
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-indigo-400 font-mono font-bold tracking-wider uppercase mb-1">
            Governed Disclosure Settings
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Database className="w-8 h-8 text-indigo-400" />
            Methodology Appendix Spec
          </h1>
          <p className="text-slate-400 text-sm">
            Configure audited methodology disclosures and verify proxy caveat disclaimers.
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

      {/* Core Panels Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Active Methodology spec details */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <h3 className="font-bold text-lg text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                Linked Methodology Disclosure
              </h3>
              {activeDisclosure ? (
                <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 uppercase">
                  CONNECTED
                </span>
              ) : (
                <span className="px-2.5 py-0.5 text-[9px] font-mono font-bold rounded bg-amber-500/10 border border-amber-500/20 text-amber-400 uppercase">
                  UNLINKED
                </span>
              )}
            </div>

            {activeDisclosure ? (
              <div className="space-y-6 text-xs">
                <div>
                  <h4 className="text-slate-400 font-mono text-[10px] uppercase mb-1">Disclosure Title</h4>
                  <div className="text-sm font-bold text-white">{activeDisclosure.title}</div>
                </div>

                <div>
                  <h4 className="text-slate-400 font-mono text-[10px] uppercase mb-1">Description Overview</h4>
                  <p className="text-slate-300 leading-relaxed font-sans">{activeDisclosure.description}</p>
                </div>

                <div className="p-4 rounded-xl border border-indigo-500/15 bg-indigo-950/5 text-slate-300 font-mono leading-relaxed space-y-2">
                  <div className="text-[9px] text-indigo-400 font-bold uppercase flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5" />
                    Standard Proxy Caveat Disclaimer Text
                  </div>
                  <div className="text-xs text-slate-300 italic">
                    "{activeDisclosure.proxy_caveat}"
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    onClick={handleUnlinkDisclosure}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg border border-red-500/30 hover:bg-red-500/10 text-red-400 transition-all font-mono"
                  >
                    Unlink Appendix Disclosure
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center space-y-3">
                <AlertOctagon className="w-12 h-12 text-amber-400 mx-auto" />
                <div className="text-sm font-bold text-white">No Methodology Appendix Linked!</div>
                <p className="text-xs text-slate-400 max-w-sm mx-auto">
                  Benchmark reports cannot clear the publication gate without linking an audited methodology. Select an option from the sidebar to resolve this blocker.
                </p>
              </div>
            )}
          </div>

          {/* Proxy Caveat Verification card */}
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-6">
            <h3 className="font-bold text-base text-white flex items-center gap-2 border-b border-white/5 pb-4">
              <ShieldCheck className="w-5 h-5 text-indigo-400" />
              Content Proxy Caveat Audit
            </h3>

            {hasCaveat ? (
              <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-950/20 text-emerald-300 text-xs font-mono flex items-start gap-3">
                <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-400" />
                <div>
                  <span className="font-bold text-white block mb-0.5">CAVEAT VERIFIED: PASS</span>
                  <p className="leading-normal">
                    The required observed panel-based proxy caveats are present in the report copy. This satisfies the AI safety disclaimer guidelines.
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-950/20 text-amber-300 text-xs font-mono flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-bold text-white block mb-1">CAVEAT MISSING: BLOCKED</span>
                    <p className="leading-normal">
                      The report body fails content-based proxy caveat validation. Reports must contain standard notices explaining that scores are statistical approximations derived from web panel observations.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleInjectCaveat}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white transition-all flex items-center gap-1.5 font-mono"
                  >
                    <Link2 className="w-4 h-4" />
                    Inject Disclaimer Caveat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Linking Panel */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white">Available Appendices</h3>
            <p className="text-xs text-slate-400">
              Select and link a vetted methodology disclosure from the registry:
            </p>

            <div className="space-y-3 pt-2">
              {disclosures.map(disc => {
                const isSelected = selectedDisclosureId === disc.id;
                return (
                  <div 
                    key={disc.id} 
                    className={`p-4 rounded-xl border transition-all text-xs space-y-2 cursor-pointer ${
                      isSelected 
                        ? "border-indigo-500/50 bg-indigo-950/20 text-white" 
                        : "border-white/5 bg-slate-900/40 text-slate-400 hover:bg-slate-900/80"
                    }`}
                    onClick={() => handleLinkDisclosure(disc.id)}
                  >
                    <div className="flex justify-between items-center font-bold">
                      <span>{disc.title}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-400" />}
                    </div>
                    <p className="text-[11px] leading-relaxed text-slate-400">
                      {disc.description.substring(0, 100)}...
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
