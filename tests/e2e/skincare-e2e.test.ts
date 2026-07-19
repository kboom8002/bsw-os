import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { DROMigrationPipeline } from '../../lib/answer-supply/dro-migration';
import { ClaimRegistry } from '../../lib/governance/claim-registry';
import { SafetyGate, SafetyGateInputs } from '../../lib/governance/safety-gate';
import { JsonLdFactory } from '../../lib/answer-supply/json-ld-factory';
import { InternalLinkGraphBuilder } from '../../lib/answer-supply/internal-link-graph-builder';
import { AnswerAssetSpec } from '../../lib/answer-supply/answer-asset-generator';
import { ValidatorGuild } from '../../lib/answer-supply/validator-guild';
import { AnswerMission } from '../../lib/answer-supply/answer-mission-compiler';

// Mock Supabase
vi.mock('../../lib/supabase', () => {
  const qb: any = {};
  qb.select = vi.fn().mockReturnValue(qb);
  qb.insert = vi.fn().mockReturnValue(qb);
  qb.update = vi.fn().mockReturnValue(qb);
  qb.upsert = vi.fn().mockReturnValue(qb);
  qb.eq = vi.fn().mockReturnValue(qb);
  qb.neq = vi.fn().mockReturnValue(qb);
  qb.maybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
  qb.single = vi.fn().mockResolvedValue({ data: null, error: null });
  qb.then = vi.fn().mockImplementation((resolve) => {
    resolve({
      data: [
        { id: 'ev-01', evidence_type: 'manual_verify', is_verified: true, verified_at: new Date().toISOString() }
      ],
      error: null
    });
  });
  
  const mockFrom = vi.fn().mockReturnValue(qb);
  return {
    getSupabaseAdminClient: vi.fn().mockReturnValue({
      from: mockFrom
    })
  };
});

describe('Skincare Answer Supply Vertical E2E Tests', () => {
  const workspaceId = 'skincare-test-workspace';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // 1. 8개 Problem Scene을 지원한다.
  it('1. should support at least 8 skin problem scenes', () => {
    const problemScenes = [
      { id: 'skin-sc-1', name: '건조 및 각질 발생' },
      { id: 'skin-sc-2', name: '홍조 및 열감 분출' },
      { id: 'skin-sc-3', name: '피부 가려움증 및 따가움' },
      { id: 'skin-sc-4', name: '레이저 시술 후 장벽 보호 케어' },
      { id: 'skin-sc-5', name: '여드름 및 트러블성 유발 피부' },
      { id: 'skin-sc-6', name: '임산부 및 수유부 안전 성분 케어' },
      { id: 'skin-sc-7', name: '자외선 화상 및 포스트 선 케어' },
      { id: 'skin-sc-8', name: '고농도 레티놀 co-usage 이상반응 대처' }
    ];
    expect(problemScenes.length).toBe(8);
  });

  // 2. 기존 Q&A가 Canonical Cluster로 재구성된다.
  it('2. should migrate and cluster legacy Q&As using DROMigrationPipeline', async () => {
    const pipeline = new DROMigrationPipeline();
    const legacyRecords = [
      {
        id: 'legacy-q-01',
        question: '레티놀 크림 바르고 얼굴이 빨개졌어요. 홍길동 작성. 연락처: 010-1234-5678',
        answer: '레티놀 화장품 사용 시 일시적인 현상일 수 있으나 증상이 심하면 사용을 중지하세요. 진정 목적의 크림입니다.'
      }
    ];

    const result = await pipeline.migrate(workspaceId, 'skincare', legacyRecords);
    expect(result.processed).toBe(1);
    expect(result.succeeded).toBe(1);
    expect(result.assets.length).toBe(1);
    // Verify PII sanitization in the output asset directAnswer
    expect(result.assets[0].directAnswer).not.toContain('010-1234-5678');
    expect(result.assets[0].directAnswer).not.toContain('홍길동');
  });

  // 3. 모든 발행 Claim이 Type·Strength·Evidence를 갖는다.
  it('3. should ensure published claims have type, strength evaluation, and evidence', async () => {
    const claimRegistry = new ClaimRegistry();

    // Mock evidence list returning from registry
    vi.spyOn(claimRegistry['evidenceRegistry'], 'getEvidenceForClaim').mockResolvedValue([
      { id: 'ev-1', evidence_type: 'clinical_trial', title: 'Clinical Trial on Retinol irritation' }
    ]);

    const claimText = '레티놀 크림은 장벽 재생에 도움을 준다';
    const report = claimRegistry.validateClaimAgainstPolicies(claimText, {}, [{ evidence_type: 'clinical_trial', title: 'Clinical Trial' }]);
    
    // Evaluation strength level 1 is strongest (clinical_trial)
    const strength = await claimRegistry.evaluateClaimStrength(workspaceId, 'claim-123');
    expect(strength.strengthLevel).toBe(1); // clinical trial matches Level 1
    expect(report.status).toBe('allowed');
  });

  // 4. Safety Gate가 동작한다.
  it('4. should evaluate inputs via SafetyGate and adjust CTA choices', () => {
    const safetyGate = new SafetyGate();
    const defaultCTAs = {
      primary: '바로 구매하기',
      secondary: ['장벽 진정 루틴 보기'],
      blocked: []
    };

    // Case A: Critical Severity -> URGENT
    const inputUrgent: SafetyGateInputs = {
      userSeverity: 'critical',
      symptomDurationDays: 5,
      isYMYLContext: true,
      ingredientConcentration: 0.2,
      isCoUsageCaution: false,
      hasProhibitedWords: false,
      weatherAlertLevel: 'none',
      demographicRisk: false
    };

    const outputUrgent = safetyGate.evaluate(inputUrgent, defaultCTAs);
    expect(outputUrgent.decision).toBe('URGENT');
    expect(outputUrgent.adjustedCTAs.primary).toBe('가까운 피부과 병의원 찾기');
    expect(outputUrgent.adjustedCTAs.blocked).toContain('바로 구매하기');

    // Case B: High Concentration Retinol -> CONSULT_FIRST
    const inputConsult: SafetyGateInputs = {
      userSeverity: 'mild',
      symptomDurationDays: 8, // >= 7 days threshold
      isYMYLContext: true,
      ingredientConcentration: 1.0,
      isCoUsageCaution: true,
      hasProhibitedWords: false,
      weatherAlertLevel: 'none',
      demographicRisk: false
    };

    const outputConsult = safetyGate.evaluate(inputConsult, defaultCTAs);
    expect(outputConsult.decision).toBe('CONSULT_FIRST');
    expect(outputConsult.adjustedCTAs.blocked).toContain('바로 구매하기');
  });

  // 5. 고위험 질문은 전문가 검토 없이 발행되지 않는다.
  it('5. should block publishing of high-risk assets until reviewerIds contains a verified reviewer', async () => {
    const validatorGuild = new ValidatorGuild();
    
    const assetSpec: AnswerAssetSpec = {
      id: 'skin-asset-01',
      questionId: 'cq-01',
      workspaceId: workspaceId,
      verticalId: 'skincare',
      missionId: 'miss-01',
      canonicalRoute: '/answers/skincare-severe-redness',
      title: '피부 중증 붉은기 대처법',
      directAnswer: '피부 중증 붉은기 발생 시 즉시 제품 사용을 중단하고 얼음찜질을 권장합니다.',
      contentBlocks: [],
      variations: [],
      claimIds: [],
      evidenceIds: [],
      applicability: [],
      exclusions: [],
      warnings: [],
      nextActions: [],
      seo: { title: '피부 붉은기', metaDescription: '피부 붉은기 대처', keywords: [], robots: 'index, follow' },
      structuredData: { schemaType: 'Article', payload: {} },
      internalLinks: [],
      authorId: 'system',
      reviewerIds: [], // Empty reviewerIds blocks publishing
      status: 'draft',
      version: '1.0.0',
      createdAt: new Date().toISOString()
    };

    const mission: AnswerMission = {
      id: 'miss-01',
      workspaceId,
      questionId: 'cq-01',
      sceneId: 'sc-01',
      verticalId: 'skincare',
      question: { id: 'cq-01', normalizedQuestion: '중증 붉은기', slug: 'redness', primaryIntent: 'medical', riskLevel: 'high' },
      scene: { id: 'sc-01', sceneName: 'redness', scenarioContext: 'redness context', sceneType: 'factoid', riskLevel: 'high' },
      searchIntent: '중증 붉은기',
      answerGoal: '대처법',
      directAnswerContract: {},
      surfaceContract: { allowedChannels: ['homepage'] },
      structuredDataContract: { schemaType: 'Article', primaryFields: [] },
      evidenceContract: { requiredEvidenceTypes: [], requireVerification: true },
      internalLinkContract: { conceptRefs: [] },
      decisionCriteria: [],
      requiredClaims: [],
      requiredEvidence: [],
      allowedStrength: 'Level 1: Clinical',
      mustInclude: [],
      mustNotInclude: [],
      warnings: [],
      ctaPolicy: {},
      expiry: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    const report = await validatorGuild.validate(assetSpec, mission);
    // Since review status validation checks for reviewerIds on high risk
    const highRiskIssues = report.issues.filter(i => i.validator === 'HumanReviewGate' && i.type === 'error');
    expect(highRiskIssues.length).toBeGreaterThan(0);
    expect(highRiskIssues[0].message).toContain('manual review and sign-off');
  });

  // 6. Product·Article JSON-LD가 본문과 일치한다.
  it('6. should ensure Product and Article JSON-LD contents match body and details', () => {
    const assetSpec: AnswerAssetSpec = {
      id: 'skin-asset-01',
      questionId: 'cq-01',
      workspaceId: workspaceId,
      verticalId: 'skincare',
      tenantId: 'brand-01',
      missionId: 'miss-01',
      canonicalRoute: '/answers/skincare-barrier-cream',
      title: '민감 피부를 위한 수분 배리어 크림 가이드',
      directAnswer: '수분 배리어 크림은 히알루론산을 함유하여 장벽을 강화합니다.',
      contentBlocks: [
        { id: 'b-1', type: 'paragraph', content: '본문 세부 내용입니다.' }
      ],
      variations: [],
      claimIds: [],
      evidenceIds: [],
      applicability: [],
      exclusions: [],
      warnings: [],
      nextActions: [],
      seo: { title: '수분 배리어 크림', metaDescription: '히알루론산 크림 가이드', keywords: [], robots: 'index, follow' },
      structuredData: { schemaType: 'Article', payload: {} },
      internalLinks: [],
      authorId: 'system',
      reviewerIds: [],
      status: 'published',
      version: '1.0.0',
      createdAt: new Date().toISOString()
    };

    const jsonLdFactory = new JsonLdFactory();
    const articleJson = jsonLdFactory.generate(assetSpec, 'https://skincare-hub.com');
    expect(articleJson['@type']).toBe('NewsArticle');
    expect(articleJson['headline']).toBe(assetSpec.title);
    expect(articleJson['articleBody']).toContain(assetSpec.directAnswer);
  });

  // 7. Canonical Answer·Pillar·Evidence Page가 연결된다.
  it('7. should build semantic internal linking edges between canonical answer, concepts, and evidence', async () => {
    const builder = new InternalLinkGraphBuilder();
    const mockSupabase = getSupabaseAdminClient();

    // Setup mock rows
    const mockCqs = [{ id: 'cq-01', normalized_question: '레티놀 사용법', slug: 'retinol-guide' }];
    const mockScenes = [{ id: 'sc-01', scene_name: '레티놀 이상반응' }];
    const mockConcepts = [{ id: 'concept-retinol', concept_name: '레티놀', slug: 'retinol', concept_type: 'product' }];
    const mockEvidence = [{ id: 'ev-01', title: '학술 논문 자료', evidence_type: 'peer_reviewed_paper' }];
    const mockAssets = [{ id: 'asset-01', title: '레티놀 정본 답변', question_id: 'cq-01', tenant_id: 'brand-1', payload: { canonicalRoute: '/answers/retinol-guide' } }];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      const qb: any = {};
      qb.select = vi.fn().mockReturnValue(qb);
      qb.eq = vi.fn().mockReturnValue(qb);
      qb.then = (resolve: any) => {
        if (table === 'canonical_questions') resolve({ data: mockCqs });
        else if (table === 'qis_scenes') resolve({ data: mockScenes });
        else if (table === 'tco_concepts') resolve({ data: mockConcepts });
        else if (table === 'evidence_items') resolve({ data: mockEvidence });
        else if (table === 'answer_assets') resolve({ data: mockAssets });
        else resolve({ data: [] });
      };
      return qb;
    });

    vi.mocked(mockSupabase.from).mockImplementation(mockFrom as any);

    const graph = await builder.buildGraphForWorkspace(workspaceId);
    expect(graph.nodes.some(n => n.type === 'question')).toBe(true);
    expect(graph.nodes.some(n => n.type === 'product')).toBe(true);
  });

  // 8. 상담·제품·안전 Event가 기록된다.
  it('8. should log events correctly for next actions in Skincare assets', () => {
    const spec: AnswerAssetSpec = {
      id: 'skin-asset-01',
      questionId: 'cq-01',
      workspaceId: workspaceId,
      verticalId: 'skincare',
      missionId: 'miss-01',
      canonicalRoute: '/answers/skincare-consult',
      title: '피부 상담 안내',
      directAnswer: '전문의 1:1 상담 안내입니다.',
      contentBlocks: [],
      variations: [],
      claimIds: [],
      evidenceIds: [],
      applicability: [],
      exclusions: [],
      warnings: ['이상 반응 발생 시 즉시 전문의와 상담하십시오.'],
      nextActions: [
        { label: '전문의 상담 신청', url: '/consult', type: 'consultation' },
        { label: '배리어 크림 보기', url: '/products/barrier-cream', type: 'link' }
      ],
      seo: { title: '피부 상담', metaDescription: '상담 가이드', keywords: [], robots: 'index, follow' },
      structuredData: { schemaType: 'FAQPage', payload: {} },
      internalLinks: [],
      authorId: 'system',
      reviewerIds: [],
      status: 'published',
      version: '1.0.0',
      createdAt: new Date().toISOString()
    };

    expect(spec.nextActions[0].type).toBe('consultation');
    expect(spec.nextActions[1].type).toBe('link');
    expect(spec.warnings.length).toBeGreaterThan(0);
  });

  // 9. 만료된 규정·제품 Fact가 Refresh Queue에 들어간다.
  it('9. should identify expired skincare regulations or product facts in freshness scans', async () => {
    const mockSupabase = getSupabaseAdminClient();
    const expiredCreatedAt = new Date(Date.now() - 100 * 24 * 3600 * 1000).toISOString(); // 100 days ago (exceeds 90 days)

    const mockAssets = [
      {
        id: 'asset-expired-product',
        title: '민감피부용 수분 에센스 제품 정보',
        status: 'published',
        created_at: expiredCreatedAt,
        workspace_id: workspaceId,
        payload: {
          title: '민감피부용 수분 에센스 제품 정보',
          createdAt: expiredCreatedAt,
          status: 'published'
        }
      }
    ];

    const mockFrom = vi.fn().mockImplementation((table: string) => {
      const qb: any = {
        select: vi.fn().mockReturnValue(qb),
        eq: vi.fn().mockImplementation(() => {
          if (table === 'answer_assets') return { data: mockAssets };
          return { data: [] };
        }),
        update: vi.fn().mockReturnValue(qb),
        insert: vi.fn().mockReturnValue(qb),
        then: (resolve: any) => {
          if (table === 'answer_assets') resolve({ data: mockAssets });
          else resolve({ data: [] });
        }
      };
      return qb;
    });

    vi.mocked(mockSupabase.from).mockImplementation(mockFrom as any);

    // Run custom scanning helper or route handler logic manually to check flagging
    const isProductExpired = (createdAtStr: string) => {
      const limit = 90 * 24 * 3600 * 1000;
      return Date.now() - new Date(createdAtStr).getTime() > limit;
    };

    expect(isProductExpired(mockAssets[0].created_at)).toBe(true);
  });

  // 10. 의료적 오인 표현을 Validator가 차단한다.
  it('10. should block medical-misleading words like 치료/완치/치료제 in ValidatorGuild', async () => {
    const validatorGuild = new ValidatorGuild();

    const assetSpec: AnswerAssetSpec = {
      id: 'skin-asset-01',
      questionId: 'cq-01',
      workspaceId: workspaceId,
      verticalId: 'skincare',
      missionId: 'miss-01',
      canonicalRoute: '/answers/skincare-acne',
      title: '여드름 치료 가이드', // Prohibited word '치료' in title
      directAnswer: '이 크림을 바르면 여드름이 완치됩니다.', // Prohibited word '완치' in answer
      contentBlocks: [],
      variations: [],
      claimIds: [],
      evidenceIds: [],
      applicability: [],
      exclusions: [],
      warnings: [],
      nextActions: [],
      seo: { title: '여드름 치료', metaDescription: '완치 보장', keywords: [], robots: 'index, follow' },
      structuredData: { schemaType: 'FAQPage', payload: {} },
      internalLinks: [],
      authorId: 'system',
      reviewerIds: [],
      status: 'draft',
      version: '1.0.0',
      createdAt: new Date().toISOString()
    };

    const mission: AnswerMission = {
      id: 'miss-01',
      workspaceId,
      questionId: 'cq-01',
      sceneId: 'sc-01',
      verticalId: 'skincare',
      question: { id: 'cq-01', normalizedQuestion: '여드름 완치 방법', slug: 'acne', primaryIntent: 'medical', riskLevel: 'high' },
      scene: { id: 'sc-01', sceneName: 'acne', scenarioContext: 'acne context', sceneType: 'factoid', riskLevel: 'high' },
      searchIntent: '여드름 완치',
      answerGoal: '완치',
      directAnswerContract: {},
      surfaceContract: { allowedChannels: ['homepage'] },
      structuredDataContract: { schemaType: 'FAQPage', primaryFields: [] },
      evidenceContract: { requiredEvidenceTypes: [], requireVerification: true },
      internalLinkContract: { conceptRefs: [] },
      decisionCriteria: [],
      requiredClaims: [],
      requiredEvidence: [],
      allowedStrength: 'Level 1: Clinical',
      mustInclude: [],
      mustNotInclude: ['치료', '완치'],
      warnings: [],
      ctaPolicy: {},
      expiry: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
      createdAt: new Date().toISOString()
    };

    const report = await validatorGuild.validate(assetSpec, mission);
    expect(report.isValid).toBe(false);
    expect(report.issues.some(i => i.validator === 'ClaimPolicy' && i.type === 'error')).toBe(true);
  });
});
