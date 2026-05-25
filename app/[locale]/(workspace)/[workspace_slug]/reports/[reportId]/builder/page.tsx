"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { 
  ArrowLeft,
  ShieldCheck,
  Plus,
  HelpCircle,
  FileText,
  Lock,
  Unlock,
  CheckCircle,
  Activity,
  Layers,
  Database,
  Cpu,
  Save,
  Check
} from "lucide-react";

export default function ReportBuilderWorkspace() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const reportId = (params?.reportId as string) || "rep-1";

  // Mock report sections
  const [sections, setSections] = useState([
    {
      id: "sec-1",
      section_title: "Executive Summary Draft",
      section_body: "AI Draft: Based on proxy crawls, the website shows high answer shares but lacks robust official links.",
      section_type: "executive_summary",
      status: "candidate"
    },
    {
      id: "sec-2",
      section_title: "Competitive Landscape Analysis",
      section_body: "AI Draft: CompetitorA Retinol outperforms on raw answer visibility, but BSW offers higher semantic fidelity.",
      section_type: "competitive_landscape",
      status: "candidate"
    }
  ]);

  const [notification, setNotification] = useState<string | null>(null);
  const [newTitle, setNewTitle] = useState("");
  const [newBody, setNewBody] = useState("");
  const [newType, setNewType] = useState("metrics_analysis");

  const handleSaveSection = (id: string, updatedBody: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === id) {
        return { ...sec, section_body: updatedBody, status: "draft" }; // Promote from candidate to draft on save
      }
      return sec;
    }));
    
    setNotification("💾 Report section saved successfully as active draft!");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleApproveSection = (id: string) => {
    setSections(prev => prev.map(sec => {
      if (sec.id === id) {
        return { ...sec, status: "completed" };
      }
      return sec;
    }));
    
    setNotification("✅ Section approved and locked! Ready for public export compilation.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleAddSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newBody) return;

    const newSec = {
      id: `sec-${Date.now()}`,
      section_title: newTitle,
      section_body: newBody,
      section_type: newType,
      status: "draft"
    };

    setSections(prev => [...prev, newSec]);
    setNewTitle("");
    setNewBody("");
    setNotification("🧬 Success: New report section appended.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleTriggerDraftAgent = () => {
    setNotification("🤖 AI Report Drafting Agent is synthesizing insights...");
    setTimeout(() => {
      const extraSec = {
        id: `sec-ai-${Date.now()}`,
        section_title: "AI Generated Squalane Efficacy Analysis",
        section_body: "AI Draft: In Vivo trials and squalane purity analysis certificates link BSW semantic ingredients pages with 99.8% confidence. AI Answer shares reflect strong trust coverage.",
        section_type: "metrics_analysis",
        status: "candidate" // candidate by default!
      };
      setSections(prev => [...prev, extraSec]);
      setNotification("✨ AI Drafting complete! Appended 'AI Generated Squalane Efficacy Analysis' as candidate section.");
    }, 1500);
  };

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
            interactive copy editor
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <FileText className="w-8 h-8 text-indigo-400" />
            Report Builder Workspace
          </h1>
          <p className="text-slate-400 text-sm">
            Edit summary text, compose analytical blocks, and trigger AI drafting agents.
          </p>
        </div>

        {/* AI Drafting button */}
        <div>
          <button
            onClick={handleTriggerDraftAgent}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all flex items-center gap-2"
          >
            <Cpu className="w-4 h-4 text-indigo-400" />
            Trigger AI Drafting Agent
          </button>
        </div>
      </div>

      {/* Notifications Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-indigo-500/20 bg-indigo-950/20 text-indigo-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Report Sections List */}
        <div className="lg:col-span-2 space-y-6">
          <h3 className="font-bold text-lg text-white">Report Sections</h3>
          
          <div className="space-y-6">
            {sections.map(sec => (
              <div key={sec.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
                
                {/* Meta details */}
                <div className="flex items-center justify-between border-b border-white/5 pb-3">
                  <h4 className="font-bold text-base text-white">{sec.section_title}</h4>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[8px] font-mono rounded bg-white/5 text-slate-500 uppercase">
                      {sec.section_type}
                    </span>
                    <span className={`px-2 py-0.5 text-[8px] font-mono font-bold rounded uppercase ${
                      sec.status === "candidate" 
                        ? "bg-amber-500/10 border border-amber-500/20 text-amber-400"
                        : sec.status === "completed"
                        ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                        : "bg-indigo-500/10 border border-indigo-500/20 text-indigo-400"
                    }`}>
                      {sec.status}
                    </span>
                  </div>
                </div>

                {/* Editable textarea body */}
                <div>
                  <textarea
                    defaultValue={sec.section_body}
                    onBlur={(e) => handleSaveSection(sec.id, e.target.value)}
                    className="w-full h-32 p-3.5 rounded-xl border border-white/5 bg-slate-900/60 text-slate-300 text-xs focus:border-indigo-500 outline-none transition-all resize-none font-sans"
                  />
                  <span className="text-[9px] text-slate-500 font-mono mt-1 block">
                    * Editing automatically promotes candidate drafts to Draft status. Blur field to save.
                  </span>
                </div>

                {/* Section Controls */}
                {sec.status !== "completed" && (
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handleApproveSection(sec.id)}
                      className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-indigo-500 hover:bg-indigo-600 text-white transition-all flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      Approve & Lock Section
                    </button>
                  </div>
                )}

              </div>
            ))}
          </div>
        </div>

        {/* Right Column: Append Section form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-indigo-400" />
              Append Custom Section
            </h3>
            
            <form onSubmit={handleAddSection} className="space-y-4 text-xs">
              
              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Section Title</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Squalane Efficacy Audit"
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Section Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value)}
                  className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 font-mono"
                >
                  <option value="executive_summary">Executive Summary</option>
                  <option value="metrics_analysis">Metrics Analysis</option>
                  <option value="competitive_landscape">Competitive Landscape</option>
                  <option value="methodology_appendix">Methodology Appendix</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] text-slate-500 font-mono uppercase">Section Content Copy</label>
                <textarea
                  required
                  value={newBody}
                  onChange={(e) => setNewBody(e.target.value)}
                  placeholder="Describe your semantic analysis or observed data..."
                  className="w-full h-32 p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-indigo-500 resize-none font-sans"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all font-mono"
              >
                Append Section
              </button>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
