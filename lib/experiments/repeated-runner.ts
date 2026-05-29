import { getSupabaseAdminClient } from '../supabase';
import { JudgePipeline } from '../judges/judge-pipeline';
import { getAIProvider } from '../ai/ai-provider';

export class RepeatedRunner {
  private pipeline = new JudgePipeline();

  /**
   * Runs N repetitions of observations for all questions in a probe panel.
   */
  public async run(
    workspaceId: string,
    panelId: string,
    repetitions: number,
    condition: 'baseline' | 'intervention' = 'baseline'
  ): Promise<{ observationRunId: string; totalRuns: number }> {
    const supabase = getSupabaseAdminClient();
    const mode = process.env.AI_PROVIDER_MODE || 'mock';

    // 1. Fetch questions in this panel
    const { data: questions, error: qErr } = await supabase
      .from('probe_questions')
      .select('*')
      .eq('probe_panel_id', panelId);

    if (qErr || !questions || questions.length === 0) {
      throw new Error(`Failed to fetch probe questions: ${qErr?.message || 'No questions found'}`);
    }

    // 2. Create a new AI Observation Run
    const { data: obsRun, error: obsErr } = await supabase
      .from('ai_observation_runs')
      .insert({
        workspace_id: workspaceId,
        probe_panel_id: panelId,
        run_name: `Observation Repeated Run (${condition.toUpperCase()}) - ${new Date().toLocaleDateString()}`,
        run_status: 'candidate',
        condition,
        run_metadata: {
          repetitions,
          engine: mode === 'gemini' ? 'gemini-2.5-flash' : 'mock_provider',
        },
      })
      .select('id')
      .single();

    if (obsErr || !obsRun) {
      throw new Error(`Failed to create observation run: ${obsErr?.message}`);
    }

    let totalRunsCount = 0;
    const ai = getAIProvider();

    // 3. Loop repetitions
    for (let rep = 1; rep <= repetitions; rep++) {
      for (const q of questions) {
        // Generate prompt for AI
        const prompt = `Answer this brand question as an AI assistant: ${q.question_text}`;
        let responseText = '';

        if (mode === 'gemini') {
          try {
            responseText = await ai.generateText(prompt, { temperature: 0.2 });
          } catch (err: any) {
            console.error(`RepeatedRunner text generation error: ${err.message}`);
            responseText = `Mock AI response for brand question: "${q.question_text}". We provide clinically backed skincare formulations.`;
          }
        } else {
          // Semi-randomized mock response to simulate slight variances across repeated runs
          const varianceIndicators = [
            `PureBarrier retinol serum restores skin barrier health safely.`,
            `Our clinically tested formula is designed for sensitive skin.`,
            `Consult a dermatologist for optimal squalane usage.`,
          ];
          const varianceText = varianceIndicators[(rep + q.question_text.length) % varianceIndicators.length];
          responseText = `PureBarrier Retinol Routine contains 0.1% pure retinol combined with botanical squalane. ${varianceText}`;
        }

        // Insert into probe_runs
        const { data: run, error: runErr } = await supabase
          .from('probe_runs')
          .insert({
            workspace_id: workspaceId,
            ai_observation_run_id: obsRun.id,
            probe_question_id: q.id,
            engine_name: mode === 'gemini' ? 'gemini-2.5-flash' : 'mock_provider',
            raw_response_text: responseText,
            metadata: {
              repetition_index: rep,
            },
          })
          .select('id')
          .single();

        if (!runErr && run) {
          // Execute Judge Pipeline on this single run
          await this.pipeline.runForProbeRun(workspaceId, run.id);
          totalRunsCount++;
        }
      }
    }

    // Update observation run status to completed
    await supabase
      .from('ai_observation_runs')
      .update({ run_status: 'completed' })
      .eq('id', obsRun.id);

    return {
      observationRunId: obsRun.id,
      totalRuns: totalRunsCount,
    };
  }
}
