/**
 * lib/answer-supply/thin-page-guard.ts
 * 
 * Prevents redundant thin pages. Uses embedding similarity check.
 * If a similar question has an existing asset, blocks creation and suggests merging.
 */

import { getSupabaseAdminClient } from '../supabase';
import { getEmbeddingProvider } from '../ai/embedding-provider';

export interface GuardDecision {
  blocked: boolean;
  highestSimilarity: number;
  matchedQuestionId?: string;
  matchedQuestionText?: string;
  existingAssetId?: string;
  suggestion?: string;
}

export class ThinPageGuard {
  private similarityThreshold: number = 0.88;

  constructor(threshold?: number) {
    if (threshold !== undefined) {
      this.similarityThreshold = threshold;
    }
  }

  /**
   * Helper to calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) return 0;
    let dotProduct = 0.0;
    let normA = 0.0;
    let normB = 0.0;
    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }
    const denom = Math.sqrt(normA) * Math.sqrt(normB);
    return denom === 0 ? 0 : dotProduct / denom;
  }

  /**
   * Checks if a new question is a duplicate/thin-page risk compared to existing assets.
   */
  async evaluate(workspaceId: string, questionText: string): Promise<GuardDecision> {
    const embedder = getEmbeddingProvider();
    const supabase = getSupabaseAdminClient();

    // 1. Get embedding of target question
    const targetEmbedding = await embedder.embed(questionText);

    // 2. Fetch existing published canonical questions and their assets
    let existingItems: Array<{
      id: string;
      normalized_question: string;
      asset_id?: string;
      embedding?: number[];
    }> = [];

    let isSimulated = false;

    try {
      // Query canonical_questions joining answer_assets
      const { data, error } = await supabase
        .from('canonical_questions')
        .select(`
          id,
          normalized_question
        `)
        .eq('workspace_id', workspaceId);

      if (error) throw error;

      if (data && data.length > 0) {
        // Fetch asset mappings for those questions
        const { data: assets, error: assetError } = await supabase
          .from('answer_assets')
          .select('id, question_id')
          .eq('status', 'published');

        const assetMap = new Map<string, string>();
        if (!assetError && assets) {
          assets.forEach(a => assetMap.set(a.question_id, a.id));
        }

        // Map and prepare questions for embedding comparison
        for (const cq of data) {
          existingItems.push({
            id: cq.id,
            normalized_question: cq.normalized_question,
            asset_id: assetMap.get(cq.id)
          });
        }
      }
    } catch (err) {
      console.warn(`[ThinPageGuard] DB query skipped or tables not migrated: ${(err as Error).message}. Running in simulation mode.`);
      isSimulated = true;
    }

    // Switch to simulation if DB is empty or failed
    if (isSimulated || existingItems.length === 0) {
      existingItems = [
        {
          id: 'existing-cq-1',
          normalized_question: '제주 독채 풀빌라 소아 요금 기준과 예약 혜택은?',
          asset_id: 'existing-asset-1'
        },
        {
          id: 'existing-cq-2',
          normalized_question: '민감성 피부를 위한 저자극 히알루론산 수분크림 추천',
          asset_id: 'existing-asset-2'
        },
        {
          id: 'existing-cq-3',
          normalized_question: '서귀포 3인 가족 가성비 펜션 추천 목록',
          asset_id: 'existing-asset-3'
        }
      ];
    }

    // 3. Obtain embeddings for all existing questions (ideally cached or calculated in batch)
    const existingTexts = existingItems.map(item => item.normalized_question);
    const existingEmbeddings = await embedder.embedBatch(existingTexts);

    // 4. Calculate similarities and find the highest match
    let highestSimilarity = 0;
    let matchedIndex = -1;

    for (let i = 0; i < existingEmbeddings.length; i++) {
      const sim = this.cosineSimilarity(targetEmbedding, existingEmbeddings[i]);
      if (sim > highestSimilarity) {
        highestSimilarity = sim;
        matchedIndex = i;
      }
    }

    // 5. Build decision report
    if (matchedIndex !== -1 && highestSimilarity >= this.similarityThreshold) {
      const matchedItem = existingItems[matchedIndex];
      const similarityPct = Math.round(highestSimilarity * 100);
      
      return {
        blocked: true,
        highestSimilarity,
        matchedQuestionId: matchedItem.id,
        matchedQuestionText: matchedItem.normalized_question,
        existingAssetId: matchedItem.asset_id,
        suggestion: `[중복 방지 게이트] 입력된 질문 '${questionText}'은(는) 기존 발행 정본 질문 '${matchedItem.normalized_question}'과(와) 의미론적 유사도(${similarityPct}%)가 매우 높습니다. 신규 페이지를 발행하여 검색 크롤러를 혼란스럽게 하는 것보다, 기존 에셋(${matchedItem.asset_id || 'ID 미지정'})의 FAQ 단락 혹은 질문 변형(Paraphrases) 목록으로 흡수 및 병합(Merge)할 것을 권장합니다.`
      };
    }

    return {
      blocked: false,
      highestSimilarity,
      suggestion: `유사도가 기준치(${Math.round(this.similarityThreshold * 100)}%) 미만입니다. 새로운 독립적인 정본 답변 페이지로 개설 가능합니다.`
    };
  }

  /**
   * Enhanced evaluation that integrates with QuestionClusterer results.
   * Questions belonging to the same cluster as an existing asset are automatically blocked.
   */
  async evaluateWithClusterContext(
    workspaceId: string,
    questionText: string,
    clusterId?: string
  ): Promise<GuardDecision> {
    // Priority 1: Cluster-based dedup (if cluster context is available)
    if (clusterId) {
      const supabase = getSupabaseAdminClient();
      try {
        const { data: clusterAssets, error } = await supabase
          .from('canonical_questions')
          .select('id, normalized_question, cluster_id')
          .eq('workspace_id', workspaceId)
          .eq('cluster_id', clusterId);

        if (!error && clusterAssets && clusterAssets.length > 0) {
          // Check if any of these cluster siblings have published assets
          const siblingIds = clusterAssets.map(cq => cq.id);
          const { data: existingAssets } = await supabase
            .from('answer_assets')
            .select('id, question_id, title')
            .in('question_id', siblingIds)
            .eq('status', 'published');

          if (existingAssets && existingAssets.length > 0) {
            const existingAsset = existingAssets[0];
            const matchedCQ = clusterAssets.find(cq => cq.id === existingAsset.question_id);
            return {
              blocked: true,
              highestSimilarity: 1.0,
              matchedQuestionId: matchedCQ?.id,
              matchedQuestionText: matchedCQ?.normalized_question,
              existingAssetId: existingAsset.id,
              suggestion: `[클러스터 중복 방지] 입력된 질문은 동일 클러스터(${clusterId})에 속하는 기존 정본 질문 '${matchedCQ?.normalized_question}'과(와) 같은 의미 그룹입니다. 기존 에셋(${existingAsset.id}: '${existingAsset.title}')의 FAQ 단락으로 흡수하여 병합할 것을 권장합니다.`
            };
          }
        }
      } catch (err: any) {
        console.warn(`[ThinPageGuard] Cluster context check failed: ${err.message}. Falling back to embedding check.`);
      }
    }

    // Priority 2: Embedding-based dedup (existing logic)
    return this.evaluate(workspaceId, questionText);
  }
}
