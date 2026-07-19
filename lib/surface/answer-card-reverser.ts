import { getAIProvider } from '../ai/ai-provider';
import { SurfaceEntity, ReversedAnswerCard, CanonicalQuestion, QisScene } from '../schema';
import { SiteKnowledgeGraph } from './knowledge-graph-builder';

export interface ReversedAnswerCardResult {
  cards: ReversedAnswerCard[];
  canonicalQuestions: CanonicalQuestion[];
  qisScenes: QisScene[];
}

export class AnswerCardReverser {
  /**
   * Run Answer Card Reverse-Engineering using the AI provider
   */
  async reverse(workspaceId: string, websiteUrl: string, kg: SiteKnowledgeGraph): Promise<ReversedAnswerCardResult> {
    const cards: ReversedAnswerCard[] = [];
    const canonicalQuestions: CanonicalQuestion[] = [];
    const qisScenes: QisScene[] = [];
    
    const provider = getAIProvider();

    // 1. Prepare data context for prompt
    const entitySummary = kg.entities.map(e => 
      `- [${e.id}] "${e.entity_name}" (${e.surface_type}): completeness=${e.completeness_score}, eeat=${e.eeat_strength}`
    ).slice(0, 30).join('\n'); // cap to 30 entities to keep prompt token size reasonable

    const relationSummary = kg.edges.map(edge => 
      `- Node[${edge.source_node_id}] --(${edge.relation_type})--> Node[${edge.target_node_id}]`
    ).slice(0, 20).join('\n');

    const prompt = `당신은 AI 검색엔진 최적화(AEO) 역설계 전문가입니다.
제시된 웹사이트의 지식 그래프(Site-KG)와 엔티티들을 분석하여, ChatGPT Search나 Gemini가 이 사이트의 정보만을 활용해 생성할 수 있는 이상적인 '답변 카드(Answer Card)'들을 역설계하고 식별해주세요.

Answer Card는 사용자가 구체적인 질문을 입력했을 때 검색엔진 상단에 카드/박스 형태로 노출되는 구조화된 고품질 지식 결과물입니다.

식별할 Answer Card 정보:
1. card_type: 카드 유형
   - direct_answer: 단답/정의형
   - how_to: 절차/가이드형
   - comparison: 비교/대조형
   - list: 목록/순위형
   - faq: 자주 묻는 질문형
   - product: 제품 명세형
   - local: 지역 매장 정보형
2. headline: 답변 카드의 핵심 타이틀/헤드라인 (예: "설화수 자음생크림 성분 및 효능 가이드")
3. trigger_queries: 사용자가 이 답변 카드를 유도하기 위해 입력할 수 있는 실질적인 검색어/질문 5개 목록
4. body_entity_ids: 이 카드의 구성 성분이 되는 SurfaceEntity ID 목록
5. completeness_score: 카드 콘텐츠가 제공할 수 있는 정보 충실도 (0~100 점)
6. eeat_strength: 정보의 신뢰성 및 E-E-A-T 점수 (0~100 점)
7. schema_support_level: 해당 정보들이 웹사이트 상에 구조화 마크업(Schema.org)으로 지원되는 레벨 ('full' | 'partial' | 'none')
8. optimization_status: 이 정보의 기술적/의미적 AEO 최적화 상태 ('optimized' | 'partial' | 'raw')

엔티티 리스트:
${entitySummary}

지식 그래프 관계:
${relationSummary}

각 Answer Card를 역설계하여 JSON 형식으로 반환하세요.

⚠️ 중요: 모든 headline과 trigger_queries는 반드시 한국어로 작성하세요. 영어 사이트에서 추출된 엔티티 이름이라도 한국어로 번역하여 작성합니다.`;

    const jsonSchema = {
      type: 'object',
      properties: {
        cards: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              card_type: {
                type: 'string',
                enum: ['direct_answer', 'how_to', 'comparison', 'list', 'faq', 'product', 'local']
              },
              headline: { type: 'string' },
              trigger_queries: {
                type: 'array',
                items: { type: 'string' }
              },
              body_entity_ids: {
                type: 'array',
                items: { type: 'string' }
              },
              completeness_score: { type: 'number' },
              eeat_strength: { type: 'number' },
              schema_support_level: {
                type: 'string',
                enum: ['full', 'partial', 'none']
              },
              optimization_status: {
                type: 'string',
                enum: ['optimized', 'partial', 'raw']
              }
            },
            required: ['card_type', 'headline', 'trigger_queries', 'body_entity_ids', 'completeness_score', 'eeat_strength', 'schema_support_level', 'optimization_status']
          }
        }
      },
      required: ['cards']
    };

    try {
      const response = await provider.generateStructuredOutput<{
        cards: Array<{
          card_type: 'direct_answer' | 'how_to' | 'comparison' | 'list' | 'faq' | 'product' | 'local';
          headline: string;
          trigger_queries: string[];
          body_entity_ids: string[];
          completeness_score: number;
          eeat_strength: number;
          schema_support_level: 'full' | 'partial' | 'none';
          optimization_status: 'optimized' | 'partial' | 'raw';
        }>;
      }>(prompt, jsonSchema);

      if (response && response.cards) {
        response.cards.forEach((card, idx) => {
          const cardId = `card-${Date.now()}-${idx}`;
          const canonicalId = `can-q-${Date.now()}-${idx}`;
          const qisSceneId = `qis-sc-${Date.now()}-${idx}`;
          
          // Generate a representative query from trigger queries
          const repQuery = card.trigger_queries[0] || `What is ${card.headline}?`;
          
          // Helper to create safe slugs
          const toSlug = (text: string) => text.toLowerCase()
            .replace(/[^a-z0-9가-힣-\s]/g, '')
            .replace(/\s+/g, '-')
            .substring(0, 150);

          const qSlug = toSlug(repQuery) || `query-${idx}`;
          
          // Create Canonical Question
          canonicalQuestions.push({
            id: canonicalId,
            workspace_id: workspaceId,
            question_capital_node_id: null,
            normalized_question: repQuery,
            slug: qSlug,
            signature: Buffer.from(repQuery).toString('base64').substring(0, 64),
            created_at: new Date().toISOString()
          });

          // Create QIS Scene
          qisScenes.push({
            id: qisSceneId,
            workspace_id: workspaceId,
            canonical_question_id: canonicalId,
            scene_name: `${card.headline} Scene`,
            query_template: repQuery,
            intent_model: card.card_type === 'comparison' ? 'commercial' : 'informational',
            scenario_context: `Trigger query context for ${card.headline}`,
            risk_level: 'medium',
            created_at: new Date().toISOString()
          });

          // Map Entity references (filter out non-existent ones)
          const validEntityIds = card.body_entity_ids.filter(eid => 
            kg.entities.some(ent => ent.id === eid)
          );
          
          // Find source pages for these entities
          const sourcePages = Array.from(new Set(
            validEntityIds.map(eid => {
              const ent = kg.entities.find(e => e.id === eid);
              return ent ? ent.source_page_url : websiteUrl;
            })
          ));

          cards.push({
            id: cardId,
            workspace_id: workspaceId,
            website_url: websiteUrl,
            card_type: card.card_type,
            headline: card.headline.substring(0, 500),
            trigger_queries: card.trigger_queries,
            body_entity_ids: validEntityIds,
            source_page_urls: sourcePages,
            linked_canonical_question_id: canonicalId,
            linked_qis_scene_ids: [qisSceneId],
            completeness_score: Math.max(0, Math.min(100, card.completeness_score)),
            eeat_strength: Math.max(0, Math.min(100, card.eeat_strength)),
            schema_support_level: card.schema_support_level,
            optimization_status: card.optimization_status,
            created_at: new Date().toISOString()
          });
        });
      }
    } catch (e: any) {
      console.warn(`[Answer Card Reverser] Reverse engineering failed: ${e.message}. Using fallback.`);
      return this.createFallbackCards(workspaceId, websiteUrl, kg);
    }

    return {
      cards,
      canonicalQuestions,
      qisScenes
    };
  }

  /**
   * Heuristic fallback generator when LLM fails or in mock mode
   */
  private createFallbackCards(workspaceId: string, websiteUrl: string, kg: SiteKnowledgeGraph): ReversedAnswerCardResult {
    const cards: ReversedAnswerCard[] = [];
    const canonicalQuestions: CanonicalQuestion[] = [];
    const qisScenes: QisScene[] = [];

    // Create 1-2 fallback cards based on the top entities
    kg.entities.slice(0, 3).forEach((entity, idx) => {
      const cardId = `card-fallback-${Date.now()}-${idx}`;
      const canonicalId = `can-q-fallback-${Date.now()}-${idx}`;
      const qisSceneId = `qis-sc-fallback-${Date.now()}-${idx}`;

      const repQuery = `What is ${entity.entity_name}?`;
      
      canonicalQuestions.push({
        id: canonicalId,
        workspace_id: workspaceId,
        question_capital_node_id: null,
        normalized_question: repQuery,
        slug: `fallback-query-${idx}-${Date.now()}`,
        signature: `sig-fallback-${idx}-${Date.now()}`,
        created_at: new Date().toISOString()
      });

      qisScenes.push({
        id: qisSceneId,
        workspace_id: workspaceId,
        canonical_question_id: canonicalId,
        scene_name: `${entity.entity_name} 핵심 FAQ`,
        query_template: repQuery,
        intent_model: 'informational',
        scenario_context: `${entity.entity_name}에 대한 핵심 정의 QIS Scene (폴백)`,
        risk_level: 'low',
        created_at: new Date().toISOString()
      });

      cards.push({
        id: cardId,
        workspace_id: workspaceId,
        website_url: websiteUrl,
        card_type: 'direct_answer',
        headline: `${entity.entity_name} 정의`,
        trigger_queries: [repQuery, `${entity.entity_name}에 대해 알려주세요`],
        body_entity_ids: [entity.id!],
        source_page_urls: [entity.source_page_url],
        linked_canonical_question_id: canonicalId,
        linked_qis_scene_ids: [qisSceneId],
        completeness_score: 80,
        eeat_strength: 60,
        schema_support_level: 'none',
        optimization_status: 'raw',
        created_at: new Date().toISOString()
      });
    });

    return {
      cards,
      canonicalQuestions,
      qisScenes
    };
  }
}
