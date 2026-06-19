import { SearchProviderFactory } from '../ai/search-provider-factory';
import { SurfaceEntity, EntityReflectionSnapshot, ReflectionQuality, EntityReflectionDetail } from '../schema';
import { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';
import { getSupabaseAdminClient } from '../supabase';
import { fuzzyKoreanMatch, normalizeKorean } from './korean-normalizer';

export interface EntityReflectionResult {
  snapshot: EntityReflectionSnapshot;
  reflectionDetails: EntityReflectionDetail[];
  rawResponses: string[];
}

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

  /**
   * classifyReflection
   * 4-Tier quality: exact, partial, distorted, absent
   */
  private classifyReflection(
    entity: SurfaceEntity,
    responseText: string,
    brandDomains: string[]
  ): ReflectionQuality {
    const normResponse = normalizeKorean(responseText.toLowerCase());
    const keywordOverlap = this.calcKeywordOverlap(entity.entity_content, normResponse);

    // exact: Name is matched + Keyword overlap >= 80%
    // If name matches but keywords are weaker, fallback to partial
    if (fuzzyKoreanMatch(entity.entity_name, responseText)) {
      if (keywordOverlap >= 0.8) return 'exact';
      if (keywordOverlap >= 0.4) return 'partial';
      return 'partial'; 
    }

    // partial: Name not matched but keywords >= 60%
    if (keywordOverlap >= 0.6) return 'partial';

    // distorted: keyword overlap 20%~60%
    if (keywordOverlap >= 0.2) return 'distorted';

    // Domain citation check
    const citesDomain = brandDomains.some(bd => {
      const cleanBd = bd.toLowerCase().replace(/^www\./, '');
      return normResponse.includes(cleanBd);
    });
    if (citesDomain && keywordOverlap > 0) return 'partial';

    return 'absent';
  }

  /**
   * classifyReflectionWithCompetitor
   */
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

      const qualityRank = { exact: 4, partial: 3, distorted: 2, absent: 1 };

      for (const resp of responses) {
        // Combined text + citations logic can be integrated in responseText.
        // We simplified citations check to just brandDomains in classifyReflection
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
      local_geo: { total: 0, weightedReflected: 0 }
    };

    const QUALITY_WEIGHTS: Record<ReflectionQuality, number> = {
      exact: 1.0, partial: 0.6, distorted: 0.2, absent: 0.0,
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
      aepi_score: 0, // calculated externally
      tech_mod_score,
      eeat_mod_score,
      tech_audit: { schema_entities: schemaEntitiesCount, total_entities: totalEntities },
      eeat_audit: { high_eeat_entities: highEeatEntitiesCount, total_entities: totalEntities },
      total_entities_checked: totalEntities,
      total_entities_reflected: reflectedCount,
      measured_at: measuredAt
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
    } catch (_) {
    }

    return {
      snapshot,
      reflectionDetails,
      rawResponses: responses.map(r => r.text)
    };
  }
}
