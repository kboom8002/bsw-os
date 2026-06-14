import { SurfaceEntity, BrandOntologyNode, BrandOntologyEdge, TcoConcept } from '../schema';
import { getAIProvider } from '../ai/ai-provider';

export interface SiteKnowledgeGraph {
  entities: SurfaceEntity[];
  nodes: BrandOntologyNode[];
  edges: BrandOntologyEdge[];
  concepts: TcoConcept[];
}

export class KnowledgeGraphBuilder {
  /**
   * Deduplicate entities based on entity_name string similarity (normalized lowercase)
   */
  deduplicateEntities(entities: SurfaceEntity[]): SurfaceEntity[] {
    const seen = new Map<string, SurfaceEntity>();
    
    for (const ent of entities) {
      const normName = ent.entity_name.trim().toLowerCase().replace(/[^a-z0-9가-힣]/g, '');
      if (seen.has(normName)) {
        const existing = seen.get(normName)!;
        // Merge contents
        existing.entity_content = {
          ...existing.entity_content,
          ...ent.entity_content,
          merged_urls: Array.from(new Set([
            ...(existing.entity_content.merged_urls || [existing.source_page_url]),
            ent.source_page_url
          ]))
        };
        // Keep higher completeness/eeat scores
        existing.completeness_score = Math.max(existing.completeness_score, ent.completeness_score);
        existing.eeat_strength = Math.max(existing.eeat_strength, ent.eeat_strength);
        existing.extraction_confidence = Math.max(existing.extraction_confidence, ent.extraction_confidence);
      } else {
        seen.set(normName, {
          ...ent,
          entity_content: { ...ent.entity_content, merged_urls: [ent.source_page_url] }
        });
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Generate BrandOntologyNodes, BrandOntologyEdges, and TcoConcepts from SurfaceEntities
   */
  async build(workspaceId: string, websiteUrl: string, rawEntities: SurfaceEntity[]): Promise<SiteKnowledgeGraph> {
    const entities = this.deduplicateEntities(rawEntities);
    const nodes: BrandOntologyNode[] = [];
    const edges: BrandOntologyEdge[] = [];
    const concepts: TcoConcept[] = [];

    // Helper to generate slug
    const toSlug = (text: string) => text.toLowerCase()
      .replace(/[^a-z0-9가-힣-\s]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 100);

    // 1. Create Nodes and TCO Concepts for each deduplicated entity
    entities.forEach((ent, idx) => {
      const nodeId = ent.id || `node-${Date.now()}-${idx}`;
      ent.id = nodeId; // ensure entity has a valid ID

      // Create Ontology Node
      nodes.push({
        id: nodeId,
        workspace_id: workspaceId,
        node_name: ent.entity_name,
        node_type: `surface_${ent.surface_type}`,
        reference_id: ent.id,
        created_at: new Date().toISOString()
      });

      // Create TCO Concept for strategic types: factoid, procedural, comparative, authority
      if (['factoid', 'procedural', 'comparative', 'authority'].includes(ent.surface_type)) {
        const conceptId = `concept-${Date.now()}-${idx}`;
        concepts.push({
          id: conceptId,
          workspace_id: workspaceId,
          concept_name: ent.entity_name,
          slug: toSlug(ent.entity_name) || `concept-${idx}`,
          definition: ent.entity_content.description || ent.entity_content.definition || `${ent.entity_name} extracted from web surface.`,
          is_strategic: ent.eeat_strength > 60,
          concept_type: `surface_${ent.surface_type}`,
          operational_fields: ent.entity_content,
          created_at: new Date().toISOString()
        });
        
        // Link entity back to the created TCO Concept
        ent.linked_tco_concept_id = conceptId;
      }
    });

    // 2. Build Edges (Relationships)
    // Basic Co-occurrence: If two entities share the same page source, they co-occur.
    for (let i = 0; i < entities.length; i++) {
      for (let j = i + 1; j < entities.length; j++) {
        const entA = entities[i];
        const entB = entities[j];
        
        const urlsA = new Set(entA.entity_content.merged_urls || [entA.source_page_url]);
        const urlsB = new Set(entB.entity_content.merged_urls || [entB.source_page_url]);
        
        // Find intersection of pages
        const intersection = [...urlsA].filter(x => urlsB.has(x));
        if (intersection.length > 0) {
          edges.push({
            id: `edge-${Date.now()}-${i}-${j}`,
            workspace_id: workspaceId,
            source_node_id: entA.id!,
            target_node_id: entB.id!,
            relation_type: 'co_occurs_with',
            created_at: new Date().toISOString()
          });
        }
      }
    }

    // 3. Semantic Relation Inference via AI (if enabled and entities count > 1)
    if (entities.length > 1) {
      const mode = process.env.AI_PROVIDER_MODE || 'mock';
      if (mode !== 'mock') {
        try {
          const ai = getAIProvider();
          
          // Select top 10 strategic nodes to infer relationships to avoid API token blow
          const topEnts = entities.slice(0, 10);
          const entityListText = topEnts.map(e => `- [${e.id}] ${e.entity_name} (${e.surface_type})`).join('\n');
          
          const prompt = `다음은 특정 웹사이트에서 추출한 지식 엔티티 목록입니다:
${entityListText}

이 엔티티들 중 의미적으로 밀접하게 연관된 쌍을 찾아 관계를 정의해주세요.
가능한 관계(relation_type) 종류:
- treats (예: 화장품 성분이 특정 증상을 치료/개선할 때)
- contains (예: 화장품 제품이 특정 성분을 포함할 때)
- routine_step (예: 특정 루틴이 특정 단계를 포함할 때)
- compares_to (비교/경쟁 관계)
- verifies (예: 임상 인증이 제품을 증명할 때)
- local_outlet (예: 오프라인 지점이 특정 브랜드를 판매할 때)

응답은 JSON 배열로 아래 스키마에 맞게 반환하세요.`;

          const relationshipSchema = {
            type: 'object',
            properties: {
              relations: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    source_id: { type: 'string' },
                    target_id: { type: 'string' },
                    relation_type: { type: 'string' }
                  },
                  required: ['source_id', 'target_id', 'relation_type']
                }
              }
            },
            required: ['relations']
          };

          const aiRes = await ai.generateStructuredOutput<{
            relations: Array<{ source_id: string; target_id: string; relation_type: string }>;
          }>(prompt, relationshipSchema);

          if (aiRes && aiRes.relations) {
            aiRes.relations.forEach((rel, rIdx) => {
              // Ensure the IDs exist in our generated nodes list
              const existsA = entities.some(e => e.id === rel.source_id);
              const existsB = entities.some(e => e.id === rel.target_id);
              
              if (existsA && existsB) {
                edges.push({
                  id: `edge-semantic-${Date.now()}-${rIdx}`,
                  workspace_id: workspaceId,
                  source_node_id: rel.source_id,
                  target_node_id: rel.target_id,
                  relation_type: rel.relation_type,
                  created_at: new Date().toISOString()
                });
              }
            });
          }
        } catch (e: any) {
          console.warn(`[Knowledge Graph Builder] Semantic relation inference failed: ${e.message}. Using co-occurrence only.`);
        }
      }
    }

    return {
      entities,
      nodes,
      edges,
      concepts
    };
  }
}
