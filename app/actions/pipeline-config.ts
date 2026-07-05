"use server";

/**
 * app/actions/pipeline-config.ts
 * 파이프라인 설정 서버 액션
 */

import { requireAuthOrDemo, checkWorkspacePermissionOrDemo } from '@/lib/auth';
import {
  PipelineConfigManager,
  PIPELINE_STAGE_DEFINITIONS,
  PIPELINE_PRESETS,
  type StageConfig,
  type PresetName,
} from '@/lib/pipeline/pipeline-config';
import { resolveWorkspaceSlug } from './workspace';

// ─────────────────────────────────────────────────────────
// 단계 정의 조회 (UI 메타데이터)
// ─────────────────────────────────────────────────────────
export async function getPipelineStageDefinitions() {
  return PIPELINE_STAGE_DEFINITIONS;
}

export async function getPipelinePresets() {
  return PIPELINE_PRESETS;
}

// ─────────────────────────────────────────────────────────
// 전체 설정 조회
// ─────────────────────────────────────────────────────────
export async function getFullPipelineConfigAction(
  workspaceSlug: string,
  domainKey: string
) {
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) throw new Error('워크스페이스를 찾을 수 없습니다.');
  return PipelineConfigManager.getFullPipelineConfig(workspaceId, domainKey);
}

// ─────────────────────────────────────────────────────────
// 단계별 설정 저장
// ─────────────────────────────────────────────────────────
export async function setStageConfigAction(
  workspaceSlug: string,
  domainKey: string,
  stageKey: string,
  config: Partial<StageConfig>,
  is_enabled?: boolean
) {
  const userId = await requireAuthOrDemo();
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) throw new Error('워크스페이스를 찾을 수 없습니다.');

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    'owner', 'admin', 'semantic_architect',
  ]);
  if (!isAuthorized) throw new Error('권한이 없습니다.');

  await PipelineConfigManager.setStageConfig(workspaceId, domainKey, stageKey, config, is_enabled);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────
// 프리셋 적용
// ─────────────────────────────────────────────────────────
export async function applyPresetAction(
  workspaceSlug: string,
  domainKey: string,
  preset: PresetName
) {
  const userId = await requireAuthOrDemo();
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) throw new Error('워크스페이스를 찾을 수 없습니다.');

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    'owner', 'admin', 'semantic_architect',
  ]);
  if (!isAuthorized) throw new Error('권한이 없습니다.');

  await PipelineConfigManager.applyPreset(workspaceId, domainKey, preset);
  return { ok: true };
}

// ─────────────────────────────────────────────────────────
// 기본값 초기화
// ─────────────────────────────────────────────────────────
export async function resetPipelineConfigAction(
  workspaceSlug: string,
  domainKey: string
) {
  const userId = await requireAuthOrDemo();
  const workspaceId = await resolveWorkspaceSlug(workspaceSlug);
  if (!workspaceId) throw new Error('워크스페이스를 찾을 수 없습니다.');

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, ['owner', 'admin']);
  if (!isAuthorized) throw new Error('권한이 없습니다.');

  await PipelineConfigManager.resetAllToDefaults(workspaceId, domainKey);
  return { ok: true };
}
