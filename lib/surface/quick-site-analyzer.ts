/**
 * lib/surface/quick-site-analyzer.ts
 *
 * HTML-only 크롤링 기반 즉시 분석기.
 * AI API 호출 없이 크롤링 + HTML 파싱만으로 사이트의
 * AEO/GEO 가시성 점수를 추정합니다.
 *
 * 소요시간: ~3-8초 (3-5 페이지 크롤링)
 */

import { WebsiteCrawler, CrawledPage, parseHtml } from './website-crawler';
import {
  SurfaceEntity, ReversedAnswerCard,
  EntityReflectionSnapshot, SurfaceGapAnalysis
} from '../schema';

export interface QuickAuditResult {
  websiteUrl: string;
  brandName: string;
  entities: SurfaceEntity[];
  cards: ReversedAnswerCard[];
  snapshot: EntityReflectionSnapshot;
  gaps: SurfaceGapAnalysis[];
  crawledPages: number;
  auditMode: 'estimated' | 'measured' | 'partial';
}

// ─── EEAT 신호 키워드 ──────────────────────────────────
const EEAT_SIGNALS = {
  experience: ['후기', '리뷰', '경험담', '사용기', 'review', 'testimonial', 'experience'],
  expertise: ['전문가', '연구', '박사', 'PhD', 'MD', '임상', 'clinical', '논문', 'paper', '특허', 'patent', '자격증'],
  authority: ['수상', 'award', '인증', 'certified', '공인', '등록', '협회', 'association', 'ISO'],
  trust: ['보증', '환불', '보험', '개인정보', 'privacy', '약관', 'terms', '안전', 'safety']
};

const PROCEDURAL_KEYWORDS = ['방법', '순서', '루틴', '가이드', '단계', 'how', 'guide', 'step', 'tutorial', 'routine', '사용법'];
const COMPARATIVE_KEYWORDS = ['비교', 'vs', '차이', '추천', '순위', 'compare', 'best', 'top', 'ranking', '어떤'];
const AUTHORITY_KEYWORDS = ['임상', '연구', '특허', '수상', '인증', 'clinical', 'research', 'patent', 'award', 'certified'];
const GEO_KEYWORDS = ['위치', '주소', '매장', '지점', '오시는', 'location', 'address', 'store', 'branch', '서울', '부산', '대구'];

export class QuickSiteAnalyzer {
  /**
   * 메인 분석 진입점. 크롤링 → HTML 파싱 → 점수 추정
   */
  async analyze(
    workspaceId: string,
    websiteUrl: string,
    brandName: string
  ): Promise<QuickAuditResult> {
    const crawler = new WebsiteCrawler();
    let pages: CrawledPage[] = [];

    try {
      pages = await crawler.crawl(websiteUrl, 5); // max 5 pages, 10s timeout per page
    } catch (e: any) {
      console.warn(`[QuickAnalyzer] Crawl failed: ${e.message}. Using minimal fallback.`);
    }

    if (pages.length === 0) {
      // Can't crawl at all → return minimal estimated data
      return this.buildMinimalFallback(workspaceId, websiteUrl, brandName);
    }

    // 1. Extract entities from HTML
    const entities = this.extractEntitiesFromHtml(pages, workspaceId, websiteUrl);

    // 2. Estimate scores
    const snapshot = this.estimateSnapshot(workspaceId, websiteUrl, entities, pages);

    // 3. Generate answer card stubs
    const cards = this.generateCards(workspaceId, websiteUrl, entities, brandName);

    // 4. Generate gap analysis
    const gaps = this.generateGaps(workspaceId, websiteUrl, entities);

    return {
      websiteUrl,
      brandName,
      entities,
      cards,
      snapshot,
      gaps,
      crawledPages: pages.length,
      auditMode: 'estimated'
    };
  }

  // ─── Entity Extraction (HTML only) ────────────────────

  private extractEntitiesFromHtml(
    pages: CrawledPage[],
    workspaceId: string,
    websiteUrl: string
  ): SurfaceEntity[] {
    const entities: SurfaceEntity[] = [];
    const now = new Date().toISOString();
    let idx = 0;

    for (const page of pages) {
      // A. Schema.org JSON-LD entities
      if (page.schemas && page.schemas.length > 0) {
        for (const schema of page.schemas) {
          if (!schema || typeof schema !== 'object') continue;
          const type = schema['@type'] || 'Thing';
          const name = schema.name || schema.headline || `${type} Schema`;
          entities.push({
            id: `se-q-${idx++}`,
            workspace_id: workspaceId,
            website_url: websiteUrl,
            source_page_url: page.url,
            surface_type: 'schema_org',
            entity_name: String(name).substring(0, 300),
            entity_content: {
              '@type': type,
              description: schema.description?.substring(0, 200) || '',
              source: 'schema-org'
            },
            completeness_score: 85,
            eeat_strength: 75,
            has_schema_support: true,
            extraction_model: 'html-parser',
            extraction_confidence: 95,
            extracted_at: now
          });
        }
      }

      // B. Page title as factoid entity
      if (page.title && page.title.length > 3) {
        entities.push({
          id: `se-q-${idx++}`,
          workspace_id: workspaceId,
          website_url: websiteUrl,
          source_page_url: page.url,
          surface_type: 'factoid',
          entity_name: page.title.substring(0, 200),
          entity_content: {
            description: page.metaDescription?.substring(0, 200) || '',
            url: page.url,
            source: 'title'
          },
          completeness_score: page.metaDescription ? 75 : 55,
          eeat_strength: 50,
          has_schema_support: page.schemas.length > 0,
          extraction_model: 'html-parser',
          extraction_confidence: 85,
          extracted_at: now
        });
      }

      // C. Heading-based entities (classified by content)
      const seenHeadings = new Set<string>();
      for (const h of page.headings.slice(0, 8)) {
        const normText = h.text.trim();
        if (normText.length < 4 || seenHeadings.has(normText.toLowerCase())) continue;
        seenHeadings.add(normText.toLowerCase());

        const surfaceType = this.classifyHeadingText(normText);
        entities.push({
          id: `se-q-${idx++}`,
          workspace_id: workspaceId,
          website_url: websiteUrl,
          source_page_url: page.url,
          surface_type: surfaceType,
          entity_name: normText.substring(0, 200),
          entity_content: {
            heading_level: h.level,
            page_title: page.title,
            source: 'heading'
          },
          completeness_score: h.level <= 2 ? 65 : 50,
          eeat_strength: this.estimateHeadingEeat(normText),
          has_schema_support: false,
          extraction_model: 'html-parser',
          extraction_confidence: 70,
          extracted_at: now
        });
      }

      // D. EEAT signal detection from body text
      const bodyLower = page.bodyText.toLowerCase();
      const eeatSignals = this.detectEeatSignals(bodyLower);
      if (eeatSignals.length > 0) {
        entities.push({
          id: `se-q-${idx++}`,
          workspace_id: workspaceId,
          website_url: websiteUrl,
          source_page_url: page.url,
          surface_type: 'authority',
          entity_name: `${page.title || '사이트'} — E-E-A-T 신호 (${eeatSignals.length}개)`,
          entity_content: {
            signals: eeatSignals,
            source: 'body-scan'
          },
          completeness_score: 60,
          eeat_strength: Math.min(90, 40 + eeatSignals.length * 8),
          has_schema_support: false,
          extraction_model: 'html-parser',
          extraction_confidence: 65,
          extracted_at: now
        });
      }

      // E. Geo/Location detection
      const hasGeo = GEO_KEYWORDS.some(kw => bodyLower.includes(kw));
      if (hasGeo) {
        entities.push({
          id: `se-q-${idx++}`,
          workspace_id: workspaceId,
          website_url: websiteUrl,
          source_page_url: page.url,
          surface_type: 'local_geo',
          entity_name: `${page.title || '사이트'} — 지역/위치 정보`,
          entity_content: { source: 'body-scan', keywords_matched: GEO_KEYWORDS.filter(kw => bodyLower.includes(kw)) },
          completeness_score: 55,
          eeat_strength: 45,
          has_schema_support: false,
          extraction_model: 'html-parser',
          extraction_confidence: 60,
          extracted_at: now
        });
      }
    }

    // Deduplicate by normalized name
    return this.deduplicateEntities(entities);
  }

  private classifyHeadingText(text: string): SurfaceEntity['surface_type'] {
    const lower = text.toLowerCase();
    if (PROCEDURAL_KEYWORDS.some(kw => lower.includes(kw))) return 'procedural';
    if (COMPARATIVE_KEYWORDS.some(kw => lower.includes(kw))) return 'comparative';
    if (AUTHORITY_KEYWORDS.some(kw => lower.includes(kw))) return 'authority';
    if (GEO_KEYWORDS.some(kw => lower.includes(kw))) return 'local_geo';
    return 'topical_cluster';
  }

  private estimateHeadingEeat(text: string): number {
    const lower = text.toLowerCase();
    let score = 40;
    if (AUTHORITY_KEYWORDS.some(kw => lower.includes(kw))) score += 20;
    if (EEAT_SIGNALS.expertise.some(kw => lower.includes(kw))) score += 15;
    if (EEAT_SIGNALS.trust.some(kw => lower.includes(kw))) score += 10;
    return Math.min(90, score);
  }

  private detectEeatSignals(bodyText: string): string[] {
    const signals: string[] = [];
    for (const [category, keywords] of Object.entries(EEAT_SIGNALS)) {
      for (const kw of keywords) {
        if (bodyText.includes(kw)) {
          signals.push(`${category}:${kw}`);
        }
      }
    }
    return [...new Set(signals)];
  }

  private deduplicateEntities(entities: SurfaceEntity[]): SurfaceEntity[] {
    const seen = new Map<string, SurfaceEntity>();
    for (const ent of entities) {
      const key = ent.entity_name.toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      if (key.length < 3) continue;
      if (seen.has(key)) {
        const existing = seen.get(key)!;
        existing.completeness_score = Math.max(existing.completeness_score, ent.completeness_score);
        existing.eeat_strength = Math.max(existing.eeat_strength, ent.eeat_strength);
      } else {
        seen.set(key, ent);
      }
    }
    return Array.from(seen.values());
  }

  // ─── Score Estimation ──────────────────────────────────

  private estimateSnapshot(
    workspaceId: string,
    websiteUrl: string,
    entities: SurfaceEntity[],
    pages: CrawledPage[]
  ): EntityReflectionSnapshot {
    const totalEntities = entities.length;
    const schemaCount = entities.filter(e => e.surface_type === 'schema_org').length;
    const highEeatCount = entities.filter(e => e.eeat_strength > 60).length;

    // Tech modifier: Schema.org 구조화 데이터 존재 비율
    const tech_mod_score = totalEntities > 0
      ? Math.min(95, Math.round((schemaCount / totalEntities) * 80) + 15)
      : 20;

    // EEAT modifier: 고신뢰 엔티티 비율 + 신호 보너스
    const eeat_mod_score = totalEntities > 0
      ? Math.min(95, Math.round((highEeatCount / totalEntities) * 70) + 25)
      : 25;

    // ERR 7차원 추정: 엔티티 타입별 존재 여부 + 수량 기반
    const typeCount = (type: string) => entities.filter(e => e.surface_type === type).length;

    const err_factoid     = Math.min(85, 15 + typeCount('factoid') * 7);
    const err_procedural  = Math.min(80, 10 + typeCount('procedural') * 10);
    const err_comparative = Math.min(70, 5 + typeCount('comparative') * 12);
    const err_authority   = Math.min(85, 10 + typeCount('authority') * 10);
    const err_schema      = schemaCount > 0 ? Math.min(90, 35 + schemaCount * 8) : 5;
    const err_topical     = Math.min(75, 10 + typeCount('topical_cluster') * 6);
    const err_geo         = Math.min(70, 5 + typeCount('local_geo') * 15);

    // AEPI 계산 (default 가중치)
    const weights = [0.15, 0.15, 0.15, 0.15, 0.15, 0.15, 0.10];
    const errValues = [err_factoid, err_procedural, err_comparative, err_authority, err_schema, err_topical, err_geo];
    let baseSum = 0;
    for (let i = 0; i < 7; i++) baseSum += errValues[i] * weights[i];
    const techMod = 0.8 + 0.2 * (tech_mod_score / 100);
    const eeatMod = 0.8 + 0.2 * (eeat_mod_score / 100);
    const aepi = parseFloat(Math.min(100, baseSum * techMod * eeatMod).toFixed(1));

    const estimatedReflected = Math.round(totalEntities * Math.min(1, aepi / 100));

    return {
      workspace_id: workspaceId,
      website_url: websiteUrl,
      engine_name: 'estimated',
      err_factoid,
      err_procedural,
      err_comparative,
      err_authority,
      err_schema,
      err_topical,
      err_geo,
      aepi_score: aepi,
      tech_mod_score,
      eeat_mod_score,
      tech_audit: { schema_entities: schemaCount, total_entities: totalEntities },
      eeat_audit: { high_eeat_entities: highEeatCount, total_entities: totalEntities },
      total_entities_checked: totalEntities,
      total_entities_reflected: estimatedReflected,
      measured_at: new Date().toISOString()
    };
  }

  // ─── Answer Card Generation ────────────────────────────

  private generateCards(
    workspaceId: string,
    websiteUrl: string,
    entities: SurfaceEntity[],
    brandName: string
  ): ReversedAnswerCard[] {
    const cards: ReversedAnswerCard[] = [];
    const now = new Date().toISOString();

    // Group entities by type and create cards for strategic groups
    const factoids = entities.filter(e => e.surface_type === 'factoid').slice(0, 3);
    const procedurals = entities.filter(e => e.surface_type === 'procedural').slice(0, 2);
    const authorities = entities.filter(e => e.surface_type === 'authority').slice(0, 2);

    for (const ent of factoids) {
      cards.push({
        id: `card-q-${cards.length}`,
        workspace_id: workspaceId,
        website_url: websiteUrl,
        card_type: 'product',
        headline: ent.entity_name,
        trigger_queries: [
          `${brandName} ${ent.entity_name} 정보`,
          `${ent.entity_name}란?`
        ],
        body_entity_ids: [ent.id!],
        source_page_urls: [ent.source_page_url],
        linked_canonical_question_id: null,
        linked_qis_scene_ids: [],
        completeness_score: ent.completeness_score,
        eeat_strength: ent.eeat_strength,
        schema_support_level: ent.has_schema_support ? 'partial' : 'none',
        optimization_status: ent.has_schema_support ? 'optimized' : 'raw',
        created_at: now
      });
    }

    for (const ent of procedurals) {
      cards.push({
        id: `card-q-${cards.length}`,
        workspace_id: workspaceId,
        website_url: websiteUrl,
        card_type: 'how_to',
        headline: ent.entity_name,
        trigger_queries: [`${brandName} ${ent.entity_name}`],
        body_entity_ids: [ent.id!],
        source_page_urls: [ent.source_page_url],
        linked_canonical_question_id: null,
        linked_qis_scene_ids: [],
        completeness_score: ent.completeness_score,
        eeat_strength: ent.eeat_strength,
        schema_support_level: 'none',
        optimization_status: 'raw',
        created_at: now
      });
    }

    for (const ent of authorities) {
      cards.push({
        id: `card-q-${cards.length}`,
        workspace_id: workspaceId,
        website_url: websiteUrl,
        card_type: 'direct_answer',
        headline: ent.entity_name,
        trigger_queries: [`${brandName} 인증`, `${brandName} 전문성`],
        body_entity_ids: [ent.id!],
        source_page_urls: [ent.source_page_url],
        linked_canonical_question_id: null,
        linked_qis_scene_ids: [],
        completeness_score: ent.completeness_score,
        eeat_strength: ent.eeat_strength,
        schema_support_level: 'none',
        optimization_status: 'raw',
        created_at: now
      });
    }

    return cards;
  }

  // ─── Gap Analysis ──────────────────────────────────────

  private generateGaps(
    workspaceId: string,
    websiteUrl: string,
    entities: SurfaceEntity[]
  ): SurfaceGapAnalysis[] {
    const gaps: SurfaceGapAnalysis[] = [];
    const now = new Date().toISOString();

    for (const ent of entities) {
      // Schema.org 없는 엔티티 → YELLOW (기술 최적화 필요)
      if (!ent.has_schema_support && ent.surface_type !== 'local_geo') {
        gaps.push({
          workspace_id: workspaceId,
          website_url: websiteUrl,
          entity_name: ent.entity_name,
          entity_type: ent.surface_type,
          quadrant: 'yellow',
          industry_qis_layer: null,
          linked_canonical_question_id: null,
          linked_surface_entity_id: ent.id || null,
          prescription_type: 'add_schema',
          prescription_detail: `Add Schema.org JSON-LD structured markup for "${ent.entity_name}" to improve AI crawler data binding.`,
          estimated_aepi_impact: 12.5,
          priority_score: Math.round(60 + (100 - ent.eeat_strength) * 0.3),
          analyzed_at: now
        });
      } else {
        // Schema.org 있는 엔티티 → GREEN (유지)
        gaps.push({
          workspace_id: workspaceId,
          website_url: websiteUrl,
          entity_name: ent.entity_name,
          entity_type: ent.surface_type,
          quadrant: 'green',
          industry_qis_layer: null,
          linked_canonical_question_id: null,
          linked_surface_entity_id: ent.id || null,
          prescription_detail: 'Asset maintained. Continue monitoring.',
          estimated_aepi_impact: 0,
          priority_score: 10,
          analyzed_at: now
        });
      }
    }

    // Check for missing content types → RED (콘텐츠 갭)
    const hasType = (type: string) => entities.some(e => e.surface_type === type);
    const contentGaps: Array<{ name: string; type: string; layer: string }> = [];

    if (!hasType('procedural')) {
      contentGaps.push({ name: '사용 가이드/절차 콘텐츠 부재', type: 'procedural', layer: 'L4_journey' });
    }
    if (!hasType('comparative')) {
      contentGaps.push({ name: '경쟁 비교/추천 콘텐츠 부재', type: 'comparative', layer: 'L2_competitive' });
    }
    if (!hasType('authority')) {
      contentGaps.push({ name: '전문성/인증 권위 콘텐츠 부재', type: 'authority', layer: 'L5_ymyl' });
    }
    if (!hasType('local_geo')) {
      contentGaps.push({ name: '지역/오프라인 접점 정보 부재', type: 'local_geo', layer: 'L1_universal' });
    }
    if (!hasType('schema_org')) {
      contentGaps.push({ name: 'Schema.org 구조화 데이터 전체 부재', type: 'schema_org', layer: 'L3_ingredient' });
    }

    for (const gap of contentGaps) {
      gaps.push({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        entity_name: gap.name,
        entity_type: 'industry_topic_gap',
        quadrant: 'red',
        industry_qis_layer: gap.layer,
        linked_canonical_question_id: null,
        linked_surface_entity_id: null,
        prescription_type: 'create_content',
        prescription_detail: `Create dedicated ${gap.type} content to fill this gap. This content type is missing from your site.`,
        estimated_aepi_impact: 18.0,
        priority_score: 85,
        analyzed_at: now
      });
    }

    return gaps;
  }

  // ─── Minimal Fallback ──────────────────────────────────

  private buildMinimalFallback(
    workspaceId: string,
    websiteUrl: string,
    brandName: string
  ): QuickAuditResult {
    const now = new Date().toISOString();
    let hostname = websiteUrl;
    try { hostname = new URL(websiteUrl).hostname; } catch {}

    return {
      websiteUrl,
      brandName,
      entities: [{
        id: 'se-fallback-0',
        workspace_id: workspaceId,
        website_url: websiteUrl,
        source_page_url: websiteUrl,
        surface_type: 'factoid',
        entity_name: `${brandName} (${hostname})`,
        entity_content: { note: '크롤링 실패 — 수동 감사 필요' },
        completeness_score: 10,
        eeat_strength: 10,
        has_schema_support: false,
        extraction_model: 'fallback',
        extraction_confidence: 10,
        extracted_at: now
      }],
      cards: [],
      snapshot: {
        workspace_id: workspaceId,
        website_url: websiteUrl,
        engine_name: 'estimated',
        err_factoid: 0, err_procedural: 0, err_comparative: 0,
        err_authority: 0, err_schema: 0, err_topical: 0, err_geo: 0,
        aepi_score: 0,
        tech_mod_score: 0, eeat_mod_score: 0,
        tech_audit: { schema_entities: 0, total_entities: 0 },
        eeat_audit: { high_eeat_entities: 0, total_entities: 0 },
        total_entities_checked: 0, total_entities_reflected: 0,
        measured_at: now
      },
      gaps: [{
        workspace_id: workspaceId,
        website_url: websiteUrl,
        entity_name: '크롤링 실패 — 사이트 접근 불가',
        entity_type: 'industry_topic_gap',
        quadrant: 'red',
        industry_qis_layer: null,
        linked_canonical_question_id: null,
        linked_surface_entity_id: null,
        prescription_type: 'create_content',
        prescription_detail: `사이트 ${websiteUrl}에 접근할 수 없습니다. URL을 확인하거나 사이트의 크롤링 차단(robots.txt, IP 차단) 여부를 점검해주세요.`,
        estimated_aepi_impact: 0,
        priority_score: 100,
        analyzed_at: now
      }],
      crawledPages: 0,
      auditMode: 'estimated'
    };
  }
}
