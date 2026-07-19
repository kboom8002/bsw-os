"use server";

import { getSupabaseAdminClient } from '../../lib/supabase';
import { createClient } from '../../lib/supabase/server';
import { requireAuthOrDemo, checkWorkspacePermissionOrDemo } from '../../lib/auth';
import { WORKSPACE_ROLES } from '../../lib/schema';
import { env } from '../../lib/env';

// ────────────────────────────────────────────────────────────────
// 1. 현재 인증된 사용자 정보 반환
// ────────────────────────────────────────────────────────────────
export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { id: user.id, email: user.email || '' };
  }

  return null;
}

// ────────────────────────────────────────────────────────────────
// 2. 사용자가 소속된 워크스페이스 목록 조회
// ────────────────────────────────────────────────────────────────
export async function getUserWorkspaces(): Promise<
  Array<{ id: string; name: string; slug: string; role: string; workspace_type: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return [];
  }

  const userId = user.id;
  const adminClient = getSupabaseAdminClient();

  // Super Admin Auto-membership check via platform_admins table
  const { data: adminRow } = await adminClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  const isSuper = !!adminRow;
  if (isSuper) {
    const { data: allWs } = await adminClient
      .from('workspaces')
      .select('id, name, slug, workspace_type');

    if (allWs && allWs.length > 0) {
      const upsertPayload = allWs.map(ws => ({
        workspace_id: ws.id,
        user_id: userId,
        role: 'owner'
      }));

      await adminClient
        .from('workspace_memberships')
        .upsert(upsertPayload, { onConflict: 'workspace_id,user_id' });

      return allWs.map(ws => ({
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        role: 'owner',
        workspace_type: ws.workspace_type ?? 'brand'
      }));
    }
  }

  const { data, error } = await adminClient
    .from('workspace_memberships')
    .select('role, workspaces(id, name, slug, workspace_type)')
    .eq('user_id', userId);

  if (error) {
    console.error('[getUserWorkspaces] 워크스페이스 조회 실패:', error.message);
    return [];
  }

  // Supabase 중첩 select 결과를 평탄화
  const workspaces = (data ?? [])
    .filter((row: { role: string; workspaces: unknown }) => row.workspaces != null)
    .map((row: { role: string; workspaces: unknown }) => {
      const wsArray = Array.isArray(row.workspaces) ? row.workspaces : [row.workspaces];
      const ws = wsArray[0] as { id: string; name: string; slug: string; workspace_type?: string };
      return {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        role: row.role,
        workspace_type: ws.workspace_type ?? 'brand'
      };
    });

  // 워크스페이스가 없는 경우 슈퍼 관리자 자동 생성 시도
  if (workspaces.length === 0 && isSuper) {
    const created = await ensureSuperAdminWorkspace(userId, user.email || '');
    if (created) {
      return [{ ...created, workspace_type: 'main' }];
    }
  }

  return workspaces;
}

// ────────────────────────────────────────────────────────────────
// 3. 슈퍼 관리자 전용 워크스페이스 자동 생성
// ────────────────────────────────────────────────────────────────
export async function ensureSuperAdminWorkspace(
  userId: string,
  email: string,
): Promise<{ id: string; name: string; slug: string; role: string; workspace_type: string } | null> {
  const adminClient = getSupabaseAdminClient();

  // platform_admins 테이블에서 권한 확인
  const { data: adminRow } = await adminClient
    .from('platform_admins')
    .select('user_id')
    .eq('user_id', userId)
    .maybeSingle();

  if (!adminRow) {
    return null;
  }

  // 기존 bsw-main 워크스페이스 존재 확인
  const { data: existing } = await adminClient
    .from('workspaces')
    .select('id, name, slug, workspace_type')
    .eq('slug', 'bsw-main')
    .maybeSingle();

  let workspaceId: string;

  if (existing) {
    workspaceId = existing.id;
  } else {
    // 워크스페이스 생성
    const { data: created, error: createError } = await adminClient
      .from('workspaces')
      .insert({ name: 'BSW Main Workspace', slug: 'bsw-main', workspace_type: 'main' })
      .select('id')
      .single();

    if (createError || !created) {
      console.error('[ensureSuperAdminWorkspace] 워크스페이스 생성 실패:', createError?.message);
      return null;
    }

    workspaceId = created.id;
  }

  // 멤버십 upsert (중복 방지)
  const { error: memberError } = await adminClient
    .from('workspace_memberships')
    .upsert(
      { workspace_id: workspaceId, user_id: userId, role: 'owner' },
      { onConflict: 'workspace_id,user_id' },
    );

  if (memberError) {
    console.error('[ensureSuperAdminWorkspace] 멤버십 생성 실패:', memberError.message);
    return null;
  }

  return {
    id: workspaceId,
    name: 'BSW Main Workspace',
    slug: 'bsw-main',
    role: 'owner',
    workspace_type: 'main'
  };
}

// ────────────────────────────────────────────
// 4. 감사(Audit) 실행 기록 삭제
// ────────────────────────────────────────────
export async function deleteAuditRun(runId: string): Promise<boolean> {
  await requireAuthOrDemo();

  const adminClient = getSupabaseAdminClient();

  const { error } = await adminClient
    .from('pipeline_runs')
    .delete()
    .eq('id', runId);

  if (error) {
    console.error('[deleteAuditRun] 삭제 실패:', error.message);
    return false;
  }

  return true;
}

// ────────────────────────────────────────────
// 5. 감사(Audit) 실행 히스토리 조회
// ────────────────────────────────────────────
export async function getAuditRunHistory(
  workspaceId: string,
  options?: { type?: string; limit?: number },
): Promise<any[]> {
  const userId = await requireAuthOrDemo();
  const hasPermission = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    ...WORKSPACE_ROLES,
  ]);

  if (!hasPermission) {
    console.error('[getAuditRunHistory] 워크스페이스 접근 권한 없음');
    return [];
  }

  const adminClient = getSupabaseAdminClient();
  const limit = options?.limit ?? 50;

  let query = adminClient
    .from('pipeline_runs')
    .select(
      'id, pipeline_type, domain_key, brand_slug, status, phase_detail, result_summary, error_message, started_at, completed_at, duration_ms',
    )
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
    .limit(limit);

  if (options?.type) {
    query = query.eq('pipeline_type', options.type);
  }

  const { data, error } = await query;

  if (error) {
    console.error('[getAuditRunHistory] 조회 실패:', error.message);
    return [];
  }

  return data ?? [];
}

// ────────────────────────────────────────────
// 6. 워크스페이스 slug → UUID 해석 (서버 액션)
// ────────────────────────────────────────────
export async function resolveWorkspaceSlug(slug: string): Promise<string | null> {
  // Guard: undefined/empty slug → 첫 번째 워크스페이스 반환
  if (!slug || slug === 'undefined' || slug === 'null' || slug.trim() === '') {
    try {
      const adminClient = getSupabaseAdminClient();
      const { data } = await adminClient
        .from('workspaces')
        .select('id')
        .limit(1)
        .maybeSingle();
      if (data?.id) {
        console.log(`[resolveWorkspaceSlug] slug 없음 → 첫 번째 워크스페이스 사용: ${data.id}`);
        return data.id;
      }
    } catch {
      return null;
    }
    return null;
  }

  const adminClient = getSupabaseAdminClient();
  const { data, error } = await adminClient
    .from('workspaces')
    .select('id')
    .eq('slug', slug)
    .maybeSingle();

  if (error || !data) {
    console.warn(`[resolveWorkspaceSlug] 워크스페이스 '${slug}' 해석 실패:`, error?.message);
    return null;
  }

  return data.id;
}

/**
 * Derive the industry key for a workspace.
 * Strategy: check workspace slug → match against BENCHMARK_DOMAINS keys.
 * Fallback: check workspace name for industry hints.
 */
export async function getWorkspaceIndustryKey(workspaceId: string): Promise<string | null> {
  const { BENCHMARK_DOMAINS } = await import("../../lib/benchmark/domain-config");
  const adminClient = getSupabaseAdminClient();

  const { data: workspace } = await adminClient
    .from('workspaces')
    .select('slug, name')
    .eq('id', workspaceId)
    .maybeSingle();

  if (!workspace) return null;

  const allKeys = Object.keys(BENCHMARK_DOMAINS);

  // 1차: slug 자체가 industryKey와 일치하는지 확인
  if (workspace.slug && allKeys.includes(workspace.slug)) {
    return workspace.slug;
  }

  // 2차: slug에 industryKey가 포함되어 있는지 확인
  for (const key of allKeys) {
    if (workspace.slug?.includes(key)) return key;
  }

  // 3차: workspace name에서 매칭
  const nameHints: Record<string, string> = {
    '제주': 'jeju_smb',
    'jeju': 'jeju_smb',
    '스킨케어': 'skincare',
    'skincare': 'skincare',
    '웨딩': 'wedding_studio',
    'wedding': 'wedding_studio',
    '아이돌': 'kpop_idol_ko',
    'kpop': 'kpop_idol_ko',
  };

  if (workspace.name) {
    const lower = workspace.name.toLowerCase();
    for (const [hint, key] of Object.entries(nameHints)) {
      if (lower.includes(hint.toLowerCase())) return key;
    }
  }

  // 4차: 첫 번째 도메인 설정 반환 (fallback)
  return allKeys.length > 0 ? allKeys[0] : null;
}
