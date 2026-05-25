import { expect } from 'vitest';

const randomUuid = () => {
  return 'd3b07384-d113-4ec6-a5d7-ec5e1e0a' + Math.floor(Math.random() * 9000 + 1000);
};

// 1. createTestWorkspace
export function createTestWorkspace(overrides: any = {}) {
  return {
    id: overrides.id || randomUuid(),
    name: overrides.name || 'Test Workspace',
    slug: overrides.slug || 'test-workspace',
    created_at: overrides.created_at || new Date().toISOString(),
    ...overrides
  };
}

// 2. createTestUser
export function createTestUser(overrides: any = {}) {
  return {
    id: overrides.id || randomUuid(),
    email: overrides.email || 'user@example.com',
    role: overrides.role || 'authenticated',
    ...overrides
  };
}

// 3. createWorkspaceMember
export function createWorkspaceMember(workspaceId: string, userId: string, role: string, overrides: any = {}) {
  return {
    id: overrides.id || randomUuid(),
    workspace_id: workspaceId,
    user_id: userId,
    role: role,
    created_at: overrides.created_at || new Date().toISOString(),
    ...overrides
  };
}

// 4. createTestDomain
export function createTestDomain(workspaceId: string, overrides: any = {}) {
  return {
    id: overrides.id || randomUuid(),
    workspace_id: workspaceId,
    name: overrides.name || 'Skincare Domain',
    slug: overrides.slug || 'skincare-domain',
    description: overrides.description || 'Test Domain Description',
    ...overrides
  };
}

// 5. createTestBrand
export function createTestBrand(workspaceId: string, overrides: any = {}) {
  return {
    id: overrides.id || randomUuid(),
    workspace_id: workspaceId,
    name: overrides.name || 'PureBarrier',
    slug: overrides.slug || 'purebarrier',
    ...overrides
  };
}

// 6. assertRlsDenied
export async function assertRlsDenied(promise: Promise<any>) {
  try {
    await promise;
    throw new Error('RLS_CHECK_FAILED: Operation was allowed but expected to be DENIED.');
  } catch (err: any) {
    if (err.message.includes('RLS_CHECK_FAILED')) {
      throw err;
    }
    expect(err).toBeDefined();
  }
}

// 7. assertRlsAllowed
export async function assertRlsAllowed(promise: Promise<any>) {
  try {
    const result = await promise;
    expect(result).toBeDefined();
    return result;
  } catch (err: any) {
    throw new Error(`RLS_CHECK_FAILED: Operation was denied but expected to be ALLOWED. Error: ${err.message}`);
  }
}

// 8. mockAgentRun
export function mockAgentRun(overrides: any = {}) {
  return {
    id: overrides.id || randomUuid(),
    workspace_id: overrides.workspace_id || randomUuid(),
    agent_name: overrides.agent_name || 'Generic Test Agent',
    input_payload: overrides.input_payload || {},
    output_payload: overrides.output_payload || {},
    status: overrides.status || 'candidate',
    ...overrides
  };
}

// 9. mockObservationRun
export function mockObservationRun(overrides: any = {}) {
  return {
    id: overrides.id || randomUuid(),
    workspace_id: overrides.workspace_id || randomUuid(),
    run_name: overrides.run_name || 'Generic Observation Run',
    probe_panel_id: overrides.probe_panel_id || randomUuid(),
    run_status: overrides.run_status || 'candidate',
    ...overrides
  };
}
