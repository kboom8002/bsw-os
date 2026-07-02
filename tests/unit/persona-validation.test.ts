import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createPersonaSpec, updatePersonaSpec } from '../../app/actions/persona';
import { checkWorkspacePermission } from '../../lib/auth';
import { getSupabaseAdminClient } from '../../lib/supabase';

vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  requireAuth: vi.fn().mockResolvedValue('test-user-id'),
  requireAuthOrDemo: vi.fn().mockResolvedValue('test-user-id'),
  checkWorkspacePermission: vi.fn().mockResolvedValue(true),
  checkWorkspacePermissionOrDemo: vi.fn().mockResolvedValue(true),
  getWorkspaceRole: vi.fn().mockResolvedValue('admin'),
}));

const createMockQueryBuilder = (data: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    single: vi.fn().mockResolvedValue({ data, error: null }),
  };
  return qb;
};

describe('PersonaSpec Validation Test (TDD-06)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should block creation if governance_layer is completely missing or empty object', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const invalidData = {
      persona_name: 'Test Persona',
      slug: 'test-persona',
      governance_layer: {}, // Empty!
      authority_scope: ['clinical'],
      legal_guardrails: ['standard disclaimer'],
      allowed_modes: ['standard'],
      current_mode: 'standard',
      prompt_text: 'Be warm and helpful',
    };

    await expect(createPersonaSpec(mockWorkspaceId, invalidData)).rejects.toThrow(
      'Validation Error: PersonaSpec must carry a valid governance_layer configuration.'
    );
  });

  it('should block creation if authority_scope is empty or missing', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const invalidData = {
      persona_name: 'Test Persona',
      slug: 'test-persona',
      governance_layer: { compliance_officer: 'John Doe' },
      authority_scope: [], // Empty!
      legal_guardrails: ['standard disclaimer'],
      allowed_modes: ['standard'],
      current_mode: 'standard',
      prompt_text: 'Be warm and helpful',
    };

    await expect(createPersonaSpec(mockWorkspaceId, invalidData)).rejects.toThrow(
      'Validation Error: PersonaSpec must carry a defined authority_scope list.'
    );
  });

  it('should block creation if legal_guardrails is empty or missing', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const invalidData = {
      persona_name: 'Test Persona',
      slug: 'test-persona',
      governance_layer: { compliance_officer: 'John Doe' },
      authority_scope: ['clinical'],
      legal_guardrails: [], // Empty!
      allowed_modes: ['standard'],
      current_mode: 'standard',
      prompt_text: 'Be warm and helpful',
    };

    await expect(createPersonaSpec(mockWorkspaceId, invalidData)).rejects.toThrow(
      'Validation Error: PersonaSpec must carry legal_guardrails parameters.'
    );
  });

  it('should block creation if current_mode is not in allowed_modes', async () => {
    vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

    const invalidData = {
      persona_name: 'Test Persona',
      slug: 'test-persona',
      governance_layer: { compliance_officer: 'John Doe' },
      authority_scope: ['clinical'],
      legal_guardrails: ['disclaimer'],
      allowed_modes: ['standard', 'advisory'],
      current_mode: 'crisis', // Not in allowed_modes!
      prompt_text: 'Be warm and helpful',
    };

    await expect(createPersonaSpec(mockWorkspaceId, invalidData)).rejects.toThrow(
      'is not allowed for this persona spec'
    );
  });
});
