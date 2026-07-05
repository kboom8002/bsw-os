/**
 * lib/pipeline/pipeline-config.ts
 *
 * 파이프라인 단계별 설정 관리자.
 * DB(pipeline_stage_configs)에서 설정을 읽고 쓰며, 기본값으로 폴백합니다.
 */

import { getSupabaseAdminClient } from '../supabase';

// ─────────────────────────────────────────────────────────
// 타입 정의
// ─────────────────────────────────────────────────────────

export interface StageConfig {
  [key: string]: number | boolean | string | string[];
}

export interface PipelineStageDefinition {
  key: string;
  name_ko: string;
  description: string;
  icon: string;
  params: Array<{
    key: string;
    label: string;
    type: 'number' | 'boolean' | 'slider' | 'tags';
    default: number | boolean | string | string[];
    min?: number;
    max?: number;
    step?: number;
    description?: string;
  }>;
}

export interface FullPipelineConfig {
  [stageKey: string]: {
    config: StageConfig;
    is_enabled: boolean;
  };
}

// ─────────────────────────────────────────────────────────
// 단계 정의 (UI 렌더링용 메타데이터)
// ─────────────────────────────────────────────────────────

export const PIPELINE_STAGE_DEFINITIONS: PipelineStageDefinition[] = [
  {
    key: 'phase0_bootstrap',
    name_ko: 'Phase 0: TCO/KG 부트스트랩',
    description: 'TCO 전략 개념과 지식 그래프 온톨로지를 자동 생성합니다.',
    icon: '🏗️',
    params: [
      { key: 'tco_count', label: 'TCO 개념 생성 수', type: 'slider', default: 20, min: 2, max: 50, step: 1 },
      { key: 'kg_max_nodes', label: 'KG 노드 최대 수', type: 'slider', default: 50, min: 10, max: 200, step: 5 },
    ],
  },
  {
    key: 'phase0_5_external',
    name_ko: 'Phase 0.5: 외부 시그널 수집',
    description: '네이버 뉴스, DataLab, RSS, 커뮤니티에서 실시간 시그널을 수집합니다.',
    icon: '📡',
    params: [
      { key: 'max_news_items', label: '뉴스 수집 최대 건수', type: 'slider', default: 10, min: 3, max: 30, step: 1 },
      { key: 'max_community_items', label: '커뮤니티 수집 최대 건수', type: 'slider', default: 15, min: 5, max: 30, step: 1 },
      { key: 'bridge_convert_enabled', label: '외부 → 질문 시그널 직접 변환', type: 'boolean', default: true },
      { key: 'volume_enrichment_enabled', label: '트렌드 기반 볼륨 보정', type: 'boolean', default: true },
    ],
  },
  {
    key: 'phase1_sogde',
    name_ko: 'Phase 1: S-OGDE v3.0 시그널 생성',
    description: 'LLM 5-Lens 메타 질문, 탐색 체인, 재귀 심화로 질문 시그널을 생성합니다.',
    icon: '🔍',
    params: [
      { key: 'chain_depth', label: '탐색 체인 깊이', type: 'slider', default: 3, min: 1, max: 5, step: 1, description: '깊을수록 더 많은 시그널 생성 (LLM 비용↑)' },
      { key: 'recursive_max_depth', label: '재귀 심화 깊이', type: 'slider', default: 3, min: 1, max: 5, step: 1 },
      { key: 'recursive_branch_factor', label: '재귀 분기 인자', type: 'slider', default: 3, min: 2, max: 5, step: 1 },
      { key: 'dedup_threshold', label: '시맨틱 중복 임계 (0~1)', type: 'slider', default: 0.85, min: 0.7, max: 0.95, step: 0.05 },
      { key: 'repeat_eval', label: '평가 반복 횟수 (불확실성 정량화)', type: 'slider', default: 1, min: 1, max: 3, step: 1 },
    ],
  },
  {
    key: 'phase1b_brandRotation',
    name_ko: 'Phase 1-B: 브랜드 순회 특화',
    description: '업종 내 등록된 브랜드를 순회하며 특화 시그널을 기본 생성합니다. 일일 $10 허용 비용 한도를 가집니다.',
    icon: '🏷️',
    params: [
      { key: 'rotation_top_n', label: '순회 브랜드 수', type: 'slider', default: 5, min: 1, max: 15, step: 1 },
      { key: 'selected_brands', label: '순회 대상 브랜드 목록', type: 'tags', default: [] },
      { key: 'daily_cost_limit', label: '일일 허용 비용 ($)', type: 'slider', default: 10.0, min: 1.0, max: 50.0, step: 0.5 },
    ],
  },
  {
    key: 'phase2_1_reportGaps',
    name_ko: 'Phase 2.1: 업종 리포트 약점 피딩',
    description: '업종 리포트의 AEPI 하위 브랜드 약점을 분석하여 시그널로 자동 연계합니다.',
    icon: '📊',
    params: [
      { key: 'weak_aepi_threshold', label: 'AEPI 약점 임계점', type: 'slider', default: 40, min: 20, max: 60, step: 5 },
    ],
  },
  {
    key: 'phase2_6_deepDiveEnrich',
    name_ko: 'Phase 2.6: 딥다이브 심층 강화',
    description: '최근 30일 이내에 완료된 딥다이브 세션의 per-engine 분석을 활용하여 질문 자산을 보강합니다.',
    icon: '🔬',
    params: [
      { key: 'bsf_threshold', label: 'BSF 약점 임계점', type: 'slider', default: 20, min: 5, max: 40, step: 5 },
      { key: 'auto_promote', label: '딥다이브 시그널 자동 승격', type: 'boolean', default: true },
    ],
  },
  {
    key: 'phase3_promotion',
    name_ko: 'Phase 3: CPS×MMR 질문 승격',
    description: 'CPS 점수 기반 상위 N개를 MMR 다양성으로 선발하여 Canonical Question으로 승격합니다.',
    icon: '💎',
    params: [
      { key: 'auto_promote_top_n', label: '자동 승격 시그널 수', type: 'slider', default: 5, min: 1, max: 20, step: 1 },
      { key: 'mmr_lambda', label: 'MMR λ (관련도 vs 다양성)', type: 'slider', default: 0.7, min: 0.3, max: 1.0, step: 0.1, description: '1.0 = 관련도만, 0.3 = 다양성 우선' },
      { key: 'auto_create_scene', label: 'QIS Scene 자동 생성', type: 'boolean', default: true },
      { key: 'auto_create_claim', label: 'Claim Node 자동 생성', type: 'boolean', default: true },
    ],
  },
];

// ─────────────────────────────────────────────────────────
// 기본값 맵
// ─────────────────────────────────────────────────────────

export const DEFAULT_STAGE_CONFIGS: Record<string, StageConfig> = {};
for (const stage of PIPELINE_STAGE_DEFINITIONS) {
  const defaults: StageConfig = {};
  for (const param of stage.params) {
    defaults[param.key] = param.default;
  }
  DEFAULT_STAGE_CONFIGS[stage.key] = defaults;
}

// ─────────────────────────────────────────────────────────
// 프리셋 정의
// ─────────────────────────────────────────────────────────

export type PresetName = 'light' | 'standard' | 'deep';

export const PIPELINE_PRESETS: Record<PresetName, { name_ko: string; description: string; overrides: Record<string, Partial<StageConfig>> }> = {
  light: {
    name_ko: 'Light (빠름)',
    description: '핵심 시그널만 빠르게 생성. LLM 비용 최소화.',
    overrides: {
      phase1_sogde: { chain_depth: 2, recursive_max_depth: 2, recursive_branch_factor: 2 },
      phase3_promotion: { auto_promote_top_n: 3 },
    },
  },
  standard: {
    name_ko: 'Standard (기본)',
    description: '기본 설정. 품질과 속도의 균형.',
    overrides: {
      phase1_sogde: { chain_depth: 3, recursive_max_depth: 3, recursive_branch_factor: 3 },
      phase3_promotion: { auto_promote_top_n: 5 },
    },
  },
  deep: {
    name_ko: 'Deep (정밀)',
    description: '최대 시그널 품질. LLM 비용 높음, 5~8분 소요.',
    overrides: {
      phase1_sogde: { chain_depth: 4, recursive_max_depth: 4, recursive_branch_factor: 4, repeat_eval: 3 },
      phase3_promotion: { auto_promote_top_n: 10 },
    },
  },
};

// ─────────────────────────────────────────────────────────
// PipelineConfigManager
// ─────────────────────────────────────────────────────────

export class PipelineConfigManager {
  /**
   * 단계별 설정 조회 (DB → 기본값 fallback)
   */
  static async getStageConfig(
    workspaceId: string,
    domainKey: string,
    stageKey: string
  ): Promise<{ config: StageConfig; is_enabled: boolean }> {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('pipeline_stage_configs')
        .select('config, is_enabled')
        .eq('workspace_id', workspaceId)
        .eq('domain_key', domainKey)
        .eq('stage_key', stageKey)
        .maybeSingle();

      if (data) {
        return {
          config: { ...DEFAULT_STAGE_CONFIGS[stageKey] || {}, ...(data.config as StageConfig) },
          is_enabled: data.is_enabled ?? true,
        };
      }
    } catch {
      // DB 오류 시 기본값 반환
    }

    return {
      config: { ...(DEFAULT_STAGE_CONFIGS[stageKey] || {}) },
      is_enabled: true,
    };
  }

  /**
   * 단계별 설정 저장 (upsert)
   */
  static async setStageConfig(
    workspaceId: string,
    domainKey: string,
    stageKey: string,
    config: Partial<StageConfig>,
    is_enabled?: boolean
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();
    await supabase
      .from('pipeline_stage_configs')
      .upsert({
        workspace_id: workspaceId,
        domain_key: domainKey,
        stage_key: stageKey,
        config,
        ...(is_enabled !== undefined ? { is_enabled } : {}),
        updated_at: new Date().toISOString(),
      }, { onConflict: 'workspace_id,domain_key,stage_key' });
  }

  /**
   * 전체 파이프라인 설정 조회 (모든 단계)
   */
  static async getFullPipelineConfig(
    workspaceId: string,
    domainKey: string
  ): Promise<FullPipelineConfig> {
    try {
      const supabase = getSupabaseAdminClient();
      const { data } = await supabase
        .from('pipeline_stage_configs')
        .select('stage_key, config, is_enabled')
        .eq('workspace_id', workspaceId)
        .eq('domain_key', domainKey);

      const result: FullPipelineConfig = {};

      // 모든 정의된 단계에 대해 기본값 설정
      for (const stage of PIPELINE_STAGE_DEFINITIONS) {
        const dbRow = data?.find(r => r.stage_key === stage.key);
        result[stage.key] = {
          config: {
            ...DEFAULT_STAGE_CONFIGS[stage.key],
            ...(dbRow?.config as StageConfig || {}),
          },
          is_enabled: dbRow?.is_enabled ?? true,
        };
      }

      return result;
    } catch {
      // 폴백: 전부 기본값
      const result: FullPipelineConfig = {};
      for (const stage of PIPELINE_STAGE_DEFINITIONS) {
        result[stage.key] = { config: { ...DEFAULT_STAGE_CONFIGS[stage.key] }, is_enabled: true };
      }
      return result;
    }
  }

  /**
   * 프리셋 적용
   */
  static async applyPreset(
    workspaceId: string,
    domainKey: string,
    preset: PresetName
  ): Promise<void> {
    const presetDef = PIPELINE_PRESETS[preset];
    const supabase = getSupabaseAdminClient();

    for (const [stageKey, overrides] of Object.entries(presetDef.overrides)) {
      const current = DEFAULT_STAGE_CONFIGS[stageKey] || {};
      await supabase
        .from('pipeline_stage_configs')
        .upsert({
          workspace_id: workspaceId,
          domain_key: domainKey,
          stage_key: stageKey,
          config: { ...current, ...overrides },
          updated_at: new Date().toISOString(),
        }, { onConflict: 'workspace_id,domain_key,stage_key' });
    }
  }

  /**
   * 설정 초기화 (도메인 전체)
   */
  static async resetAllToDefaults(
    workspaceId: string,
    domainKey: string
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();
    await supabase
      .from('pipeline_stage_configs')
      .delete()
      .eq('workspace_id', workspaceId)
      .eq('domain_key', domainKey);
  }
}
