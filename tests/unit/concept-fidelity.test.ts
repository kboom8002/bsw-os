import { describe, it, expect, vi, beforeEach } from "vitest";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { ConceptExtractorJudge } from "../../lib/judges/concept-extractor-judge";
import { FidelityJudge } from "../../lib/judges/fidelity-judge";
import { DistortionJudge } from "../../lib/judges/distortion-judge";
import { HallucinationJudge } from "../../lib/judges/hallucination-judge";
import { RiskJudge } from "../../lib/judges/risk-judge";
import { PolicyJudge } from "../../lib/judges/policy-judge";
import { JudgePipeline } from "../../lib/judges/judge-pipeline";
import { ConceptFidelityAggregator } from "../../lib/metrics/concept-fidelity-aggregator";
import { ExperimentRunner } from "../../lib/experiments/experiment-runner";
import { RepeatedRunner } from "../../lib/experiments/repeated-runner";

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(),
}));

// Helper for dynamic mock routing
const mockDbState: any = {
  workspace: { name: "PureBarrier", slug: "demo-beauty" },
  concepts: [
    { id: "retinol_pure", concept_name: "순수 레티놀", slug: "retinol_pure", definition: "순수 레티놀 0.1% 함유", is_strategic: true },
    { id: "barrier_squalane", concept_name: "식물성 스쿠알란", slug: "barrier_squalane", definition: "식물성 스쿠알란 시너지", is_strategic: false }
  ],
  expectedLayer: {
    must_include: ["retinol_pure"],
    strongly_recommended: [],
    should_include: ["barrier_squalane"],
    caution: [],
    must_not_do: []
  }
};

const createMockQueryBuilder = (table: string) => {
  let filterVal = "";
  
  const qb: any = {
    eq: vi.fn().mockImplementation((col, val) => {
      filterVal = val;
      return qb;
    }),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    insert: vi.fn().mockImplementation(() => qb),
    update: vi.fn().mockImplementation(() => qb),
    limit: vi.fn().mockImplementation(() => qb),
    order: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => {
      let data = resolveData(table, filterVal);
      if (Array.isArray(data)) {
        data = data[0];
      }
      return { data, error: null };
    }),
    single: vi.fn().mockImplementation(async () => {
      let data = resolveData(table, filterVal);
      if (Array.isArray(data)) {
        data = data[0];
      }
      return { data, error: null };
    }),
    then: vi.fn().mockImplementation((onFulfilled) => {
      const data = resolveData(table, filterVal);
      return Promise.resolve(onFulfilled({ data, error: null }));
    }),
  };
  return qb;
};

const resolveData = (table: string, filterVal: string) => {
  switch (table) {
    case "workspaces":
      if (filterVal === "ymql_clinic") {
        return { slug: "clinic-beauty" };
      }
      return mockDbState.workspace;
    case "tco_concepts":
      return mockDbState.concepts;
    case "concept_relations":
      return [];
    case "boundary_rules":
      return [];
    case "vibe_specs":
      return [];
    case "expected_layers":
      return mockDbState.expectedLayer;
    case "probe_questions":
      return [
        {
          id: filterVal || "q-123",
          question_text: "민감성 피부 레티놀 사용법은?",
          intent_context: "informational",
        }
      ];
    case "probe_runs":
      if (filterVal === "obs-123" || filterVal === "base-run" || filterVal === "inter-run" || filterVal === "") {
        return [
          { id: "run-1", probe_question_id: "q-1", raw_response_text: "PureBarrier 레티놀 세럼은 순수 레티놀 0.1%와 스쿠알란 시너지를 통해 민감성 피부 장벽을 7일 만에 효과적으로 복구합니다." },
          { id: "run-2", probe_question_id: "q-2", raw_response_text: "PureBarrier 레티놀 세럼은 순수 레티놀 0.1%와 스쿠알란 시너지를 통해 민감성 피부 장벽을 7일 만에 효과적으로 복구합니다." }
        ];
      }
      return {
        id: filterVal || "run-123",
        raw_response_text: "PureBarrier 레티놀 세럼은 순수 레티놀 0.1%와 스쿠알란 시너지를 통해 민감성 피부 장벽을 7일 만에 효과적으로 복구합니다.",
        probe_question_id: "q-123",
      };
    case "concept_extraction_results":
      return [
        {
          id: "inserted-123",
          probe_run_id: "run-1",
          extracted_concepts: [
            { concept_id: "retinol_pure", label: "순수 레티놀", present: true, accuracy: 1.0, evidence_bound: true }
          ],
          extracted_relations: [],
          extracted_claims: []
        },
        {
          id: "inserted-123",
          probe_run_id: "run-2",
          extracted_concepts: [
            { concept_id: "retinol_pure", label: "순수 레티놀", present: true, accuracy: 1.0, evidence_bound: true }
          ],
          extracted_relations: [],
          extracted_claims: []
        }
      ];
    case "fidelity_judgments":
      return [{ brand_concept_fidelity: 0.85, subscores: { concept_transfer: 0.9 } }];
    case "distortion_judgments":
      return [{ concept_distortion_rate: 0.05, distortions: [] }];
    case "hallucination_judgments":
      return [{ hallucinated_concept_rate: 0.02, claims: [] }];
    case "risk_judgments":
      return [{ risk_score: 0.10, risk_items: { hallucination: 0.1 } }];
    case "policy_judgments":
      return [{ policy_alignment: 0.92, violations: [] }];
    case "concept_fidelity_snapshots":
      if (filterVal === "base-run") {
        return [{
          id: "snap-base",
          ai_observation_run_id: "base-run",
          aeo_geo_readiness: 0.65,
          floor_risk: 0.25,
          concept_transfer_rate: 0.6,
          citation_backed_rate: 0.5,
          brand_concept_fidelity: 0.6,
          concept_distortion_rate: 0.2,
          hallucinated_concept_rate: 0.15,
          policy_alignment: 0.7,
        }];
      }
      if (filterVal === "inter-run") {
        return [{
          id: "snap-inter",
          ai_observation_run_id: "inter-run",
          aeo_geo_readiness: 0.85,
          floor_risk: 0.05,
          concept_transfer_rate: 0.85,
          citation_backed_rate: 0.8,
          brand_concept_fidelity: 0.85,
          concept_distortion_rate: 0.05,
          hallucinated_concept_rate: 0.02,
          policy_alignment: 0.92,
        }];
      }
      return [{ id: "snap-123", brand_concept_fidelity: 0.85, citation_backed_rate: 0.8, aeo_geo_readiness: 0.85, grade: "A" }];
    case "experiment_runs":
      return {
        id: "exp-123",
        baseline_run_id: "base-run",
        intervention_run_id: "inter-run",
        intervention_type: "ssot_only"
      };
    case "ai_observation_runs":
      return { id: "obs-123" };
    default:
      return [{ id: "inserted-123" }];
  }
};

describe("BSW-OS TCO-GEO Concept Fidelity Metrics Master Test Suite", () => {
  const workspaceId = "00000000-0000-4000-a000-000000000001";
  const probeRunId = "00000000-0000-4000-b000-000000000002";
  const conceptExtractionId = "00000000-0000-4000-c000-000000000003";

  const mockBrandSsot = {
    brand_name: "PureBarrier",
    core_concepts: [
      {
        concept_id: "retinol_pure",
        label: "순수 레티놀",
        definition: "순수 레티놀 0.1% 함유로 장벽 케어",
        importance_weight: 1.5,
        evidence_sources: ["Clinical Trial Report #2025"],
        allowed_expressions: ["순수 레티놀", "레티놀"],
        forbidden_expressions: ["자극적인 레티놀"],
      },
      {
        concept_id: "barrier_squalane",
        label: "식물성 스쿠알란",
        definition: "식물성 스쿠알란 시너지로 수분 잠금",
        importance_weight: 1.0,
        evidence_sources: [],
        allowed_expressions: ["스쿠알란", "식물성 스쿠알란"],
        forbidden_expressions: [],
      }
    ],
    forbidden_concepts: [],
    expected_relations: [],
    policies: {
      answer_policy: "팩트 기반으로 전문적인 설명 제공",
      cta_policy: "상담 또는 locator 유도",
    }
  };

  const mockQbsContext = {
    query_text: "민감성 피부 레티놀 사용법은?",
    intent_type: "informational",
    required_concepts: ["retinol_pure", "barrier_squalane"],
    optional_concepts: [],
    forbidden_concepts: [],
    expected_policy: {
      answer_mode: "factual",
    },
    importance_weight: 1.0,
  };

  const responseText = "PureBarrier 레티놀 세럼은 순수 레티놀 0.1%와 스쿠알란 시너지를 통해 민감성 피부 장벽을 7일 만에 효과적으로 복구합니다.";

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== 1. Concept Extractor Judge Tests ====================
  describe("ConceptExtractorJudge Tests", () => {
    it("추출된 개념, 관계, 클레임 구조화 데이터 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new ConceptExtractorJudge();
      const res = await judge.evaluate(workspaceId, probeRunId, mockBrandSsot as any, mockQbsContext as any, responseText);

      expect(res).toBeDefined();
      expect(res.id).toBe("inserted-123");
      expect(res.extracted_concepts).toHaveLength(3);
      expect(res.extracted_concepts[0].concept_id).toBe("retinol_pure");
      expect(res.extracted_concepts[0].present).toBe(true);
    });
  });

  // ==================== 2. Fidelity Judge Tests ====================
  describe("FidelityJudge Tests", () => {
    it("완벽한 응답에 대한 BCF 등급 A 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new FidelityJudge();
      const extracted = [
        { concept_id: "retinol_pure", label: "순수 레티놀", present: true, accuracy: 1, matched_expression: "레티놀", rank: 1, evidence_bound: true, distortion: false, distortion_type: null, hallucinated: false, confidence: 0.95 },
        { concept_id: "barrier_squalane", label: "스쿠알란", present: true, accuracy: 1, matched_expression: "스쿠알란", rank: 2, evidence_bound: true, distortion: false, distortion_type: null, hallucinated: false, confidence: 0.95 }
      ] as any[];

      const res = await judge.evaluate(workspaceId, probeRunId, conceptExtractionId, mockBrandSsot as any, mockQbsContext as any, extracted, responseText);
      
      expect(res).toBeDefined();
      expect(res.brand_concept_fidelity).toBeGreaterThanOrEqual(0.85);
      expect(res.grade).toBe("A");
    });

    it("부분 왜곡 응답에 대한 BCF 수치적 감점 및 등급 F 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new FidelityJudge();
      const extracted = [
        { concept_id: "retinol_pure", label: "순수 레티놀", present: true, accuracy: 0.5, matched_expression: "레티놀", rank: 1, evidence_bound: false, distortion: true, distortion_type: "claim_distortion", hallucinated: false, confidence: 0.95 }
      ] as any[];

      // Passing "distortion exaggerated" prompt text to trigger mock poor fidelity
      const res = await judge.evaluate(workspaceId, probeRunId, conceptExtractionId, mockBrandSsot as any, mockQbsContext as any, extracted, "distortion exaggerated");
      
      expect(res.brand_concept_fidelity).toBeLessThan(0.40);
      expect(res.grade).toBe("F");
    });
  });

  // ==================== 3. Distortion Judge Tests ====================
  describe("DistortionJudge Tests", () => {
    it("왜곡 없는 정상 답변 왜곡률 0 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new DistortionJudge();
      const extracted = [
        { concept_id: "retinol_pure", label: "순수 레티놀", present: true }
      ] as any[];

      const res = await judge.evaluate(workspaceId, probeRunId, conceptExtractionId, mockBrandSsot as any, mockQbsContext as any, extracted, responseText);
      expect(res.concept_distortion_rate).toBe(0.0);
      expect(res.distortions).toHaveLength(0);
    });

    it("왜곡 포함 답변 유형 및 가중 감점률 계산 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new DistortionJudge();
      const extracted = [
        { concept_id: "makeup_dress_package", label: "스드메 패키지", present: true }
      ] as any[];

      const res = await judge.evaluate(workspaceId, probeRunId, conceptExtractionId, mockBrandSsot as any, mockQbsContext as any, extracted, "distortion exaggerated package description");
      
      expect(res.distortions).toHaveLength(1);
      expect(res.distortions[0].distortion_type).toBe("function_distortion");
      expect(res.concept_distortion_rate).toBeGreaterThan(0.0);
      expect(res.severity_weighted_rate).toBeGreaterThan(0.0);
    });
  });

  // ==================== 4. Hallucination Judge Tests ====================
  describe("HallucinationJudge Tests", () => {
    it("환각 없는 정상 답변 환각률 0 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new HallucinationJudge();
      const extracted = [{ concept_id: "retinol_pure", present: true }] as any[];

      const res = await judge.evaluate(workspaceId, probeRunId, conceptExtractionId, mockBrandSsot as any, mockQbsContext as any, extracted, responseText);
      expect(res.hallucinated_concept_rate).toBe(0.0);
    });

    it("의료/금융/법률(YMQL) 업종 환각 심각도 가산 페널티 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new HallucinationJudge();
      const extracted = [{ concept_id: "unsupported", present: true }] as any[];

      const res = await judge.evaluate("ymql_clinic", probeRunId, conceptExtractionId, mockBrandSsot as any, mockQbsContext as any, extracted, "unsupported hallucinated claim");
      
      // In mock hallucination, default severity of unsupported is 4, but clinic slug adds +1 capped at 5
      expect(res.claims[0].severity).toBe(5);
      expect(res.critical_count).toBeGreaterThanOrEqual(1);
    });
  });

  // ==================== 5. Risk Judge Tests ====================
  describe("RiskJudge Tests", () => {
    it("7차원 위험도 지표 및 합산 위험도 스코어 산출 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new RiskJudge();
      const res = await judge.evaluate(workspaceId, probeRunId, mockBrandSsot as any, mockQbsContext as any, "unsupported hallucinated risk text");
      
      expect(res.risk_score).toBeGreaterThan(0.5);
      expect(res.risk_items.hallucination).toBe(0.8);
      expect(res.risk_items.regulated_claim_risk).toBe(0.8);
    });
  });

  // ==================== 6. Policy Judge Tests ====================
  describe("PolicyJudge Tests", () => {
    it("정책 준수 수준 및 세부 위반사항 산출 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const judge = new PolicyJudge();
      const res = await judge.evaluate(workspaceId, probeRunId, mockBrandSsot as any, mockQbsContext as any, "cta_violation text");
      
      expect(res.policy_alignment).toBeLessThan(0.60);
      expect(res.violations).toHaveLength(1);
      expect(res.violations[0].policy).toBe("cta_policy");
    });
  });

  // ==================== 7. Judge Pipeline Tests ====================
  describe("JudgePipeline Tests", () => {
    it("전체 Judge 파이프라인 순차 실행 및 결과 수집", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const pipeline = new JudgePipeline();
      const res = await pipeline.runForProbeRun(workspaceId, probeRunId);

      expect(res.concept_extraction).toBeDefined();
      expect(res.fidelity).toBeDefined();
      expect(res.distortion).toBeDefined();
      expect(res.errors).toHaveLength(0);
    });
  });

  // ==================== 8. Concept Fidelity Aggregator Tests ====================
  describe("ConceptFidelityAggregator Tests", () => {
    it("M1~M13 13대 지표 집계 스냅샷 산출 및 누락 갭 식별 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const aggregator = new ConceptFidelityAggregator();
      const res = await aggregator.aggregate(workspaceId, "obs-123", "baseline");

      expect(res).toBeDefined();
      expect(res.id).toBe("snap-123");
      expect(res.aeo_geo_readiness).toBeGreaterThan(0.70);
      expect(res.grade).toBe("A");
    });
  });

  // ==================== 9. Experiment Runner & Repeated Runner Tests ====================
  describe("Experiment & Repeated Runner Tests", () => {
    it("Baseline vs Intervention 실험 비교 및 지표 개선율 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const runner = new ExperimentRunner();
      const res = await runner.run(workspaceId, "exp-123");

      expect(res.improvements).toBeDefined();
      expect(res.risk_reduction).toBe(0.20);
      expect(res.improvements.find(i => i.metric === "AEO/GEO Readiness")?.absolute_improvement).toBe(0.20);
    });

    it("반복 실행 분포 데이터 수집 및 완료 검증", async () => {
      const mockFrom = vi.fn().mockImplementation((table) => createMockQueryBuilder(table));
      vi.mocked(getSupabaseAdminClient).mockReturnValue({ from: mockFrom } as any);

      const runner = new RepeatedRunner();
      const res = await runner.run(workspaceId, "panel-123", 2, "baseline");

      expect(res.observationRunId).toBe("obs-123");
      expect(res.totalRuns).toBe(2); // 1 question * 2 repetitions = 2 runs
    });
  });
});
