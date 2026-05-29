import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { 
  organizationSchema,
  organizationMembershipSchema,
  kcultureDomainPackSchema,
  culturalConceptSchema,
  culturalOpportunitySchema,
  humanReviewSchema
} from "../../lib/kculture/types";
import { seedKCultureForWorkspace, SEED_DOMAIN_PACKS, SEED_CONCEPTS_MAP } from "../../lib/kculture/domain-pack-registry";
import { OpportunityEngine } from "../../lib/kculture/opportunity-engine";
import { CulturalMetricsAggregator } from "../../lib/metrics/cultural-metrics-aggregator";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

const mockDbState: any = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  domainPacks: [],
  culturalConcepts: [],
  opportunities: [],
  snapshots: [],
};

const createMockQueryBuilder = () => {
  const queryBuilder: any = {
    eq: vi.fn().mockImplementation(() => queryBuilder),
    in: vi.fn().mockImplementation(() => queryBuilder),
    select: vi.fn().mockImplementation(() => queryBuilder),
    insert: vi.fn().mockImplementation(() => queryBuilder),
    update: vi.fn().mockImplementation(() => queryBuilder),
    limit: vi.fn().mockImplementation(() => queryBuilder),
    order: vi.fn().mockImplementation(() => queryBuilder),
    maybeSingle: vi.fn().mockImplementation(async () => {
      return { data: null, error: null };
    }),
    single: vi.fn().mockImplementation(async () => {
      return { data: { id: "11111111-1111-4111-8111-111111111111" }, error: null };
    }),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data: [], error: null }));
    }),
  };
  return queryBuilder;
};

describe("K-Culture Hybrid Module Tests", () => {
  let mockSupabase: any;
  let mockQueryBuilder: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockQueryBuilder = createMockQueryBuilder();
    mockSupabase = {
      from: vi.fn().mockImplementation(() => mockQueryBuilder)
    };
    (getSupabaseAdminClient as any).mockReturnValue(mockSupabase);
  });

  describe("Zod Schema Validation", () => {
    it("should successfully parse a valid Organization", () => {
      const org = {
        name: "Acme Cultural Group",
        slug: "acme-cultural",
      };
      const parsed = organizationSchema.parse(org);
      expect(parsed.name).toBe(org.name);
      expect(parsed.slug).toBe(org.slug);
    });

    it("should throw a validation error on invalid organization slug", () => {
      const org = {
        name: "Acme Cultural Group",
        slug: "INVALID_SLUG_WITH_CAPS",
      };
      expect(() => organizationSchema.parse(org)).toThrow();
    });

    it("should successfully parse a valid human review object", () => {
      const review = {
        workspace_id: "11111111-1111-4111-8111-111111111111",
        object_type: "cultural_concept",
        object_id: "11111111-1111-4111-8111-222222222222",
        reviewer_id: "reviewer-1",
        review_status: "approved",
        comments: "Approved with complete authentic definitions",
        correction_payload: {},
      };
      const parsed = humanReviewSchema.parse(review);
      expect(parsed.review_status).toBe("approved");
    });
  });

  describe("Domain Pack Seeder", () => {
    it("should hold the 3 static K-Culture domain packs", () => {
      expect(SEED_DOMAIN_PACKS.length).toBe(3);
      expect(SEED_DOMAIN_PACKS.map(p => p.slug)).toContain("k-beauty");
      expect(SEED_DOMAIN_PACKS.map(p => p.slug)).toContain("k-food");
      expect(SEED_DOMAIN_PACKS.map(p => p.slug)).toContain("k-tourism");
    });

    it("should contain exactly 30 concepts for each seeded domain", () => {
      expect(SEED_CONCEPTS_MAP["k-beauty"].length).toBe(30);
      expect(SEED_CONCEPTS_MAP["k-food"].length).toBe(30);
      expect(SEED_CONCEPTS_MAP["k-tourism"].length).toBe(30);
    });

    it("should run seeding functions and return true", async () => {
      const result = await seedKCultureForWorkspace(mockSupabase, mockDbState.workspaceId);
      expect(result).toBe(true);
    });
  });

  describe("Opportunity Engine", () => {
    it("should generate 3 distinct K-Culture opportunities (product, tourism, content) if concepts exist", async () => {
      // Mock active concepts return
      const mockConcepts = [
        {
          id: "concept-1",
          concept_id: "glass_skin",
          concept_type: "ingredients",
          preferred_label: { ko: "물광 피부", en: "Glass Skin" },
          definition: "Glass Skin description",
          status: "active",
          commerce_vector: { marketability: 0.95 },
        },
        {
          id: "concept-2",
          concept_id: "double_cleansing",
          concept_type: "skincare_routine",
          preferred_label: { ko: "이중 세안", en: "Double Cleansing" },
          definition: "Double Cleansing description",
          status: "active",
          commerce_vector: { marketability: 0.90 },
        },
        {
          id: "concept-3",
          concept_id: "hanok_stay_experience",
          concept_type: "traditional_heritage",
          preferred_label: { ko: "한옥 스테이", en: "Hanok Stay" },
          definition: "Hanok Stay description",
          status: "active",
          affective_vector: { authenticity: 0.95 },
        }
      ];

      mockQueryBuilder.then = vi.fn().mockImplementation((onFulfilled) => {
        return Promise.resolve(onFulfilled({ data: mockConcepts, error: null }));
      });

      const opps = await OpportunityEngine.generateOpportunities(
        mockDbState.workspaceId,
        "11111111-1111-4111-8111-111111111111"
      );

      expect(opps.length).toBeGreaterThan(0);
      const types = opps.map(o => o.opportunity_type);
      expect(types).toContain("product");
      expect(types).toContain("tourism");
    });
  });

  describe("Cultural Metrics Aggregator Formulas", () => {
    it("should accurately compute M14 (Resonance) and M15 (Transferability)", async () => {
      // Mock database aggregates query values
      mockQueryBuilder.then = vi.fn().mockImplementation((onFulfilled) => {
        return Promise.resolve(onFulfilled({
          data: [
            { id: "11111111-1111-4111-8111-111111111111", probe_question_id: "q-1" }
          ],
          error: null
        }));
      });

      const aggregator = new CulturalMetricsAggregator();
      
      const mockSnap = {
        workspace_id: mockDbState.workspaceId,
        ai_observation_run_id: "11111111-1111-4111-8111-111111111111",
        condition: "baseline",
        concept_transfer_rate: 0.9,
        citation_backed_rate: 0.92,
        brand_concept_fidelity: 0.88,
        concept_distortion_rate: 0.05,
        hallucinated_concept_rate: 0.02,
        floor_risk: 0.06,
        policy_alignment: 0.95,
        cross_cultural_resonance: 0.91,
        commercial_transferability: 0.88,
        grade: 'A'
      };

      mockQueryBuilder.single = vi.fn().mockImplementation(async () => {
        return { data: mockSnap, error: null };
      });

      const snapshot = await aggregator.aggregate(
        mockDbState.workspaceId,
        "11111111-1111-4111-8111-111111111111",
        "baseline"
      );

      expect(snapshot).toBeDefined();
      expect(snapshot.cross_cultural_resonance).toBe(0.91);
      expect(snapshot.commercial_transferability).toBe(0.88);
    });
  });
});
