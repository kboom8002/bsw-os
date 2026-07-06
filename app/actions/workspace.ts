"use server";

import { getSupabaseAdminClient } from '../../lib/supabase';
import { createClient } from '../../lib/supabase/server';
import { requireAuthOrDemo, checkWorkspacePermissionOrDemo } from '../../lib/auth';
import { WORKSPACE_ROLES } from '../../lib/schema';
import { env } from '../../lib/env';

// ────────────────────────────────────────────
// 1. 현재 인증된 사용자 정보 반환
// ────────────────────────────────────────────
export async function getCurrentUser(): Promise<{ id: string; email: string } | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    return { id: user.id, email: user.email || '' };
  }

  // 데모 모드일 경우 가상 사용자 반환
  if (env.DEMO_MODE === 'true') {
    return {
      id: 'demo-user-00000000-0000-4000-a000-000000000000',
      email: 'demo@bsw-os.local',
    };
  }

  return null;
}

// ────────────────────────────────────────────
// 2. 사용자가 소속된 워크스페이스 목록 조회
// ────────────────────────────────────────────
export async function getUserWorkspaces(): Promise<
  Array<{ id: string; name: string; slug: string; role: string }>
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // 데모 모드 — 인증 없이 데모 워크스페이스 반환
  if (!user) {
    if (env.DEMO_MODE === 'true') {
      return [
        {
          id: 'demo-ws',
          name: 'Demo Brand Semantic Lab',
          slug: 'demo-brand-semantic-lab',
          role: 'owner',
        },
      ];
    }
    return [];
  }

  const userId = user.id;
  const adminClient = getSupabaseAdminClient();

  // Super Admin Auto-membership check
  const isSuper = user.email === 'kboom8002@gmail.com';
  if (isSuper) {
    const { data: allWs } = await adminClient
      .from('workspaces')
      .select('id, name, slug');

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
        role: 'owner'
      }));
    }
  }

  const { data, error } = await adminClient
    .from('workspace_memberships')
    .select('role, workspaces(id, name, slug)')
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
      const ws = wsArray[0] as { id: string; name: string; slug: string };
      return {
        id: ws.id,
        name: ws.name,
        slug: ws.slug,
        role: row.role,
      };
    });

  // 워크스페이스가 없는 경우 슈퍼 관리자 자동 생성 시도
  if (workspaces.length === 0) {
    const created = await ensureSuperAdminWorkspace(userId, user.email || '');
    if (created) {
      return [created];
    }
  }

  return workspaces;
}

// ────────────────────────────────────────────
// 3. 슈퍼 관리자 전용 워크스페이스 자동 생성
// ────────────────────────────────────────────
export async function ensureSuperAdminWorkspace(
  userId: string,
  email: string,
): Promise<{ id: string; name: string; slug: string; role: string } | null> {
  // 슈퍼 관리자 이메일이 아니면 무시
  if (email !== 'kboom8002@gmail.com') {
    return null;
  }

  const adminClient = getSupabaseAdminClient();

  // 기존 bsw-main 워크스페이스 존재 확인
  const { data: existing } = await adminClient
    .from('workspaces')
    .select('id, name, slug')
    .eq('slug', 'bsw-main')
    .maybeSingle();

  let workspaceId: string;

  if (existing) {
    workspaceId = existing.id;
  } else {
    // 워크스페이스 생성
    const { data: created, error: createError } = await adminClient
      .from('workspaces')
      .insert({ name: 'BSW Main Workspace', slug: 'bsw-main' })
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

