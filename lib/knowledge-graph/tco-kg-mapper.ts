/**
 * lib/knowledge-graph/tco-kg-mapper.ts
 *
 * TCO 개념과 온톨로지 KG 노드의 매핑 및 커버리지 연산 모듈.
 */

import { getEmbeddingProvider } from '../ai/embedding-provider';

export interface TcoKgMapping {
  tco_concept_id: string;
  kg_node_id: string;
  mapping_type: 'exact' | 'broader' | 'narrower' | 'related';
  confidence: number;
}

export interface TCOConcept {
  id: string;
  concept_name: string;
  definition: string;
}

export interface KGNode {
  id: string;
  node_name: string;
  node_type: string;
}

export class TcoKgMapper {
  /**
   * 임베딩 기반 TCO 개념과 KG 노드 간 자동 매핑
   */
  static async autoMap(concepts: TCOConcept[], kgNodes: KGNode[]): Promise<TcoKgMapping[]> {
    if (concepts.length === 0 || kgNodes.length === 0) return [];
    
    const provider = getEmbeddingProvider();
    const mappings: TcoKgMapping[] = [];

    try {
      // concepts 이름과 kgNodes 이름을 임베딩
      const conceptNames = concepts.map(c => c.concept_name);
      const nodeNames = kgNodes.map(n => n.node_name);

      const conceptEmbeddings = await provider.embedBatch(conceptNames);
      const nodeEmbeddings = await provider.embedBatch(nodeNames);

      for (let i = 0; i < concepts.length; i++) {
        const cEmbed = conceptEmbeddings[i];
        if (!cEmbed) continue;

        for (let j = 0; j < kgNodes.length; j++) {
          const nEmbed = nodeEmbeddings[j];
          if (!nEmbed) continue;

          const sim = cosineSimilarity(cEmbed, nEmbed);
          if (sim >= 0.70) {
            // 0.85 이상 exact, 0.75 broader/narrower, 0.70 related
            const mappingType = sim >= 0.85 ? 'exact' 
              : sim >= 0.75 ? 'broader' 
              : 'related';

            mappings.push({
              tco_concept_id: concepts[i].id,
              kg_node_id: kgNodes[j].id,
              mapping_type: mappingType,
              confidence: parseFloat(sim.toFixed(4))
            });
          }
        }
      }
    } catch (err) {
      console.warn('[TcoKgMapper] Embedding map failed, fallback to exact string matching', err);
      // Fallback: Exact/Substring matching
      for (const c of concepts) {
        for (const n of kgNodes) {
          const cName = c.concept_name.toLowerCase().trim();
          const nName = n.node_name.toLowerCase().trim();
          if (cName === nName || cName.includes(nName) || nName.includes(cName)) {
            mappings.push({
              tco_concept_id: c.id,
              kg_node_id: n.id,
              mapping_type: cName === nName ? 'exact' : 'related',
              confidence: 0.80
            });
          }
        }
      }
    }

    return mappings;
  }

  /**
   * 시그널 텍스트가 커버하는 KG 노드 매칭 수 계산
   */
  static calcCoverage(signal: string, kgNodes: KGNode[]): number {
    if (kgNodes.length === 0) return 0;
    
    let matches = 0;
    const lowerSignal = signal.toLowerCase();
    
    for (const n of kgNodes) {
      const lowerName = n.node_name.toLowerCase();
      // 단어 경계 또는 부분 일치 확인
      if (lowerSignal.includes(lowerName)) {
        matches++;
      }
    }
    
    // 점수화: 매칭된 노드가 3개 이상이면 만점(10), 그 이하는 비례 배분
    return Math.min(10, Math.round((matches / 3) * 10));
  }
}

function cosineSimilarity(a: number[], b: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dotProduct / denom;
}
