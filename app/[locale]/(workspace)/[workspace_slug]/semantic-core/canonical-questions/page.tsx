"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { 
  createCanonicalQuestion, 
  mergeCanonicalQuestions 
} from "@/app/actions/semantic";
import { 
  ArrowLeft, 
  HelpCircle, 
  Plus, 
  GitMerge, 
  Fingerprint,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
  Activity,
  Cpu,
  AlertCircle
} from "lucide-react";
import { QuestionLifecyclePipeline } from "@/components/question-lifecycle-pipeline";

interface CanonicalQuestion {
  id: string;
  normalized_question: string;
  slug: string;
  signature: string;
  question_capital_node_id: string | null;
}

export default function CanonicalQuestionsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [questions, setQuestions] = useState<CanonicalQuestion[]>([]);
  const [dbLoading, setDbLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // DB에서 데이터 로드
  useEffect(() => {
    loadFromDb();
  }, [workspaceSlug]);

  const loadFromDb = async () => {
    setDbLoading(true);
    setDbError(null);
    try {
      const { getSupabaseClient } = await import('@/lib/supabase');
      const supabase = getSupabaseClient();

      // 워크스페이스 ID 조회
      const { data: ws } = await supabase
        .from('workspaces')
        .select('id')
        .eq('slug', workspaceSlug)
        .single();

      const resolvedWsId = ws?.id || '11111111-1111-1111-1111-111111111111';
      setWorkspaceId(resolvedWsId);

      // Canonical Questions 조회
      const { data: cqs } = await supabase
        .from('canonical_questions')
        .select('id, normalized_question, slug, signature, question_capital_node_id')
        .eq('workspace_id', resolvedWsId)
        .order('created_at', { ascending: false })
        .limit(50);

      setQuestions(cqs || []);
    } catch (err: unknown) {
      console.error('Canonical Questions DB 조회 실패:', err);
      setDbError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setDbLoading(false);
    }
  };

  const [selectedCqId, setSelectedCqId] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [normalizedQuestion, setNormalizedQuestion] = useState("");
  const [slug, setSlug] = useState("");
  const [signature, setSignature] = useState("");
  
  // Merge state
  const [isMerging, setIsMerging] = useState(false);
  const [targetCqId, setTargetCqId] = useState("");
  const [sourceCqIds, setSourceCqIds] = useState<string[]>([]);

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setNormalizedQuestion("");
    setSlug("");
    setSignature("");
    setFeedback(null);
  };

  const handleQuestionChange = (val: string) => {
    setNormalizedQuestion(val);
    const generatedSlug = val.toLowerCase()
      .replace(/[^a-z0-9\s?]+/g, "")
      .replace(/\s+/g, "-")
      .replace(/\?$/, "")
      .replace(/(^-|-$)/g, "");
    setSlug(generatedSlug);

    // Simple deterministic mock hash for unique signature
    let hash = 0;
    for (let i = 0; i < val.length; i++) {
      hash = (hash << 5) - hash + val.charCodeAt(i);
      hash = hash & hash;
    }
    setSignature(Math.abs(hash).toString(16).padStart(16, "0").substring(0, 16));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!normalizedQuestion.trim() || !slug.trim()) return;

    try {
      const data = {
        normalized_question: normalizedQuestion,
        slug,
        signature,
        question_capital_node_id: null
      };
      const result = await createCanonicalQuestion(workspaceId || '11111111-1111-1111-1111-111111111111', data);
      const created: CanonicalQuestion = {
        id: result.id || "cq-" + Math.floor(Math.random() * 1000),
        normalized_question: result.normalized_question,
        slug: result.slug,
        signature: result.signature,
        question_capital_node_id: result.question_capital_node_id
      };
      setQuestions(prev => [...prev, created]);
      setFeedback({ type: "success", message: "정규 질문이 시맨틱 고유 시그니처로 등록되었습니다!" });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        // 데모 모드
        setQuestions(prev => [...prev, {
          id: "demo-cq-" + Math.floor(Math.random() * 1000),
          normalized_question: normalizedQuestion,
          slug,
          signature,
          question_capital_node_id: null
        }]);
        setFeedback({ type: "success", message: `[데모] Canonical Question 등록됨 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    }
    setIsCreating(false);
    resetForm();
  };

  const handleMerge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetCqId || sourceCqIds.length === 0) return;

    try {
      const result = await mergeCanonicalQuestions(workspaceId || '11111111-1111-1111-1111-111111111111', targetCqId, sourceCqIds);
      setQuestions(prev => prev.filter(q => !sourceCqIds.includes(q.id)));
      setFeedback({ type: "success", message: `중복 제거 성공: ${result.mergedCount}개 중복 시그니처가 대상 CQ에 병합되었습니다!` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        // 데모 모드: 로친 상태만 업데이트
        setQuestions(prev => prev.filter(q => !sourceCqIds.includes(q.id)));
        setFeedback({ type: "success", message: `[데모] ${sourceCqIds.length}개 시그니처 연결 완료 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    }
    setIsMerging(false);
    setTargetCqId("");
    setSourceCqIds([]);
  };

  const toggleSourceSelection = (id: string) => {
    if (sourceCqIds.includes(id)) {
      setSourceCqIds(prev => prev.filter(x => x !== id));
    } else {
      setSourceCqIds(prev => [...prev, id]);
    }
  };

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-5xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div className="flex items-center gap-4">
          <Link 
            href={`/${locale}/${workspaceSlug}/semantic-core`}
            className="p-2 rounded-xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <div className="text-xs text-cyan-400 font-mono">{t('semantic_core.studio_title')}</div>
            <h1 className="text-2xl font-extrabold text-white">{t('semantic_core.cq_title')}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setIsMerging(true);
              setIsCreating(false);
              setFeedback(null);
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl border border-purple-500/20 text-purple-400 hover:bg-purple-950/20 bg-purple-950/10 flex items-center gap-1.5 transition-all"
          >
            <GitMerge className="w-4 h-4" /> {t('semantic_core.btn_merge_dedup')}
          </button>
          <button
            onClick={() => {
              setIsCreating(true);
              setIsMerging(false);
              resetForm();
            }}
            className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
          >
            <Plus className="w-4 h-4" /> {t('semantic_core.btn_add_cq')}
          </button>
        </div>
      </div>

      {feedback && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-sm ${
          feedback.type === "success" 
            ? "border-green-500/20 text-green-400 bg-green-950/20" 
            : "border-red-500/20 text-red-400 bg-red-950/20"
        }`}>
          {feedback.type === "success" ? <CheckCircle className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* DB 상태 표시 */}
      {dbLoading && (
        <div className="flex items-center justify-center py-12 gap-3 text-slate-500">
          <Cpu className="h-5 w-5 animate-spin" />
          <span className="text-sm font-semibold">정규 질문 데이터 로드 중...</span>
        </div>
      )}

      {dbError && (
        <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4 text-sm text-red-400 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <span className="font-bold">DB 연결 오류: </span>{dbError}
            <button onClick={loadFromDb} className="ml-3 text-xs underline hover:text-red-300 cursor-pointer">재시도</button>
          </div>
        </div>
      )}

      {!dbLoading && !dbError && questions.length === 0 && (
        <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-8 text-center space-y-2">
          <HelpCircle className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">정규 질문이 없습니다.</p>
          <p className="text-xs text-slate-500">시그널을 프로모션하거나 직접 추가하세요.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* CQ Signatures Grid */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-blue-400" />
              {t('semantic_core.stable_cqs')}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {questions.map((cq) => (
                <div key={cq.id} className="p-4 rounded-xl border border-white/5 bg-slate-900/60 flex flex-col justify-between space-y-3 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 font-mono text-[9px] text-cyan-400 flex items-center gap-1 bg-cyan-950/40 border-l border-b border-white/5 rounded-bl-lg">
                    <Fingerprint className="w-3 h-3" />
                    {cq.signature}
                  </div>
                  <div>
                    <h4 className="font-bold text-white text-xs leading-normal pr-16">{cq.normalized_question}</h4>
                    <p className="text-[10px] text-slate-500 font-mono mt-1.5">slug: {cq.slug}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-[10px] text-slate-400">
                        <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
                        <span>중복 제거된 안정 식별자</span>
                      </div>
                      <button 
                        onClick={() => setSelectedCqId(selectedCqId === cq.id ? null : cq.id)}
                        className="text-[10px] flex items-center gap-1 text-cyan-400 hover:text-cyan-300"
                      >
                        <Activity className="w-3.5 h-3.5" />
                        라이프사이클
                      </button>
                    </div>
                    {selectedCqId === cq.id && (
                      <QuestionLifecyclePipeline questionId={cq.id} workspaceSlug={workspaceSlug} locale={locale} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Dynamic Context Panels */}
        <div>
          {isCreating && (
            <form onSubmit={handleCreate} className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-5">
              <h3 className="font-bold text-sm text-slate-200">CQ 시그니처 등록</h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">정규화된 질문 문구</label>
                <input
                  type="text"
                  value={normalizedQuestion}
                  onChange={(e) => handleQuestionChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="예: 나이아신아마이드는 피부에 안전한가요?"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">정규화된 슬러그 (자동 생성)</label>
                <input
                  type="text"
                  value={slug}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900/60 text-slate-400 focus:outline-none text-xs font-mono cursor-not-allowed"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">시맨틱 시그니처 해시</label>
                <div className="w-full px-3 py-2 rounded-lg border border-white/5 bg-slate-950 text-cyan-400 font-mono text-xs select-all flex items-center gap-1.5">
                  <Fingerprint className="w-3.5 h-3.5" />
                  {signature || "입력 대기 중..."}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  시그니처 생성
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {isMerging && (
            <form onSubmit={handleMerge} className="p-6 rounded-2xl border border-purple-500/20 bg-slate-950/40 space-y-5">
              <h3 className="font-bold text-sm text-slate-200 flex items-center gap-1.5">
                <GitMerge className="w-4 h-4 text-purple-400" />
                CQ 병합 및 중복 제거
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">대상 CQ (안정 식별자)</label>
                <select
                  value={targetCqId}
                  onChange={(e) => setTargetCqId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                  required
                >
                  <option value="">-- 대상 CQ 선택 --</option>
                  {questions.map(q => (
                    <option key={q.id} value={q.id}>{q.normalized_question.substring(0, 40)}...</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400">병합할 중복 CQ 선택</label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto border border-white/5 rounded-lg p-2 bg-slate-900">
                  {questions.filter(q => q.id !== targetCqId).map(q => (
                    <label key={q.id} className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sourceCqIds.includes(q.id)}
                        onChange={() => toggleSourceSelection(q.id)}
                        className="rounded border-white/10 text-purple-500 focus:ring-0 bg-slate-950"
                      />
                      <span className="truncate">{q.normalized_question}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  disabled={!targetCqId || sourceCqIds.length === 0}
                  className="flex-1 px-4 py-2 rounded-lg bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold transition-all text-xs text-center disabled:opacity-50"
                >
                  병합 실행
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsMerging(false);
                    setTargetCqId("");
                    setSourceCqIds([]);
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  취소
                </button>
              </div>
            </form>
          )}

          {!isCreating && !isMerging && (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <Search className="w-4 h-4 text-cyan-400" />
                {t('semantic_core.dedup_title')}
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                {t('semantic_core.dedup_desc')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
