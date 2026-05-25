import * as fs from 'fs';
import * as path from 'path';
import { getSupabaseAdminClient } from '../../supabase';
import { RunnerAdapter, JudgeAdapter, EvalTraceContext } from '../providers/types';
import { judgeProbeRunWithLLM } from '../judgment/judge-response';

export interface EvalHarnessConfig {
  runner: RunnerAdapter;
  judge: JudgeAdapter;
}

export class EvalHarness {
  private runner: RunnerAdapter;
  private judge: JudgeAdapter;

  constructor(config: EvalHarnessConfig) {
    this.runner = config.runner;
    this.judge = config.judge;
  }

  async runEvaluation(
    workspaceId: string,
    probeQuestionId: string,
    promptPack: string,
    questionText: string,
    expectedLayer: string,
    lane: 'official' | 'manual_calibration' = 'official'
  ): Promise<any> {
    const runId = `run-${Date.now()}`;
    const traceContext: EvalTraceContext = {
      runId,
      workspaceId,
      probeQuestionId,
      lane,
      mode: 'cb_strict'
    };

    // 1. Execute Runner
    const runResult = await this.runner.executeStrictRun(promptPack, questionText, traceContext);

    // 2. Execute Judge
    const judgeResult = await this.judge.evaluateRunnerOutput(
      "AEO structured response quality judge rubric",
      expectedLayer,
      runResult.normalized.answerText || '',
      traceContext
    );

    const resultSummary = {
      traceContext,
      runnerOutput: runResult,
      judgeOutput: judgeResult,
      timestamp: new Date().toISOString()
    };

    // 3. Lane check separation
    if (lane === 'manual_calibration') {
      // Route exclusively to artifacts/manual/, NEVER DB!
      const dirPath = path.join(process.cwd(), 'artifacts', 'manual');
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }
      const filePath = path.join(dirPath, `calibration-${runId}.json`);
      fs.writeFileSync(filePath, JSON.stringify(resultSummary, null, 2), 'utf-8');
      return { lane: 'manual_calibration', filePath, result: resultSummary };
    } else {
      // Route to Supabase DB (official run lane)
      const supabase = getSupabaseAdminClient();

      // Insert mock/real probe_run and response_judgment
      const { data: pr, error: prErr } = await supabase
        .from('probe_runs')
        .insert({
          workspace_id: workspaceId,
          ai_observation_run_id: workspaceId, // soft ref for testing
          probe_question_id: probeQuestionId,
          engine_name: this.runner.providerName,
          raw_response_text: runResult.normalized.answerText || '',
          metadata: runResult.raw,
          source_provider: this.runner.providerName,
          citations: runResult.normalized.citations || [],
          grounding_metadata: runResult.raw,
          raw_serp_data: runResult.normalized.serpFeatures || {},
          crawler_latency_ms: runResult.raw.latencyMs || 0
        })
        .select()
        .single();

      if (prErr || !pr) {
        throw new Error(`Failed to save probe run: ${prErr?.message}`);
      }


      const validatedScore = judgeResult.normalized.concept_transfer_score * 100 - (judgeResult.normalized.concept_distortion_score * 50);
      const finalScore = Math.max(0, Math.min(100, validatedScore));

      const { data: judg, error: jErr } = await supabase
        .from('response_judgments')
        .insert({
          workspace_id: workspaceId,
          probe_run_id: pr.id,
          is_citation_found: judgeResult.normalized.official_citation,
          brand_semantic_fidelity_score: finalScore,
          question_territory_covered: judgeResult.normalized.centeredness_score > 0.5,
          geo_concept_transferred: judgeResult.normalized.concept_transfer_score > 0.5,
          reviewer_notes: judgeResult.normalized.reasoning_summary,
          review_status: 'candidate'
        })
        .select()
        .single();

      if (jErr) {
        throw new Error(`Failed to save response judgment: ${jErr.message}`);
      }

      return { lane: 'official', probeRunId: pr.id, judgmentId: judg.id, result: resultSummary };
    }
  }
}
