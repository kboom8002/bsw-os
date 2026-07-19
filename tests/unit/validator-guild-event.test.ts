import { describe, it, expect, vi, beforeEach } from "vitest";
import { ValidatorGuild } from "../../lib/answer-supply/validator-guild";
import { AnswerAssetSpec } from "../../lib/answer-supply/answer-asset-generator";
import { AnswerMission } from "../../lib/answer-supply/answer-mission-compiler";

const mockEvidence = [
  { id: 'ev-1', evidence_type: 'manual_verify', is_verified: true, title: 'Mock Evidence', content: 'Verified info' }
];

const createMockQueryBuilder = (data: any = null, error: any = null) => {
  const qb: any = {
    eq: vi.fn().mockImplementation(() => qb),
    in: vi.fn().mockImplementation(() => qb),
    select: vi.fn().mockImplementation(() => qb),
    maybeSingle: vi.fn().mockImplementation(async () => ({ data: Array.isArray(data) ? data[0] : data, error })),
    single: vi.fn().mockImplementation(async () => ({ data: Array.isArray(data) ? data[0] : data, error })),
    then: vi.fn().mockImplementation((onFulfilled) => {
      return Promise.resolve(onFulfilled({ data, error }));
    }),
  };
  return qb;
};

vi.mock("../../lib/supabase", () => ({
  getSupabaseAdminClient: vi.fn(() => ({
    from: vi.fn((table: string) => {
      if (table === 'evidence_items') {
        return createMockQueryBuilder(mockEvidence);
      }
      return createMockQueryBuilder(null);
    }),
  })),
}));

describe("ValidatorGuild EventPage Rules Unit Test Suite (Phase 3)", () => {
  let validator: ValidatorGuild;
  
  beforeEach(() => {
    validator = new ValidatorGuild();
    vi.clearAllMocks();
  });

  const createMockMission = (): AnswerMission => ({
    id: "mission-123",
    workspaceId: "ws-123",
    questionId: "q-123",
    sceneId: "scene-123",
    verticalId: "beauty",
    question: {
      id: "q-123",
      normalizedQuestion: "여름 휴가철 선크림 특별 혜택은?",
      slug: "summer-sunscreen-promo",
      primaryIntent: "commercial",
      riskLevel: "low",
    },
    scene: {
      id: "scene-123",
      sceneName: "여름 바캉스 프로모션",
      scenarioContext: "선크림 할인 혜택 제안",
      sceneType: "commercial",
      riskLevel: "low",
    },
    searchIntent: "commercial",
    answerGoal: "Propose sunscreen promo",
    directAnswerContract: {},
    surfaceContract: {
      allowedChannels: ["homepage", "event_page"],
      requiredSections: ["H1", "direct_answer"]
    },
    structuredDataContract: {
      schemaType: "FAQPage",
      primaryFields: ["question", "answerText"]
    },
    evidenceContract: {
      requiredEvidenceTypes: ["manual_verify"],
      requireVerification: true
    },
    internalLinkContract: {
      conceptRefs: ["sunscreen"],
    },
    decisionCriteria: [],
    requiredClaims: [],
    requiredEvidence: [],
    allowedStrength: "neutral",
    mustInclude: [],
    mustNotInclude: [],
    warnings: [],
    ctaPolicy: {},
    expiry: new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
    createdAt: new Date().toISOString()
  });

  const createMockAsset = (): AnswerAssetSpec => ({
    id: "asset-123",
    questionId: "q-123",
    workspaceId: "ws-123",
    verticalId: "beauty",
    missionId: "mission-123",
    canonicalRoute: "/answers/summer-sunscreen-promo",
    title: "여름 휴가철 선크림 특별 혜택은?",
    directAnswer: "선크림 1+1 특별 패키지와 추가 20% 할인 쿠폰을 제공합니다. 기간 내 예약 필수.",
    contentBlocks: [
      { id: "block-0", type: "paragraph", content: "선크림 특가 혜택 안내입니다." }
    ],
    variations: [
      {
        channel: "event_page",
        title: "여름 바캉스 특별 혜택",
        body: "선크림 패키지 구매 시 20% 즉시 할인 혜택 제공 및 사은품 증정!"
      }
    ],
    claimIds: [],
    evidenceIds: [],
    applicability: ["여름철 구매자"],
    exclusions: [],
    warnings: [],
    nextActions: [
      {
        label: "혜택 받고 예약하기",
        url: "https://aihompy.com/ko/clinic/match",
        type: "reservation"
      }
    ],
    seo: {
      title: "선크림 특별 혜택",
      metaDescription: "여름철 선크림 할인 정보",
      keywords: ["선크림"],
      robots: "index, follow"
    },
    structuredData: {
      schemaType: "FAQPage",
      payload: {
        mainEntity: {
          acceptedAnswer: {
            text: "선크림 1+1 특별 패키지와 추가 20% 할인 쿠폰을 제공합니다. 기간 내 예약 필수."
          }
        }
      }
    },
    internalLinks: [],
    authorId: "system",
    reviewerIds: [],
    status: "draft",
    version: "1.0.0",
    createdAt: new Date().toISOString(),
    validUntil: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString() // 7일 후 만료
  });

  it("✅ Happy: 정상적인 EventPage 자산일 때 모든 검증 통과", async () => {
    const mission = createMockMission();
    const asset = createMockAsset();

    const report = await validator.validate(asset, mission);

    if (!report.isValid) {
      console.log("Validation Issues (Happy case):", report.issues);
    }
    expect(report.isValid).toBe(true);
    expect(report.issues.filter(i => i.validator === "EventPageRules")).toHaveLength(0);
  });

  it("❌ Error: validUntil(만료 기한)이 누락되었을 때 에러 발생", async () => {
    const mission = createMockMission();
    const asset = createMockAsset();
    delete asset.validUntil;

    const report = await validator.validate(asset, mission);

    expect(report.isValid).toBe(false);
    const ruleIssues = report.issues.filter(i => i.validator === "EventPageRules");
    expect(ruleIssues.some(i => i.type === "error" && i.message.includes("expiration date"))).toBe(true);
  });

  it("❌ Error: 이미 만료된 과거 날짜일 때 에러 발생", async () => {
    const mission = createMockMission();
    const asset = createMockAsset();
    asset.validUntil = new Date(Date.now() - 1000 * 60).toISOString(); // 1분 전 만료

    const report = await validator.validate(asset, mission);

    expect(report.isValid).toBe(false);
    const ruleIssues = report.issues.filter(i => i.validator === "EventPageRules");
    expect(ruleIssues.some(i => i.type === "error" && i.message.includes("already expired"))).toBe(true);
  });

  it("⚠️ Warning: event_page 변형 텍스트에 명확한 혜택 키워드(할인 등)가 없을 때 경고 발생", async () => {
    const mission = createMockMission();
    const asset = createMockAsset();
    asset.variations = [
      {
        channel: "event_page",
        title: "여름 프로모션",
        body: "아무런 관련 키워드가 없고 정보도 부족한 무의미한 문장입니다."
      }
    ];

    const report = await validator.validate(asset, mission);

    if (!report.isValid) {
      console.log("Validation Issues (Warning case):", report.issues);
    }
    // warning은 isValid를 false로 만들지 않음
    expect(report.isValid).toBe(true);
    const ruleIssues = report.issues.filter(i => i.validator === "EventPageRules");
    expect(ruleIssues.some(i => i.type === "warning" && i.message.includes("clearly state promotional benefits"))).toBe(true);
  });

  it("❌ Error: CTA 링크(nextActions)가 누락되거나 비었을 때 에러 발생", async () => {
    const mission = createMockMission();
    const asset = createMockAsset();
    asset.nextActions = [];

    const report = await validator.validate(asset, mission);

    expect(report.isValid).toBe(false);
    const ruleIssues = report.issues.filter(i => i.validator === "EventPageRules");
    expect(ruleIssues.some(i => i.type === "error" && i.message.includes("valid Call-To-Action"))).toBe(true);
  });
});
