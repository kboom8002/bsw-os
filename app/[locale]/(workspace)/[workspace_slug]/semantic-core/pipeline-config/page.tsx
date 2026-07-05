"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import {
  Settings,
  Zap,
  RotateCcw,
  Save,
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
  Layers,
} from "lucide-react";
import {
  getFullPipelineConfigAction,
  setStageConfigAction,
  applyPresetAction,
  resetPipelineConfigAction,
} from "@/app/actions/pipeline-config";
import { resolveWorkspaceSlug } from "@/app/actions/workspace";
import {
  PIPELINE_STAGE_DEFINITIONS,
  PIPELINE_PRESETS,
  type FullPipelineConfig,
  type PresetName,
} from "@/lib/pipeline/pipeline-config";
import { BENCHMARK_DOMAINS } from "@/lib/benchmark/domain-config";

// ─────────────────────────────────────────────────────────
// 메인 컴포넌트
// ─────────────────────────────────────────────────────────
export default function PipelineConfigPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const rawSlug = params?.workspace_slug as string;
  const workspaceSlug = rawSlug && rawSlug !== "undefined" ? rawSlug : "demo-brand-semantic-lab";
  const locale = (params?.locale as string) || "ko";
  const domainFromUrl = searchParams.get('domain') || "jeju_smb";

  const [wsId, setWsId] = useState("");
  const [selectedDomain, setSelectedDomain] = useState(domainFromUrl);
  const [config, setConfig] = useState<FullPipelineConfig>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [savedStages, setSavedStages] = useState<Set<string>>(new Set());
  const [expandedStages, setExpandedStages] = useState<Set<string>>(
    new Set(PIPELINE_STAGE_DEFINITIONS.map(s => s.key))
  );
  const [applyingPreset, setApplyingPreset] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);

  // 로컬 수정 상태 (아직 저장 안 된 것)
  const [localConfig, setLocalConfig] = useState<FullPipelineConfig>({});

  useEffect(() => {
    resolveWorkspaceSlug(workspaceSlug).then(id => {
      if (id) setWsId(id);
    });
  }, [workspaceSlug]);

  const loadConfig = useCallback(async () => {
    setLoading(true);
    try {
      const c = await getFullPipelineConfigAction(workspaceSlug, selectedDomain);
      setConfig(c);
      setLocalConfig(JSON.parse(JSON.stringify(c)));
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [workspaceSlug, selectedDomain]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const handleParamChange = (stageKey: string, paramKey: string, value: number | boolean | string | string[]) => {
    setLocalConfig(prev => ({
      ...prev,
      [stageKey]: {
        ...prev[stageKey],
        config: {
          ...prev[stageKey]?.config,
          [paramKey]: value,
        },
      },
    }));
  };

  const handleToggleEnabled = async (stageKey: string, enabled: boolean) => {
    setSaving(stageKey);
    await setStageConfigAction(workspaceSlug, selectedDomain, stageKey, localConfig[stageKey]?.config || {}, enabled);
    setLocalConfig(prev => ({
      ...prev,
      [stageKey]: { ...prev[stageKey], is_enabled: enabled },
    }));
    setSaving(null);
  };

  const handleSaveStage = async (stageKey: string) => {
    setSaving(stageKey);
    try {
      await setStageConfigAction(
        workspaceSlug,
        selectedDomain,
        stageKey,
        localConfig[stageKey]?.config || {},
        localConfig[stageKey]?.is_enabled ?? true
      );
      setSavedStages(prev => new Set([...prev, stageKey]));
      setTimeout(() => setSavedStages(prev => { const n = new Set(prev); n.delete(stageKey); return n; }), 2000);
    } finally {
      setSaving(null);
    }
  };

  const handleApplyPreset = async (preset: PresetName) => {
    setApplyingPreset(preset);
    try {
      await applyPresetAction(workspaceSlug, selectedDomain, preset);
      await loadConfig();
    } finally {
      setApplyingPreset(null);
    }
  };

  const handleReset = async () => {
    if (!confirm("모든 설정을 기본값으로 초기화하시겠습니까?")) return;
    setResetting(true);
    try {
      await resetPipelineConfigAction(workspaceSlug, selectedDomain);
      await loadConfig();
    } finally {
      setResetting(false);
    }
  };

  const toggleExpanded = (stageKey: string) => {
    setExpandedStages(prev => {
      const n = new Set(prev);
      if (n.has(stageKey)) n.delete(stageKey);
      else n.add(stageKey);
      return n;
    });
  };

  return (
    <div className="min-h-screen bg-[#0A0B0E] text-white">
      {/* 헤더 */}
      <div className="border-b border-white/10 px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <Settings className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">파이프라인 단계별 설정</h1>
              <p className="text-xs text-white/40">Pipeline Stage Configuration</p>
            </div>
          </div>
          <button
            onClick={handleReset}
            disabled={resetting}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-white/50 border border-white/10 hover:border-white/20 hover:text-white/70 transition-all"
          >
            {resetting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            기본값 초기화
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {/* 도메인 선택 */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <label className="text-xs text-white/50 mb-2 block">업종 도메인</label>
          <select
            value={selectedDomain}
            onChange={e => setSelectedDomain(e.target.value)}
            className="w-full bg-white/10 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-violet-500"
          >
            {Object.values(BENCHMARK_DOMAINS).map(d => (
              <option key={d.slug} value={d.slug} className="bg-[#1a1b1f]">
                {d.icon} {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* 프리셋 */}
        <div className="bg-white/5 rounded-xl p-4 border border-white/10">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium">빠른 프리셋 적용</span>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {(Object.entries(PIPELINE_PRESETS) as [PresetName, typeof PIPELINE_PRESETS[PresetName]][]).map(([key, preset]) => (
              <button
                key={key}
                onClick={() => handleApplyPreset(key)}
                disabled={applyingPreset !== null}
                className={`p-3 rounded-lg border text-left transition-all ${
                  applyingPreset === key
                    ? "border-violet-500 bg-violet-500/10"
                    : "border-white/10 hover:border-violet-500/50 hover:bg-white/5"
                }`}
              >
                <div className="text-sm font-medium mb-1">
                  {applyingPreset === key ? (
                    <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> 적용 중...</span>
                  ) : preset.name_ko}
                </div>
                <div className="text-xs text-white/40">{preset.description}</div>
              </button>
            ))}
          </div>
        </div>

        {/* 단계별 설정 */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-violet-400" />
          </div>
        ) : (
          <div className="space-y-4">
            {PIPELINE_STAGE_DEFINITIONS.map(stage => {
              const stageConf = localConfig[stage.key] || { config: {}, is_enabled: true };
              const isExpanded = expandedStages.has(stage.key);
              const isSaving = saving === stage.key;
              const isSaved = savedStages.has(stage.key);

              return (
                <div
                  key={stage.key}
                  className={`rounded-xl border transition-all ${
                    stageConf.is_enabled
                      ? "border-white/10 bg-white/5"
                      : "border-white/5 bg-white/2 opacity-60"
                  }`}
                >
                  {/* 단계 헤더 */}
                  <div className="flex items-center gap-3 p-4">
                    <span className="text-lg">{stage.icon}</span>
                    <button
                      onClick={() => toggleExpanded(stage.key)}
                      className="flex-1 flex items-center gap-2 text-left"
                    >
                      <div>
                        <div className="text-sm font-medium">{stage.name_ko}</div>
                        <div className="text-xs text-white/40 mt-0.5">{stage.description}</div>
                      </div>
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-white/40 ml-auto" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-white/40 ml-auto" />
                      )}
                    </button>

                    {/* 활성화 토글 */}
                    <button
                      onClick={() => handleToggleEnabled(stage.key, !stageConf.is_enabled)}
                      className={`flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all ${
                        stageConf.is_enabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-white/5 text-white/30 border border-white/10"
                      }`}
                    >
                      {stageConf.is_enabled ? (
                        <><CheckCircle className="w-3 h-3" /> 활성</>
                      ) : (
                        <><XCircle className="w-3 h-3" /> 비활성</>
                      )}
                    </button>
                  </div>

                  {/* 파라미터 편집 */}
                  {isExpanded && stageConf.is_enabled && (
                    <div className="px-4 pb-4 border-t border-white/5 pt-4 space-y-4">
                      {stage.params.map(param => {
                        const value = stageConf.config[param.key] ?? param.default;

                        return (
                          <div key={param.key}>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-xs text-white/70">{param.label}</label>
                              {param.type === "slider" && (
                                <span className="text-xs font-mono text-violet-400">
                                  {typeof value === "number" ? value : param.default}
                                </span>
                              )}
                            </div>

                            {param.type === "slider" && (
                              <div className="flex items-center gap-3">
                                <input
                                  type="range"
                                  min={param.min}
                                  max={param.max}
                                  step={param.step}
                                  value={typeof value === "number" ? value : (param.default as number)}
                                  onChange={e => handleParamChange(stage.key, param.key, Number(e.target.value))}
                                  className="flex-1 h-1.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-violet-500"
                                />
                              </div>
                            )}

                            {param.type === "boolean" && (
                              <button
                                onClick={() => handleParamChange(stage.key, param.key, !value)}
                                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                                  value ? "bg-violet-500" : "bg-white/10"
                                }`}
                              >
                                <span
                                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                                    value ? "translate-x-4" : "translate-x-0.5"
                                  }`}
                                />
                              </button>
                            )}

                            {param.type === "tags" && (
                              <div className="grid grid-cols-2 gap-2 mt-2 bg-white/5 p-3 rounded-lg border border-white/5 max-h-48 overflow-y-auto">
                                {(BENCHMARK_DOMAINS[selectedDomain as keyof typeof BENCHMARK_DOMAINS]?.brands || []).map(brand => {
                                  const listValue = Array.isArray(value) ? value : [];
                                  const isChecked = listValue.includes(brand.slug);
                                  return (
                                    <label key={brand.slug} className="flex items-center gap-2 text-xs text-white/70 hover:text-white cursor-pointer py-1">
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => {
                                          const newList = isChecked
                                            ? listValue.filter((s: string) => s !== brand.slug)
                                            : [...listValue, brand.slug];
                                          handleParamChange(stage.key, param.key, newList);
                                        }}
                                        className="rounded border-white/10 text-violet-500 focus:ring-0 focus:ring-offset-0 bg-[#1a1b1f]"
                                      />
                                      <span>{brand.name}</span>
                                    </label>
                                  );
                                })}
                              </div>
                            )}

                            {param.description && (
                              <p className="text-xs text-white/30 mt-1">{param.description}</p>
                            )}
                          </div>
                        );
                      })}

                      {/* 저장 버튼 */}
                      <div className="flex justify-end pt-2">
                        <button
                          onClick={() => handleSaveStage(stage.key)}
                          disabled={isSaving}
                          className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition-all ${
                            isSaved
                              ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                              : "bg-violet-500/20 text-violet-400 border border-violet-500/30 hover:bg-violet-500/30"
                          }`}
                        >
                          {isSaving ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : isSaved ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Save className="w-3.5 h-3.5" />
                          )}
                          {isSaved ? "저장됨" : isSaving ? "저장 중..." : "이 단계 저장"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 안내 */}
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
          <div className="flex items-start gap-2">
            <Layers className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
            <div className="text-xs text-white/50 leading-relaxed">
              설정은 다음 E2E 파이프라인 실행 시 반영됩니다.
              오케스트레이션 페이지에서 실행하면 이 설정이 자동으로 로드됩니다.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
