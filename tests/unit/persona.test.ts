import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  createPersonaSpec, 
  updatePersonaSpec,
  createVibeRatingEvent,
  detectAuthorityOverreach,
  validatePersonaCrisisContent,
  checkDarkPatternFlags,
  computePMRI,
  computeVPA,
  computeVCS,
  detectMSA,
  computeVMRI
} from '../../app/actions/persona';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { checkWorkspacePermission } from '../../lib/auth';

// Mock Supabase admin client and auth permission helper
vi.mock('../../lib/supabase', () => ({
  getSupabaseAdminClient: vi.fn(),
}));

vi.mock('../../lib/auth', () => ({
  checkWorkspacePermission: vi.fn(),
}));

const createMockQueryBuilder = (data: any = null, count: number = 0) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    upsert: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    delete: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockResolvedValue({ data, error: null }),
    single: vi.fn().mockResolvedValue({ data, error: null }),
    then: (resolve: any) => resolve({ data, count, error: null })
  };
  return qb;
};

describe('BSW-OS Persona & Vibe MVP Test Suite (AG-B5)', () => {
  const mockWorkspaceId = '11111111-1111-4111-a111-111111111111';
  const mockPersonaId = '22222222-2222-4222-b222-222222222222';
  const mockVibeId = '33333333-3333-4333-c333-333333333333';
  const mockEvidenceId = '44444444-4444-4444-d444-444444444444';
  const mockPageId = '55555555-5555-4555-e555-555555555555';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('1. Governed PersonaSpec Validation Rules', () => {
    it('should throw an error if PersonaSpec lacks authority scope or legal guardrails', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const invalidData = {
        persona_name: "Wellness Doctor",
        slug: "wellness-doctor",
        governance_layer: { compliance_officer: "John Doe" },
        authority_scope: [], // Empty
        legal_guardrails: ["FDA disclaimers"],
        allowed_modes: ["standard"],
        current_mode: "standard",
        prompt_text: "Be healthy"
      };

      await expect(createPersonaSpec(mockWorkspaceId, invalidData)).rejects.toThrow(
        "Validation Error: PersonaSpec must carry a defined authority_scope list."
      );
    });

    it('should block updating mode when new mode is not allowed in persona spec', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "persona_specs") {
          return createMockQueryBuilder({
            id: mockPersonaId,
            persona_name: "Clinical Wellness",
            slug: "clinical-wellness",
            allowed_modes: ["standard", "advisory"], // Crisis NOT allowed
            current_mode: "standard",
            version: 1
          });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const updatedData = {
        persona_name: "Clinical Wellness",
        slug: "clinical-wellness",
        governance_layer: { compliance_officer: "John Doe" },
        authority_scope: ["clinical"],
        legal_guardrails: ["FDA"],
        allowed_modes: ["standard", "advisory"],
        current_mode: "crisis", // Attempting illegal switch
        prompt_text: "Wellness voice"
      };

      await expect(updatePersonaSpec(mockWorkspaceId, mockPersonaId, updatedData)).rejects.toThrow(
        'Validation Error: Mode "crisis" is not allowed for this persona spec.'
      );
    });
  });

  describe('2. CRISIS Mode CTA Suppress checks', () => {
    it('should block commercial CTA triggers when persona current_mode is crisis', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({
          current_mode: "crisis"
        });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      // E.g. content contains sales words like 'purchase'
      const commercialContent = "Purchase this premium clinical serum today!";
      
      await expect(validatePersonaCrisisContent(mockWorkspaceId, mockPersonaId, commercialContent)).rejects.toThrow(
        'CRISIS MODE ACTION BLOCK: Aggressive commercial CTA trigger word "purchase" was blocked'
      );
    });

    it('should pass content safety checks when persona is in crisis mode but content is clinical and informational', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({
          current_mode: "crisis"
        });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const clinicalContent = "Refer immediately to a registered healthcare professional for psoriasis diagnosis.";
      
      // Should not throw
      await expect(validatePersonaCrisisContent(mockWorkspaceId, mockPersonaId, clinicalContent)).resolves.not.toThrow();
    });
  });

  describe('3. Authority Overreach Checker', () => {
    it('should flag authority overreach when a claim asserts topics outside allowed scope', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder({
          persona_name: "Clinical Wellness",
          authority_scope: ["clinical", "warm"] // Missing 'legal' & 'medical'
        });
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const legalClaim = "We legally guarantee psoriasis cure in under 24 hours.";
      const result = await detectAuthorityOverreach(mockWorkspaceId, mockPersonaId, legalClaim);

      expect(result.overreach).toBe(true);
      expect(result.violations[0]).toContain('requires "legal" authority');
    });
  });

  describe('4. No evidence, no vibe score rules', () => {
    it('should block rating creation if evidence_item_id is completely missing', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const ratingPayload = {
        vibe_spec_id: mockVibeId,
        target_id: mockPageId,
        target_type: "page",
        rating_scores: { clinical: 50, warm: 30, luxury: 20 }
        // Missing evidence_item_id
      };

      await expect(createVibeRatingEvent(mockWorkspaceId, ratingPayload)).rejects.toThrow(
        "No evidence, no vibe score."
      );
    });

    it('should block rating creation if evidence exists in DB but is NOT verified', async () => {
      vi.mocked(checkWorkspacePermission).mockResolvedValue(true);

      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "evidence_items") {
          return createMockQueryBuilder({
            id: mockEvidenceId,
            is_verified: false // NOT verified!
          });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const ratingPayload = {
        vibe_spec_id: mockVibeId,
        target_id: mockPageId,
        target_type: "page",
        rating_scores: { clinical: 50, warm: 30, luxury: 20 },
        evidence_item_id: mockEvidenceId
      };

      await expect(createVibeRatingEvent(mockWorkspaceId, ratingPayload)).rejects.toThrow(
        "No evidence, no vibe score. The linked evidence item must be actively VERIFIED first."
      );
    });
  });

  describe('5. Dark Pattern Guardrails Scanner', () => {
    it('should block content publishing when false scarcity or fake urgency triggers are present', async () => {
      const mockFrom = vi.fn().mockImplementation(() => {
        return createMockQueryBuilder([
          {
            rule_name: "False Scarcity Block",
            forbidden_linguistic_triggers: ["only 2 left", "limited time only"],
            is_active: true
          }
        ]);
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const badContent = "Buy our retinol treatment now! There are only 2 left in stock!";
      const result = await checkDarkPatternFlags(mockWorkspaceId, badContent);

      expect(result.flagged).toBe(true);
      expect(result.violations[0]).toContain('by trigger "only 2 left"');
    });
  });

  describe('6. Mathematical Vector Metrics calculations', () => {
    it('should calculate P-MRI correctly based on active crisis mode and candidate patches', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "persona_specs") {
          return createMockQueryBuilder({
            current_mode: "crisis", // +30
            legal_guardrails: [] // +25
          });
        }
        if (table === "persona_patches") {
          return createMockQueryBuilder([
            { id: "patch-1" }, { id: "patch-2" } // 2 candidate patches * 15 = +30
          ]);
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const pmri = await computePMRI(mockWorkspaceId, mockPersonaId);
      // Total: 30 (crisis) + 25 (guardrails) + 30 (patches) = 85
      expect(pmri).toBe(85);
    });

    it('should calculate absolute cosine distance based VPA index accurately', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "vibe_assignments") {
          return createMockQueryBuilder({ vibe_spec_id: mockVibeId });
        }
        if (table === "vibe_specs") {
          return createMockQueryBuilder({
            target_vector: { clinical: 50, warm: 30, luxury: 20 }
          });
        }
        if (table === "vibe_profiles") {
          return createMockQueryBuilder({
            aggregated_vector: { clinical: 40, warm: 34, luxury: 26 }
          });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      // Diff: |50-40| + |30-34| + |20-26| = 10 + 4 + 6 = 20.
      // vpa = 100 - (20 / 2) = 90%
      const vpa = await computeVPA(mockWorkspaceId, mockPageId);
      expect(vpa).toBe(90.00);

      // msa = 100 - vpa = 10.00%
      const msa = await detectMSA(mockWorkspaceId, mockPageId);
      expect(msa).toBe(10.00);
    });

    it('should calculate Vibe Consistency Score (VCS) over historical ratings logs correctly', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "vibe_rating_events") {
          return createMockQueryBuilder([
            { rating_scores: { clinical: 50, warm: 30, luxury: 20 } },
            { rating_scores: { clinical: 52, warm: 28, luxury: 20 } }
          ]);
        }
        if (table === "vibe_specs") {
          return createMockQueryBuilder({
            target_vector: { clinical: 50, warm: 30, luxury: 20 }
          });
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      const vcs = await computeVCS(mockWorkspaceId, mockVibeId);
      // Small variance -> Consistency score should be extremely high
      expect(vcs).toBeGreaterThan(90.00);
      expect(vcs).toBeLessThanOrEqual(100.00);
    });

    it('should calculate Vibe Mismatch Risk Index (VMRI) combining MSA and VCS correctly', async () => {
      const mockFrom = vi.fn().mockImplementation((table: string) => {
        if (table === "vibe_assignments") {
          return createMockQueryBuilder([
            { target_id: mockPageId, target_type: "page" }
          ]);
        }
        if (table === "vibe_specs") {
          return createMockQueryBuilder({
            target_vector: { clinical: 50, warm: 30, luxury: 20 }
          });
        }
        if (table === "vibe_profiles") {
          return createMockQueryBuilder({
            aggregated_vector: { clinical: 40, warm: 34, luxury: 26 } // diff / 2 = 10% (MSA = 10)
          });
        }
        if (table === "vibe_rating_events") {
          return createMockQueryBuilder([
            { rating_scores: { clinical: 50, warm: 30, luxury: 20 } },
            { rating_scores: { clinical: 50, warm: 30, luxury: 20 } }
          ]);
        }
        return createMockQueryBuilder();
      });

      vi.mocked(getSupabaseAdminClient).mockReturnValue({
        from: mockFrom,
      } as any);

      // VCS should be 100.00 (perfect consistency). MSA is 10.00.
      // VMRI = (MSA * 0.6) + ((100 - VCS) * 0.4) = (10 * 0.6) + (0 * 0.4) = 6.00%
      const vmri = await computeVMRI(mockWorkspaceId, mockVibeId);
      expect(vmri).toBe(6.00);
    });
  });
});
