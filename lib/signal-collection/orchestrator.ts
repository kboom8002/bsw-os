/**
 * lib/signal-collection/orchestrator.ts
 *
 * S-OGDE v3.0 통합 파이프라인 오케스트레이터.
 */

import { MetaQuestionEngine } from './meta-question-engine';
import { ExploratoryChain } from './exploratory-chain';
import { RecursiveDeepener } from './recursive-deepener';
import { SemanticDedup } from './semantic-dedup';
import { SignalEvaluator } from './signal-evaluator';
import { VolumeEstimator } from './volume-estimator';
import { ReverseQuestionEngine } from './reverse-question-engine';
import { createQuestionSignal } from '../../app/actions/semantic';
import { getSupabaseAdminClient } from '../supabase';
import { INDUSTRY_PANELS_DATA } from '../../db/seed/industry-panels/questions-data';
import { TcoKgMapper } from '../knowledge-graph/tco-kg-mapper';
import type { RawSignalCandidate, PipelineResultV2, SignalCluster, PipelineOptionsV3 } from './types';
import { SignalBridge } from './signal-bridge';

export { type PipelineResultV2 as PipelineResult };

const PLACEHOLDER_VOLUME = -1;
const EVAL_BATCH_SIZE = 5;

export class SignalOrchestrator {
  /**
   * Runs the full S-OGDE v3.0 pipeline.
   */
  static async runFullPipeline(
    workspaceId: string,
    domainName: string,
    brandName?: string,
    options: PipelineOptionsV3 = {}
  ): Promise<PipelineResultV2> {
    const { brandUSP, contextChunks, onProgress } = options;
    const pipelineStart = Date.now();
    const log = (msg: string) => {
      console.log(`[S-OGDE v3.0] ${msg}`);
      if (onProgress) onProgress(msg);
    };

    let savedSignals = 0;
    const sources: Record<string, number> = { meta: 0, chain: 0, recursive: 0, reverse: 0 };
    const allCandidates: RawSignalCandidate[] = [];
    const phaseWarnings: string[] = [];

    const supabase = getSupabaseAdminClient();

    // ─── TCO Seed Concepts 주입 (실측 그라운딩) ───────────
    log("TCO 전략 개념 로드 중...");
    let tcoSeeds = options.tcoConceptSeeds || [];
    try {
      if (tcoSeeds.length === 0 && workspaceId) {
        const { data } = await supabase
          .from('tco_concepts')
          .select('concept_name, definition')
          .eq('workspace_id', workspaceId)
          .eq('is_strategic', true)
          .limit(15);
        tcoSeeds = data || [];
      }
      
      // ─── P2-2: 경쟁사 페르소나 관측 씨앗 주입 ───
      if (workspaceId) {
        const { data: personas } = await supabase
          .from('observed_parametric_personas')
          .select('category_placement, competitive_frame, tone_expertise')
          .eq('workspace_id', workspaceId)
          .order('measured_at', { ascending: false })
          .limit(5);
        if (personas && personas.length > 0) {
          const personaContext = personas.map(p =>
            `[${p.category_placement || 'Unknown'}] 경쟁사: ${(p.competitive_frame || []).join(', ')} (전문성: ${p.tone_expertise || 'medium'})`
          ).join('\n');
          tcoSeeds.push({
            concept_name: '경쟁사 페르소나 포지셔닝 맥락',
            definition: personaContext
          });
        }
      }
      log(`TCO 개념 ${tcoSeeds.length}개 획득 완료.`);
    } catch (e: any) {
      log(`TCO 로드 오류 (계속 진행): ${e.message}`);
    }

    // ─── External Context Injection (Signal Bridge) ────────
    // 외부 수집 시그널을 VOC 청크로 변환하여 LLM 컨텍스트에 주입
    if (workspaceId && options.industryKey) {
      try {
        const externalChunks = await SignalBridge.buildContextChunks(
          workspaceId,
          options.industryKey,
          20
        );
        if (externalChunks.length > 0) {
          const existingChunks = options.contextChunks || [];
          (options as any).contextChunks = [...existingChunks, ...externalChunks];
          log(`외부 시그널 컨텍스트 ${externalChunks.length}개 주입 완료.`);
        }
      } catch (bridgeErr: any) {
        log(`외부 컨텍스트 주입 오류 (계속 진행): ${bridgeErr.message}`);
      }
    }

    // ─── Phase G: Meta Questions ───────────────────────────
    log("Phase G: 메타질문 5-Lens 분석 시작...");
    try {
      const metaResults = await MetaQuestionEngine.analyzeAndGenerate(
        domainName, brandName, contextChunks, tcoSeeds
      );

      for (const res of metaResults) {
        for (const query of res.generated_queries) {
          allCandidates.push({
            query,
            source: `meta_${res.meta_type}`,
            volume: PLACEHOLDER_VOLUME
          });
          sources.meta++;
        }
      }
      log(`Phase G 완료: ${sources.meta}개 메타 시그널 생성`);
      if (sources.meta === 0) phaseWarnings.push('Phase G: API 호출 성공했으나 메타 시그널 0개 생성됨');
    } catch (err) {
      phaseWarnings.push(`Phase G: ${(err as Error).message}`);
      log(`Phase G 실패 (계속 진행): ${(err as Error).message}`);
    }

    const activeBrand = brandName || "";
    const seedForChain = allCandidates.find(c => c.source === 'meta_pattern')?.query
      || allCandidates[0]?.query
      || (activeBrand ? `${activeBrand} 리뷰` : `${domainName} 추천`);
    const seedForRecursive = allCandidates.find(c => c.source === 'meta_counter')?.query
      || allCandidates[allCandidates.length - 1]?.query
      || (activeBrand ? `${activeBrand} 부작용` : `${domainName} 부작용`);

    // ─── Phase D1: Exploratory Chain ─────────────────────
    log(`Phase D1: Search-Grounded 탐색 체인 시작 (씨앗: "${seedForChain.slice(0, 30)}...")...`);
    try {
      const chainSteps = await ExploratoryChain.runChain(seedForChain, brandName, 3);
      const groundedCount = chainSteps.filter(s => s.grounded).length;

      for (const step of chainSteps) {
        for (const fq of step.follow_up_questions) {
          allCandidates.push({
            query: fq,
            source: step.grounded ? 'chain_grounded' : 'chain_fallback',
            volume: PLACEHOLDER_VOLUME
          });
          sources.chain++;
        }
      }
      log(`Phase D1 완료: ${sources.chain}개 체인 시그널 (그라운딩 ${groundedCount}/${chainSteps.length})`);
      if (sources.chain === 0) phaseWarnings.push('Phase D1: 탐색 체인 0개 시그널 생성됨');
    } catch (err) {
      phaseWarnings.push(`Phase D1: ${(err as Error).message}`);
      log(`Phase D1 실패 (계속 진행): ${(err as Error).message}`);
    }

    // ─── Phase D2: Recursive Deepening ───────────────────
    log(`Phase D2: Multi-Persona 재귀 심화 시작 (씨앗: "${seedForRecursive.slice(0, 30)}...")...`);
    try {
      const deepener = new RecursiveDeepener();
      const tree = await deepener.expandTree(seedForRecursive, brandName, {
        maxDepth: 3,
        branchFactor: 3,
        maxTotalQuestions: 15,
        usePersonas: true
      });

      const flatten = (node: typeof tree) => {
        allCandidates.push({
          query: node.question,
          source: node.persona ? `recursive_${node.persona}` : 'recursive_tree',
          volume: PLACEHOLDER_VOLUME
        });
        sources.recursive++;
        node.children.forEach(flatten);
      };
      flatten(tree);
      log(`Phase D2 완료: ${sources.recursive}개 재귀 시그널`);
      if (sources.recursive === 0) phaseWarnings.push('Phase D2: 재귀 심화 0개 시그널 생성됨');
    } catch (err) {
      phaseWarnings.push(`Phase D2: ${(err as Error).message}`);
      log(`Phase D2 실패 (계속 진행): ${(err as Error).message}`);
    }

    // ─── Phase R: Reverse Chaining ───────────────────────
    if (brandUSP && brandName) {
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
            volume: PLACEHOLDER_VOLUME
          });
          sources.reverse++;
        }
        log(`Phase R 완료: ${sources.reverse}개 역추적 시그널`);
      } catch (err) {
        phaseWarnings.push(`Phase R: ${(err as Error).message}`);
        log(`Phase R 실패 (계속 진행): ${(err as Error).message}`);
      }
    }

    let totalGenerated = allCandidates.length;

    // ─── Fallback: LLM 생성 실패 시 패널 데이터에서 시그널 보충 ────────
    if (totalGenerated === 0 && options.industryKey) {
      log(`Phase G/D/R LLM 생성 실패. Fallback: 패널 데이터에서 시그널 주입 시작...`);
      const panelQuestions = INDUSTRY_PANELS_DATA[options.industryKey as keyof typeof INDUSTRY_PANELS_DATA]?.questions || [];
      const fallbackQuestions = panelQuestions.slice(0, 15); // 최대 15개 주입

      for (const pq of fallbackQuestions) {
        allCandidates.push({
          query: pq.question_text.replace('[브랜드]', brandName || domainName),
          source: 'fallback_panel',
          volume: PLACEHOLDER_VOLUME
        });
        sources.meta++;
      }
      totalGenerated = allCandidates.length;
      log(`Fallback 완료: ${totalGenerated}개 시그널 확보.`);
    }
    // ─── Phase DD: Semantic Dedup ─────────────────────────
    log(`Phase DD: 시맨틱 중복 제거 시작 (${totalGenerated}개 후보)...`);
    let clusters: SignalCluster[] = [];
    let dedupedCandidates: RawSignalCandidate[] = [];

    try {
      const dedup = new SemanticDedup(0.85);
      const dedupResult = await dedup.deduplicate(allCandidates);

      clusters = dedupResult.clusters;
      dedupedCandidates = clusters.map(c => c.representative);
      log(`Phase DD 완료: ${totalGenerated}개 → ${dedupedCandidates.length}개`);
    } catch (err) {
      phaseWarnings.push(`Phase DD: ${(err as Error).message}`);
      log(`Phase DD 실패 (Fallback 사용): ${(err as Error).message}`);
      const uniqueQueries = new Set<string>();
      dedupedCandidates = allCandidates.filter(c => {
        const q = c.query.toLowerCase().trim();
        if (uniqueQueries.has(q)) return false;
        uniqueQueries.add(q);
        return true;
      });
    }

    // ─── KG Nodes 로딩 (GEO 커버리지 평가용) ───────────────
    let kgNodes = options.kgNodes || [];
    try {
      if (kgNodes.length === 0 && workspaceId) {
        const { data } = await supabase
          .from('brand_ontology_nodes')
          .select('id, node_name, node_type')
          .eq('workspace_id', workspaceId);
        kgNodes = data || [];
      }
    } catch (e: any) {
      log(`KG 로드 오류: ${e.message}`);
    }
    const kgNodeNames = kgNodes.map(n => n.node_name);

    // ─── 패널 질문 로딩 (QW-3 Layer 기반 YMYL) ───────────
    const panelQuestions = options.industryKey && INDUSTRY_PANELS_DATA[options.industryKey as keyof typeof INDUSTRY_PANELS_DATA]
      ? INDUSTRY_PANELS_DATA[options.industryKey as keyof typeof INDUSTRY_PANELS_DATA].questions
      : [];

    // ─── Phase E: Evaluate & Save ────────────────────────
    log(`Phase E: ${dedupedCandidates.length}개 시그널 배치 평가 시작...`);
    let evalErrors = 0;
    let filteredOut = 0;

    // 통계 보정용 QVS / Volume 집계 리스트
    const allQvsScores: number[] = [];
    const allVolumes: number[] = [];
    const evaluatedSignals: any[] = [];

    for (let i = 0; i < dedupedCandidates.length; i += EVAL_BATCH_SIZE) {
      const batch = dedupedCandidates.slice(i, i + EVAL_BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(async (candidate) => {
          // 1. 볼륨 추정 (로그-선형 모델)
          const estimatedVolume = await VolumeEstimator.estimateVolume(candidate.query);
          allVolumes.push(estimatedVolume);

          // 2. 패널 Layer 매칭 (QW-3)
          const panelMatch = panelQuestions.find(pq => 
            pq.question_text.toLowerCase().includes(candidate.query.toLowerCase().slice(0, 15))
          );

          // 3. 2단계 QVS 8차원 평가 (CoT & 3회 반복 신뢰성 검증)
          const evalResult = await SignalEvaluator.evaluateWithConfidence(
            candidate.query,
            brandName,
            options.repeatEval || 1, // repeatEval 기본값
            kgNodeNames,
            panelMatch?.layer,
            workspaceId
          );

          // 패널 가이드 매칭 보정 (L5_ymyl / risk_level=high인 경우 강제 YMYL 지정)
          if (panelMatch?.layer === 'L5_ymyl' || panelMatch?.risk_level === 'high') {
            evalResult.step1.is_ymyl = true;
          }

          if ((brandName && evalResult.step1.brand_fit === 'unfit') || evalResult.gate_status === 'No-Go') {
            return { saved: false, reason: 'filtered' as const };
          }

          // KG 커버리지 점수 계산
          const kgCoverage = TcoKgMapper.calcCoverage(candidate.query, kgNodes);

          allQvsScores.push(evalResult.qvs_total);

          // TCO 개념 매칭 계산 (간단 자카드 매칭)
          let tcoMatchScore = 0;
          if (tcoSeeds.length > 0) {
            const matches = tcoSeeds.filter(seed => 
              candidate.query.toLowerCase().includes(seed.concept_name.toLowerCase())
            ).length;
            tcoMatchScore = Math.min(10, matches * 4); // 매칭 당 4점, 최대 10점
          }

          return {
            saved: true,
            query: candidate.query,
            volume: estimatedVolume,
            intent: evalResult.step1.intent,
            isYmyl: evalResult.step1.is_ymyl,
            gateStatus: evalResult.gate_status,
            confidence: evalResult.confidence,
            qvsTotal: evalResult.qvs_total,
            qvsDimensions: evalResult.qvs,
            kgCoverage,
            tcoMatchScore,
            panelLayer: panelMatch?.layer || 'L1_universal'
          };
        })
      );

      for (const r of results) {
        if (r.status === 'fulfilled' && r.value.saved) {
          evaluatedSignals.push(r.value);
        } else if (r.status === 'fulfilled' && !r.value.saved) {
          filteredOut++;
        } else {
          evalErrors++;
          console.error('[S-OGDE Phase E] Signal evaluation failed:', (r as PromiseRejectedResult).reason);
        }
      }
    }

    // CPS (Composite Promotion Score) 최종 정규화 및 저장
    log("CPS 복합 스코어 산출 및 데이터 저장 중...");
    for (const sig of evaluatedSignals) {
      try {
        // Percentile Rank 정규화 (STAT-4)
        const qvsNorm = percentileRank(sig.qvsTotal, allQvsScores);
        const volNorm = percentileRank(sig.volume, allVolumes);
        const ymylWeight = sig.isYmyl ? 1.0 : 0.5;

        // CPS 공식 적용
        const cpsScore = parseFloat((
          (0.3 * qvsNorm) + 
          (0.25 * volNorm) + 
          (0.2 * (sig.tcoMatchScore / 10)) + 
          (0.15 * (sig.kgCoverage / 10)) + 
          (0.10 * ymylWeight)
        ).toFixed(4));

        await createQuestionSignal(workspaceId, {
          query: sig.query,
          volume: sig.volume,
          intent: sig.intent,
          status: sig.gateStatus === 'Go' ? 'promoted' : 'mined',
          // 확장 컬럼 바인딩
          qvs_total: sig.qvsTotal,
          qvs_dimensions: sig.qvsDimensions,
          cps_score: cpsScore,
          is_ymyl: sig.isYmyl,
          gate_status: sig.gateStatus,
          eval_confidence: sig.confidence,
          panel_layer: sig.panelLayer
        } as any);

        savedSignals++;
      } catch (err: any) {
        evalErrors++;
        console.error('[S-OGDE Save] DB write error:', err.message);
      }
    }

    log(`Phase E 완료: ${savedSignals}개 저장, ${filteredOut}개 필터링`);
    log(`파이프라인 완료! 총 ${Date.now() - pipelineStart}ms 소요.`);

    return {
      totalGenerated,
      afterDedup: dedupedCandidates.length,
      savedSignals,
      sources,
      clusters,
      filteredOut,
      evalErrors,
      phaseWarnings,
      durationMs: Date.now() - pipelineStart
    };
  }
}

/**
 * 백분위 순위 (Percentile Rank) 계산 함수
 */
function percentileRank(val: number, arr: number[]): number {
  if (arr.length <= 1) return 1.0;
  const count = arr.filter(v => v < val).length;
  const same = arr.filter(v => v === val).length;
  return (count + (same / 2)) / arr.length;
}
