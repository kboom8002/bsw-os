"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission } from "../../lib/auth";
import { buildCulturalSSoTContext } from "../../lib/judges/cultural-ssot-context-builder";
import { CulturalJudgeProvider } from "../../lib/judges/cultural-judge-provider";
import { CulturalMetricsAggregator } from "../../lib/metrics/cultural-metrics-aggregator";
import { OpportunityEngine } from "../../lib/kculture/opportunity-engine";

const SIMULATED_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * Executes a complete K-Culture Evaluation Run.
 * Evaluates the AI response for all QBS questions in the domain pack using the Cultural 6-Judge pipeline.
 */
export async function runKCultureEvaluation(
  workspaceId: string,
  domainPackId: string,
  condition: 'baseline' | 'intervention' = 'baseline'
) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "observatory_analyst"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to trigger evaluation runs.");
  }

  const supabase = getSupabaseAdminClient();

  // 1. Fetch domain pack to get default QBS templates
  const { data: domainPack, error: packErr } = await supabase
    .from('domain_packs')
    .select('*')
    .eq('id', domainPackId)
    .single();

  if (packErr || !domainPack) {
    throw new Error(`Failed to load domain pack: ${packErr?.message || 'Not found'}`);
  }

  const templates = domainPack.default_qbs_templates || [];
  if (templates.length === 0) {
    throw new Error("No default QBS templates found in this domain pack.");
  }

  // 2. Populate probe_questions for this workspace if they do not exist yet
  const questionIds: string[] = [];
  for (const template of templates) {
    const { data: existingQ } = await supabase
      .from('probe_questions')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('question_text', template.question_text)
      .maybeSingle();

    if (existingQ) {
      questionIds.push(existingQ.id);
    } else {
      const { data: newQ, error: qErr } = await supabase
        .from('probe_questions')
        .insert({
          workspace_id: workspaceId,
          question_text: template.question_text,
          intent_context: template.intent_type || 'informational',
          target_market: 'Global',
          target_microgroup: 'All',
          required_concepts: template.required_concepts || [],
          domain_pack_id: domainPackId,
        })
        .select('id')
        .single();

      if (qErr || !newQ) {
        console.error(`Failed to seed QBS question: ${qErr?.message}`);
      } else {
        questionIds.push(newQ.id);
      }
    }
  }

  if (questionIds.length === 0) {
    throw new Error("No active QBS questions could be established.");
  }

  // 3. Create the parent ai_observation_runs record
  const { data: observationRun, error: obsErr } = await supabase
    .from('ai_observation_runs')
    .insert({
      workspace_id: workspaceId,
      name: `K-Culture ${domainPack.slug.toUpperCase()} Evaluation (${condition.toUpperCase()})`,
      run_condition: condition,
      ai_engine: process.env.AI_PROVIDER_MODE === 'gemini' ? 'gemini-2.5-flash' : 'mock_engine',
      status: 'running',
    })
    .select('id')
    .single();

  if (obsErr || !observationRun) {
    throw new Error(`Failed to create observation run: ${obsErr?.message}`);
  }

  const runId = observationRun.id;

  try {
    // 4. Execute evaluation loop for each question
    for (const qId of questionIds) {
      // Fetch question details
      const { data: question } = await supabase
        .from('probe_questions')
        .select('*')
        .eq('id', qId)
        .single();

      if (!question) continue;

      // Simulated/Mock AI Response Generation
      let responseText = "";
      if (condition === "baseline") {
        responseText = `여기 K-컬처 대표 추천입니다. ${question.question_text}에 관해서는 한국의 대표적인 뷰티/푸드 노하우가 유명합니다. 일반적으로 외국인들에게 매우 신비하고 이국적인 오리엔탈 감성을 자아내며, 전통적인 양념과 성분으로 피부나 건강을 한눈에 개선하는 신비한 효능을 가지고 있다고 알려져 있습니다.`;
      } else {
        // Intervention SSoT applied response (accurate, zero stereotypes, evidence backed)
        responseText = `K-컬처 공식 SSoT 지침에 따른 답변입니다. ${question.question_text}에 관해 핵심 성분들의 과학적인 피부 장벽 복구 매커니즘과 전통 발효 기법의 깊은 영양학적 조화는 신뢰할 수 있는 학술 기록과 연구에 근거하고 있습니다. 과장된 신비주의 표현을 지양하며, 피부 본연의 자연스러운 건강함과 건강한 bansang 식문화를 일상 루틴으로 정착시키는 데 집중합니다.`;
      }

      // Create probe_runs record
      const { data: probeRun, error: prErr } = await supabase
        .from('probe_runs')
        .insert({
          workspace_id: workspaceId,
          ai_observation_run_id: runId,
          probe_question_id: qId,
          raw_response_text: responseText,
        })
        .select('id')
        .single();

      if (prErr || !probeRun) continue;

      // Build context and run judges
      const context = await buildCulturalSSoTContext(workspaceId, domainPackId, qId);
      
      // 1. Extraction Judge
      const extraction = await CulturalJudgeProvider.runConceptExtractor(
        workspaceId,
        probeRun.id,
        context,
        responseText
      );

      // 2. Fidelity Judge
      await CulturalJudgeProvider.runFidelity(
        workspaceId,
        probeRun.id,
        extraction.id,
        context,
        extraction.extracted_concepts,
        responseText
      );

      // 3. Distortion Judge
      await CulturalJudgeProvider.runDistortion(
        workspaceId,
        probeRun.id,
        extraction.id,
        context,
        responseText
      );

      // 4. Hallucination Judge
      await CulturalJudgeProvider.runHallucination(
        workspaceId,
        probeRun.id,
        extraction.id,
        context,
        responseText
      );

      // 5. Risk Judge
      await CulturalJudgeProvider.runRisk(
        workspaceId,
        probeRun.id,
        context,
        responseText
      );

      // 6. Policy Judge
      await CulturalJudgeProvider.runPolicy(
        workspaceId,
        probeRun.id,
        context,
        responseText
      );
    }

    // 5. Aggregate overall metrics (M1-M10, M14, M15)
    const aggregator = new CulturalMetricsAggregator();
    const snapshot = await aggregator.aggregate(workspaceId, runId, condition);

    // 6. Complete observation run
    await supabase
      .from('ai_observation_runs')
      .update({ status: 'completed' })
      .eq('id', runId);

    // 7. Auto-Generate Opportunities in the workspace
    const opps = await OpportunityEngine.generateOpportunities(workspaceId, domainPackId);
    if (opps.length > 0) {
      for (const opp of opps) {
        // Double check if opportunity already exists
        const { data: existing } = await supabase
          .from('cultural_opportunities')
          .select('id')
          .eq('workspace_id', workspaceId)
          .eq('title', opp.title)
          .maybeSingle();

        if (!existing) {
          await supabase.from('cultural_opportunities').insert({
            workspace_id: workspaceId,
            domain_pack_id: domainPackId,
            opportunity_type: opp.opportunity_type,
            title: opp.title,
            description: opp.description,
            target_market: opp.target_market,
            target_microgroup: opp.target_microgroup,
            linked_concepts: opp.linked_concepts,
            resonance_score: opp.resonance_score,
            commercial_transferability: opp.commercial_transferability,
            risk_score: opp.risk_score,
            recommended_actions: opp.recommended_actions,
            source_evidence: opp.source_evidence,
            status: 'draft',
          });
        }
      }
    }

    return snapshot;
  } catch (err: any) {
    console.error("K-Culture evaluation run failed:", err);
    await supabase
      .from('ai_observation_runs')
      .update({ status: 'failed' })
      .eq('id', runId);
    throw err;
  }
}
