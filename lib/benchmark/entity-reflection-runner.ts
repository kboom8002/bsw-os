import { SearchProviderFactory } from '../ai/search-provider-factory';
import { SurfaceEntity, EntityReflectionSnapshot, ReflectionQuality, EntityReflectionDetail } from '../schema';
import { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';
import { getSupabaseAdminClient } from '../supabase';
import { fuzzyKoreanMatch, normalizeKorean } from './korean-normalizer';

export interface EntityReflectionResult {
  snapshot: EntityReflectionSnapshot;
  reflectionDetails: EntityReflectionDetail[];
  rawResponses: string[];
  rawCitations?: any[][];
}

const COMPARATIVE_KEYWORDS = ['비교', 'vs', '차이', '추천', '순위', 'compare', 'best', 'top', 'ranking', '어떤'];
const PRODUCT_CATALOG_KEYWORDS = ['상품', '제품', '서비스', '가격', '구매', 'shop', 'product', 'service', 'price', 'buy', '카탈로그'];

export class EntityReflectionRunner {
  private engines: string[];

  constructor(engines: string[] = ['chatgpt_search', 'gemini_grounding']) {
    this.engines = engines;
  }

  private calcKeywordOverlap(entityContent: any, text: string): number {
    const keywords: string[] = [];
    const flattenObj = (obj: any) => {
      for (const k in obj) {
        const val = obj[k];
        if (typeof val === 'string' && val.length > 2) {
          keywords.push(normalizeKorean(val.toLowerCase()));
        } else if (Array.isArray(val)) {
          val.forEach(v => {
            if (typeof v === 'string' && v.length > 2) keywords.push(normalizeKorean(v.toLowerCase()));
          });
        } else if (typeof val === 'object' && val !== null) {
          flattenObj(val);
        }
      }
    };
    
    if (entityContent && typeof entityContent === 'object') {
      flattenObj(entityContent);
    }

    const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 10);
    if (uniqueKeywords.length === 0) return 0;

    let matchedCount = 0;
    uniqueKeywords.forEach(kw => {
      if (text.includes(kw)) matchedCount++;
    });
    return matchedCount / uniqueKeywords.length;
  }

  private classifyReflection(
    entity: SurfaceEntity,
    responseText: string,
    brandDomains: string[]
  ): ReflectionQuality {
    const normResponse = normalizeKorean(responseText.toLowerCase());
    const keywordOverlap = this.calcKeywordOverlap(entity.entity_content, normResponse);

    if (fuzzyKoreanMatch(entity.entity_name, responseText)) {
      if (keywordOverlap >= 0.8) return 'exact';
      if (keywordOverlap >= 0.4) return 'partial';
      return 'partial'; 
    }

    if (keywordOverlap >= 0.6) return 'partial';
    if (keywordOverlap >= 0.2) return 'distorted';

    const citesDomain = brandDomains.some(bd => {
      const cleanBd = bd.toLowerCase().replace(/^www\./, '');
      return normResponse.includes(cleanBd);
    });
    if (citesDomain && keywordOverlap > 0) return 'partial';

    return 'absent';
  }

  private classifyReflectionWithCompetitor(
    entity: SurfaceEntity,
    responseText: string,
    brandDomains: string[],
    competitors: string[]
  ): EntityReflectionDetail {
    const quality = this.classifyReflection(entity, responseText, brandDomains);
    const normResponse = normalizeKorean(responseText.toLowerCase());

    let competitor_mentioned: string | undefined;
    if (quality === 'absent' || quality === 'distorted') {
      for (const comp of competitors) {
        if (fuzzyKoreanMatch(comp, responseText)) {
          competitor_mentioned = comp;
          break;
        }
      }
    }

    return {
      entity_id: entity.id!,
      entity_name: entity.entity_name,
      surface_type: entity.surface_type,
      quality,
      keyword_overlap: this.calcKeywordOverlap(entity.entity_content, normResponse),
      competitor_mentioned
    };
  }

  async run(
    workspaceId: string,
    websiteUrl: string,
    entities: SurfaceEntity[],
    probes: SeedProbeQuestion[],
    brandDomains: string[],
    engineName = 'composite',
    competitors: string[] = []
  ): Promise<EntityReflectionResult> {
    const measuredAt = new Date().toISOString();
    console.log(`[ERR Runner] Measuring ${entities.length} entities against ${probes.length} probes for ${websiteUrl}`);

    const engineList = engineName === 'composite' ? this.engines : [engineName];
    const responses: Array<{ text: string; citations: any[] }> = [];

    for (const probe of probes.slice(0, 15)) {
      const queryText = probe.question_text.replace(/{brand}/g, '');
      try {
        const multiRes = await SearchProviderFactory.runMultiEngine(queryText, engineList);
        for (const eng of engineList) {
          const res = multiRes.results[eng];
          if (res) {
            responses.push({
              text: res.raw_response_text || '',
              citations: res.citations || []
            });
          }
        }
      } catch (e: any) {
        console.warn(`[ERR Runner] Probe failed: "${queryText}" -> ${e.message}`);
      }
    }

    // Evaluate entities
    const reflectionDetails: EntityReflectionDetail[] = [];
    entities.forEach(entity => {
      let bestDetail: EntityReflectionDetail = {
        entity_id: entity.id!,
        entity_name: entity.entity_name,
        surface_type: entity.surface_type,
        quality: 'absent',
        keyword_overlap: 0
      };

      const qualityRank = { exact: 4, partial: 3, distorted: 2, absent: 1, outdated: 0, competitor_substituted: 0, hallucinated: 0 };

      for (const resp of responses) {
        const detail = this.classifyReflectionWithCompetitor(entity, resp.text, brandDomains, competitors);
        
        if (qualityRank[detail.quality] > qualityRank[bestDetail.quality]) {
          bestDetail = detail;
        }
        if (bestDetail.quality === 'exact') break;
      }
      reflectionDetails.push(bestDetail);
    });

    // Aggregate 7-dimension ERR based on weighted quality
    const errCounts: Record<string, { total: number; weightedReflected: number }> = {
      factoid: { total: 0, weightedReflected: 0 },
      procedural: { total: 0, weightedReflected: 0 },
      comparative: { total: 0, weightedReflected: 0 },
      authority: { total: 0, weightedReflected: 0 },
      schema_org: { total: 0, weightedReflected: 0 },
      topical_cluster: { total: 0, weightedReflected: 0 },
      local_geo: { total: 0, weightedReflected: 0 },
      brand_identity: { total: 0, weightedReflected: 0 },
      product_catalog: { total: 0, weightedReflected: 0 },
      person_expertise: { total: 0, weightedReflected: 0 },
      temporal_event: { total: 0, weightedReflected: 0 },
      media_asset: { total: 0, weightedReflected: 0 }
    };

    const QUALITY_WEIGHTS: Record<ReflectionQuality, number> = {
      exact: 1.0, partial: 0.6, distorted: 0.2, absent: 0.0,
      outdated: 0.0, competitor_substituted: 0.0, hallucinated: 0.0
    };

    let reflectedCount = 0;
    reflectionDetails.forEach(detail => {
      const type = detail.surface_type;
      if (errCounts[type]) {
        errCounts[type].total++;
        errCounts[type].weightedReflected += QUALITY_WEIGHTS[detail.quality];
        if (detail.quality !== 'absent') reflectedCount++;
      }
    });

    const getErrRate = (type: string): number => {
      const data = errCounts[type];
      if (!data || data.total === 0) return 0;
      return parseFloat(((data.weightedReflected / data.total) * 100).toFixed(1));
    };

    const err_factoid = getErrRate('factoid');
    const err_procedural = getErrRate('procedural');
    const err_comparative = getErrRate('comparative');
    const err_authority = getErrRate('authority');
    const err_schema = getErrRate('schema_org');
    const err_topical = getErrRate('topical_cluster');
    const err_geo = getErrRate('local_geo');

    const totalEntities = entities.length;
    const schemaEntitiesCount = entities.filter(e => e.surface_type === 'schema_org').length;
    const highEeatEntitiesCount = entities.filter(e => (e.eeat_strength || 0) > 75).length;

    const tech_mod_score = totalEntities > 0 
      ? Math.round((schemaEntitiesCount / totalEntities) * 100) 
      : 50;

    const eeat_mod_score = totalEntities > 0 
      ? Math.round((highEeatEntitiesCount / totalEntities) * 100) 
      : 50;

    // L4 Citation & Competitors Calculations
    let citedResponses = 0;
    const citationPositions = { inline: 0, footer: 0, absent: 0 };
    
    for (const resp of responses) {
      let isCited = false;
      let inlineCite = false;
      let footerCite = false;

      if (resp.citations && Array.isArray(resp.citations)) {
        for (const cite of resp.citations) {
          const citeUrl = String(cite.url || cite.uri || cite || '').toLowerCase();
          if (brandDomains.some(bd => citeUrl.includes(bd.toLowerCase().replace(/^www\./, '')))) {
            isCited = true;
            footerCite = true;
            break;
          }
        }
      }

      const inlineRegex = /\[[^\]]+\]\((https?:\/\/[^\)]+)\)/g;
      let match;
      while ((match = inlineRegex.exec(resp.text)) !== null) {
        const linkUrl = match[1].toLowerCase();
        if (brandDomains.some(bd => linkUrl.includes(bd.toLowerCase().replace(/^www\./, '')))) {
          isCited = true;
          inlineCite = true;
          break;
        }
      }

      if (isCited) {
        citedResponses++;
        if (inlineCite) {
          citationPositions.inline++;
        } else {
          citationPositions.footer++;
        }
      } else {
        citationPositions.absent++;
      }
    }

    const citationRate = responses.length > 0 ? Math.round((citedResponses / responses.length) * 100) : 0;

    let competitorMentionCount = 0;
    const competitorDetailsMap: Record<string, { mentionCount: number; probeCount: number }> = {};
    for (const comp of competitors) {
      competitorDetailsMap[comp] = { mentionCount: 0, probeCount: 0 };
    }

    for (const resp of responses) {
      let competitorFound = false;
      for (const comp of competitors) {
        const isCompMentioned = fuzzyKoreanMatch(comp, resp.text) || resp.text.toLowerCase().includes(comp.toLowerCase());
        if (isCompMentioned) {
          competitorFound = true;
          competitorDetailsMap[comp].mentionCount++;
        }
        competitorDetailsMap[comp].probeCount++;
      }
      if (competitorFound) {
        competitorMentionCount++;
      }
    }

    const competitorMentionRate = responses.length > 0 ? Math.round((competitorMentionCount / responses.length) * 100) : 0;
    const competitorDetails = Object.entries(competitorDetailsMap).map(([name, data]) => ({
      competitorName: name,
      mentionCount: data.mentionCount,
      probeCount: data.probeCount
    }));

    // Intent Match
    const intentEntityMatchRate: Record<string, number> = { informational: 0, commercial: 0 };
    let infoCount = 0;
    let commCount = 0;
    let infoMatchSum = 0;
    let commMatchSum = 0;

    for (let i = 0; i < responses.length; i++) {
      const resp = responses[i];
      const probe = probes[i];
      const query = (probe?.question_text || '').toLowerCase();
      const isCommercial = COMPARATIVE_KEYWORDS.some(kw => query.includes(kw)) || PRODUCT_CATALOG_KEYWORDS.some(kw => query.includes(kw));

      let matchCount = 0;
      for (const entity of entities) {
        const overlap = this.calcKeywordOverlap(entity.entity_content, resp.text);
        if (overlap >= 0.4) {
          matchCount++;
        }
      }
      const matchRate = entities.length > 0 ? Math.round((matchCount / entities.length) * 100) : 0;

      if (isCommercial) {
        commCount++;
        commMatchSum += matchRate;
      } else {
        infoCount++;
        infoMatchSum += matchRate;
      }
    }

    intentEntityMatchRate.informational = infoCount > 0 ? Math.round(infoMatchSum / infoCount) : 0;
    intentEntityMatchRate.commercial = commCount > 0 ? Math.round(commMatchSum / commCount) : 0;

    // Distortion patterns
    const distortionPatterns: Record<string, number> = { exact: 0, partial: 0, distorted: 0, absent: 0, competitor_substituted: 0 };
    reflectionDetails.forEach(detail => {
      if (detail.competitor_mentioned) {
        distortionPatterns.competitor_substituted = (distortionPatterns.competitor_substituted || 0) + 1;
      } else {
        distortionPatterns[detail.quality] = (distortionPatterns[detail.quality] || 0) + 1;
      }
    });

    const snapshot: EntityReflectionSnapshot = {
      workspace_id: workspaceId,
      website_url: websiteUrl,
      engine_name: engineName,
      err_factoid,
      err_procedural,
      err_comparative,
      err_authority,
      err_schema,
      err_topical,
      err_geo,
      aepi_score: 0,
      tech_mod_score,
      eeat_mod_score,
      tech_audit: { schema_entities: schemaEntitiesCount, total_entities: totalEntities },
      eeat_audit: { high_eeat_entities: highEeatEntitiesCount, total_entities: totalEntities },
      total_entities_checked: totalEntities,
      total_entities_reflected: reflectedCount,
      measured_at: measuredAt,
      citationRate,
      citationPositions,
      competitorMentionRate,
      competitorDetails,
      intentEntityMatchRate,
      distortionPatterns
    };

    try {
      const supabase = getSupabaseAdminClient();
      const { data, error } = await supabase
        .from('entity_reflection_snapshots')
        .insert(snapshot)
        .select()
        .single();
        
      if (error) {
        console.warn(`[ERR Runner] Failed to insert snapshot in DB: ${error.message}`);
      } else if (data) {
        snapshot.id = data.id;
      }
    } catch (_) {}

    return {
      snapshot,
      reflectionDetails,
      rawResponses: responses.map(r => r.text),
      rawCitations: responses.map(r => r.citations)
    };
  }
}
