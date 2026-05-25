import { describe, it, expect } from 'vitest';
import {
  workspaceSchema,
  workspaceMembershipSchema,
  domainSchema,
  agentRunSchema,
  brandEntitySchema,
  sourceSnapshotSchema,
  auditEventSchema
} from '../../lib/schema';

describe('BSW-OS Zod Schema Validation Tests (TDD-03)', () => {
  describe('Workspace Schema', () => {
    it('should validate correctly for a valid workspace payload', () => {
      const validPayload = {
        name: 'Brand Semantic Lab',
        slug: 'demo-brand-semantic-lab',
      };
      const result = workspaceSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should fail validation when name is too short', () => {
      const invalidPayload = {
        name: 'A', // min: 2
        slug: 'valid-slug',
      };
      const result = workspaceSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should fail validation when slug contains invalid characters', () => {
      const invalidPayload = {
        name: 'Valid Name',
        slug: 'Invalid_Slug_With_Uppercase_And_Underscores!', // regex: /^[a-z0-9-]+$/
      };
      const result = workspaceSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Workspace Membership Schema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correctly for a valid membership payload', () => {
      const validPayload = {
        workspace_id: validUuid,
        user_id: validUuid,
        role: 'owner',
      };
      const result = workspaceMembershipSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should fail validation when role is invalid', () => {
      const invalidPayload = {
        workspace_id: validUuid,
        user_id: validUuid,
        role: 'super_admin_does_not_exist',
      };
      const result = workspaceMembershipSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });

    it('should fail validation when workspace_id is not a valid UUID', () => {
      const invalidPayload = {
        workspace_id: 'not-a-uuid',
        user_id: validUuid,
        role: 'owner',
      };
      const result = workspaceMembershipSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Domain Schema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correctly for a valid domain payload', () => {
      const validPayload = {
        workspace_id: validUuid,
        name: 'K-Beauty Skincare',
        slug: 'k-beauty',
      };
      const result = domainSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should fail validation when slug is empty or too short', () => {
      const invalidPayload = {
        workspace_id: validUuid,
        name: 'K-Beauty',
        slug: 'a', // min: 2
      };
      const result = domainSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Agent Run Schema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correctly for a valid agent run payload', () => {
      const validPayload = {
        workspace_id: validUuid,
        agent_name: 'vibe-analyst-agent',
        input_payload: { probe: 'test' },
        status: 'candidate',
      };
      const result = agentRunSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it('should fail validation when status is not in agent run statuses', () => {
      const invalidPayload = {
        workspace_id: validUuid,
        agent_name: 'vibe-analyst-agent',
        input_payload: { probe: 'test' },
        status: 'completed', // not valid
      };
      const result = agentRunSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe('Brand Entity Schema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correctly for a valid brand entity', () => {
      const validPayload = {
        workspace_id: validUuid,
        name: 'PureBarrier',
        slug: 'purebarrier',
      };
      const result = brandEntitySchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Source Snapshot Schema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correctly for a valid source snapshot', () => {
      const validPayload = {
        workspace_id: validUuid,
        source_type: 'gsc_console',
        content: 'some analytical report content...',
      };
      const result = sourceSnapshotSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });

  describe('Audit Event Schema', () => {
    const validUuid = '123e4567-e89b-12d3-a456-426614174000';

    it('should validate correctly for a valid audit event', () => {
      const validPayload = {
        workspace_id: validUuid,
        user_id: 'user-1',
        action: 'create_claim',
        target_type: 'claim',
        target_id: validUuid,
      };
      const result = auditEventSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });
  });
});
