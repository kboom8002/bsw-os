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

export interface E2EPipelineResult {
  phase0_bootstrap: { tcoConcepts: number; kgNodes: number; kgEdges: number; skipped: boolean };
  phase1_signals: { count: number; source: string };
  phase1_5_deepDive?: { targetsFound: number; fedCount: number; skipped?: boolean; reason?: string };
  phase2_opportunities: { gapCount: number; blindSpotCount: number; fedCount: number };
  phase2_5_surfacePersist?: { persisted: number; skipped?: boolean; reason?: string };
  phase3_promotions: { promotedCount: number; cqCreated: number };
  phase4_hubPush?: { pushed: boolean; count: number };
  totalDuration: number;
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
  }
): Promise<E2EPipelineResult> {
  await requireAuthOrDemo();
  const startTime = Date.now();
  const mode = options?.mode || 'standalone';
  const autoPromoteTopN = options?.autoPromoteTopN ?? 5;
  const industryKey = options?.industryKey || 'wedding_studio';

  const result: E2EPipelineResult = {
    phase0_bootstrap: { tcoConcepts: 0, kgNodes: 0, kgEdges: 0, skipped: true },
    phase1_signals: { count: 0, source: mode },
    phase2_opportunities: { gapCount: 0, blindSpotCount: 0, fedCount: 0 },
    phase3_promotions: { promotedCount: 0, cqCreated: 0 },
    totalDuration: 0,
  };

  const supabase = getSupabaseAdminClient();

  // ── Phase 0: 실측 기반 TCO/KG 부트스트랩 (데이터 부재 시 자동 기동) ──
  try {
    const [tcoCount, kgCount] = await Promise.all([
      supabase.from('tco_concepts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
      supabase.from('brand_ontology_nodes').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId)
    ]);

    if ((tcoCount.count ?? 0) === 0 || (kgCount.count ?? 0) === 0) {
      result.phase0_bootstrap.skipped = false;
      const { generateIndustryConcepts, generateIndustryOntology } = await import('./semantic');

      // TCO 개념 20개 자동 도출
      if ((tcoCount.count ?? 0) === 0) {
        let tcoRes = { created: 0 };
        try {
          tcoRes = await generateIndustryConcepts(workspaceId, domainName, brandName, industryKey);
        } catch (e: any) {
          console.warn('[E2E Pipeline] generateIndustryConcepts failed:', e.message);
        }
        
        // Fallback: TCO 생성이 0개이거나 실패한 경우, 기본 시드 2개 삽입
        if (tcoRes.created === 0) {
          console.log('[E2E Pipeline] TCO fallback triggered. Inserting 2 seed concepts.');
          const seedConcepts = [
            { workspace_id: workspaceId, concept_name: '핵심 서비스', definition: `${domainName}의 기본 제공 서비스 및 상품성`, is_strategic: true, origin_layer: 'tco', status: 'active' },
            { workspace_id: workspaceId, concept_name: '고객 경험', definition: `사용자가 체감하는 ${domainName}의 전반적인 서비스 품질과 혜택`, is_strategic: true, origin_layer: 'tco', status: 'active' }
          ];
          const { data: insertedTco } = await supabase.from('tco_concepts').insert(seedConcepts).select();
          tcoRes.created = insertedTco?.length || 0;
        }
        result.phase0_bootstrap.tcoConcepts = tcoRes.created;
      }

      // 온톨로지 KG 구축
      if ((kgCount.count ?? 0) === 0) {
        const kgRes = await generateIndustryOntology(workspaceId, domainName, brandName, industryKey);
        result.phase0_bootstrap.kgNodes = kgRes.nodesCreated;
        result.phase0_bootstrap.kgEdges = kgRes.edgesCreated;
      }
    }
  } catch (err: any) {
    console.warn('[E2E Pipeline] Phase 0 Bootstrap failed:', err.message);
  }

  // ── Phase 1: S-OGDE v3.0 시그널 수집 (TCO 시드 및 KG 로딩 포함) ────
  try {
    const { data: tcoSeeds } = await supabase
      .from('tco_concepts')
      .select('concept_name, definition')
      .eq('workspace_id', workspaceId)
      .eq('is_strategic', true);

    const { data: kgNodes } = await supabase
      .from('brand_ontology_nodes')
      .select('id, node_name, node_type')
      .eq('workspace_id', workspaceId);

    const pipelineResult = await SignalOrchestrator.runFullPipeline(
      workspaceId,
      domainName,
      brandName,
      {
        brandUSP: options?.brandUSP,
        workspaceId,
        industryKey,
        tcoConceptSeeds: tcoSeeds || [],
        kgNodes: kgNodes || [],
        repeatEval: 1 // 속도를 위해 E2E 실행 시 1회 평가 권장
      }
    );
    result.phase1_signals.count = pipelineResult.savedSignals || 0;
  } catch (err: any) {
    console.warn('[E2E Pipeline] Phase 1 failed:', err.message);
  }

  // ── Phase 1.5: Deep Dive Target Discovery → Signal Feed ────
  try {
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
    console.warn('[E2E Pipeline] Phase 1.5 Deep Dive failed:', err.message);
    result.phase1_5_deepDive = { targetsFound: 0, fedCount: 0, skipped: true, reason: err.message };
  }

  // ── Phase 2: 벤치마크 기회 → 시그널 피딩 ────────────────────
  try {
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
    console.warn('[E2E Pipeline] Phase 2 failed:', err.message);
  }

  // ── Phase 2.5: Surface AnswerCardReverser CQ/QIS → DB 영속화 (P2-3) ──
  try {
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
    console.warn('[E2E Pipeline] Phase 2.5 Surface Persist failed:', err.message);
    result.phase2_5_surfacePersist = { persisted: 0, skipped: true, reason: err.message };
  }

  // ── Phase 3: CPS 및 MMR 다양성 기반 승격 대상 탐색 ────────────────
  try {
    // cps_score가 높은 순으로 mined 상태 시그널 조회
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

      // ── Phase 5: 연쇄적 Claim/Lineage 자동 연계 (승격 수행) ────────
      for (const sig of selected) {
        try {
          const promoteResult = await autoPromoteSignalToCQ(
            workspaceId,
            sig.id,
            { autoCreateQisScene: true, industryKey }
          );
          result.phase3_promotions.promotedCount++;
          if (promoteResult.canonicalQuestionId) {
            result.phase3_promotions.cqCreated++;
          }
        } catch (err: any) {
          console.warn(`[E2E] Signal ${sig.id} promotion failed:`, err.message);
        }
      }
    }
  } catch (err: any) {
    console.warn('[E2E Pipeline] Phase 3/5 failed:', err.message);
  }

  // ── Phase 4: Hub Push (연동 모드만) ─────────────────────────
  if (mode === 'hub') {
    try {
      const { QisHubClient } = await import('../../lib/qis/hub-client');
      const hubClient = new QisHubClient();

      const { data: predictions } = await supabase
        .from('predicted_questions')
        .select('*')
        .eq('workspace_id', workspaceId)
        .gte('confidence', 0.7)
        .order('created_at', { ascending: false })
        .limit(50);

      if (predictions && predictions.length > 0) {
        const pushed = await hubClient.pushPredictedQuestions(predictions as any);
        result.phase4_hubPush = { pushed, count: predictions.length };
      }
    } catch (err: any) {
      console.warn('[E2E Pipeline] Phase 4 Hub Push failed:', err.message);
      result.phase4_hubPush = { pushed: false, count: 0 };
    }
  }

  result.totalDuration = Date.now() - startTime;
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

