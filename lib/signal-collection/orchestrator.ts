/**
 * lib/signal-collection/orchestrator.ts
 *
 * S-OGDE v2.0 통합 파이프라인 오케스트레이터.
 *
 * 파이프라인 흐름:
 *   Phase G:  메타질문 생성 (5-Lens)
 *   Phase D1: 탐색 체인 (Search-Grounded)
 *   Phase D2: 재귀 심화 트리 (Multi-Persona)
 *   Phase DD: 시맨틱 중복 제거 (Embedding Cosine Similarity)  ← v2.0 신규
 *   Phase E:  자동 평가 (Brand Fit / YMYL / Intent)
 *   Phase S:  DB 저장
 */

import { MetaQuestionEngine } from './meta-question-engine';
import { ExploratoryChain } from './exploratory-chain';
import { RecursiveDeepener } from './recursive-deepener';
import { SemanticDedup } from './semantic-dedup';
import { SignalEvaluator, SignalEvaluationResult } from './signal-evaluator';
import { VolumeEstimator } from './volume-estimator';
import { ReverseQuestionEngine } from './reverse-question-engine';
import { createQuestionSignal } from '../../app/actions/semantic';
import type { RawSignalCandidate, PipelineResultV2, SignalCluster } from './types';

export { type PipelineResultV2 as PipelineResult };

export class SignalOrchestrator {
  /**
   * Runs the full S-OGDE v2.0 pipeline.
   *
   * 1. Meta-Questions (Generate) — 25 signals from 5 lenses
   * 2. Exploratory Chains (Deepen) — Search-Grounded follow-ups
   * 3. Recursive Trees (Deepen) — Multi-Persona branching
   * 4. Semantic Dedup (Filter) — Embedding-based clustering  [NEW]
   * 5. Evaluation (Evaluate) — Brand Fit / YMYL / Intent
   * 6. DB Save (Store)
   */
  static async runFullPipeline(
    workspaceId: string,
    domainName: string,
    brandName: string,
    onProgress?: (msg: string) => void,
    brandUSP?: string
  ): Promise<PipelineResultV2> {
    const log = (msg: string) => {
      console.log(`[S-OGDE v2.0] ${msg}`);
      if (onProgress) onProgress(msg);
    };

    let savedSignals = 0;
    const sources: Record<string, number> = { meta: 0, chain: 0, recursive: 0, reverse: 0 };
    const allCandidates: RawSignalCandidate[] = [];

    // ─── Phase G: Meta Questions ───────────────────────────
    log("Phase G: 메타질문 5-Lens 분석 시작...");
    try {
      const metaResults = await MetaQuestionEngine.analyzeAndGenerate(domainName, brandName);

      for (const res of metaResults) {
        for (const query of res.generated_queries) {
          allCandidates.push({
            query,
            source: `meta_${res.meta_type}`,
            volume: Math.floor(Math.random() * 500) + 50
          });
          sources.meta++;
        }
      }
      log(`Phase G 완료: ${sources.meta}개 메타 시그널 생성`);
    } catch (err) {
      log(`Phase G 실패 (계속 진행): ${(err as Error).message}`);
    }

    // 씨앗 질문 선택
    const seedForChain = allCandidates.find(c => c.source === 'meta_pattern')?.query
      || allCandidates[0]?.query
      || `${brandName} 리뷰`;
    const seedForRecursive = allCandidates.find(c => c.source === 'meta_counter')?.query
      || allCandidates[allCandidates.length - 1]?.query
      || `${brandName} 부작용`;

    // ─── Phase D1: Exploratory Chain (Search-Grounded) ────
    log(`Phase D1: Search-Grounded 탐색 체인 시작 (씨앗: "${seedForChain.slice(0, 30)}...")...`);
    try {
      const chainSteps = await ExploratoryChain.runChain(seedForChain, brandName, 3);
      const groundedCount = chainSteps.filter(s => s.grounded).length;

      for (const step of chainSteps) {
        for (const fq of step.follow_up_questions) {
          allCandidates.push({
            query: fq,
            source: step.grounded ? 'chain_grounded' : 'chain_fallback',
            volume: Math.floor(Math.random() * 200) + 10
          });
          sources.chain++;
        }
      }
      log(`Phase D1 완료: ${sources.chain}개 체인 시그널 (그라운딩 ${groundedCount}/${chainSteps.length})`);
    } catch (err) {
      log(`Phase D1 실패 (계속 진행): ${(err as Error).message}`);
    }

    // ─── Phase D2: Recursive Deepening (Multi-Persona) ────
    log(`Phase D2: Multi-Persona 재귀 심화 시작 (씨앗: "${seedForRecursive.slice(0, 30)}...")...`);
    try {
      const deepener = new RecursiveDeepener();
      const tree = await deepener.expandTree(seedForRecursive, brandName, {
        maxDepth: 3,
        branchFactor: 3,         // = 페르소나 3종
        maxTotalQuestions: 15,
        usePersonas: true         // v2.0 활성화
      });

      // 트리 평탄화
      const flatten = (node: typeof tree) => {
        allCandidates.push({
          query: node.question,
          source: node.persona ? `recursive_${node.persona}` : 'recursive_tree',
          volume: Math.floor(Math.random() * 100) + 5
        });
        sources.recursive++;
        node.children.forEach(flatten);
      };
      flatten(tree);
      log(`Phase D2 완료: ${sources.recursive}개 재귀 시그널 (페르소나 분기)`);
    } catch (err) {
      log(`Phase D2 실패 (계속 진행): ${(err as Error).message}`);
    }

    // ─── Phase R: Reverse Chaining (선택적) ─────────────
    if (brandUSP) {
      log(`Phase R: Reverse Chaining 시작 (USP: "${brandUSP.slice(0, 40)}...")...`);
      try {
        const reverseResult = await ReverseQuestionEngine.reverseEngineer(
          brandUSP, brandName, domainName
        );
        const reverseQuestions = ReverseQuestionEngine.extractAllQuestions(reverseResult);

        for (const q of reverseQuestions) {
          allCandidates.push({
            query: q,
            source: 'reverse_usp',
            volume: Math.floor(Math.random() * 300) + 50
          });
          sources.reverse++;
        }
        log(`Phase R 완료: ${sources.reverse}개 역추적 시그널 (${reverseResult.reasoning_paths.length}개 경로)`);
      } catch (err) {
        log(`Phase R 실패 (계속 진행): ${(err as Error).message}`);
      }
    }

    const totalGenerated = allCandidates.length;

    // ─── Phase DD: Semantic Dedup ─────────────────────────
    log(`Phase DD: 시맨틱 중복 제거 시작 (${totalGenerated}개 후보)...`);
    let clusters: SignalCluster[] = [];
    let dedupedCandidates: RawSignalCandidate[] = [];

    try {
      const dedup = new SemanticDedup(0.85);
      const dedupResult = await dedup.deduplicate(allCandidates);

      clusters = dedupResult.clusters;
      dedupedCandidates = clusters.map(c => c.representative);
      log(`Phase DD 완료: ${totalGenerated}개 → ${dedupedCandidates.length}개 (${dedupResult.duplicatesRemoved}개 중복 제거)`);
    } catch (err) {
      log(`Phase DD 실패 (Exact Match Fallback 사용): ${(err as Error).message}`);
      // Fallback: Exact Match Dedup (v1.0 방식)
      const uniqueQueries = new Set<string>();
      dedupedCandidates = allCandidates.filter(c => {
        const q = c.query.toLowerCase().trim();
        if (uniqueQueries.has(q)) return false;
        uniqueQueries.add(q);
        return true;
      });
    }

    // ─── Phase E: Evaluate & Save ─────────────────────────
    log(`Phase E: ${dedupedCandidates.length}개 시그널 LLM 자동 평가 및 볼륨 측정 시작...`);

    for (const candidate of dedupedCandidates) {
      try {
        const evalResult = await SignalEvaluator.evaluateSignal(candidate.query, brandName);

        // Brand Fit = 'unfit' 또는 Gate = 'No-Go'이면 자동 제거
        if (evalResult.brand_fit === 'unfit' || evalResult.gate_status === 'No-Go') continue;

        let safeIntent = evalResult.intent;
        if (!['informational', 'navigational', 'transactional', 'local'].includes(safeIntent)) {
          safeIntent = 'informational';
        }

        // S-07 볼륨 추정 (API 호출 최소화를 위해 통과된 후보만)
        const estimatedVolume = await VolumeEstimator.estimateVolume(candidate.query);

        await createQuestionSignal(workspaceId, {
          query: candidate.query,
          volume: estimatedVolume,
          intent: safeIntent,
          status: evalResult.gate_status === 'Go' ? 'promoted' : 'mined'
        });
        savedSignals++;
      } catch (err) {
        console.error("Failed to save signal", err);
      }
    }

    log(`파이프라인 완료! ${savedSignals}개 고품질 시그널 DB 저장.`);

    return {
      totalGenerated,
      afterDedup: dedupedCandidates.length,
      savedSignals,
      sources,
      clusters,
      reverseSignals: sources.reverse || 0
    };
  }
}

