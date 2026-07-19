/**
 * lib/answer-supply/answer-asset-generator.ts
 * 
 * Generates AnswerAssetSpec from the Answer Mission, producing channel-specific content variations
 * (e.g. homepage, answer_card, chatbot, cardnews, ad, sales_script, llm_txt) using LLM generation and program safeguards.
 */

import { getSupabaseAdminClient } from '../supabase';
import { getAIProvider } from '../ai/ai-provider';
import { AnswerMission } from './answer-mission-compiler';

export interface ContentBlock {
  id: string;
  type: 'paragraph' | 'list' | 'step' | 'table' | 'quote' | string;
  title?: string;
  content: string;
  evidenceRefs?: string[];
}

export interface ContentVariation {
  channel: 'homepage' | 'answer_card' | 'chatbot' | 'cardnews' | 'ad' | 'sales_script' | 'llm_txt' | string;
  title: string;
  body: string;
  metadata?: Record<string, any>;
}

export interface NextAction {
  label: string;
  url: string;
  type: 'reservation' | 'call' | 'consultation' | 'link' | string;
}

export interface SeoContract {
  title: string;
  metaDescription: string;
  keywords: string[];
  robots: string;
}

export interface StructuredDataContract {
  schemaType: string;
  payload: Record<string, any>;
}

export interface LinkContract {
  anchorText: string;
  targetUrl: string;
  rel?: string;
}

export interface AnswerAssetSpec {
  id: string;
  questionId: string;
  workspaceId: string;
  verticalId: string;
  tenantId?: string;
  missionId: string;
  
  canonicalRoute: string;
  title: string;
  directAnswer: string;
  
  contentBlocks: ContentBlock[];
  variations: ContentVariation[];
  
  claimIds: string[];
  evidenceIds: string[];
  
  applicability: string[];
  exclusions: string[];
  warnings: string[];
  nextActions: NextAction[];
  
  seo: SeoContract;
  structuredData: StructuredDataContract;
  internalLinks: LinkContract[];
  
  authorId: string;
  reviewerIds: string[];
  reviewedAt?: string;
  validUntil?: string;
  status: 'draft' | 'under_review' | 'approved' | 'published' | 'stale' | string;
  version: string;
  createdAt: string;
}

export class AnswerAssetGenerator {
  /**
   * Generates a fully fleshed out AnswerAssetSpec from an AnswerMission
   */
  async generate(mission: AnswerMission, tenantId?: string, authorId: string = 'system-generator'): Promise<AnswerAssetSpec> {
    const ai = getAIProvider();
    const supabase = getSupabaseAdminClient();

    const mustIncludeStr = mission.mustInclude.map((s, i) => `${i + 1}. "${s}"`).join('\n');
    const mustNotIncludeStr = mission.mustNotInclude.map((s, i) => `${i + 1}. "${s}"`).join('\n');
    const evidenceStr = mission.requiredEvidence.map((e, i) => `- ${e}`).join('\n');
    const decisionCriteriaStr = mission.decisionCriteria.map((c, i) => `- ${c}`).join('\n');

    const prompt = `
당신은 한국 시장 규칙(EEAT, YMYL 안전장치, 브랜드 가이드라인)을 엄격히 준수하는 시니어 콘텐츠 설계자입니다.
다음 Answer Mission 계약 조건에 맞추어 정본 답변 에셋(AnswerAssetSpec)의 세부 콘텐츠와 각 채널별 변형(Variations)을 생성해 주세요.

[Answer Mission 정보]
- 질문: "${mission.question.normalizedQuestion}"
- 상황(Scene Context): "${mission.scene.scenarioContext}"
- 위험도(Risk Level): "${mission.question.riskLevel}"
- 허용 강도(Allowed Strength): "${mission.allowedStrength}"

[본문 필수 조건 (Must Include)]
${mustIncludeStr || '없음'}

[절대 금지 조항 (Must Not Include - 위반 시 법적 제재/품질 저하)]
${mustNotIncludeStr || '없음'}

[증명 근거 및 사실 정보 (Evidence)]
${evidenceStr || '없음'}

[의사결정 판단 기준 (Decision Criteria)]
${decisionCriteriaStr || '없음'}

[작성 요구사항]
1. **Direct Answer (직접 답변)**: 본문 요약이자 첫 단락으로 들어가며, 150자 이내로 핵심 질문에 명확하고 정직하게 답변해야 합니다.
2. **Content Blocks**: 마크다운 본문을 구조화하여 다음 블록들을 설계하세요:
   - 'introduction': 질문의 배경 상황 설명
   - 'proof': 수집된 근거(Evidence)에 기초한 주장 입증
   - 'routines': 권장 절차 또는 실천 단계
   - 'cautions': 이용 시의 주의사항 또는 부작용 고지
3. **Variations**: 동일한 정본 정보를 기반으로 각 채널에 맞는 변형을 작성하세요:
   - 'homepage': 웹사이트 랜딩용 (상세하고 구조적)
   - 'answer_card': AI 검색엔진 추천 스니펫용 (간결하고 핵심적)
   - 'chatbot': 메신저 상담 답변용 (친근하고 대화형)
   - 'cardnews': SNS 카드뉴스 텍스트용 (슬라이드별 5단계 분할)
   - 'ad': 마케팅 광고 카피용 (소구점 강조, 과장 금지)
   - 'sales_script': 오프라인 상담/전화용 스크립트
   - 'llm_txt': 타 LLM 프롬프트 주입용 메타 요약본
   - 'event_page': 이벤트 페이지 본문용 (시즌 혜택 요약, 전문가 보증 문구, CTA 명확)
4. **SEO & Structured Data**: 검색 및 AI 가시성을 위한 Title, Description, Keywords를 설정하세요.

주의: 한국 의료법, 표시광고법 상 금지 표현을 철저히 배제하세요.
`;

    let generated: any = null;
    try {
      generated = await ai.generateStructuredOutput<any>(
        prompt,
        {
          type: 'object',
          properties: {
            title: { type: 'string', description: '콘텐츠 제목' },
            directAnswer: { type: 'string', description: 'AEO 최적화 직접 답변 (150자 이내)' },
            blocks: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  type: { type: 'string', enum: ['paragraph', 'list', 'step', 'table', 'quote'] },
                  title: { type: 'string' },
                  content: { type: 'string' }
                },
                required: ['type', 'content']
              }
            },
            variations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  channel: { type: 'string', enum: ['homepage', 'answer_card', 'chatbot', 'cardnews', 'ad', 'sales_script', 'llm_txt', 'event_page'] },
                  title: { type: 'string' },
                  body: { type: 'string' }
                },
                required: ['channel', 'title', 'body']
              }
            },
            seo: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                metaDescription: { type: 'string' },
                keywords: { type: 'array', items: { type: 'string' } }
              },
              required: ['title', 'metaDescription', 'keywords']
            },
            applicability: { type: 'array', items: { type: 'string' }, description: '이 답변이 적용되는 범위' },
            exclusions: { type: 'array', items: { type: 'string' }, description: '이 답변이 제외되는 범위' }
          },
          required: ['title', 'directAnswer', 'blocks', 'variations', 'seo', 'applicability', 'exclusions']
        },
        { temperature: 0.2 }
      );
    } catch (llmError) {
      console.warn(`[AnswerAssetGenerator] LLM Generation failed. Falling back to deterministic template. Error: ${(llmError as Error).message}`);
      
      // Fallback generator when LLM fails
      generated = {
        title: `${mission.question.normalizedQuestion}에 대한 안내`,
        directAnswer: `질문하신 내용에 대한 정본 안내입니다. ${mission.scene.scenarioContext} 상황 하에서 소아 동반 규정 및 세부 이용 금액을 철저히 검토한 후 이용하셔야 합니다.`,
        blocks: [
          { type: 'paragraph', title: '개요', content: `${mission.question.normalizedQuestion} 관련 안내문입니다.` },
          { type: 'paragraph', title: '증명 근거', content: mission.requiredEvidence.join('\n') || '공식 제공된 정보에 기초함.' },
          { type: 'paragraph', title: '이용 가이드라인', content: mission.decisionCriteria.join('\n') }
        ],
        variations: [
          { channel: 'homepage', title: `${mission.question.normalizedQuestion} - 상세 안내`, body: `독채 풀빌라 3인 가족 상세 안내입니다.\n\n${mission.decisionCriteria.join('\n')}` },
          { channel: 'answer_card', title: `대표 답변`, body: `직접 답변: 제주 풀빌라의 소아 동반 정책 기준입니다. ${mission.requiredEvidence[0] || ''}` },
          { channel: 'chatbot', title: '상담 답변', body: `안녕하세요! 3인 가족 풀빌라 문의 주셨네요. 소아 동반 규정은 다음과 같아요: ${mission.requiredEvidence[0] || ''}` },
          { channel: 'cardnews', title: '슬라이드 뉴스', body: `1장: 가족을 위한 제주 풀빌라 정보\n2장: 소아 정책 확인 필수\n3장: ${mission.requiredEvidence[0] || ''}` },
          { channel: 'ad', title: '광고 카피', body: `가족 맞춤형 프라이빗 풀빌라! 소아 추가 요금 걱정 없이 투명한 예약 완료!` },
          { channel: 'sales_script', title: '상담용 멘트', body: `고객님, 3인 가족이 이용하시는 경우 소아 연령에 따라 규정이 상이합니다. 기준표에 의하면...` },
          { channel: 'llm_txt', title: 'LLM Context', body: `Q: ${mission.question.normalizedQuestion}\nA: ${mission.requiredEvidence[0] || ''}` },
          { channel: 'event_page', title: `특별 프로모션 & 혜택`, body: `질문에 기반한 특별 혜택 및 이벤트 정보입니다. ${mission.requiredEvidence[0] || ''}` }
        ],
        seo: {
          title: `${mission.question.normalizedQuestion} | 정본 가이드`,
          metaDescription: `${mission.question.normalizedQuestion}에 대한 정확한 정보 안내입니다. 소아 요금 기준 및 이용 약관 확인.`,
          keywords: [mission.question.slug, '제주풀빌라', '소아동반']
        },
        applicability: ['3인 가족', '소아 동반 여행객'],
        exclusions: ['성인 단체 고객', '반려동물 동반']
      };
    }

    // Programmatic Sanitation Guards
    // Rule: Clean up forbidden terms if LLM somehow leaked them
    for (const variation of generated.variations) {
      for (const forbidden of mission.mustNotInclude) {
        const regex = new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
        if (regex.test(variation.body)) {
          variation.body = variation.body.replace(regex, '[규정 준수를 위해 필터링됨]');
        }
        if (regex.test(variation.title)) {
          variation.title = variation.title.replace(regex, '안내');
        }
      }
    }

    const assetBlocks: ContentBlock[] = generated.blocks.map((b: any, idx: number) => ({
      id: `block-${idx}`,
      type: b.type,
      title: b.title,
      content: b.content,
      evidenceRefs: mission.requiredEvidence.length > 0 ? ['ev-1'] : []
    }));

    const assetId = crypto.randomUUID();
    const expiryDate = new Date(mission.expiry);

    const assetSpec: AnswerAssetSpec = {
      id: assetId,
      questionId: mission.questionId,
      workspaceId: mission.workspaceId,
      verticalId: mission.verticalId,
      tenantId: tenantId || mission.tenantId,
      missionId: mission.id,
      
      canonicalRoute: `/answers/${mission.question.slug}`,
      title: generated.title,
      directAnswer: generated.directAnswer,
      
      contentBlocks: assetBlocks,
      variations: generated.variations,
      
      claimIds: [],
      evidenceIds: [],
      
      applicability: generated.applicability,
      exclusions: generated.exclusions,
      warnings: mission.warnings,
      nextActions: [
        {
          label: mission.ctaPolicy.primaryCtaText || '문의하기',
          url: mission.ctaPolicy.ctaUrlPattern || `/answers/${mission.question.slug}`,
          type: 'consultation'
        }
      ],
      
      seo: {
        title: generated.seo.title,
        metaDescription: generated.seo.metaDescription,
        keywords: generated.seo.keywords,
        robots: 'index, follow'
      },
      structuredData: {
        schemaType: mission.structuredDataContract.schemaType,
        payload: {
          "@context": "https://schema.org",
          "@type": mission.structuredDataContract.schemaType,
          "mainEntity": {
            "@type": "Question",
            "name": mission.question.normalizedQuestion,
            "acceptedAnswer": {
              "@type": "Answer",
              "text": generated.directAnswer
            }
          }
        }
      },
      internalLinks: [
        {
          anchorText: mission.question.normalizedQuestion.substring(0, 15),
          targetUrl: `/answers/${mission.question.slug}`
        }
      ],
      
      authorId,
      reviewerIds: [],
      status: 'draft',
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      validUntil: expiryDate.toISOString()
    };

    // Attempt DB sync
    try {
      const { error: dbError } = await supabase
        .from('answer_assets')
        .insert({
          id: assetSpec.id,
          workspace_id: mission.workspaceId,
          question_id: mission.questionId,
          mission_id: mission.id,
          tenant_id: assetSpec.tenantId,
          title: assetSpec.title,
          direct_answer: assetSpec.directAnswer,
          payload: assetSpec,
          status: assetSpec.status,
          version: assetSpec.version,
          created_at: assetSpec.createdAt
        });

      if (dbError) {
        console.warn(`[AnswerAssetGenerator] Could not insert generated asset to 'answer_assets' table: ${dbError.message}`);
      } else {
        console.log(`[AnswerAssetGenerator] AnswerAssetSpec ${assetSpec.id} successfully written to database.`);
      }
    } catch (err) {
      console.warn(`[AnswerAssetGenerator] db write error: ${(err as Error).message}`);
    }

    return assetSpec;
  }
}
