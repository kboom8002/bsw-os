import { getSupabaseAdminClient } from '../../../lib/supabase';
import { judgeOutputSchema, JudgeOutput } from './schema';
import { MockProvider } from '../providers/mock-provider';
import { OpenAIResponsesProvider } from '../providers/openai-responses-provider';
import { GeminiProvider } from '../providers/gemini-provider';
import { EvalTraceContext } from '../providers/types';

export async function judgeProbeRunWithLLM(
  workspaceId: string,
  probeRunId: string,
  providerType: 'mock' | 'openai' | 'gemini' = 'mock'
): Promise<JudgeOutput> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch probe run and corresponding question text
  const { data: run, error: runErr } = await supabase
    .from('probe_runs')
    .select(`
      id,
      raw_response_text,
      probe_question_id,
      probe_questions (
        id,
        question_text,
        target_keyword
      )
    `)
    .eq('id', probeRunId)
    .single();

  if (runErr || !run) {
    throw new Error(`ProbeRun not found: ${runErr?.message || 'Unknown'}`);
  }

  const rawResponseText = run.raw_response_text;
  const questionText = (run.probe_questions as any)?.question_text || '';
  const questionId = (run.probe_questions as any)?.id || '';

  // 2. Fetch Expected Layer constraints if they exist
  const { data: exLayer } = await supabase
    .from('expected_layers')
    .select('*')
    .eq('probe_question_id', questionId)
    .maybeSingle();

  const mustInclude = exLayer?.must_include || [];
  const shouldInclude = exLayer?.should_include || [];
  const mustNotDo = exLayer?.must_not_do || [];

  // Formulate expected layer string representation
  const expectedLayerString = JSON.stringify({
    must_include: mustInclude,
    should_include: shouldInclude,
    must_not_do: mustNotDo
  });

  const traceContext: EvalTraceContext = {
    runId: probeRunId,
    workspaceId,
    probeQuestionId: questionId,
    lane: 'official',
    mode: 'cb_strict'
  };

  let judgeResult: JudgeOutput;

  // 3. Dispatch to appropriate provider
  if (providerType === 'openai' && process.env.OPENAI_API_KEY) {
    const openaiProvider = new OpenAIResponsesProvider();
    const res = await openaiProvider.evaluateRunnerOutput(
      "AEO structured response quality judge rubric",
      expectedLayerString,
      rawResponseText,
      traceContext
    );
    judgeResult = res.normalized;
  } else if (providerType === 'gemini' && process.env.GOOGLE_AI_API_KEY) {
    const geminiProvider = new GeminiProvider();
    const res = await geminiProvider.evaluateRunnerOutput(
      "AEO structured response quality judge rubric",
      expectedLayerString,
      rawResponseText,
      traceContext
    );
    judgeResult = res.normalized;
  } else {
    // Fall back to Mock Provider
    const mock = new MockProvider();
    const res = await mock.evaluateRunnerOutput(
      "AEO structured response quality judge rubric",
      expectedLayerString,
      rawResponseText,
      traceContext
    );
    judgeResult = res.normalized;
  }

  // 4. Validate output schema using Zod
  const validated = judgeOutputSchema.parse(judgeResult);

  // 5. Check if judgment already exists, then upsert
  const { data: existing } = await supabase
    .from('response_judgments')
    .select('id')
    .eq('probe_run_id', probeRunId)
    .maybeSingle();

  const judgmentPayload = {
    workspace_id: workspaceId,
    probe_run_id: probeRunId,
    is_citation_found: validated.official_citation,
    brand_semantic_fidelity_score: validated.concept_transfer_score * 100 - (validated.concept_distortion_score * 50),
    question_territory_covered: validated.centeredness_score > 0.5,
    geo_concept_transferred: validated.concept_transfer_score > 0.5,
    reviewer_notes: validated.reasoning_summary,
    review_status: 'candidate'
  };

  // brand_semantic_fidelity_score must be bounded between 0 and 100
  judgmentPayload.brand_semantic_fidelity_score = Math.max(0, Math.min(100, judgmentPayload.brand_semantic_fidelity_score));

  if (existing) {
    await supabase
      .from('response_judgments')
      .update(judgmentPayload)
      .eq('id', existing.id);
  } else {
    await supabase
      .from('response_judgments')
      .insert(judgmentPayload);
  }

  return validated;
}
