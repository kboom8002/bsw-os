"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getStrategicTruth, upsertStrategicTruth } from "@/app/actions/truth";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import { ArrowLeft, Save, Sparkles, Plus, Trash, CheckCircle, Loader2 } from "lucide-react";

interface StrategicTruth {
  id?: string;
  statement: string;
  vision?: string | null;
  core_pillars: string[];
}

export default function StrategicTruthPage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [recordId, setRecordId] = useState<string | undefined>(undefined);
  const [statement, setStatement] = useState("");
  const [vision, setVision] = useState("");
  const [pillars, setPillars] = useState<string[]>([]);
  const [newPillar, setNewPillar] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load existing strategic truth from DB
  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return;
      try {
        setLoading(true);
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (!wsId) throw new Error("워크스페이스를 찾을 수 없습니다.");
        setWorkspaceId(wsId);

        const data = await getStrategicTruth(wsId);
        if (data) {
          setRecordId(data.id);
          setStatement(data.statement || "");
          setVision(data.vision || "");
          setPillars(data.core_pillars || []);
        }
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceSlug]);

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
    if (!workspaceId) return;
    setSaving(true);
    setSuccess(false);
    setError(null);
    try {
      const result = await upsertStrategicTruth(workspaceId, {
        id: recordId,
        statement,
        vision: vision || null,
        core_pillars: pillars,
      });
      setRecordId(result.id);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Breadcrumb Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/${locale}/${workspaceSlug}/truth`}
          className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">전략적 진실 설정</h1>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" />
          DB에서 데이터 로딩 중...
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6 bg-slate-950/40 p-6 rounded-2xl border border-white/5 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-400 to-blue-500" />

          {/* Statement */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              <Sparkles className="w-3 h-3 inline-block mr-1.5 text-cyan-400" />
              브랜드 전략적 진실 선언문 *
            </label>
            <textarea
              required
              rows={4}
              value={statement}
              onChange={(e) => setStatement(e.target.value)}
              placeholder="우리 브랜드가 세상에 전달하는 단 하나의 핵심 진실을 간결하게 서술하세요..."
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Vision */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
              브랜드 비전
            </label>
            <textarea
              rows={3}
              value={vision}
              onChange={(e) => setVision(e.target.value)}
              placeholder="5년 후 이 브랜드가 달성하고자 하는 상태는 무엇인가요?"
              className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50 resize-none"
            />
          </div>

          {/* Core Pillars */}
          <div>
            <label className="block text-xs font-bold text-slate-400 mb-3 uppercase tracking-wider">
              핵심 필라 (Core Pillars)
            </label>
            <div className="space-y-2 mb-3">
              {pillars.map((pillar, i) => (
                <div key={i} className="flex items-center gap-2 p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/10">
                  <span className="text-xs font-mono text-cyan-300 flex-1">{pillar}</span>
                  <button
                    type="button"
                    onClick={() => removePillar(i)}
                    className="p-1 text-slate-500 hover:text-red-400 transition-colors"
                  >
                    <Trash className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
              {pillars.length === 0 && (
                <div className="text-xs text-slate-600 font-mono italic p-3">아직 필라가 없습니다. 아래에서 추가하세요.</div>
              )}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPillar}
                onChange={(e) => setNewPillar(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addPillar())}
                placeholder="새 필라 입력 후 Enter 또는 추가 클릭"
                className="flex-1 bg-slate-900 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500/50"
              />
              <button
                type="button"
                onClick={addPillar}
                className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 text-sm flex items-center gap-1.5 transition-all"
              >
                <Plus className="w-4 h-4" /> 추가
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs">{error}</div>
          )}

          <div className="flex items-center justify-between pt-2">
            {success && (
              <div className="flex items-center gap-2 text-xs text-green-400">
                <CheckCircle className="w-4 h-4" /> 성공적으로 저장되었습니다!
              </div>
            )}
            <button
              type="submit"
              disabled={saving}
              className="ml-auto px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-slate-950 font-bold text-sm flex items-center gap-2 disabled:opacity-50 transition-all"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {saving ? "저장 중..." : "저장"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
