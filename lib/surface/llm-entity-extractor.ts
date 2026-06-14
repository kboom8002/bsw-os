import { getAIProvider } from '../ai/ai-provider';
import { CrawledPage } from './website-crawler';
import { SurfaceEntity } from '../schema';

export interface ExtractedSurfaceEntity extends Omit<SurfaceEntity, 'id' | 'workspace_id' | 'created_at'> {
  id?: string;
  workspace_id?: string;
}

export class LlmEntityExtractor {
  /**
   * Convert page schema.org schemas into SurfaceEntity objects
   */
  private extractSchemaOrgEntities(page: CrawledPage, websiteUrl: string): ExtractedSurfaceEntity[] {
    const entities: ExtractedSurfaceEntity[] = [];
    
    if (!page.schemas || page.schemas.length === 0) {
      return entities;
    }

    for (const schema of page.schemas) {
      if (!schema || typeof schema !== 'object') continue;
      
      const type = schema['@type'] || 'Thing';
      const name = schema.name || schema.headline || `${type} Schema`;
      
      entities.push({
        website_url: websiteUrl,
        source_page_url: page.url,
        surface_type: 'schema_org',
        entity_name: String(name).substring(0, 500),
        entity_content: schema,
        completeness_score: 100,
        eeat_strength: 80, // Schema.org structures are a strong technical authority signal
        has_schema_support: true,
        extraction_model: 'schema-parser',
        extraction_confidence: 100,
        extracted_at: new Date().toISOString()
      });
    }

    return entities;
  }

  /**
   * Extract entities from a single page using LLM + Schema.org parsing
   */
  async extract(workspaceId: string, page: CrawledPage, websiteUrl: string): Promise<SurfaceEntity[]> {
    const schemaOrgEntities = this.extractSchemaOrgEntities(page, websiteUrl);
    const llmEntities: ExtractedSurfaceEntity[] = [];
    
    const provider = getAIProvider();

    // Prepare prompt
    const headingsText = page.headings.map(h => `H${h.level}: ${h.text}`).join('\n');
    const pageContext = `
URL: ${page.url}
Title: ${page.title}
Meta Description: ${page.metaDescription}
Headings:
${headingsText}

Body Text snippet:
${page.bodyText.substring(0, 8000)}
`;

    const prompt = `당신은 AEO/GEO(AI Search Engine Optimization) 분석 전문가입니다. 
제시된 웹페이지의 콘텐츠를 분석하여 AI 검색엔진이 Answer Card(답변 상자) 및 지식 그래프(Knowledge Graph)에 등록하고 소비자 답변으로 활용할 수 있는 핵심 지식 엔티티들을 식별하고 추출해주세요.

각 엔티티는 아래 7가지 유형 중 하나로 정확히 분류되어야 합니다:
1. factoid: 사실형 (제품 성분명, 수치, 사실 주장, 독자적 명칭)
2. procedural: 절차형 (사용법, 사용 루틴, 단계별 프로세스)
3. comparative: 비교형 (경쟁 제품 대비 차별성, 대안과의 비교)
4. authority: 권위 신호 (특허, 임상 인증, 전문가 추천, 수상 이력, EEAT 요소)
5. schema_org: Schema.org에 이미 구조화된 정보 (HTML 파서가 처리하므로 LLM은 생략하거나 추가 매핑만 수행)
6. topical_cluster: 주제 클러스터 (핵심 카테고리, 특정 테마의 하위 주제 묶음)
7. local_geo: 지역/지리 정보 (오프라인 매장 위치, 판매처 주소, 배송 범위)

각 엔티티에 대해 다음 정보들을 채워주세요:
- surface_type: 위의 7가지 유형명
- entity_name: 엔티티의 명확하고 구체적인 이름 (예: "Retinol 0.1% Cream Factual Formula", "3-Step Skincare Nightly Routine")
- entity_content: 이 엔티티의 핵심 사실이나 정보들을 담은 key-value object (예: {"active_ingredient": "Retinol", "concentration": "0.1%", "claims": ["Reduces fine wrinkles", "Boosts cell turnover"]})
- completeness_score: 엔티티 정보의 완전성/충분도 (0~100 점)
- eeat_strength: 신뢰도 및 권위 강도 (0~100 점)
- extraction_confidence: 추출 확신도 (0~100 점)

웹페이지 분석 대상 콘텐츠:
${pageContext}
`;

    const jsonSchema = {
      type: 'object',
      properties: {
        entities: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              surface_type: {
                type: 'string',
                enum: ['factoid', 'procedural', 'comparative', 'authority', 'schema_org', 'topical_cluster', 'local_geo']
              },
              entity_name: { type: 'string' },
              entity_content: { type: 'object' },
              completeness_score: { type: 'number' },
              eeat_strength: { type: 'number' },
              extraction_confidence: { type: 'number' }
            },
            required: ['surface_type', 'entity_name', 'entity_content', 'completeness_score', 'eeat_strength', 'extraction_confidence']
          }
        }
      },
      required: ['entities']
    };

    try {
      const response = await provider.generateStructuredOutput<{
        entities: Array<{
          surface_type: 'factoid' | 'procedural' | 'comparative' | 'authority' | 'schema_org' | 'topical_cluster' | 'local_geo';
          entity_name: string;
          entity_content: Record<string, any>;
          completeness_score: number;
          eeat_strength: number;
          extraction_confidence: number;
        }>;
      }>(prompt, jsonSchema);

      if (response && response.entities) {
        for (const ent of response.entities) {
          llmEntities.push({
            website_url: websiteUrl,
            source_page_url: page.url,
            surface_type: ent.surface_type,
            entity_name: ent.entity_name.substring(0, 500),
            entity_content: ent.entity_content || {},
            completeness_score: Math.max(0, Math.min(100, ent.completeness_score)),
            eeat_strength: Math.max(0, Math.min(100, ent.eeat_strength)),
            has_schema_support: false, // Default for LLM extraction
            extraction_model: 'gemini-flash',
            extraction_confidence: Math.max(0, Math.min(100, ent.extraction_confidence)),
            extracted_at: new Date().toISOString()
          });
        }
      }
    } catch (e: any) {
      console.warn(`[LLM Entity Extractor] Failed to extract from ${page.url} via AI: ${e.message}. Using fallback.`);
      
      // Fallback: simple heuristic based on page titles and headings
      const fallbackEntities = this.createFallbackEntities(page, websiteUrl);
      llmEntities.push(...fallbackEntities);
    }

    // Merge both
    const allExtracted: SurfaceEntity[] = [...schemaOrgEntities, ...llmEntities].map((ent, idx) => ({
      ...ent,
      workspace_id: workspaceId,
      id: ent.id || `se-${Date.now()}-${idx}`
    })) as SurfaceEntity[];

    return allExtracted;
  }

  /**
   * Safe fallback heuristic extractor when AI provider fails or in mock mode
   */
  private createFallbackEntities(page: CrawledPage, websiteUrl: string): ExtractedSurfaceEntity[] {
    const fallbacks: ExtractedSurfaceEntity[] = [];

    // Extract title as factoid
    if (page.title) {
      fallbacks.push({
        website_url: websiteUrl,
        source_page_url: page.url,
        surface_type: 'factoid',
        entity_name: page.title,
        entity_content: { description: page.metaDescription, url: page.url },
        completeness_score: 70,
        eeat_strength: 50,
        has_schema_support: false,
        extraction_model: 'fallback-heuristic',
        extraction_confidence: 80,
        extracted_at: new Date().toISOString()
      });
    }

    // Convert headings into topical_cluster or procedural
    page.headings.slice(0, 3).forEach((h, i) => {
      const isProcedural = h.text.includes('방법') || h.text.includes('루틴') || h.text.includes('Routine') || h.text.includes('How to');
      fallbacks.push({
        website_url: websiteUrl,
        source_page_url: page.url,
        surface_type: isProcedural ? 'procedural' : 'topical_cluster',
        entity_name: h.text,
        entity_content: { heading_level: h.level, order: i },
        completeness_score: 50,
        eeat_strength: 40,
        has_schema_support: false,
        extraction_model: 'fallback-heuristic',
        extraction_confidence: 60,
        extracted_at: new Date().toISOString()
      });
    });

    return fallbacks;
  }
}
