"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  listEvidenceItems,
  createEvidenceItem,
  updateEvidenceItem,
  deleteEvidenceItem,
  uploadEvidenceFile,
} from "@/app/actions/truth";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import {
  ArrowLeft, Plus, FileText, FileCheck, ExternalLink,
  CheckCircle, Trash2, X, Loader2, Upload, Link2, AlignLeft
} from "lucide-react";

const EVIDENCE_TYPE_LABELS = {
  clinical_trial: "임상 시험",
  lab_report: "실험실 보고서",
  certificate: "인증서",
  manual_verify: "수동 검증",
} as const;

const EVIDENCE_TYPE_COLORS = {
  clinical_trial: "cyan",
  lab_report: "blue",
  certificate: "green",
  manual_verify: "amber",
} as const;

interface EvidenceItem {
  id: string;
  title: string;
  content: string;
  url?: string | null;
  evidence_type: "clinical_trial" | "lab_report" | "certificate" | "manual_verify";
  is_verified: boolean;
  verified_at?: string | null;
  created_at: string;
}

export default function EvidencePage() {
  const params = useParams();
  const locale = (params?.locale as string) || "ko";
  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [evidenceList, setEvidenceList] = useState<EvidenceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [addMode, setAddMode] = useState<"link" | "file">("link");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [url, setUrl] = useState("");
  const [evidenceType, setEvidenceType] = useState<EvidenceItem["evidence_type"]>("clinical_trial");

  useEffect(() => {
    async function load() {
      if (!workspaceSlug) return;
      try {
        setLoading(true);
        const wsId = await resolveWorkspaceSlug(workspaceSlug);
        if (!wsId) throw new Error("워크스페이스를 찾을 수 없습니다.");
        setWorkspaceId(wsId);
        const data = await listEvidenceItems(wsId);
        setEvidenceList(data as EvidenceItem[]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [workspaceSlug]);

  const resetForm = () => {
    setTitle(""); setContent(""); setUrl("");
    setEvidenceType("clinical_trial"); setShowForm(false);
  };

  const handleSubmitLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId) return;
    setSaving(true); setError(null);
    try {
      await createEvidenceItem(workspaceId, { title, content, url: url || null, evidence_type: evidenceType, is_verified: false });
      const updated = await listEvidenceItems(workspaceId);
      setEvidenceList(updated as EvidenceItem[]);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmitFile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspaceId || !fileInputRef.current?.files?.[0]) return;
    setSaving(true); setError(null);
    try {
      const formData = new FormData();
      formData.append("file", fileInputRef.current.files[0]);
      formData.append("title", title);
      formData.append("content", content);
      formData.append("evidence_type", evidenceType);
      await uploadEvidenceFile(workspaceId, formData);
      const updated = await listEvidenceItems(workspaceId);
      setEvidenceList(updated as EvidenceItem[]);
      resetForm();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleVerify = async (item: EvidenceItem) => {
    if (!workspaceId) return;
    setTogglingId(item.id);
    const newVerified = !item.is_verified;
    try {
      await updateEvidenceItem(workspaceId, item.id, {
        ...item,
        is_verified: newVerified,
        verified_at: newVerified ? new Date().toISOString() : null,
      });
      setEvidenceList(prev => prev.map(ev => ev.id === item.id ? { ...ev, is_verified: newVerified, verified_at: newVerified ? new Date().toISOString() : null } : ev));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setTogglingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    if (!workspaceId || !confirm("이 증거 항목을 삭제하시겠습니까?")) return;
    setDeletingId(id);
    try {
      await deleteEvidenceItem(workspaceId, id);
      setEvidenceList(prev => prev.filter(ev => ev.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-6 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/${workspaceSlug}/truth`} className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all">
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div className="flex-1">
          <div className="text-xs text-cyan-400 font-mono">Brand Truth Studio</div>
          <h1 className="text-2xl font-extrabold text-white">증거 라이브러리</h1>
        </div>
        <button onClick={() => setShowForm(v => !v)} className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 transition-all">
          <Plus className="w-4 h-4" /> 증거 추가
        </button>
      </div>

      {error && <div className="p-3 rounded-xl bg-red-950/30 border border-red-500/20 text-red-400 text-xs">{error}</div>}

      {showForm && (
        <div className="bg-slate-950/60 rounded-2xl border border-blue-500/20 p-6 space-y-4 relative">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-t-2xl" />
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white">새 증거 추가</h3>
            <button onClick={resetForm} className="text-slate-500 hover:text-white"><X className="w-4 h-4" /></button>
          </div>
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <button onClick={() => setAddMode("link")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${addMode === "link" ? "bg-blue-600 text-white" : "border border-white/10 text-slate-400 hover:bg-white/5"}`}>
              <Link2 className="w-3.5 h-3.5" /> URL 링크
            </button>
            <button onClick={() => setAddMode("file")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${addMode === "file" ? "bg-indigo-600 text-white" : "border border-white/10 text-slate-400 hover:bg-white/5"}`}>
              <Upload className="w-3.5 h-3.5" /> 파일 업로드
            </button>
          </div>
          <form onSubmit={addMode === "link" ? handleSubmitLink : handleSubmitFile} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-400 mb-1">증거 제목 *</label>
              <input required value={title} onChange={e => setTitle(e.target.value)} placeholder="예: 임상 시험 #AC-10-NIA"
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50" />
            </div>
            <div>
              <label className="block text-xs text-slate-400 mb-1">설명</label>
              <textarea rows={2} value={content} onChange={e => setContent(e.target.value)} placeholder="증거 내용 요약..."
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50 resize-none" />
            </div>
            {addMode === "link" ? (
              <div>
                <label className="block text-xs text-slate-400 mb-1">URL</label>
                <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..."
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-sm text-slate-100 placeholder-slate-600 focus:outline-none focus:border-blue-500/50" />
              </div>
            ) : (
              <div>
                <label className="block text-xs text-slate-400 mb-1">파일 선택 *</label>
                <input ref={fileInputRef} required={addMode === "file"} type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.txt,.csv"
                  className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-xs text-slate-400 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-blue-600 file:text-white hover:file:bg-blue-500 focus:outline-none" />
                <p className="text-[10px] text-slate-600 mt-1">PDF, PNG, JPG, DOCX, TXT, CSV (최대 50MB)</p>
              </div>
            )}
            <div>
              <label className="block text-xs text-slate-400 mb-1">증거 유형</label>
              <select value={evidenceType} onChange={e => setEvidenceType(e.target.value as any)}
                className="w-full bg-slate-900 border border-white/10 rounded-xl p-2.5 text-sm text-slate-100 focus:outline-none focus:border-blue-500/50">
                <option value="clinical_trial">임상 시험</option>
                <option value="lab_report">실험실 보고서</option>
                <option value="certificate">인증서</option>
                <option value="manual_verify">수동 검증</option>
              </select>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={resetForm} className="px-4 py-2 rounded-xl border border-white/10 text-slate-400 text-sm hover:bg-white/5">취소</button>
              <button type="submit" disabled={saving} className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center gap-2 disabled:opacity-50">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? "저장 중..." : "추가"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Evidence List */}
      {loading ? (
        <div className="flex items-center justify-center h-48 text-slate-500">
          <Loader2 className="w-6 h-6 animate-spin mr-2" /> 증거 로딩 중...
        </div>
      ) : evidenceList.length === 0 ? (
        <div className="text-center py-16 text-slate-600">
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">아직 증거 항목이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {evidenceList.map(ev => {
            const typeColor = EVIDENCE_TYPE_COLORS[ev.evidence_type];
            return (
              <div key={ev.id} className={`p-5 rounded-2xl border transition-all ${ev.is_verified ? "border-green-500/20 bg-green-950/10" : "border-white/5 bg-slate-950/40"}`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <FileCheck className={`w-4 h-4 text-${typeColor}-400 flex-shrink-0`} />
                      <p className="font-semibold text-sm text-white">{ev.title}</p>
                    </div>
                    {ev.content && <p className="text-xs text-slate-400 mb-2 line-clamp-2">{ev.content}</p>}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full bg-${typeColor}-500/10 text-${typeColor}-400 border border-${typeColor}-500/20`}>
                        {EVIDENCE_TYPE_LABELS[ev.evidence_type]}
                      </span>
                      {ev.url && (
                        <a href={ev.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-400 hover:underline">
                          <ExternalLink className="w-3 h-3" /> 링크 열기
                        </a>
                      )}
                      <span>{new Date(ev.created_at).toLocaleDateString("ko-KR")}</span>
                      {ev.is_verified && ev.verified_at && (
                        <span className="flex items-center gap-1 text-green-400">
                          <CheckCircle className="w-3 h-3" /> {new Date(ev.verified_at).toLocaleDateString("ko-KR")} 검증됨
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => handleToggleVerify(ev)}
                      disabled={togglingId === ev.id}
                      title={ev.is_verified ? "검증 취소" : "검증 완료로 표시"}
                      className={`p-1.5 rounded-lg transition-all disabled:opacity-40 ${ev.is_verified ? "text-green-400 hover:text-slate-400 hover:bg-slate-800" : "text-slate-500 hover:text-green-400 hover:bg-green-950/20"}`}
                    >
                      {togglingId === ev.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => handleDelete(ev.id)}
                      disabled={deletingId === ev.id}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-950/20 transition-all disabled:opacity-40"
                    >
                      {deletingId === ev.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
