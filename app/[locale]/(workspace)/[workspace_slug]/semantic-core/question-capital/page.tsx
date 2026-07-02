"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { 
  createQuestionCapitalNode, 
  updateQuestionCapitalNode 
} from "@/app/actions/semantic";
import { 
  ArrowLeft, 
  Boxes, 
  Plus, 
  Edit3, 
  GitMerge, 
  HelpCircle, 
  TrendingUp, 
  CheckCircle,
  AlertTriangle,
  Cpu,
  AlertCircle
} from "lucide-react";

interface CapitalNode {
  id: string;
  title: string;
  slug: string;
  strategic_weight: number;
  parent_id: string | null;
}

export default function QuestionCapitalPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const { t } = useTranslation();
  const [workspaceId, setWorkspaceId] = useState<string>("");
  const [nodes, setNodes] = useState<CapitalNode[]>([]);
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
      // 서버 액션으로 워크스페이스 해석 (Admin Client — RLS 우회)
      const { resolveWorkspaceSlug } = await import('@/app/actions/workspace');
      const resolvedId = await resolveWorkspaceSlug(workspaceSlug);
      const resolvedWsId = resolvedId || '11111111-1111-1111-1111-111111111111';
      setWorkspaceId(resolvedWsId);

      // 서버 액션으로 질문 자본 노드 조회 (Admin Client — RLS 우회)
      const { getQuestionCapitalNodes } = await import('@/app/actions/semantic');
      const qcNodes = await getQuestionCapitalNodes(resolvedWsId);
      setNodes(qcNodes || []);
    } catch (err: unknown) {
      console.error('Question Capital DB 조회 실패:', err);
      setDbError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setDbLoading(false);
    }
  };

  const [isCreating, setIsCreating] = useState(false);
  const [editingNode, setEditingNode] = useState<CapitalNode | null>(null);

  // Form states
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [weight, setWeight] = useState(50);
  const [parentId, setParentId] = useState("");

  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const resetForm = () => {
    setTitle("");
    setSlug("");
    setWeight(50);
    setParentId("");
    setFeedback(null);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) return;

    const newNodeData = {
      title,
      slug,
      strategic_weight: Number(weight),
      parent_id: parentId || null
    };

    try {
      const result = await createQuestionCapitalNode(workspaceId || '11111111-1111-1111-1111-111111111111', newNodeData);
      const created: CapitalNode = {
        id: result.id || "cap-" + Math.floor(Math.random() * 1000),
        title: result.title,
        slug: result.slug,
        strategic_weight: result.strategic_weight,
        parent_id: result.parent_id
      };
      setNodes(prev => [...prev, created]);
      setFeedback({ type: "success", message: `"${title}" 영역이 질문 자본에 등록되었습니다.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        // 데모 모드: 로친 상태만 업데이트
        const created: CapitalNode = {
          id: "demo-cap-" + Math.floor(Math.random() * 1000),
          title,
          slug,
          strategic_weight: Number(weight),
          parent_id: parentId || null
        };
        setNodes(prev => [...prev, created]);
        setFeedback({ type: "success", message: `[데모] "${title}" 생성됨 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    }
    setIsCreating(false);
    resetForm();
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingNode || !title.trim() || !slug.trim()) return;

    const updatedData = {
      title,
      slug,
      strategic_weight: Number(weight),
      parent_id: parentId || null
    };

    try {
      const result = await updateQuestionCapitalNode(workspaceId || '11111111-1111-1111-1111-111111111111', editingNode.id, updatedData);
      setNodes(prev => prev.map(n => n.id === editingNode.id ? {
        ...n,
        title: result.title,
        slug: result.slug,
        strategic_weight: result.strategic_weight,
        parent_id: result.parent_id
      } : n));
      setFeedback({ type: "success", message: `"${title}" 영역이 업데이트되었습니다.` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg.includes('Unauthorized') || msg.includes('401')) {
        // 데모 모드: 로친 상태만 업데이트
        setNodes(prev => prev.map(n => n.id === editingNode.id ? { ...n, ...updatedData } : n));
        setFeedback({ type: "success", message: `[데모] "${title}" 업데이트됨 (로그인 시 실제 저장)` });
      } else {
        setFeedback({ type: "error", message: `오류: ${msg}` });
      }
    }
    setEditingNode(null);
    resetForm();
  };

  const startEdit = (node: CapitalNode) => {
    setEditingNode(node);
    setTitle(node.title);
    setSlug(node.slug);
    setWeight(node.strategic_weight);
    setParentId(node.parent_id || "");
    setIsCreating(false);
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
            <h1 className="text-2xl font-extrabold text-white">{t('semantic_core.capital_page_title')}</h1>
          </div>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            setEditingNode(null);
            resetForm();
          }}
          className="px-4 py-2 text-xs font-bold rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center gap-1.5 transition-all shadow-lg shadow-cyan-500/10"
        >
          <Plus className="w-4 h-4" /> 영역 정의
        </button>
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
          <span className="text-sm font-semibold">질문 자본 데이터 로드 중...</span>
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

      {!dbLoading && !dbError && nodes.length === 0 && (
        <div className="bg-slate-800/30 border border-dashed border-slate-700 rounded-xl p-8 text-center space-y-2">
          <HelpCircle className="h-8 w-8 text-slate-600 mx-auto" />
          <p className="text-sm font-bold text-slate-400">질문 자본 노드가 없습니다.</p>
          <p className="text-xs text-slate-500">시그널을 프로모션하면 자동 생성됩니다.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List of Capital Nodes */}
        <div className="lg:col-span-2 space-y-6">
          <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
            <h3 className="font-bold text-sm text-slate-200 flex items-center gap-2">
              <Boxes className="w-5 h-5 text-purple-400" />
              전략적 영역 노드 트리
            </h3>

            <div className="divide-y divide-white/5 border border-white/5 rounded-xl overflow-hidden bg-slate-900/60">
              {nodes.filter(n => !n.parent_id).map(parent => (
                <div key={parent.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2 text-sm">
                        <span className="w-2 h-2 rounded-full bg-purple-500" />
                        {parent.title}
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono pl-4 mt-0.5">slug: {parent.slug}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full border border-purple-500/20 text-purple-400 bg-purple-950/20">
                        가중치: {parent.strategic_weight}%
                      </span>
                      <button
                        onClick={() => startEdit(parent)}
                        className="p-1.5 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Child nodes */}
                  <div className="pl-6 space-y-2 border-l border-white/10 ml-5">
                    {nodes.filter(child => child.parent_id === parent.id).map(child => (
                      <div key={child.id} className="flex items-center justify-between gap-4 bg-slate-950/20 p-2.5 rounded-lg">
                        <div>
                          <div className="font-semibold text-slate-300 text-xs flex items-center gap-1.5">
                            <GitMerge className="w-3 h-3 text-slate-500" />
                            {child.title}
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono pl-4 mt-0.5">slug: {child.slug}</div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-full border border-slate-700 text-slate-400 bg-slate-800">
                            가중치: {child.strategic_weight}%
                          </span>
                          <button
                            onClick={() => startEdit(child)}
                            className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Editor Form Panel */}
        <div>
          {(isCreating || editingNode) ? (
            <form 
              onSubmit={isCreating ? handleCreate : handleUpdate}
              className="p-6 rounded-2xl border border-white/10 bg-slate-950/40 space-y-5"
            >
              <h3 className="font-bold text-sm text-slate-200">
                {isCreating ? "새 영역 노드 정의" : `노드 편집: ${editingNode?.title}`}
              </h3>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">영역 제목</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 text-xs font-semibold"
                  placeholder="예: 피부 탄력과 노화"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">영역 슬러그 (자동 생성)</label>
                <input
                  type="text"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900/60 text-slate-400 focus:outline-none text-xs font-mono cursor-not-allowed"
                  placeholder="skin-elasticity-and-aging"
                  readOnly
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">전략적 소유 가중치 ({weight}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={weight}
                  onChange={(e) => setWeight(Number(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-400">상위 영역 (선택사항)</label>
                <select
                  value={parentId}
                  onChange={(e) => setParentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-white/10 bg-slate-900 text-slate-200 focus:outline-none text-xs font-semibold"
                >
                  <option value="">-- 상위 없음 (최상위 노드) --</option>
                  {nodes.filter(n => !n.parent_id && n.id !== editingNode?.id).map(parent => (
                    <option key={parent.id} value={parent.id}>{parent.title}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all text-xs text-center"
                >
                  {isCreating ? "영역 등록" : "변경 저장"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreating(false);
                    setEditingNode(null);
                    resetForm();
                  }}
                  className="px-4 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 transition-all text-xs"
                >
                  취소
                </button>
              </div>
            </form>
          ) : (
            <div className="p-6 rounded-2xl border border-white/5 bg-slate-950/20 space-y-4">
              <h3 className="font-bold text-sm text-slate-300 flex items-center gap-1.5">
                <HelpCircle className="w-4 h-4 text-cyan-400" />
                전략적 가중치 시스템
              </h3>
              <p className="text-slate-400 text-xs leading-relaxed">
                BSW-OS는 검색 공간을 자본 자산으로 매핑합니다. 높은 가중치를 할당하면 프리미엄 AI 에이전트 커버리지, 엄격한 클레임 검증 확인 및 사전 검색 크롤링 대상으로 지정됩니다.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
