'use server';

/**
 * app/actions/qis-bridge.ts
 * 
 * QIS 시스템 교차 활용 브릿지 액션 모듈
 * 
 * 기존 벤치마크(benchmark), 업종 실측(industry), S-OGDE(signal-collection),
 * 서피스(surface) 엔진 간의 교차 연결을 담당합니다.
 * 
 * 동작 모드:
 * - Hub 연동 모드: AIHompyHub와 연동하여 시그널 수집/Push
 * - 단독(Standalone) 모드: Hub 없이 자체 벤치마크/업종 데이터 기반 질문 발굴
 */

import crypto from 'crypto';
import { getSupabaseAdminClient } from '../../lib/supabase';
import { OpportunityAnalyzer, BrandOpportunityReport } from '../../lib/benchmark/opportunity-analyzer';
import { QisCrossMapper, UnifiedQuestionMapping } from '../../lib/surface/qis-cross-mapper';
import { TargetQisEngine } from '../../lib/deep-dive/target-qis-engine';
import { SignalOrchestrator } from '../../lib/signal-collection/orchestrator';
import { BENCHMARK_DOMAINS } from '../../lib/benchmark/domain-config';
import { requireAuthOrDemo } from '../../lib/auth';
import { SignalBridge } from '../../lib/signal-collection/signal-bridge';
import {
  PipelineStateManager,
  PipelinePausedError,
  PIPELINE_PHASES,
  type PipelinePhase,
} from '../../lib/pipeline/pipeline-state-manager';

// ═══════════════════════════════════════════════════════════════
// 1. 벤치마크 기회 → 질문 시그널 자동 피딩
// ═══════════════════════════════════════════════════════════════

/**
 * OpportunityAnalyzer에서 발견한 GAP/BLIND_SPOT을
 * question_signals 테이블에 자동 등록합니다.
 * 
 * 이 함수는:
 * - 벤치마크 측정 후 자동 호출
 * - Hub 연동/단독 모두 사용 가능
 * - 중복 방지: 동일 query 존재 시 skip
 */
export async function feedBenchmarkOpportunitiesToSignals(
  workspaceId: string,
  opportunities: Array<{ query: string; intent: string; source: string }>
): Promise<{ fedCount: number; skippedCount: number; errors: string[] }> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  let fedCount = 0;
  let skippedCount = 0;
  const errors: string[] = [];

  for (const opp of opportunities) {
    try {
      // 중복 체크: 동일 query가 이미 존재하면 skip
      const { data: existing } = await supabase
        .from('question_signals')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('query', opp.query)
        .maybeSingle();

      if (existing) {
        skippedCount++;
        continue;
      }

      // 시그널 등록
      const signalData = {
        workspace_id: workspaceId,
        query: opp.query,
        volume: 0, // 추후 VolumeEstimator로 갱신
        intent: opp.intent || 'informational',
        status: 'mined' as const,
        source: opp.source,
      };

      const { error } = await supabase
        .from('question_signals')
        .insert(signalData);

      if (error) {
        errors.push(`Signal insert failed for "${opp.query}": ${error.message}`);
      } else {
        fedCount++;
      }
    } catch (err: any) {
      errors.push(`Error processing "${opp.query}": ${err.message}`);
    }
  }

  return { fedCount, skippedCount, errors };
}

// ═══════════════════════════════════════════════════════════════
// 2. Signal → CQ 자동 승격 (Signal → Capital Node → CQ → QIS Scene)
// ═══════════════════════════════════════════════════════════════

/**
 * 시그널을 Question Capital Node + Canonical Question으로 자동 승격합니다.
 * 기존 promoteSignalToQuestionCapital()을 확장하여 CQ + (선택) QIS Scene까지 생성.
 * 
 * Hub 연동 모드: Hub에서 수집된 시그널 승격
 * 단독 모드: S-OGDE 또는 벤치마크에서 발굴된 시그널 승격
 */
export async function autoPromoteSignalToCQ(
  workspaceId: string,
  signalId: string,
  options?: { autoCreateQisScene?: boolean; industryKey?: string }
): Promise<{ capitalNodeId: string; canonicalQuestionId: string; qisSceneId?: string }> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  // 1. 시그널 조회
  const { data: signal, error: sigErr } = await supabase
    .from('question_signals')
    .select('*')
    .eq('id', signalId)
    .eq('workspace_id', workspaceId)
    .single();

  if (sigErr || !signal) {
    throw new Error(`SignalNotFound: ${signalId}`);
  }

  // 2. Question Capital Node 생성
  const slug = (signal.query || 'signal')
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 60) + '-' + Date.now();

  const { data: capitalNode, error: capErr } = await supabase
    .from('question_capital_nodes')
    .insert({
      workspace_id: workspaceId,
      title: `질문 자본: ${(signal.query || '').slice(0, 80)}`,
      slug,
      strategic_weight: signal.volume > 1000 ? 90 : signal.volume > 500 ? 70 : 50,
    })
    .select('id')
    .single();

  if (capErr || !capitalNode) {
    throw new Error(`CapitalNode creation failed: ${capErr?.message}`);
  }

  // 3. Canonical Question 생성 (중복 방지: signature 기반)
  const signature = crypto
    .createHash('sha256')
    .update(signal.query || '')
    .digest('hex');

  // 기존 CQ 존재 여부 확인
  const { data: existingCQ } = await supabase
    .from('canonical_questions')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('signature', signature)
    .maybeSingle();

  let canonicalQuestionId: string;

  if (existingCQ) {
    canonicalQuestionId = existingCQ.id;
  } else {
    const { data: newCQ, error: cqErr } = await supabase
      .from('canonical_questions')
      .insert({
        workspace_id: workspaceId,
        question_capital_node_id: capitalNode.id,
        normalized_question: signal.query,
        slug: `cq-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        signature,
      })
      .select('id')
      .single();

    if (cqErr || !newCQ) {
      throw new Error(`CQ creation failed: ${cqErr?.message}`);
    }
    canonicalQuestionId = newCQ.id;
  }

  // 4. (선택) QIS Scene 자동 생성
  let qisSceneId: string | undefined;

  if (options?.autoCreateQisScene) {
    const { data: scene, error: sceneErr } = await supabase
      .from('qis_scenes')
      .insert({
        workspace_id: workspaceId,
        canonical_question_id: canonicalQuestionId,
        scene_type: 'factoid',
        answer_text: `${signal.query}에 대한 전문적인 답변이 필요합니다.`,
        must_include: signal.metadata?.auto_must_include || [],
        must_not_do: signal.metadata?.auto_must_not_do || [],
        confidence_score: 0.5,
      })
      .select('id')
      .single();

    if (!sceneErr && scene) {
      qisSceneId = scene.id;
    }
  }

  // 5. Signal 상태 업데이트
  await supabase
    .from('question_signals')
    .update({ status: 'promoted' })
    .eq('id', signalId);

  // 6. Audit Trail
  await supabase.from('audit_events').insert({
    workspace_id: workspaceId,
    user_id: 'system-auto-promote',
    action: 'AUTO_PROMOTE_SIGNAL_TO_CQ',
    target_type: 'canonical_questions',
    target_id: canonicalQuestionId,
    payload: {
      signalId,
      capitalNodeId: capitalNode.id,
      hasQisScene: !!qisSceneId,
    },
  });

  // 7. Claim Lineage 자동 연결 — 승격된 시그널에서 Claim Node 및 실측 근거(Evidence) 자동 생성
  let claimNodeId: string | undefined;
  try {
    const riskLevel = signal.metadata?.preemption_urgency === 'critical' ? 'critical'
      : signal.metadata?.preemption_urgency === 'high' ? 'high' : 'medium';

    // 7-1. 업종 패널 데이터에서 must_include, risk_level 조회하여 진실 가이드 생성
    const { INDUSTRY_PANELS_DATA } = await import('../../db/seed/industry-panels/questions-data');
    
    // 업종 정보 매칭 탐색
    let panelMatch: any = null;
    if (options?.industryKey && INDUSTRY_PANELS_DATA[options.industryKey as keyof typeof INDUSTRY_PANELS_DATA]) {
      const questions = INDUSTRY_PANELS_DATA[options.industryKey as keyof typeof INDUSTRY_PANELS_DATA].questions;
      panelMatch = questions.find(q => 
        signal.query && q.question_text.toLowerCase().includes(signal.query.toLowerCase().slice(0, 15))
      );
    }

    const mustIncludes = panelMatch?.must_include && panelMatch.must_include.length > 0
      ? ` (필수포함: ${panelMatch.must_include.join(', ')})`
      : '';

    const truthClaim = `${(signal.query || '').slice(0, 100)}에 대한 브랜드 운영 실측 진실${mustIncludes}`;
    
    const { data: existingTruth } = await supabase
      .from('brand_operational_truths')
      .select('id')
      .eq('workspace_id', workspaceId)
      .ilike('claim', `%${(signal.query || '').slice(0, 50)}%`)
      .maybeSingle();

    let truthId = existingTruth?.id;
    if (!truthId) {
      const { data: newTruth } = await supabase
        .from('brand_operational_truths')
        .insert({ workspace_id: workspaceId, claim: truthClaim, risk_level: riskLevel })
        .select('id')
        .single();
      truthId = newTruth?.id;
    }

    // 7-2. 구글 검색 인용을 기반으로 실측 증거(Evidence Item) 및 YMYL 경계 규칙 생성
    let evidenceId: string | null = null;
    let ruleId: string | null = null;

    try {
      const { SearchProviderFactory } = await import('../../lib/ai/search-provider-factory');
      const searchRes = await SearchProviderFactory.runMultiEngine(signal.query, ['gemini_grounding']);
      const res = searchRes.results['gemini_grounding'];

      if (res?.citations && res.citations.length > 0) {
        const primaryCitation = res.citations[0];
        const { data: newEvidence } = await supabase
          .from('evidence_items')
          .insert({
            workspace_id: workspaceId,
            title: `[실측] ${primaryCitation.title || signal.query}`,
            source_url: primaryCitation.url || null,
            is_verified: true
          })
          .select('id')
          .single();
        
        if (newEvidence) {
          evidenceId = newEvidence.id;
        }
      }
    } catch (e: any) {
      console.warn('[autoPromote] Evidence grounding failed (continuing):', e.message);
    }

    // YMYL 경계 규칙 생성 (패널의 risk_level이 medium 이상이거나 must_not_do가 있을 시)
    if (panelMatch?.risk_level === 'high' || panelMatch?.must_not_do?.length > 0) {
      const ruleName = panelMatch.must_not_do && panelMatch.must_not_do.length > 0
        ? `[경계] ${panelMatch.must_not_do[0]}`
        : `[경계] ${signal.query.slice(0, 30)} 안전 규칙`;

      const { data: newRule } = await supabase
        .from('boundary_rules')
        .insert({
          workspace_id: workspaceId,
          rule_name: ruleName,
          description: `업종 표준 질문 경계: ${panelMatch?.question_text || signal.query}`,
          is_active: true
        })
        .select('id')
        .single();

      if (newRule) {
        ruleId = newRule.id;
      }
    }

    // 7-3. Claim Node 생성
    if (truthId) {
      const { data: claimNode } = await supabase
        .from('claim_nodes')
        .insert({
          workspace_id: workspaceId,
          claim_summary: `[자동] ${(signal.query || '').slice(0, 120)}`,
          operational_truth_id: truthId,
          risk_level: riskLevel,
          is_publishable: !!evidenceId, // 증거가 있으면 즉시 배포 가능성 부여
          verification_signature: null,
        })
        .select('id')
        .single();

      if (claimNode) {
        claimNodeId = claimNode.id;

        // 7-4. Lineage Record 생성 (실측 증거 및 경계규칙 연동)
        await supabase.from('lineage_records').insert({
          workspace_id: workspaceId,
          claim_node_id: claimNode.id,
          evidence_item_id: evidenceId,
          boundary_rule_id: ruleId,
          is_publishable: !!evidenceId,
          verification_signature: null,
        });

        // 7-5. 피드백 루프 성과 추적 활성화 (PRED-1 해결)
        const { SignalPerformanceTracker } = await import('../../lib/signal-collection/signal-performance-tracker');
        await SignalPerformanceTracker.initTracking(signalId, workspaceId);
      }
    }
  } catch (claimErr: any) {
    console.warn('[autoPromoteSignalToCQ] Claim auto-link failed (non-blocking):', claimErr.message);
  }

  return {
    capitalNodeId: capitalNode.id,
    canonicalQuestionId,
    qisSceneId,
  };
}

// ═══════════════════════════════════════════════════════════════
// 3. QisCrossMapper RED → 시그널 자동 등록
// ═══════════════════════════════════════════════════════════════

/**
 * QisCrossMapper의 RED 영역(업종에는 있지만 자사에 없음)을
 * question_signals에 자동 등록합니다.
 * 
 * 이 함수는 업종 벤치마크와 사이트 크롤 결과를 교차 비교하여
 * 자사가 커버하지 못한 업종 표준 질문을 자동 발굴합니다.
 */
export async function feedCrossMapGapsToSignals(
  workspaceId: string,
  industryKey: string,
  siteProbes: Array<{ question_text: string; layer: string; must_include: string[]; should_include: string[] }>
): Promise<{ fedCount: number; totalGaps: number }> {
  await requireAuthOrDemo();
  const mapper = new QisCrossMapper();
  const mappings = await mapper.crossMap(industryKey, siteProbes as any);

  // RED: 업종에는 있지만 사이트에 없는 질문
  const redGaps = mappings.filter(m => m.coverage_status === 'industry_only');

  const opportunities = redGaps.map(gap => ({
    query: gap.question_text,
    intent: gap.industry_question_ref?.question_type || 'informational',
    source: 'cross_map_industry_gap',
  }));

  const result = await feedBenchmarkOpportunitiesToSignals(workspaceId, opportunities);

  return {
    fedCount: result.fedCount,
    totalGaps: redGaps.length,
  };
}

// ═══════════════════════════════════════════════════════════════
// 4. 원클릭 E2E 파이프라인 (7단계 실측 기반 통합)
// ═══════════════════════════════════════════════════════════════

interface PipelinePhaseError {
  phase: string;
  message: string;
  timestamp: string;
}

interface E2EPipelineResult {
  phase0_bootstrap: { tcoConcepts: number; kgNodes: number; kgEdges: number; skipped: boolean };
  phase0_5_signals?: { collected: number; converted: number; volumeEnriched: number };
  phase0_6_hubFeedback?: { newSignals: number; cpsUpdated: number; source: string };
  phase1_signals: { count: number; source: string };
  phase1b_brandSignals?: { 
    brandsProcessed: number; 
    totalSignals: number; 
    perBrand: Record<string, number>;
    costLimitReached: boolean;
  };
  phase1_5_deepDive?: { targetsFound: number; fedCount: number; skipped?: boolean; reason?: string };
  phase2_opportunities: { gapCount: number; blindSpotCount: number; fedCount: number };
  phase2_1_reportGaps?: { weakCategories: number; fedCount: number };
  phase2_5_surfacePersist?: { persisted: number; skipped?: boolean; reason?: string };
  phase2_6_deepDiveEnrich?: { brandsEnriched: number; additionalCQ: number };
  phase3_promotions: { promotedCount: number; cqCreated: number };
  phase3_1_brandAssignment?: { packagesCreated: number; cqAssigned: number };
  phase4_hubPush?: { pushed: boolean; cqCount: number; sceneCount: number; arenaCreated: number; errors: string[] };
  phase5_saturation?: { coveragePercent: number; isNearSaturation: boolean; recommendation?: string };
  totalDuration: number;
  status: string;
  phaseErrors: PipelinePhaseError[];
  runId?: string;
}

/**
 * 원클릭 E2E 파이프라인 실행 (7단계 실측 그라운딩)
 */
export async function runE2EPipeline(
  workspaceId: string,
  domainName: string,
  brandName?: string,
  options?: {
    mode?: 'hub' | 'standalone';
    autoPromoteTopN?: number;
    brandUSP?: string;
    industryKey?: string;
    enableBrandRotation?: boolean;
    enableReportGapFeed?: boolean;
    enableSaturationCheck?: boolean;
    /** 이 Phase부터 실행 (이전 Phase는 기존 결과 재사용) */
    resumeFromPhase?: string;
    /** 기존 run을 재사용 (resume/retry 시) */
    existingRunId?: string;
    /**
     * Phase 그룹 실행 모드:
     * - 'bootstrap': Phase 0만 실행
     * - 'collect':   Phase 0.5 ~ 2.6 (시그널 수집만, enabledPhases로 개별 제어)
     * - 'promote':   Phase 3 ~ 3.1 (선택된 시그널 CQ 승격, selectedSignalIds 필요)
     * - 'finalize':  Phase 4 ~ 5 (Hub Push + Saturation)
     * - 'full':      전체 실행 (기본값, 기존 동작)
     */
    phaseGroup?: 'bootstrap' | 'collect' | 'promote' | 'finalize' | 'full';
    /** phaseGroup='collect'일 때 실행할 Phase 키 목록 */
    enabledPhases?: string[];
    /** phaseGroup='promote'일 때 승격할 시그널 ID 목록 */
    selectedSignalIds?: string[];
  }
): Promise<E2EPipelineResult> {
  await requireAuthOrDemo();

  // ── 입력 검증 ──────────────────────────────────────────────────
  if (!workspaceId || typeof workspaceId !== 'string') {
    throw new Error('Invalid workspaceId: must be a non-empty string');
  }
  if (!domainName || typeof domainName !== 'string' || domainName.trim() === '') {
    throw new Error('Invalid domainName: must be a non-empty string');
  }

  const startTime = Date.now();
  const mode = options?.mode || 'standalone';
  const autoPromoteTopN = Math.max(1, Math.min(20, options?.autoPromoteTopN ?? 5));
  const industryKey = options?.industryKey || domainName || 'skincare';
  const resumeFromPhase = options?.resumeFromPhase;
  const phaseGroup = options?.phaseGroup || 'full';
  const enabledPhases = options?.enabledPhases; // undefined = 전체 허용
  const selectedSignalIds = options?.selectedSignalIds; // undefined = MMR 자동 선택

  // Phase 실행 여부 판단 헬퍼
  const shouldRunPhase = (phase: string): boolean => {
    if (phaseGroup === 'full') return true;
    if (phaseGroup === 'bootstrap') return phase === 'phase0_bootstrap';
    if (phaseGroup === 'collect') {
      const collectPhases = ['phase0_5_external','phase0_6_hubFeedback','phase1_signals',
        'phase1b_brandSignals','phase1_5_deepDive','phase2_opportunities',
        'phase2_1_reportGaps','phase2_5_surfacePersist','phase2_6_deepDiveEnrich'];
      if (!collectPhases.includes(phase)) return false;
      // 개별 Phase 토글이 있으면 그것으로 판단
      return enabledPhases ? enabledPhases.includes(phase) : true;
    }
    if (phaseGroup === 'promote') return ['phase3_promotions','phase3_1_brandAssignment'].includes(phase);
    if (phaseGroup === 'finalize') return ['phase4_hubPush','phase5_saturation'].includes(phase);
    return true;
  };

  const phaseErrors: PipelinePhaseError[] = [];
  const addPhaseError = (phase: string, err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    phaseErrors.push({ phase, message: msg, timestamp: new Date().toISOString() });
    console.warn(`[E2E Pipeline] ${phase} failed:`, msg);
  };

  const result: E2EPipelineResult = {
    phase0_bootstrap: { tcoConcepts: 0, kgNodes: 0, kgEdges: 0, skipped: true },
    phase1_signals: { count: 0, source: mode },
    phase2_opportunities: { gapCount: 0, blindSpotCount: 0, fedCount: 0 },
    phase3_promotions: { promotedCount: 0, cqCreated: 0 },
    totalDuration: 0,
    status: 'running',
    phaseErrors,
  };

  // ── Phase 실행 헬퍼: 중지 체크 + 스킵(resume) + 체크포인트 ────────
  const executePhase = async <T>(
    phaseName: string,
    fn: () => Promise<T>
  ): Promise<T | null> => {
    const phaseIdx = PIPELINE_PHASES.indexOf(phaseName as PipelinePhase);
    const resumeIdx = resumeFromPhase
      ? PIPELINE_PHASES.indexOf(resumeFromPhase as PipelinePhase)
      : -1;

    // resumeFromPhase 이전 Phase는 이전 결과를 DB에서 로드하여 스킵
    if (resumeIdx > 0 && phaseIdx < resumeIdx) {
      if (runId) {
        const prev = await PipelineStateManager.getRunProgress(runId);
        const cached = prev.phases[phaseName];
        if (cached?.status === 'completed') {
          console.log(`[E2E Pipeline] [${phaseName}] ⏭ 스킵 (resume, 이전 결과 재사용)`);
          return cached as unknown as T;
        }
      }
      return null;
    }

    // 중지 플래그 확인
    if (runId && await PipelineStateManager.shouldPause(runId)) {
      await PipelineStateManager.markAsPaused(runId, phaseName);
      throw new PipelinePausedError(phaseName);
    }

    // Phase 시작 — 현재 Phase 업데이트
    if (runId) {
      await PipelineStateManager.updatePhaseResult(runId, phaseName, { status: 'running' });
    }

    try {
      const res = await fn();
      // 체크포인트 저장
      if (runId) {
        await PipelineStateManager.updatePhaseResult(runId, phaseName, {
          status: 'completed',
          completed_at: new Date().toISOString(),
          ...(res as any),
        });
      }
      return res;
    } catch (err: any) {
      if (err instanceof PipelinePausedError) throw err;
      if (runId) {
        await PipelineStateManager.updatePhaseResult(runId, phaseName, {
          status: 'failed',
          error: err.message,
          completed_at: new Date().toISOString(),
        });
      }
      throw err;
    }
  };

  const supabase = getSupabaseAdminClient();

  // ── 동시 실행 방지 및 pipeline_runs 이력 기록 ───────────────────
  let runId: string | undefined = options?.existingRunId;
  try {
    if (runId) {
      // 기존 run 재사용 (resume/retry 시) — running 상태로 전환
      await supabase.from('pipeline_runs')
        .update({ status: 'running', pause_requested: false, resume_from: resumeFromPhase ?? null })
        .eq('id', runId);
      result.runId = runId;
    } else {
      // 현재 실행 중인 파이프라인이 있는지 확인
      const { data: activeRun } = await supabase
        .from('pipeline_runs')
        .select('id, started_at')
        .eq('workspace_id', workspaceId)
        .eq('status', 'running')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (activeRun) {
        const runningFor = Date.now() - new Date(activeRun.started_at).getTime();
        // 5분 이상된 running 상태는 stale로 간주하고 계속 진행
        if (runningFor < 5 * 60 * 1000) {
          throw new Error(`Pipeline is already running (started ${Math.round(runningFor / 1000)}s ago). Please wait for it to complete.`);
        }
        await supabase.from('pipeline_runs').update({ status: 'stale' }).eq('id', activeRun.id);
      }

      // 새 실행 기록 생성
      const { data: newRun } = await supabase
        .from('pipeline_runs')
        .insert({
          workspace_id: workspaceId,
          pipeline_type: 'e2e_qis',
          status: 'running',
          domain_key: domainName,
          brand_name: brandName || null,
          started_at: new Date().toISOString(),
          resume_from: resumeFromPhase ?? null,
          current_phase: resumeFromPhase ?? 'phase0_bootstrap',
        })
        .select('id')
        .single();

      if (newRun) {
        runId = newRun.id;
        result.runId = runId;
      }
    }
  } catch (err: any) {
    if (err.message?.includes('already running')) throw err;
    console.warn('[E2E Pipeline] pipeline_runs insert failed (non-blocking):', err.message);
  }

  // ── Phase 0: 실측 기반 TCO/KG 부트스트랩 (캐시 우선, 없으면 생성) ──
  if (shouldRunPhase('phase0_bootstrap')) try {
    await executePhase('phase0_bootstrap', async () => {
      // PipelineStateManager로 캐시 확인 (DB 카운트 쿼리 최소화)
      const bootstrapStatus = await PipelineStateManager.getBootstrapStatus(workspaceId);

      if (bootstrapStatus.isComplete) {
        // 이미 완료 — 스킵 (캐시 기반)
        result.phase0_bootstrap.skipped = true;
        result.phase0_bootstrap.tcoConcepts = bootstrapStatus.tcoCount;
        result.phase0_bootstrap.kgNodes = bootstrapStatus.kgCount;
        console.log(`[E2E Pipeline] [Phase 0] ✅ Bootstrap 스킵 (캐시: TCO ${bootstrapStatus.tcoCount}, KG ${bootstrapStatus.kgCount})`);
        return { tcoConcepts: bootstrapStatus.tcoCount, kgNodes: bootstrapStatus.kgCount, skipped: true };
      }

      // Bootstrap 필요 — 생성
      result.phase0_bootstrap.skipped = false;
      const { generateIndustryConcepts, generateIndustryOntology } = await import('./semantic');

      // TCO 개념 자동 도출
      if (!bootstrapStatus.isPartial || bootstrapStatus.tcoCount === 0) {
        let tcoRes = { created: 0 };
        try {
          tcoRes = await generateIndustryConcepts(workspaceId, domainName, brandName, industryKey);
        } catch (e: any) {
          console.warn('[E2E Pipeline] generateIndustryConcepts failed:', e.message);
        }
        if (tcoRes.created === 0) {
          console.log('[E2E Pipeline] TCO fallback triggered. Inserting 2 seed concepts.');
          const seedConcepts = [
            { workspace_id: workspaceId, concept_name: '핵심 서비스', slug: 'core-service', definition: `${domainName}의 기본 제공 서비스 및 상품성`, is_strategic: true },
            { workspace_id: workspaceId, concept_name: '고객 경험', slug: 'customer-experience', definition: `사용자가 체감하는 ${domainName}의 전반적인 서비스 품질과 혜택`, is_strategic: true }
          ];
          const { data: insertedTco, error: seedErr } = await supabase.from('tco_concepts').upsert(seedConcepts, { onConflict: 'workspace_id,slug' }).select();
          if (seedErr) console.warn('[E2E Pipeline] TCO fallback insert error:', seedErr.message);
          tcoRes.created = insertedTco?.length || 0;
        }
        result.phase0_bootstrap.tcoConcepts = tcoRes.created;
      } else {
        // TCO 이미 존재 → 기존 카운트 반영
        result.phase0_bootstrap.tcoConcepts = bootstrapStatus.tcoCount;
      }

      // 온톨로지 KG 구축
      if (!bootstrapStatus.isPartial || bootstrapStatus.kgCount === 0) {
        const kgRes = await generateIndustryOntology(workspaceId, domainName, brandName, industryKey);
        result.phase0_bootstrap.kgNodes = kgRes.nodesCreated;
        result.phase0_bootstrap.kgEdges = kgRes.edgesCreated;
      } else {
        // KG 이미 존재 → 기존 카운트 반영
        result.phase0_bootstrap.kgNodes = bootstrapStatus.kgCount;
      }

      return {
        tcoConcepts: result.phase0_bootstrap.tcoConcepts,
        kgNodes: result.phase0_bootstrap.kgNodes,
        skipped: false,
      };
    });
  } catch (err: any) {
    if (err instanceof PipelinePausedError) {
      result.status = 'paused';
      result.totalDuration = Date.now() - startTime;
      return result;
    }
    addPhaseError('phase0_bootstrap', err);
  }


  // ── Phase 0.5: 외부 시그널 수집 & 브릿지 (E2E 내장) ──────────
  const phase0_5_result = { collected: 0, converted: 0, volumeEnriched: 0 };
  if (shouldRunPhase('phase0_5_external')) try {
    await executePhase('phase0_5_external', async () => {
      console.log('[E2E Pipeline] [Phase 0.5] 외부 시그널 수집 & 브릿지 시작...');
      const { triggerAllCollectionsAction } = await import('./collection');
      const collectionResult = await triggerAllCollectionsAction(
        workspaceId,
        undefined,
        industryKey
      );
      phase0_5_result.collected = collectionResult.totalFetched;
      const bridgeResult = await SignalBridge.convertExternalToQuestionSignals(workspaceId, industryKey);
      phase0_5_result.converted = bridgeResult.converted;
      const enrichResult = await SignalBridge.enrichVolumeFromTrends(workspaceId);
      phase0_5_result.volumeEnriched = enrichResult.enriched;
      return phase0_5_result;
    });
  } catch (err: any) {
    if (err instanceof PipelinePausedError) {
      result.status = 'paused';
      result.totalDuration = Date.now() - startTime;
      return result;
    }
    addPhaseError('phase0_5_external', err);
  }

  // ── Phase 0.6: AI Hub 역방향 피드백 수집 (AI Hub → BSW) ──
  if (shouldRunPhase('phase0_6_hubFeedback')) try {
    await executePhase('phase0_6_hubFeedback', async () => {
      const { QisHubClient } = await import('../../lib/qis/hub-client');
      const { FeedbackProcessor } = await import('../../lib/hub-feedback/feedback-processor');
      const hubClient = new QisHubClient();
      const DOMAIN_REGION_MAP: Record<string, string> = { jeju_smb: 'jeju', skincare: 'korea' };
      const region = DOMAIN_REGION_MAP[industryKey] || 'jeju';
      const feedback = await hubClient.pullFeedback(region);
      if (feedback) {
        await supabase.from('hub_feedback_logs').upsert({
          workspace_id: workspaceId, region,
          feedback_date: feedback.date || new Date().toISOString().split('T')[0],
          source: 'pipeline_pull', payload: feedback, processed: false
        }, { onConflict: 'workspace_id,region,feedback_date,source' });
        const processResult = await FeedbackProcessor.processIncoming(workspaceId, feedback, industryKey);
        result.phase0_6_hubFeedback = { newSignals: processResult.newSignals, cpsUpdated: processResult.cpsUpdated, source: 'pipeline_pull' };
        return result.phase0_6_hubFeedback;
      } else {
        result.phase0_6_hubFeedback = { newSignals: 0, cpsUpdated: 0, source: 'none' };
        return result.phase0_6_hubFeedback;
      }
    });
  } catch (err: any) {
    if (err instanceof PipelinePausedError) {
      result.status = 'paused';
      result.totalDuration = Date.now() - startTime;
      return result;
    }
    addPhaseError('phase0_6_hubFeedback', err);
    result.phase0_6_hubFeedback = { newSignals: 0, cpsUpdated: 0, source: 'error' };
  }

  // ── Phase 1: S-OGDE v3.0 시그널 수집 (TCO 시드 및 KG 로딩 포함) ────
  if (shouldRunPhase('phase1_signals')) try {
    await executePhase('phase1_signals', async () => {
      const { data: tcoSeeds } = await supabase
        .from('tco_concepts').select('concept_name, definition')
        .eq('workspace_id', workspaceId).eq('is_strategic', true);
      const { data: kgNodes } = await supabase
        .from('brand_ontology_nodes').select('id, node_name, node_type')
        .eq('workspace_id', workspaceId);
      const pipelineResult = await SignalOrchestrator.runFullPipeline(
        workspaceId, domainName, brandName,
        { brandUSP: options?.brandUSP, workspaceId, industryKey,
          tcoConceptSeeds: tcoSeeds || [], kgNodes: kgNodes || [], repeatEval: 1 }
      );
      result.phase1_signals.count = pipelineResult.savedSignals || 0;
      return { count: pipelineResult.savedSignals || 0 };
    });
  } catch (err: any) {
    if (err instanceof PipelinePausedError) {
      result.status = 'paused';
      result.totalDuration = Date.now() - startTime;
      return result;
    }
    addPhaseError('phase1_signals', err);
  }

  // ── Phase 1-B: 브랜드 순회 특화 시그널 생성 ────────────────────
  if (shouldRunPhase('phase1b_brandSignals') && options?.enableBrandRotation !== false) {
    try {
      const domainCfg = BENCHMARK_DOMAINS[industryKey];
      if (domainCfg) {
        // Admin UI 설정 조회
        const { data: configRecord } = await supabase
          .from('pipeline_stage_configs')
          .select('config')
          .eq('workspace_id', workspaceId)
          .eq('domain_key', industryKey)
          .eq('stage_key', 'phase1b_brandRotation')
          .maybeSingle();

        const savedConfig = configRecord?.config as any || {};
        const selectedSlugs: string[] = savedConfig.selected_brands || [];
        const costLimit = savedConfig.daily_cost_limit || 10.0; // 일일 비용 제한 $10

        let targetBrands = domainCfg.brands.filter(b => selectedSlugs.includes(b.slug));
        if (targetBrands.length === 0) {
          // 백업: 점수 하위 5개 순회
          const { data: brandRankings } = await supabase
            .from('industry_benchmark_snapshots')
            .select('brand_slug')
            .eq('workspace_id', workspaceId)
            .order('aepi_score', { ascending: true })
            .limit(5);

          targetBrands = (brandRankings?.length
            ? brandRankings.map(r => domainCfg.brands.find(b => b.slug === r.brand_slug)).filter(Boolean)
            : domainCfg.brands.slice(0, 5)) as typeof domainCfg.brands;
        }

        const { CostGuard } = await import('../../lib/pipeline/cost-guard');
        const perBrand: Record<string, number> = {};
        let totalBrandSignals = 0;
        let costLimitReached = false;

        for (const brand of targetBrands) {
          // 일일 허용 비용 초과 여부 체크
          const currentCost = await CostGuard.getTodayCost(workspaceId, industryKey);
          if (currentCost >= costLimit) {
            costLimitReached = true;
            console.warn(`[Phase 1-B] Daily cost limit of $${costLimit} reached. Skipping remaining rotation.`);
            break;
          }

          const brandResult = await SignalOrchestrator.runFullPipeline(
            workspaceId,
            domainName,
            brand.name,
            {
              brandUSP: brand.brand_identity,
              industryKey,
              repeatEval: 1 // E2E 순회 효율 극대화
            }
          );
          perBrand[brand.slug] = brandResult.savedSignals || 0;
          totalBrandSignals += brandResult.savedSignals || 0;

          // S-OGDE v3.0 대략적인 비용 기록 누적 ($0.8 가상 증가)
          await CostGuard.trackCost(workspaceId, industryKey, 0.8, runId);
        }

        result.phase1b_brandSignals = {
          brandsProcessed: Object.keys(perBrand).length,
          totalSignals: totalBrandSignals,
          perBrand,
          costLimitReached
        };
      }
    } catch (err: any) {
      if (err instanceof PipelinePausedError) {
        result.status = 'paused';
        result.totalDuration = Date.now() - startTime;
        return result;
      }
      addPhaseError('phase1b_brandSignals', err);
    }
  }

  // ── Phase 1.5: Deep Dive Target Discovery → Signal Feed ────
  if (shouldRunPhase('phase1_5_deepDive')) try {
    const { TargetQisEngine } = await import('../../lib/deep-dive/target-qis-engine');
    const domainCfg = BENCHMARK_DOMAINS[industryKey || ''];
    if (domainCfg) {
      const [mappingsRes, oppReportRes] = await Promise.all([
        supabase.from('unified_question_mappings').select('*').eq('workspace_id', workspaceId).limit(200),
        supabase.from('opportunity_reports').select('*').eq('workspace_id', workspaceId).order('created_at', { ascending: false }).limit(1).maybeSingle()
      ]);

      const mappings = mappingsRes.data || [];
      const oppReport = oppReportRes.data || { opportunities: [], eeat_summary: {} };

      const targets = await TargetQisEngine.discoverTargets(
        workspaceId,
        brandName,
        mappings,
        oppReport as any,
        domainCfg
      );

      const targetSignals = targets.slice(0, 10).map(t => ({
        query: t.question_text,
        intent: 'informational',
        source: 'deep_dive_target'
      }));
      
      if (targetSignals.length > 0) {
        const fed = await feedBenchmarkOpportunitiesToSignals(workspaceId, targetSignals);
        result.phase1_5_deepDive = { targetsFound: targets.length, fedCount: fed.fedCount };
      } else {
        result.phase1_5_deepDive = { targetsFound: targets.length, fedCount: 0 };
      }
    }
  } catch (err: any) {
    if (err instanceof PipelinePausedError) {
      result.status = 'paused';
      result.totalDuration = Date.now() - startTime;
      return result;
    }
    addPhaseError('phase1_5_deepDive', err);
    result.phase1_5_deepDive = { targetsFound: 0, fedCount: 0, skipped: true, reason: err.message };
  }

  // ── Phase 2: 벤치마크 기회 → 시그널 피딩 ────────────────────
  if (shouldRunPhase('phase2_opportunities')) try {
    const { data: recentSnapshots } = await supabase
      .from('industry_benchmark_snapshots')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(20);

    if (recentSnapshots && recentSnapshots.length > 0) {
      const autoSignals: Array<{ query: string; intent: string; source: string }> = [];
      for (const snap of recentSnapshots) {
        if (snap.auto_generated_signals) {
          autoSignals.push(...(snap.auto_generated_signals as any[]));
        }
      }

      if (autoSignals.length > 0) {
        const feedResult = await feedBenchmarkOpportunitiesToSignals(workspaceId, autoSignals);
        result.phase2_opportunities.fedCount = feedResult.fedCount;
      }
    }
  } catch (err: any) {
    if (err instanceof PipelinePausedError) {
      result.status = 'paused';
      result.totalDuration = Date.now() - startTime;
      return result;
    }
    addPhaseError('phase2_opportunities', err);
  }

  // ── Phase 2.1: 업종 리포트 약점 카테고리 → 시그널 피딩 ──────────
  if (shouldRunPhase('phase2_1_reportGaps') && options?.enableReportGapFeed !== false) {
    try {
      const { data: latestReport } = await supabase
        .from('industry_report_snapshots')
        .select('report_data')
        .eq('workspace_id', workspaceId)
        .eq('domain_key', domainName)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (latestReport?.report_data) {
        const reportData = latestReport.report_data as any;
        const weakSignals: Array<{ query: string; intent: string; source: string }> = [];

        const rankings = reportData.rankings || [];
        const weakBrands = rankings
          .filter((r: any) => r.aepi_score < 40)
          .slice(0, 5);

        for (const wb of weakBrands) {
          if (wb.bdr < 30) {
            weakSignals.push({
              query: `${wb.brand_name} 장점 단점 비교`,
              intent: 'comparison',
              source: 'report_weak_bdr'
            });
          }
          if (wb.cwr < 40) {
            weakSignals.push({
              query: `${wb.brand_name} vs 경쟁 브랜드 어디가 나아`,
              intent: 'comparison',
              source: 'report_weak_cwr'
            });
          }
        }

        const prescriptions = reportData.executiveSummary?.prescriptions || [];
        for (const rx of prescriptions.slice(0, 5)) {
          if (rx.question_text || rx.action) {
            weakSignals.push({
              query: rx.question_text || rx.action,
              intent: 'informational',
              source: 'report_prescription'
            });
          }
        }

        if (weakSignals.length > 0) {
          const fed = await feedBenchmarkOpportunitiesToSignals(workspaceId, weakSignals);
          result.phase2_1_reportGaps = {
            weakCategories: weakBrands.length,
            fedCount: fed.fedCount
          };
        }
      }
    } catch (err: any) {
      addPhaseError('phase2_1_reportGaps', err);
    }
  }

  // ── Phase 2.5: Surface AnswerCardReverser CQ/QIS → DB 영속화 (P2-3) ──
  if (shouldRunPhase('phase2_5_surfacePersist')) try {
    const { data: recentSessions } = await supabase
      .from('audit_sessions')
      .select('result_data')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(10);

    const reversedQueries: Array<{ query: string; intent: string; source: string }> = [];
    for (const session of (recentSessions || [])) {
      const resData = session.result_data as any;
      if (resData && resData.canonicalQuestions && Array.isArray(resData.canonicalQuestions)) {
        for (const cq of resData.canonicalQuestions) {
          if (cq.normalized_question) {
            reversedQueries.push({
              query: cq.normalized_question,
              intent: 'informational',
              source: 'surface_reversal'
            });
          }
        }
      }
    }

    let persisted = 0;
    if (reversedQueries.length > 0) {
      await feedBenchmarkOpportunitiesToSignals(workspaceId, reversedQueries);
      const queriesToFind = reversedQueries.map(rq => rq.query);
      const { data: signalsToPromote } = await supabase
        .from('question_signals')
        .select('id, query')
        .eq('workspace_id', workspaceId)
        .eq('status', 'mined')
        .in('query', queriesToFind);

      if (signalsToPromote && signalsToPromote.length > 0) {
        for (const sig of signalsToPromote) {
          try {
            await autoPromoteSignalToCQ(workspaceId, sig.id, {
              autoCreateQisScene: true,
              industryKey
            });
            persisted++;
          } catch (e: any) {
            console.warn(`[E2E Pipeline] Phase 2.5 promotion failed for signal ${sig.id}:`, e.message);
          }
        }
      }
    }
    result.phase2_5_surfacePersist = { persisted };
  } catch (err: any) {
    addPhaseError('phase2_5_surfacePersist', err);
    result.phase2_5_surfacePersist = { persisted: 0, skipped: true, reason: err.message };
  }

  // ── Phase 2.6: 딥다이브 완료 브랜드 → 심층 질문 자산 강화 (최근 30일) ──
  if (shouldRunPhase('phase2_6_deepDiveEnrich')) try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: deepDiveSessions } = await supabase
      .from('audit_sessions')
      .select('result_data, brand_slug')
      .eq('workspace_id', workspaceId)
      .eq('status', 'completed')
      .gte('completed_at', thirtyDaysAgo.toISOString())
      .not('result_data->questionDetails', 'is', null)
      .order('completed_at', { ascending: false });

    const deepDiveSignals: Array<{ query: string; intent: string; source: string }> = [];

    for (const session of (deepDiveSessions || [])) {
      const resData = session.result_data as any;
      const brandSlug = session.brand_slug;
      const details = resData?.questionDetails || resData?.question_details || [];

      for (const q of details) {
        const engines = Object.keys(q.per_engine || {});

        const mentionedAnywhere = engines.some(eng =>
          (q.per_engine[eng].brands_mentioned || []).includes(brandSlug)
        );

        if (!mentionedAnywhere) {
          deepDiveSignals.push({
            query: q.question_text,
            intent: q.question_type || 'informational',
            source: `deep_dive_gap_${brandSlug}`
          });
        }

        if (mentionedAnywhere) {
          const avgBsf = engines.reduce((sum, eng) => {
            const bsf = q.per_engine[eng].llm_bsf_score ?? q.per_engine[eng].bsf_score ?? 50;
            return sum + bsf;
          }, 0) / Math.max(1, engines.length);

          if (avgBsf < 20) {
            deepDiveSignals.push({
              query: `${q.question_text} 상세 정보`,
              intent: q.question_type || 'informational',
              source: `deep_dive_weak_bsf_${brandSlug}`
            });
          }
        }
      }
    }

    let enrichedCQ = 0;
    if (deepDiveSignals.length > 0) {
      const fed = await feedBenchmarkOpportunitiesToSignals(workspaceId, deepDiveSignals);
      enrichedCQ = fed.fedCount;

      if (fed.fedCount > 0) {
        const { data: newSignals } = await supabase
          .from('question_signals')
          .select('id')
          .eq('workspace_id', workspaceId)
          .in('source', deepDiveSignals.map(s => s.source))
          .eq('status', 'mined')
          .limit(15);

        for (const sig of (newSignals || [])) {
          await autoPromoteSignalToCQ(workspaceId, sig.id, {
            autoCreateQisScene: true,
            industryKey
          });
        }
      }
    }

    result.phase2_6_deepDiveEnrich = {
      brandsEnriched: (deepDiveSessions || []).length,
      additionalCQ: enrichedCQ
    };
  } catch (err: any) {
    addPhaseError('phase2_6_deepDiveEnrich', err);
  }

  // ── Phase 3: CPS 및 MMR 다양성 기반 승격 대상 탐색 ────────────────
  if (shouldRunPhase('phase3_promotions')) try {
    // ★ 사용자가 선택한 시그널 ID가 있으면 해당 목록으로 직접 승격
    if (selectedSignalIds && selectedSignalIds.length > 0) {
      const { data: userSelected } = await supabase
        .from('question_signals')
        .select('id, query, cps_score, volume')
        .eq('workspace_id', workspaceId)
        .in('id', selectedSignalIds);

      for (const sig of (userSelected || [])) {
        try {
          const promoteResult = await autoPromoteSignalToCQ(
            workspaceId, sig.id, { autoCreateQisScene: true, industryKey }
          );
          result.phase3_promotions.promotedCount++;
          if (promoteResult.canonicalQuestionId) result.phase3_promotions.cqCreated++;
        } catch (err: any) {
          console.warn(`[E2E] Signal ${sig.id} promotion failed:`, err.message);
        }
      }
    } else {
      // MMR 자동 선택 (기본 모드)
      const { data: candidates } = await supabase
        .from('question_signals')
        .select('id, query, cps_score, volume')
        .eq('workspace_id', workspaceId)
        .eq('status', 'mined')
        .order('cps_score', { ascending: false })
        .limit(50);

      if (candidates && candidates.length > 0) {
        // MMR (Maximal Marginal Relevance) 다양성 승격 후보군 획득 (PRED-3)
        const selected: any[] = [];
        const remaining = [...candidates];

        // 첫 번째는 점수 최고값 선택
        selected.push(remaining.shift()!);

        const lambda = 0.7; // 관련도(0.7) vs 다양성(0.3)
        while (selected.length < autoPromoteTopN && remaining.length > 0) {
          let bestMMR = -Infinity;
          let bestIdx = 0;

          for (let i = 0; i < remaining.length; i++) {
            const relevance = remaining[i].cps_score || (remaining[i].volume / 1000);
            
            // 간단 Jaccard 자모 오버랩 유사도로 다양성 확보
            const maxSim = Math.max(...selected.map(s => {
              const q1 = remaining[i].query;
              const q2 = s.query;
              const set1 = new Set(q1.split(''));
              const set2 = new Set(q2.split(''));
              const intersect = new Set([...set1].filter(x => set2.has(x)));
              return intersect.size / Math.max(1, set1.size + set2.size - intersect.size);
            }));

            const mmr = lambda * relevance - (1 - lambda) * maxSim;
            if (mmr > bestMMR) {
              bestMMR = mmr;
              bestIdx = i;
            }
          }

          selected.push(remaining.splice(bestIdx, 1)[0]);
        }

        // 연쇄적 Claim/Lineage 자동 연계 (승격 수행)
        for (const sig of selected) {
          try {
            const promoteResult = await autoPromoteSignalToCQ(
              workspaceId, sig.id, { autoCreateQisScene: true, industryKey }
            );
            result.phase3_promotions.promotedCount++;
            if (promoteResult.canonicalQuestionId) result.phase3_promotions.cqCreated++;
          } catch (err: any) {
            console.warn(`[E2E] Signal ${sig.id} promotion failed:`, err.message);
          }
        }
      }
    }
  } catch (err: any) {
    addPhaseError('phase3_promotions', err);
  }

  // ── Phase 3.1: CQ → 브랜드 배정 & 공급 패키지 ──────────────────
  if (shouldRunPhase('phase3_1_brandAssignment')) try {
    const domainCfg = BENCHMARK_DOMAINS[industryKey];
    if (domainCfg) {
      const { BrandAssigner } = await import('../../lib/pipeline/brand-assigner');
      const assignResult = await BrandAssigner.assignAndPackage(
        workspaceId,
        industryKey,
        domainCfg.brands
      );
      result.phase3_1_brandAssignment = assignResult;
    }
  } catch (err: any) {
    addPhaseError('phase3_1_brandAssignment', err);
  }

  // ── Phase 4: AI Hub Push (CQ + QIS Scene → AiHompyHub) ──────
  if (shouldRunPhase('phase4_hubPush')) try {
    const { QisHubClient } = await import('../../lib/qis/hub-client');
    const hubClient = new QisHubClient();

    // CQ 조회
    const { data: cqs } = await supabase
      .from('canonical_questions')
      .select('id, normalized_question, primary_intent, risk_level, cps_score, metadata')
      .eq('workspace_id', workspaceId)
      .order('cps_score', { ascending: false })
      .limit(200);

    // QIS Scene 조회
    const { data: scenes } = await supabase
      .from('qis_scenes')
      .select('id, scene_name, risk_level, readiness_score, must_do, must_not_do')
      .eq('workspace_id', workspaceId)
      .order('readiness_score', { ascending: false })
      .limit(50);

    const bswQuestions = QisHubClient.mapCQsToBSWQuestions(cqs || [], industryKey);
    const bswScenes = QisHubClient.mapQISScenesToBSWScenes(scenes || [], industryKey);

    // 도메인 → 리전 매핑
    const DOMAIN_REGION_MAP: Record<string, string> = {
      jeju_smb: 'jeju',
      skincare: 'korea',
    };
    const region = DOMAIN_REGION_MAP[industryKey] || process.env.BSW_HUB_REGION || 'jeju';

    if (bswQuestions.length > 0) {
      const pushResult = await hubClient.pushToAiHub(region, bswQuestions, bswScenes.length > 0 ? bswScenes : undefined);
      result.phase4_hubPush = {
        pushed: pushResult.ok,
        cqCount: pushResult.ingested,
        sceneCount: bswScenes.length,
        arenaCreated: pushResult.arenaCreated,
        errors: pushResult.errors,
      };
    } else {
      result.phase4_hubPush = { pushed: false, cqCount: 0, sceneCount: 0, arenaCreated: 0, errors: ['No CQs to push'] };
    }
  } catch (err: any) {
    addPhaseError('phase4_hubPush', err);
    result.phase4_hubPush = { pushed: false, cqCount: 0, sceneCount: 0, arenaCreated: 0, errors: [err.message] };
  }

  // ── Phase 5: CQ 포화도 체크 ──────────────────────────────────
  if (shouldRunPhase('phase5_saturation') && options?.enableSaturationCheck !== false) {
    try {
      const { SaturationMonitor } = await import('../../lib/pipeline/saturation-monitor');
      const satResult = await SaturationMonitor.checkSaturation(workspaceId, industryKey);
      result.phase5_saturation = satResult;

      if (satResult.isNearSaturation) {
        console.warn(`[E2E Pipeline] ⚠️ CQ 포화도 ${satResult.coveragePercent}% — 벤치마크 재실행 권고`);
      }
    } catch (err: any) {
      addPhaseError('phase5_saturation', err);
    }
  }

  result.totalDuration = Date.now() - startTime;

  // ── 최종 상태 결정 ───────────────────────────────────────────
  const hasAnyOutput = (
    result.phase1_signals.count > 0 ||
    result.phase3_promotions.promotedCount > 0
  );
  if (phaseErrors.length === 0) {
    result.status = 'success';
  } else if (hasAnyOutput) {
    result.status = 'partial_success';
  } else {
    result.status = 'failed';
  }

  // ── pipeline_runs 업데이트 ─────────────────────────────────
  if (runId) {
    try {
      await supabase.from('pipeline_runs').update({
        status: result.status === 'failed' ? 'failed' : 'completed',
        completed_at: new Date().toISOString(),
        duration_ms: result.totalDuration,
        result_summary: {
          signals: result.phase1_signals.count,
          promotions: result.phase3_promotions.promotedCount,
          cqCreated: result.phase3_promotions.cqCreated,
        },
        error_message: phaseErrors.length > 0
          ? phaseErrors.map(e => `[${e.phase}] ${e.message}`).join(' | ')
          : null,
      }).eq('id', runId);
    } catch (e) {
      console.warn('[E2E Pipeline] Failed to update pipeline_runs record:', e);
    }
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// 5. QVS × AEPI 전략 매트릭스 조회
// ═══════════════════════════════════════════════════════════════

/**
 * 현재 질문 자산의 QVS × AEPI 4-Quadrant 매트릭스를 조회합니다.
 * 기존 qis-benchmark-bridge.ts의 buildQvsAepiMatrix를 액션으로 래핑.
 */
export async function getQvsAepiStrategyMatrix(
  workspaceId: string,
  subIndustryKey: string
): Promise<{
  matrix: Array<{ id: string; label: string; qvs: number; aepi: number; quadrant: string; urgency: string }>;
  summary: { threat: number; core: number; ignore: number; maintain: number };
}> {
  await requireAuthOrDemo();
  const { buildQvsAepiMatrix } = await import('../../lib/benchmark/qis-benchmark-bridge');

  const supabase = getSupabaseAdminClient();
  const { data: snapshots } = await supabase
    .from('entity_reflection_snapshots')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(50);

  const matrix = await buildQvsAepiMatrix(subIndustryKey, snapshots || []);

  const summary = {
    threat: matrix.filter(m => m.quadrant === 'threat').length,
    core: matrix.filter(m => m.quadrant === 'core').length,
    ignore: matrix.filter(m => m.quadrant === 'ignore').length,
    maintain: matrix.filter(m => m.quadrant === 'maintain').length,
  };

  return { matrix, summary };
}

// ═══════════════════════════════════════════════════════════════
// 6. 파이프라인 상태 조회
// ═══════════════════════════════════════════════════════════════

/**
 * 질문 자산 파이프라인 전체 현황을 집계합니다.
 * 통합 대시보드 Command Center용 데이터.
 */
export async function getQisAssetOverview(
  workspaceId: string
): Promise<{
  signals: { total: number; mined: number; promoted: number; ignored: number };
  capitalNodes: number;
  canonicalQuestions: number;
  qisScenes: number;
  recentActivity: Array<{ action: string; target: string; timestamp: string }>;
}> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  // 병렬 쿼리
  const [signalsRes, capitalRes, cqRes, scenesRes, activityRes] = await Promise.all([
    supabase
      .from('question_signals')
      .select('status', { count: 'exact' })
      .eq('workspace_id', workspaceId),
    supabase
      .from('question_capital_nodes')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId),
    supabase
      .from('canonical_questions')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId),
    supabase
      .from('qis_scenes')
      .select('id', { count: 'exact' })
      .eq('workspace_id', workspaceId),
    supabase
      .from('audit_events')
      .select('action, target_type, created_at')
      .eq('workspace_id', workspaceId)
      .order('created_at', { ascending: false })
      .limit(10),
  ]);

  // 시그널 상태별 카운트
  const signalData = signalsRes.data || [];
  const signals = {
    total: signalsRes.count || 0,
    mined: signalData.filter((s: any) => s.status === 'mined').length,
    promoted: signalData.filter((s: any) => s.status === 'promoted').length,
    ignored: signalData.filter((s: any) => s.status === 'ignored').length,
  };

  return {
    signals,
    capitalNodes: capitalRes.count || 0,
    canonicalQuestions: cqRes.count || 0,
    qisScenes: scenesRes.count || 0,
    recentActivity: (activityRes.data || []).map((a: any) => ({
      action: a.action,
      target: a.target_type,
      timestamp: a.created_at,
    })),
  };
}

// ═══════════════════════════════════════════════════════════════
// 7. 골든 레퍼런스 합의 → QIS Scenes 연동
// ═══════════════════════════════════════════════════════════════

/**
 * 골든 레퍼런스 합의 결과를 QIS Scenes에 반영합니다.
 */
export async function applyGoldenConsensusToQis(
  workspaceId: string,
  subIndustryKey: string,
  consensusData: any
): Promise<{ success: boolean; updatedScenes: number; newMustIncludes: number }> {
  await requireAuthOrDemo();
  try {
    const { GoldenQisBridge } = await import('../../lib/golden/golden-qis-bridge');
    const result = await GoldenQisBridge.feedConsensusToQisScenes(
      workspaceId,
      consensusData,
      subIndustryKey
    );
    return { success: true, ...result };
  } catch (err: any) {
    console.error('[applyGoldenConsensusToQis] Error:', err);
    return { success: false, updatedScenes: 0, newMustIncludes: 0 };
  }
}

