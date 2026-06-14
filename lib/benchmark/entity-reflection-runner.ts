import { SearchProviderFactory } from '../ai/search-provider-factory';
import { SurfaceEntity, EntityReflectionSnapshot } from '../schema';
import { SeedProbeQuestion } from '../../db/seed/industry-panels/questions-data';
import { getSupabaseAdminClient } from '../supabase';

export interface EntityReflectionResult {
  snapshot: EntityReflectionSnapshot;
  reflectedEntityIds: string[];
}

export class EntityReflectionRunner {
  private engines: string[];

  constructor(engines: string[] = ['chatgpt_search', 'gemini_grounding']) {
    this.engines = engines;
  }

  /**
   * Check if a specific SurfaceEntity is reflected in the engine's response text and citations
   */
  private checkEntityReflected(
    entity: SurfaceEntity,
    responseText: string,
    citations: Array<{ domain: string; url: string }>,
    brandDomains: string[]
  ): boolean {
    const text = responseText.toLowerCase();
    const entityName = entity.entity_name.toLowerCase();

    // 1. Exact entity name containment is a strong positive
    if (text.includes(entityName)) {
      return true;
    }

    // 2. Keyword containment based on entity_content
    const keywords: string[] = [];
    
    // Add words from entity_name
    entityName.split(/\s+/).forEach(w => {
      if (w.length > 2) keywords.push(w);
    });

    // Extract values from entity_content
    if (entity.entity_content && typeof entity.entity_content === 'object') {
      const flattenObj = (obj: any) => {
        for (const k in obj) {
          const val = obj[k];
          if (typeof val === 'string' && val.length > 2) {
            keywords.push(val.toLowerCase());
          } else if (Array.isArray(val)) {
            val.forEach(v => {
              if (typeof v === 'string' && v.length > 2) {
                keywords.push(v.toLowerCase());
              }
            });
          } else if (typeof val === 'object' && val !== null) {
            flattenObj(val);
          }
        }
      };
      flattenObj(entity.entity_content);
    }

    // Check if at least 60% of the keywords are present in the response
    const uniqueKeywords = Array.from(new Set(keywords)).slice(0, 10); // cap to top 10 keywords
    if (uniqueKeywords.length > 0) {
      let matchedCount = 0;
      uniqueKeywords.forEach(kw => {
        if (text.includes(kw)) matchedCount++;
      });
      const matchRate = matchedCount / uniqueKeywords.length;
      
      // If keyword match rate is high, treat as reflected
      if (matchRate >= 0.6) {
        return true;
      }
    }

    // 3. Domain citations match (if it cites our domain, it's highly relevant to our entities)
    const citesDomain = citations.some(c => {
      const domain = c.domain.toLowerCase().replace(/^www\./, '');
      const url = c.url.toLowerCase();
      return brandDomains.some(bd => {
        const cleanBd = bd.toLowerCase().replace(/^www\./, '');
        return domain.includes(cleanBd) || url.includes(cleanBd);
      });
    });

    // If it cites our domain and has at least one matching keyword, it's reflected
    if (citesDomain && uniqueKeywords.some(kw => text.includes(kw))) {
      return true;
    }

    return false;
  }

  /**
   * Run the reflection engine and calculate the ERR for each dimension
   */
  async run(
    workspaceId: string,
    websiteUrl: string,
    entities: SurfaceEntity[],
    probes: SeedProbeQuestion[],
    brandDomains: string[],
    engineName = 'composite'
  ): Promise<EntityReflectionResult> {
    const measuredAt = new Date().toISOString();
    const reflectedEntityIds = new Set<string>();

    console.log(`[ERR Runner] Measuring ${entities.length} entities against ${probes.length} probes for ${websiteUrl}`);

    // 1. Execute all probes via search provider
    const engineList = engineName === 'composite' ? this.engines : [engineName];
    const responses: Array<{ text: string; citations: any[] }> = [];

    for (const probe of probes.slice(0, 15)) { // Limit to 15 probes for pilot performance
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

    // 2. Perform entity reflection matching on all responses
    entities.forEach(entity => {
      for (const resp of responses) {
        const isReflected = this.checkEntityReflected(entity, resp.text, resp.citations, brandDomains);
        if (isReflected) {
          reflectedEntityIds.add(entity.id!);
          break; // entity is marked reflected if it matches at least one response
        }
      }
    });

    // 3. Aggregate 7-dimension ERR (Entity Reflection Rate)
    const errCounts: Record<string, { total: number; reflected: number }> = {
      factoid: { total: 0, reflected: 0 },
      procedural: { total: 0, reflected: 0 },
      comparative: { total: 0, reflected: 0 },
      authority: { total: 0, reflected: 0 },
      schema_org: { total: 0, reflected: 0 },
      topical_cluster: { total: 0, reflected: 0 },
      local_geo: { total: 0, reflected: 0 }
    };

    entities.forEach(ent => {
      const type = ent.surface_type;
      if (errCounts[type]) {
        errCounts[type].total++;
        if (reflectedEntityIds.has(ent.id!)) {
          errCounts[type].reflected++;
        }
      }
    });

    const getErrRate = (type: string): number => {
      const data = errCounts[type];
      if (!data || data.total === 0) return 0;
      return parseFloat(((data.reflected / data.total) * 100).toFixed(1));
    };

    const err_factoid = getErrRate('factoid');
    const err_procedural = getErrRate('procedural');
    const err_comparative = getErrRate('comparative');
    const err_authority = getErrRate('authority');
    const err_schema = getErrRate('schema_org');
    const err_topical = getErrRate('topical_cluster');
    const err_geo = getErrRate('local_geo');

    // 4. Tech & EEAT Audit Heuristics (based on crawler & LLM extractor results)
    const totalEntities = entities.length;
    const schemaEntitiesCount = entities.filter(e => e.surface_type === 'schema_org').length;
    const highEeatEntitiesCount = entities.filter(e => e.eeat_strength > 75).length;

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
      aepi_score: 0, // calculated in aepi-calculator.ts
      tech_mod_score,
      eeat_mod_score,
      tech_audit: { schema_entities: schemaEntitiesCount, total_entities: totalEntities },
      eeat_audit: { high_eeat_entities: highEeatEntitiesCount, total_entities: totalEntities },
      total_entities_checked: totalEntities,
      total_entities_reflected: reflectedEntityIds.size,
      measured_at: measuredAt
    };

    // Save to database if connected
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
      // Ignore Supabase fallback if tables not yet migrated
    }

    return {
      snapshot,
      reflectedEntityIds: Array.from(reflectedEntityIds)
    };
  }
}
