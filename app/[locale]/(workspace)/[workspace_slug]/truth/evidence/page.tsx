"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { createEvidenceItem, updateEvidenceItem } from "@/app/actions/truth";
import { 
  ArrowLeft, 
  Plus, 
  FileText, 
  FileCheck, 
  ExternalLink,
  Save,
  CheckCircle,
  Database
} from "lucide-react";

interface EvidenceItem {
  id: string;
  title: string;
  content: string;
  url: string;
  evidence_type: "clinical_trial" | "lab_report" | "certificate" | "manual_verify";
  is_verified: boolean;
  verified_at?: string;
}

export default function EvidencePage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([
    {
      id: "ev-101",
      title: "Clinical Trial #AC-10-NIA-Barrier",
      content: "Ingested clinical trials of 10% clinical Niacinamide compound on 45 volunteer skins over a 7 day daily routine.",
      url: "https://clinicalbeautytest.org/acme-report-niacinamide.pdf",
      evidence_type: "clinical_trial",
      is_verified: true,
      verified_at: "2026-05-23T11:00:00Z"
    },
    {
      id: "ev-102",
      title: "Niacinamide Purity Lab Certification",
      content: "Chemical purity tests verifying 99.8% raw substance score of active K-beauty skincare compound ingredients.",
      url: "https://labpuritycert.com/niacinamide-pur-998.pdf",
      evidence_type: "lab_report",
      is_verified: true,
      verified_at: "2026-05-23T12:00:00Z"
    }
  ]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [evidenceType, setEvidenceType] = useState<"clinical_trial" | "lab_report" | "certificate" | "manual_verify">("clinical_trial");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setSaving(true);
    try {
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";
      const newEv = {
        title,
        content,
        url: url.trim() || null,
        evidence_type: evidenceType,
        is_verified: true, // Auto-verify in seeder mockups
      };

      await createEvidenceItem(mockWorkspaceId, newEv);

      // Append locally for fluid interactive demo
      const newLocalEv: EvidenceItem = {
        id: "ev-" + Math.floor(Math.random() * 1000),
        title,
        content,
        url,
        evidence_type: evidenceType,
        is_verified: true,
        verified_at: new Date().toISOString()
      };
      setEvidenceList([newLocalEv, ...evidenceList]);

      // Reset
      setTitle("");
      setContent("");
      setUrl("");
      setEvidenceType("clinical_trial");
      setShowAddForm(false);
    } catch (err) {
      alert("Error saving evidence: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVerify = async (evId: string) => {
    // Update local state first for fluid feedback
    setEvidenceList(prev => prev.map(item => {
      if (item.id === evId) {
        const nextStatus = !item.is_verified;
        return {
          ...item,
          is_verified: nextStatus,
          verified_at: nextStatus ? new Date().toISOString() : undefined
        };
      }
      return item;
    }));

    try {
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";
      const target = evidenceList.find(e => e.id === evId);
      if (target) {
        await updateEvidenceItem(mockWorkspaceId, evId, {
          title: target.title,
          content: target.content,
          url: target.url,
          evidence_type: target.evidence_type,
          is_verified: !target.is_verified
        });
      }
    } catch (err) {
      console.error("DB Update failed (using fallback local state):", err);
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
            <h1 className="text-2xl font-extrabold text-white">Evidence Library</h1>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold text-sm transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Upload Evidence Document
        </button>
      </div>

      {/* Upload evidence inline form */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 space-y-4">
          <h3 className="font-bold text-sm text-slate-200">Submit New Evidence Ingestion</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Document Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
                placeholder="e.g. Clinical Trial #NIA-Skin-45..."
                required
              />
            </div>
            
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Evidence Classification</label>
              <select
                value={evidenceType}
                onChange={(e: any) => setEvidenceType(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 focus:outline-none focus:border-cyan-500 text-sm"
              >
                <option value="clinical_trial">Clinical Trial Report</option>
                <option value="lab_report">Laboratory Certificate</option>
                <option value="certificate">Product Quality Certificate</option>
                <option value="manual_verify">Manual Strategic Log</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-400">Document URL / Reference Link (optional)</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm font-mono"
                placeholder="https://clinicalbeautytest.org/acme-report.pdf"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold text-slate-400">Clinical Data Summary / Extract Details</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              placeholder="Paste active ingredient logs, chemical levels, trial methods, and outcome percentages..."
              required
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
              {saving ? "Ingesting..." : "Ingest Document"}
            </button>
          </div>
        </form>
      )}

      {/* Evidence Repository Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {evidenceList.map((item) => (
          <div key={item.id} className="p-6 rounded-2xl border border-white/5 bg-slate-950/40 relative overflow-hidden flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <span className="text-[10px] text-cyan-400 font-mono uppercase bg-cyan-950/30 px-2 py-0.5 rounded border border-cyan-800/30">
                  {item.evidence_type.replace("_", " ")}
                </span>
                
                {/* Verified Toggle check */}
                <button
                  onClick={() => handleToggleVerify(item.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-semibold font-mono transition-all ${
                    item.is_verified 
                      ? "border-green-500/20 text-green-400 bg-green-950/20" 
                      : "border-yellow-500/20 text-yellow-400 bg-yellow-950/20"
                  }`}
                >
                  {item.is_verified ? (
                    <>
                      <FileCheck className="w-3.5 h-3.5" /> Verified
                    </>
                  ) : (
                    <>
                      <FileText className="w-3.5 h-3.5" /> In Review
                    </>
                  )}
                </button>
              </div>

              <h3 className="font-bold text-white text-base">{item.title}</h3>
              <p className="text-slate-400 text-xs leading-relaxed">{item.content}</p>
            </div>

            <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between text-xs font-mono text-slate-500">
              <span>ID: {item.id}</span>
              {item.url && (
                <a 
                  href={item.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:underline flex items-center gap-1 hover:text-cyan-300"
                >
                  View File <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
