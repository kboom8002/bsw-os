/**
 * lib/fix-it/patch-executor.ts
 *
 * ⑤ 패치 자동 적용기 + 롤백.
 * 승인된 PatchTicket을 실제 Supabase 데이터에 적용합니다.
 *
 * 지원 패치 유형:
 *   ssot_update         → brand_operational_truths UPDATE
 *   answer_card_create  → semantic_pages INSERT
 *   answer_card_update  → semantic_pages UPDATE
 *   boundary_rule_add   → boundary_rules INSERT
 *   expected_layer_update → expected_layers UPDATE (메타데이터 기반)
 *   content_restructure → semantic_pages + page_sections 복합 처리
 *   schema_markup_fix   → (schema_mappings — 향후 구현)
 */

import { getSupabaseAdminClient } from '../supabase';
import type { PatchTicket, PatchResult, PatchType } from './types';

export class PatchExecutor {
  /**
   * 승인된 패치 티켓을 실제 데이터에 적용합니다.
   *
   * @param workspaceId   워크스페이스 ID
   * @param patchTicket   적용할 패치 티켓 객체
   * @returns PatchResult
   */
  async execute(workspaceId: string, patchTicket: PatchTicket): Promise<PatchResult> {
    const appliedAt = new Date().toISOString();

    if (patchTicket.status !== 'approved') {
      return {
        patch_ticket_id: patchTicket.id,
        success: false,
        applied_at: appliedAt,
        error_message: `패치 상태가 'approved'가 아닙니다: ${patchTicket.status}`,
        rollback_available: false,
      };
    }

    try {
      await this._applyPatch(workspaceId, patchTicket);

      return {
        patch_ticket_id: patchTicket.id,
        success: true,
        applied_at: appliedAt,
        rollback_available: true,
      };
    } catch (err: any) {
      console.error(`[PatchExecutor] execute error: ${err.message}`);
      return {
        patch_ticket_id: patchTicket.id,
        success: false,
        applied_at: appliedAt,
        error_message: err.message,
        rollback_available: false,
      };
    }
  }

  /**
   * 패치를 롤백합니다 (original_payload가 있어야 합니다).
   */
  async rollback(workspaceId: string, patchTicket: PatchTicket): Promise<void> {
    if (!patchTicket.original_payload) {
      throw new Error('[PatchExecutor] 롤백을 위한 original_payload가 없습니다.');
    }

    const supabase = getSupabaseAdminClient();
    const payload = patchTicket.patch_payload;
    const original = patchTicket.original_payload;

    switch (patchTicket.patch_type) {
      case 'ssot_update': {
        const { error } = await supabase
          .from('brand_operational_truths')
          .update(original)
          .eq('id', payload.target_id)
          .eq('workspace_id', workspaceId);
        if (error) throw new Error(`ssot rollback: ${error.message}`);
        break;
      }
      case 'answer_card_create': {
        const { error } = await supabase
          .from('semantic_pages')
          .delete()
          .eq('id', original.inserted_id)
          .eq('workspace_id', workspaceId);
        if (error) throw new Error(`answer_card rollback: ${error.message}`);
        break;
      }
      case 'answer_card_update': {
        const { error } = await supabase
          .from('semantic_pages')
          .update(original)
          .eq('id', payload.target_id)
          .eq('workspace_id', workspaceId);
        if (error) throw new Error(`answer_card_update rollback: ${error.message}`);
        break;
      }
      case 'boundary_rule_add': {
        const { error } = await supabase
          .from('boundary_rules')
          .delete()
          .eq('id', original.inserted_id)
          .eq('workspace_id', workspaceId);
        if (error) throw new Error(`boundary_rule rollback: ${error.message}`);
        break;
      }
      default:
        throw new Error(`[PatchExecutor] 롤백이 구현되지 않은 패치 유형: ${patchTicket.patch_type}`);
    }

    console.info(`[PatchExecutor] 롤백 완료: ${patchTicket.id} (${patchTicket.patch_type})`);
  }

  // ─────────────────────────────────────────
  // Private — 패치 유형별 실행 로직
  // ─────────────────────────────────────────

  private async _applyPatch(workspaceId: string, ticket: PatchTicket): Promise<void> {
    switch (ticket.patch_type) {
      case 'ssot_update':
        await this._patchSsotUpdate(workspaceId, ticket);
        break;
      case 'answer_card_create':
        await this._patchAnswerCardCreate(workspaceId, ticket);
        break;
      case 'answer_card_update':
        await this._patchAnswerCardUpdate(workspaceId, ticket);
        break;
      case 'boundary_rule_add':
        await this._patchBoundaryRuleAdd(workspaceId, ticket);
        break;
      case 'expected_layer_update':
        await this._patchExpectedLayerUpdate(workspaceId, ticket);
        break;
      case 'content_restructure':
        await this._patchContentRestructure(workspaceId, ticket);
        break;
      case 'schema_markup_fix':
        // schema_mappings 테이블 수정 — 향후 구현
        console.warn('[PatchExecutor] schema_markup_fix는 아직 자동화가 구현되지 않았습니다.');
        break;
      default:
        throw new Error(`[PatchExecutor] 알 수 없는 패치 유형: ${ticket.patch_type}`);
    }
  }

  private async _patchSsotUpdate(workspaceId: string, ticket: PatchTicket): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { target_id, updates } = ticket.patch_payload;

    if (!target_id || !updates) {
      throw new Error('ssot_update: target_id와 updates가 필요합니다.');
    }

    const { error } = await supabase
      .from('brand_operational_truths')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', target_id)
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(`ssot_update 실패: ${error.message}`);
    console.info(`[PatchExecutor] ssot_update 적용: ${target_id}`);
  }

  private async _patchAnswerCardCreate(workspaceId: string, ticket: PatchTicket): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { page_data } = ticket.patch_payload;

    if (!page_data) {
      throw new Error('answer_card_create: page_data가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('semantic_pages')
      .insert({ ...page_data, workspace_id: workspaceId, created_at: new Date().toISOString() })
      .select('id')
      .single();

    if (error) throw new Error(`answer_card_create 실패: ${error.message}`);

    // 롤백을 위해 삽입된 ID 기록
    if (ticket.original_payload) {
      ticket.original_payload.inserted_id = data.id;
    }
    console.info(`[PatchExecutor] answer_card_create 적용: ${data.id}`);
  }

  private async _patchAnswerCardUpdate(workspaceId: string, ticket: PatchTicket): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { target_id, updates } = ticket.patch_payload;

    if (!target_id || !updates) {
      throw new Error('answer_card_update: target_id와 updates가 필요합니다.');
    }

    const { error } = await supabase
      .from('semantic_pages')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', target_id)
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(`answer_card_update 실패: ${error.message}`);
    console.info(`[PatchExecutor] answer_card_update 적용: ${target_id}`);
  }

  private async _patchBoundaryRuleAdd(workspaceId: string, ticket: PatchTicket): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { rule_data } = ticket.patch_payload;

    if (!rule_data) {
      throw new Error('boundary_rule_add: rule_data가 필요합니다.');
    }

    const { data, error } = await supabase
      .from('boundary_rules')
      .insert({ ...rule_data, workspace_id: workspaceId, created_at: new Date().toISOString() })
      .select('id')
      .single();

    if (error) throw new Error(`boundary_rule_add 실패: ${error.message}`);

    if (ticket.original_payload) {
      ticket.original_payload.inserted_id = data.id;
    }
    console.info(`[PatchExecutor] boundary_rule_add 적용: ${data.id}`);
  }

  private async _patchExpectedLayerUpdate(workspaceId: string, ticket: PatchTicket): Promise<void> {
    // expected_layers는 ai_observation_runs의 run_metadata에 포함된 것으로 처리
    const supabase = getSupabaseAdminClient();
    const { observation_run_id, expected_layer_updates } = ticket.patch_payload;

    if (!observation_run_id || !expected_layer_updates) {
      throw new Error('expected_layer_update: observation_run_id와 expected_layer_updates가 필요합니다.');
    }

    const { data: run } = await supabase
      .from('ai_observation_runs')
      .select('run_metadata')
      .eq('id', observation_run_id)
      .eq('workspace_id', workspaceId)
      .single();

    if (!run) throw new Error('expected_layer_update: observation run을 찾을 수 없습니다.');

    const updatedMetadata = {
      ...(run.run_metadata || {}),
      expected_layer: {
        ...((run.run_metadata as any)?.expected_layer || {}),
        ...expected_layer_updates,
        updated_at: new Date().toISOString(),
      },
    };

    const { error } = await supabase
      .from('ai_observation_runs')
      .update({ run_metadata: updatedMetadata })
      .eq('id', observation_run_id)
      .eq('workspace_id', workspaceId);

    if (error) throw new Error(`expected_layer_update 실패: ${error.message}`);
    console.info(`[PatchExecutor] expected_layer_update 적용: ${observation_run_id}`);
  }

  private async _patchContentRestructure(workspaceId: string, ticket: PatchTicket): Promise<void> {
    const supabase = getSupabaseAdminClient();
    const { target_page_id, visible_content, sections } = ticket.patch_payload;

    if (!target_page_id) {
      throw new Error('content_restructure: target_page_id가 필요합니다.');
    }

    // 페이지 콘텐츠 업데이트
    if (visible_content) {
      const { error } = await supabase
        .from('semantic_pages')
        .update({ visible_content, source_content: visible_content, updated_at: new Date().toISOString() })
        .eq('id', target_page_id)
        .eq('workspace_id', workspaceId);
      if (error) throw new Error(`content_restructure page update 실패: ${error.message}`);
    }

    // 섹션 업데이트 (배열)
    if (Array.isArray(sections)) {
      for (const section of sections) {
        if (section.id) {
          await supabase
            .from('page_sections')
            .update({ content_body: section.content_body })
            .eq('id', section.id)
            .eq('workspace_id', workspaceId);
        } else {
          await supabase
            .from('page_sections')
            .insert({ ...section, workspace_id: workspaceId, semantic_page_id: target_page_id });
        }
      }
    }

    console.info(`[PatchExecutor] content_restructure 적용: ${target_page_id}`);
  }
}
