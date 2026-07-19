/**
 * lib/surface/quick-site-analyzer.ts
 *
 * HTML-only 크롤링 기반 즉시 분석기.
 * AI API 호출 없이 크롤링 + HTML 파싱만으로 사이트의
 * AEO/GEO 가시성 점수를 추정합니다.
 *
 * 소요시간: ~3-8초 (3-5 페이지 크롤링)
 */

import { WebsiteCrawler, CrawledPage } from './website-crawler';
import {
  SurfaceEntity, ReversedAnswerCard,
  EntityReflectionSnapshot, SurfaceGapAnalysis
} from '../schema';
import { TechInfraAuditor, TechInfraAuditResult } from './tech-infra-auditor';
import { SchemaQualityAuditor, SchemaQualityAuditResult } from './schema-quality-auditor';
import { ContentSemanticAnalyzer, ContentSemanticResult } from './content-semantic-analyzer';
import { AepiCalculator } from '../benchmark/aepi-calculator';

export interface QuickAuditResult {
  websiteUrl: string;
  brandName: string;
  entities: SurfaceEntity[];
  cards: ReversedAnswerCard[];
  snapshot: EntityReflectionSnapshot;
  gaps: SurfaceGapAnalysis[];
  crawledPages: number;
  auditMode: 'estimated' | 'measured' | 'partial';
  techInfra?: TechInfraAuditResult;
  schemaQuality?: SchemaQualityAuditResult;
  contentSemantic?: ContentSemanticResult;
}

// ─── EEAT 신호 키워드 ──────────────────────────────────
const EEAT_SIGNALS = {
  experience: ['후기', '리뷰', '경험담', '사용기', 'review', 'testimonial', 'experience'],
  expertise: ['전문가', '연구', '박사', 'PhD', 'MD', '임상', 'clinical', '논문', 'paper', '특허', 'patent', '자격증'],
  authority: ['수상', 'award', '인증', 'certified', '공인', '등록', '협회', 'association', 'ISO'],
  trust: ['보증', '환불', '보험', '개인정보', 'privacy', '약관', 'terms', '안전', 'safety']
};

const PROCEDURAL_KEYWORDS = ['방법', '순서', '루틴', '가이드', '단계', 'how', 'guide', 'step', 'tutorial', 'routine', '사용법', '바르는법', '세안법', '관리법', '케어', '스텝', '레시피', '만들기', '절차', '과정', '팁', 'tips', '노하우'];
const COMPARATIVE_KEYWORDS = ['비교', 'vs', '차이', '추천', '순위', 'compare', 'best', 'top', 'ranking', '어떤', '선택', '고르는', '리뷰', '평가', '장단점', '효과', '성분비교', '대안', 'alternative', 'review'];
const AUTHORITY_KEYWORDS = ['임상', '연구', '특허', '수상', '인증', 'clinical', 'research', 'patent', 'award', 'certified', '한방', '전통', '과학', '성분', '피부과', '더마', '검증', '테스트', '시험', '증명', 'FDA', 'KFDA', '학회', '논문'];
const GEO_KEYWORDS = ['위치', '주소', '매장', '지점', '오시는', 'location', 'address', 'store', 'branch', '서울', '부산', '대구', '강남', '명동', '플래그십', 'flagship', '백화점', '면세점', '팝업'];
const BRAND_IDENTITY_KEYWORDS = ['소개', '철학', '가치', '비전', '역사', 'about', 'philosophy', 'vision', 'history', '브랜드', '헤리티지', 'heritage', '스토리', 'story', '미션', 'mission'];
const PRODUCT_CATALOG_KEYWORDS = ['상품', '제품', '서비스', '가격', '구매', 'shop', 'product', 'service', 'price', 'buy', '카탈로그', '컬렉션', 'collection', '라인업', '시리즈', '세럼', '크림', '에센스', '토너'];
const EXPERTISE_KEYWORDS = ['저자', '프로필', '작가', '연구원', '이력', 'author', 'profile', 'career', 'credentials', '전문가', '박사', 'PhD', 'MD', '자격증'];
const TEMPORAL_KEYWORDS = ['이벤트', '행사', '일정', '기간', 'news', 'event', 'calendar', 'schedule', '신제품', '출시', 'launch', '시즌', '한정판', 'limited'];
const MEDIA_KEYWORDS = ['갤러리', '사진', '영상', '유튜브', 'gallery', 'photo', 'video', 'youtube', '룩북', 'lookbook', '캠페인', 'campaign'];

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
    let crawlResult: any = null;
    let pages: CrawledPage[] = [];

    try {
      // Crawl max 5 pages for quick audit
      crawlResult = await crawler.crawl(websiteUrl, 5);
      pages = crawlResult.pages || [];
    } catch (e: any) {
      console.warn(`[QuickAnalyzer] Crawl failed: ${e.message}. Using minimal fallback.`);
    }

    if (pages.length === 0) {
      return this.buildMinimalFallback(workspaceId, websiteUrl, brandName);
    }

    // 1. L1, L2, L3 Auditing
    const techInfra = TechInfraAuditor.audit(crawlResult);
    const schemaQuality = SchemaQualityAuditor.audit(pages);
    const contentSemantic = ContentSemanticAnalyzer.analyze(pages, techInfra.httpsEnabled, schemaQuality.orgSameAsProfiles.length);

    // 2. Extract entities from HTML
    const entities = this.extractEntitiesFromHtml(pages, workspaceId, websiteUrl);

    // B5 수정: entities가 비었으면 브랜드 기본 entity 주입
    if (entities.length === 0) {
      let hostname = websiteUrl;
      try { hostname = new URL(websiteUrl).hostname; } catch {}
      const now = new Date().toISOString();
      entities.push({
        id: 'se-fallback-brand',
        workspace_id: workspaceId,
        website_url: websiteUrl,
        source_page_url: websiteUrl,
        surface_type: 'brand_identity',
        entity_name: brandName || hostname,
        entity_content: { domain: hostname, source: 'fallback-brand', note: 'SPA/크롤링 제한으로 자동 생성' },
        completeness_score: 30,
        eeat_strength: 20,
        has_schema_support: false,
        extraction_model: 'fallback',
        extraction_confidence: 30,
        extracted_at: now
      });
      // bodyText에서 추가 entity 추출 시도 (마크다운 heading 패턴)
      for (const page of pages) {
        const text = page.bodyText || '';
        const mdHeadingRegex = /^#{1,3}\s+(.+)$/gm;
        let mdMatch;
        while ((mdMatch = mdHeadingRegex.exec(text)) !== null) {
          const headingText = mdMatch[1].trim();
          if (headingText.length >= 4 && headingText.length <= 200) {
            const surfaceType = this.classifyHeadingText(headingText);
            entities.push({
              id: `se-md-${entities.length}`,
              workspace_id: workspaceId,
              website_url: websiteUrl,
              source_page_url: page.url,
              surface_type: surfaceType,
              entity_name: headingText,
              entity_content: { source: 'markdown-heading' },
              completeness_score: 45,
              eeat_strength: this.estimateHeadingEeat(headingText),
              has_schema_support: false,
              extraction_model: 'markdown-parser',
              extraction_confidence: 50,
              extracted_at: now
            });
          }
        }
      }
    }

    // 3. Estimate scores and build snapshot
    const snapshot = this.estimateSnapshot(workspaceId, websiteUrl, entities, pages, techInfra, schemaQuality, contentSemantic);

    // 4. Generate answer card stubs
    const cards = this.generateCards(workspaceId, websiteUrl, entities, brandName);

    // 5. Generate gap analysis (integrating L1/L2/L3 gaps)
    const gaps = this.generateGaps(workspaceId, websiteUrl, entities, techInfra, schemaQuality, contentSemantic);

    return {
      websiteUrl,
      brandName,
      entities,
      cards,
      snapshot,
      gaps,
      crawledPages: pages.length,
      auditMode: pages.some(p => p.isSpaRendered) ? 'partial' : 'estimated',
      techInfra,
      schemaQuality,
      contentSemantic
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

      // B. Page title as brand_identity or factoid entity
      if (page.title && page.title.length > 3) {
        const isMain = page.url === websiteUrl || page.url === `${websiteUrl}/` || page.url.endsWith('/index.html');
        entities.push({
          id: `se-q-${idx++}`,
          workspace_id: workspaceId,
          website_url: websiteUrl,
          source_page_url: page.url,
          surface_type: isMain ? 'brand_identity' : 'factoid',
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

      // C. Heading-based entities (classified by content into 12 types)
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

      // D. EEAT signal detection from body text (person_expertise / authority)
      const bodyLower = page.bodyText.toLowerCase();
      const eeatSignals = this.detectEeatSignals(bodyLower);
      if (eeatSignals.length > 0) {
        const hasExpertise = eeatSignals.some(s => s.startsWith('expertise'));
        entities.push({
          id: `se-q-${idx++}`,
          workspace_id: workspaceId,
          website_url: websiteUrl,
          source_page_url: page.url,
          surface_type: hasExpertise ? 'person_expertise' : 'authority',
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

    return this.deduplicateEntities(entities);
  }

  private classifyHeadingText(text: string): SurfaceEntity['surface_type'] {
    const lower = text.toLowerCase();
    if (PROCEDURAL_KEYWORDS.some(kw => lower.includes(kw))) return 'procedural';
    if (COMPARATIVE_KEYWORDS.some(kw => lower.includes(kw))) return 'comparative';
    if (AUTHORITY_KEYWORDS.some(kw => lower.includes(kw))) return 'authority';
    if (GEO_KEYWORDS.some(kw => lower.includes(kw))) return 'local_geo';
    if (BRAND_IDENTITY_KEYWORDS.some(kw => lower.includes(kw))) return 'brand_identity';
    if (PRODUCT_CATALOG_KEYWORDS.some(kw => lower.includes(kw))) return 'product_catalog';
    if (EXPERTISE_KEYWORDS.some(kw => lower.includes(kw))) return 'person_expertise';
    if (TEMPORAL_KEYWORDS.some(kw => lower.includes(kw))) return 'temporal_event';
    if (MEDIA_KEYWORDS.some(kw => lower.includes(kw))) return 'media_asset';
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
    pages: CrawledPage[],
    techInfra: TechInfraAuditResult,
    schemaQuality: SchemaQualityAuditResult,
    contentSemantic: ContentSemanticResult
  ): EntityReflectionSnapshot {
    const totalEntities = entities.length;
    const schemaCount = entities.filter(e => e.surface_type === 'schema_org').length;
    const highEeatCount = entities.filter(e => e.eeat_strength > 60).length;

    // Tech modifier: Schema.org 구조화 데이터 존재 비율 + TechInfra 점수 반영
    const tech_mod_score = Math.round((techInfra.techInfraScore + schemaQuality.schemaQualityScore) / 2);

    // EEAT modifier: Content EEAT 점수 반영
    const eeat_mod_score = contentSemantic.eeat.overall;

    // ERR 7차원 추정
    const typeCount = (type: string) => entities.filter(e => e.surface_type === type).length;

    const err_factoid     = Math.min(85, 15 + typeCount('factoid') * 7 + typeCount('brand_identity') * 10);
    const err_procedural  = Math.min(80, 10 + typeCount('procedural') * 10);
    const err_comparative = Math.min(70, 5 + typeCount('comparative') * 12);
    const err_authority   = Math.min(85, 10 + typeCount('authority') * 10 + typeCount('person_expertise') * 8);
    const err_schema      = schemaCount > 0 ? Math.min(90, 35 + schemaCount * 8) : 5;
    const err_topical     = Math.min(75, 10 + typeCount('topical_cluster') * 6);
    const err_geo         = Math.min(70, 5 + typeCount('local_geo') * 15);

    // AEPI 계산 (업종별 동적 가중치 적용)
    const industryWeights = AepiCalculator.getWeights('default');
    const weightKeys = ['factoid', 'procedural', 'comparative', 'authority', 'schema_org', 'topical_cluster', 'local_geo'];
    const errValues = [err_factoid, err_procedural, err_comparative, err_authority, err_schema, err_topical, err_geo];
    let baseSum = 0;
    for (let i = 0; i < 7; i++) baseSum += errValues[i] * (industryWeights[weightKeys[i]] || 0.15);
    const techMod = 0.8 + 0.2 * (tech_mod_score / 100);
    const eeatMod = 0.8 + 0.2 * (eeat_mod_score / 100);
    const aepi = parseFloat(Math.min(100, baseSum * techMod * eeatMod).toFixed(1));

    const estimatedReflected = Math.round(totalEntities * Math.min(1, aepi / 100));

    // L4 Reflection properties
    // B10 수정: AEPI=0일 때 L1+L2+L3 기반 최솟값 보정
    const citationRate = aepi > 5
      ? Math.round(aepi * 0.7)
      : Math.max(5, Math.round((techInfra.techInfraScore * 0.3 + schemaQuality.schemaQualityScore * 0.4 + contentSemantic.contentSemanticScore * 0.3) * 0.5));

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
      tech_audit: { schema_entities: schemaCount, total_entities: totalEntities, score: techInfra.techInfraScore },
      eeat_audit: { high_eeat_entities: highEeatCount, total_entities: totalEntities, score: contentSemantic.eeat.overall },
      total_entities_checked: totalEntities,
      total_entities_reflected: estimatedReflected,
      measured_at: new Date().toISOString(),
      citationRate,
      citationPositions: { inline: Math.round(citationRate * 0.4), footer: Math.round(citationRate * 0.6), absent: 100 - citationRate },
      competitorMentionRate: Math.max(0, 100 - citationRate),
      competitorDetails: [],
      intentEntityMatchRate: { informational: Math.round(aepi), commercial: Math.round(aepi * 0.8) },
      distortionPatterns: { absent: 100 - citationRate }
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

    // Map 12 surface_types to 10 card_types
    const typeToCard: Record<string, ReversedAnswerCard['card_type']> = {
      factoid: 'direct_answer',
      procedural: 'how_to',
      comparative: 'comparison',
      authority: 'direct_answer',
      schema_org: 'product',
      topical_cluster: 'faq',
      local_geo: 'local',
      brand_identity: 'direct_answer',
      product_catalog: 'product',
      person_expertise: 'expert_profile',
      temporal_event: 'event_card',
      media_asset: 'list'
    };

    const makeTriggers = (ent: SurfaceEntity): string[] => {
      const name = ent.entity_name.length > 60
        ? ent.entity_name.substring(0, 60)
        : ent.entity_name;

      switch (ent.surface_type) {
        case 'factoid':
          return [`${brandName} ${name}`, `${name}이란?`];
        case 'procedural':
          return [`${name} 방법`, `${brandName} ${name}`];
        case 'comparative':
          return [`${name} 비교`, `${brandName} 추천`];
        case 'authority':
          return [`${brandName} 인증`, `${brandName} 전문성 신뢰도`];
        case 'schema_org': {
          const schemaType = ent.entity_content?.['@type'] || '';
          return [`${brandName} ${name}`, `${schemaType} ${brandName}`];
        }
        case 'topical_cluster':
          return [`${name}`, `${brandName} ${name} 정보`];
        case 'local_geo':
          return [`${brandName} 위치`, `${brandName} 매장 주소`];
        case 'brand_identity':
          return [`${brandName} 소개`, `${brandName} 가치 철학`];
        case 'product_catalog':
          return [`${brandName} 상품 종류`, `${brandName} 가격 정보`];
        case 'person_expertise':
          return [`${brandName} 저자`, `${brandName} 전문가 소개`];
        case 'temporal_event':
          return [`${brandName} 이벤트 일정`, `${brandName} 소식`];
        case 'media_asset':
          return [`${brandName} 사진`, `${brandName} 동영상`];
        default:
          return [`${brandName} ${name}`];
      }
    };

    for (const ent of entities.slice(0, 15)) {
      const cardType = typeToCard[ent.surface_type] || 'direct_answer';
      const isSchemaSupported = ent.has_schema_support;

      cards.push({
        id: `card-q-${cards.length}`,
        workspace_id: workspaceId,
        website_url: websiteUrl,
        card_type: cardType,
        headline: ent.entity_name,
        trigger_queries: makeTriggers(ent),
        body_entity_ids: [ent.id || `ent-${cards.length}`],
        source_page_urls: [ent.source_page_url],
        linked_canonical_question_id: null,
        linked_qis_scene_ids: [],
        completeness_score: ent.completeness_score,
        eeat_strength: ent.eeat_strength,
        schema_support_level: isSchemaSupported ? 'full' : 'none',
        optimization_status: isSchemaSupported ? 'optimized' : 'raw',
        created_at: now
      });
    }

    return cards;
  }

  // ─── Gap Analysis ──────────────────────────────────────

  private generateGaps(
    workspaceId: string,
    websiteUrl: string,
    entities: SurfaceEntity[],
    techInfra: TechInfraAuditResult,
    schemaQuality: SchemaQualityAuditResult,
    contentSemantic: ContentSemanticResult
  ): SurfaceGapAnalysis[] {
    const gaps: SurfaceGapAnalysis[] = [];
    const now = new Date().toISOString();

    // 1. Schema gaps for entities
    for (const ent of entities) {
      if (!ent.has_schema_support && ent.surface_type !== 'local_geo' && ent.surface_type !== 'schema_org') {
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
      }
    }

    // 2. Integration of L1: Tech Infra issues
    for (const issue of techInfra.issues) {
      const prescMap: Record<string, SurfaceGapAnalysis['prescription_type']> = {
        crawlability: 'fix_robots_txt',
        performance: 'improve_meta', // placeholder, but can map to standard
        security: 'fix_https',
        structure: 'add_canonical'
      };
      
      let quad: 'red' | 'yellow' | 'white' = 'yellow';
      if (issue.severity === 'critical') quad = 'red';
      
      gaps.push({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        entity_name: issue.title,
        entity_type: 'tech_infra_issue',
        quadrant: quad,
        industry_qis_layer: 'L1_universal',
        linked_canonical_question_id: null,
        linked_surface_entity_id: null,
        prescription_type: prescMap[issue.category] || 'improve_meta',
        prescription_detail: issue.description + ' Recommendation: ' + issue.recommendation,
        estimated_aepi_impact: issue.severity === 'critical' ? 20.0 : 8.0,
        priority_score: issue.severity === 'critical' ? 95 : 65,
        analyzed_at: now
      });
    }

    // 3. Integration of L2: Schema issues
    for (const issue of schemaQuality.issues) {
      let quad: 'red' | 'yellow' = 'yellow';
      if (issue.severity === 'critical') quad = 'red';

      gaps.push({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        entity_name: issue.message,
        entity_type: 'schema_quality_issue',
        quadrant: quad,
        industry_qis_layer: 'L3_ingredient',
        linked_canonical_question_id: null,
        linked_surface_entity_id: null,
        prescription_type: issue.property === 'author' ? 'add_author_markup' : 'add_schema',
        prescription_detail: issue.recommendation,
        estimated_aepi_impact: issue.severity === 'critical' ? 15.0 : 5.0,
        priority_score: issue.severity === 'critical' ? 90 : 55,
        analyzed_at: now
      });
    }

    // 4. Integration of L3: Content Semantic issues
    for (const issue of contentSemantic.issues) {
      let quad: 'red' | 'yellow' = 'yellow';
      if (issue.severity === 'critical') quad = 'red';

      const prescMap: Record<string, SurfaceGapAnalysis['prescription_type']> = {
        eeat: 'add_eeat_signal',
        answer_first: 'improve_heading',
        freshness: 'update_content',
        structure: 'improve_internal_linking',
        originality: 'create_content'
      };

      gaps.push({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        entity_name: issue.title,
        entity_type: 'content_semantic_issue',
        quadrant: quad,
        industry_qis_layer: 'L5_ymyl',
        linked_canonical_question_id: null,
        linked_surface_entity_id: null,
        prescription_type: prescMap[issue.category] || 'create_content',
        prescription_detail: issue.description + ' ' + issue.recommendation,
        estimated_aepi_impact: issue.severity === 'critical' ? 18.0 : 7.0,
        priority_score: issue.severity === 'critical' ? 88 : 60,
        analyzed_at: now
      });
    }

    // 5. Redundant placeholder check for completely missing content types
    const hasType = (type: string) => entities.some(e => e.surface_type === type);
    if (!hasType('procedural')) {
      gaps.push({
        workspace_id: workspaceId,
        website_url: websiteUrl,
        entity_name: '사용 가이드/절차 콘텐츠 부재',
        entity_type: 'industry_topic_gap',
        quadrant: 'red',
        industry_qis_layer: 'L4_journey',
        linked_canonical_question_id: null,
        linked_surface_entity_id: null,
        prescription_type: 'create_content',
        prescription_detail: 'Create dedicated procedural guide content to improve search visibility for tutorial queries.',
        estimated_aepi_impact: 15.0,
        priority_score: 80,
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

    const fallbackSnapshot: EntityReflectionSnapshot = {
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
      measured_at: now,
      citationRate: 0,
      citationPositions: {},
      competitorMentionRate: 0,
      competitorDetails: [],
      intentEntityMatchRate: {},
      distortionPatterns: {}
    };

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
      snapshot: fallbackSnapshot,
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
