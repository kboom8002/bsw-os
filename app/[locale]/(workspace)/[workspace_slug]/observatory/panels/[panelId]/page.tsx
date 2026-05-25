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
  Database
} from "lucide-react";

export default function ProbePanelDetailView() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const panelId = (params?.panelId as string) || "panel-v1";

  // Mock details for the panel
  const [panel, setPanel] = useState({
    id: panelId,
    panel_name: "K-Beauty Hydration AI Panel",
    slug: "kbeauty-hydration-ai",
    version: 1,
    is_locked: false,
    description: "Panel measuring hydration, retinol formulation efficacy, and organic K-Beauty skin care keywords in AI answer feeds."
  });

  // Mock list of probe questions
  const [questions, setQuestions] = useState([
    {
      id: "q-1",
      question_text: "What is the clinical squalane concentration in BSW serum?",
      intent_context: "informational",
      target_keyword: "squalane concentration"
    },
    {
      id: "q-2",
      question_text: "Which K-Beauty brand offers the best retinol efficacy?",
      intent_context: "commercial",
      target_keyword: "retinol efficacy"
    },
    {
      id: "q-3",
      question_text: "Is squalane safe for severely sensitive skin?",
      intent_context: "informational",
      target_keyword: "squalane safety"
    }
  ]);

  const [newQuestionText, setNewQuestionText] = useState("");
  const [newIntent, setNewIntent] = useState("informational");
  const [newKeyword, setNewKeyword] = useState("");
  const [notification, setNotification] = useState<string | null>(null);

  const handleAddQuestion = (e: React.FormEvent) => {
    e.preventDefault();
    if (panel.is_locked) {
      setNotification("❌ Blocked: Cannot add questions to a locked version.");
      setTimeout(() => setNotification(null), 3000);
      return;
    }

    const newQ = {
      id: `q-${Date.now()}`,
      question_text: newQuestionText,
      intent_context: newIntent,
      target_keyword: newKeyword || "BSW serum"
    };

    setQuestions(prev => [...prev, newQ]);
    setNewQuestionText("");
    setNewKeyword("");
    setNotification("🧬 Success: New probe question successfully appended to Draft panel.");
    setTimeout(() => setNotification(null), 3000);
  };

  const handleLockPanel = () => {
    setPanel(prev => ({ ...prev, is_locked: true }));
    setNotification("🔒 Panel version frozen and locked. Version is ready for Observation Runs.");
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-6xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Back Link */}
      <div>
        <Link
          href={`/${workspaceSlug}/observatory/panels`}
          className="inline-flex items-center gap-2 text-xs font-mono text-slate-500 hover:text-cyan-400 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          BACK TO OBSERVATORY PANELS
        </Link>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 text-[10px] font-mono rounded bg-cyan-500/10 border border-cyan-500/20 text-cyan-300">
              v{panel.version}
            </span>
            <span className="text-xs text-slate-500 font-mono">
              ID: {panel.id.substring(0, 8)}...
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2 flex items-center gap-3">
            <Layers className="w-8 h-8 text-cyan-400" />
            {panel.panel_name}
          </h1>
          <p className="text-slate-400 text-sm">
            Auditing panel questions and version lock specifications.
          </p>
        </div>

        {/* Lock controls */}
        <div className="flex items-center gap-2">
          {panel.is_locked ? (
            <div className="px-4 py-2 text-xs font-bold rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Locked / Frozen
            </div>
          ) : (
            <button
              onClick={handleLockPanel}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 shadow-md shadow-cyan-400/10 transition-all flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              Lock Spec Version
            </button>
          )}
        </div>
      </div>

      {/* Notification Banner */}
      {notification && (
        <div className="p-4 rounded-xl border border-cyan-500/20 bg-cyan-950/20 text-cyan-300 text-xs font-mono flex items-start gap-3 backdrop-blur-sm">
          <CheckCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <span>{notification}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Probe Question table */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-lg text-white">Probe Questions Version Catalog</h3>
            
            {/* Probe Question Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-white/5 text-slate-500 uppercase font-mono text-[10px]">
                    <th className="py-3 px-2">Question Context Copy</th>
                    <th className="py-3 px-2">Intent</th>
                    <th className="py-3 px-2">Target keyword</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {questions.map(q => (
                    <tr key={q.id} className="hover:bg-white/5 transition-all">
                      <td className="py-3.5 px-2 text-slate-200 font-medium font-sans">
                        {q.question_text}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-cyan-400 uppercase text-[10px]">
                        {q.intent_context}
                      </td>
                      <td className="py-3.5 px-2 font-mono text-slate-400">
                        {q.target_keyword}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right Column: Add Question Form if not locked */}
        <div className="lg:col-span-1 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/30 space-y-4">
            <h3 className="font-bold text-sm text-white flex items-center gap-2">
              <Plus className="w-4.5 h-4.5 text-cyan-400" />
              Append Probe Question
            </h3>
            {panel.is_locked ? (
              <p className="text-slate-500 text-xs leading-relaxed">
                🔒 Question additions are blocked because this version is locked. You must synthesize a new version to add questions.
              </p>
            ) : (
              <form onSubmit={handleAddQuestion} className="space-y-4 text-xs">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Question Copy Text</label>
                  <textarea
                    required
                    value={newQuestionText}
                    onChange={(e) => setNewQuestionText(e.target.value)}
                    placeholder="e.g. Which moisturizer cures dry skin eczema?"
                    className="w-full h-20 p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 resize-none font-sans"
                  />
                </div>
                
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Intent Context</label>
                  <select
                    value={newIntent}
                    onChange={(e) => setNewIntent(e.target.value)}
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                  >
                    <option value="informational">Informational</option>
                    <option value="commercial">Commercial</option>
                    <option value="transactional">Transactional</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-500 font-mono uppercase">Target Keyword</label>
                  <input
                    type="text"
                    required
                    value={newKeyword}
                    onChange={(e) => setNewKeyword(e.target.value)}
                    placeholder="e.g. retinol moisturizer"
                    className="w-full p-2.5 rounded-lg border border-white/10 bg-slate-900 text-slate-200 outline-none focus:border-cyan-500 font-mono"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 font-bold rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 text-white transition-all"
                >
                  Append Question
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
