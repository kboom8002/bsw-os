"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { upsertStrategicTruth } from "@/app/actions/truth";
import { ArrowLeft, Save, Sparkles, Plus, Trash } from "lucide-react";

export default function StrategicTruthPage() {
  const params = useParams();
  const router = useRouter();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // Pre-seed some default mock states to avoid blank screens
  const [statement, setStatement] = useState(
    "We provide the world's most scientifically rigorous active compound solutions with transparent clinical traces."
  );
  const [vision, setVision] = useState(
    "To eliminate misinformation in beauty and healthcare search answers by presenting verified clinical evidence."
  );
  const [pillars, setPillars] = useState<string[]>([
    "100% Verified Evidence",
    "Clinical Lab Ingestion",
    "Zero AI Hallucination Boundaries"
  ]);
  const [newPillar, setNewPillar] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const addPillar = () => {
    if (newPillar.trim()) {
      setPillars([...pillars, newPillar.trim()]);
      setNewPillar("");
    }
  };

  const removePillar = (index: number) => {
    setPillars(pillars.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess(false);
    try {
      // Mock workspace UUID for upsert calls (will fall back to database)
      const mockWorkspaceId = "11111111-1111-1111-1111-111111111111";
      await upsertStrategicTruth(mockWorkspaceId, {
        statement,
        vision,
        core_pillars: pillars
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Error saving strategic truth: " + (err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-4">
        <Link 
          href={`/${workspaceSlug}/truth`}
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">Strategic Truth Setup</h1>
        </div>
      </div>

      <form onSubmit={handleSave} className="space-y-6 bg-slate-950/40 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />
        
        {/* Statement */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            Strategic Brand Statement
          </label>
          <textarea
            value={statement}
            onChange={(e) => setStatement(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all text-sm leading-relaxed"
            placeholder="Outline your strategic brand message..."
            required
          />
        </div>

        {/* Vision */}
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-slate-200">
            Brand Vision Paragraph
          </label>
          <textarea
            value={vision}
            onChange={(e) => setVision(e.target.value)}
            rows={3}
            className="w-full px-4 py-3 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all text-sm leading-relaxed"
            placeholder="Explain how you protect meaning..."
          />
        </div>

        {/* Pillars list builder */}
        <div className="space-y-4">
          <label className="block text-sm font-semibold text-slate-200">
            Core Meaning Pillars
          </label>
          
          <div className="flex gap-3">
            <input
              type="text"
              value={newPillar}
              onChange={(e) => setNewPillar(e.target.value)}
              className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-sm"
              placeholder="Add new pillar tag..."
            />
            <button
              type="button"
              onClick={addPillar}
              className="px-4 py-2.5 rounded-xl bg-slate-800 text-slate-200 border border-white/5 hover:bg-slate-700 transition-all text-sm flex items-center gap-1.5 font-semibold"
            >
              <Plus className="w-4 h-4" /> Add
            </button>
          </div>

          <div className="flex flex-wrap gap-2 pt-2">
            {pillars.map((pillar, index) => (
              <span
                key={index}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/5 text-xs text-slate-200 font-medium"
              >
                <span>{pillar}</span>
                <button
                  type="button"
                  onClick={() => removePillar(index)}
                  className="text-slate-500 hover:text-red-400 transition-all"
                >
                  <Trash className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>

        {/* Save button and alerts */}
        <div className="pt-4 border-t border-white/5 flex items-center justify-between">
          <div>
            {success && (
              <div className="text-xs text-green-400 font-semibold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 animate-bounce" /> Saved Strategic Statement successfully!
              </div>
            )}
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 disabled:opacity-50 transition-all flex items-center gap-2 text-sm"
          >
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save Config"}
          </button>
        </div>
      </form>
    </div>
  );
}
