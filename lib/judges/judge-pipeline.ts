import { getSupabaseAdminClient } from '../supabase';
import { buildBrandSSoTContext, buildQBSItemContext } from './ssot-context-builder';
import { ConceptExtractorJudge } from './concept-extractor-judge';
import { FidelityJudge } from './fidelity-judge';
import { DistortionJudge } from './distortion-judge';
import { HallucinationJudge } from './hallucination-judge';
import { RiskJudge } from './risk-judge';
import { PolicyJudge } from './policy-judge';
import { JudgePipelineResult } from './types';

export class JudgePipeline {
  private extractor = new ConceptExtractorJudge();
  private fidelityJudge = new FidelityJudge();
  private distortionJudge = new DistortionJudge();
  private hallucinationJudge = new HallucinationJudge();
  private riskJudge = new RiskJudge();
  private policyJudge = new PolicyJudge();

  /**
   * Run the full 6-Judge Pipeline for a single probe run.
   */
  public async runForProbeRun(
    workspaceId: string,
    probeRunId: string
  ): Promise<JudgePipelineResult> {
    const supabase = getSupabaseAdminClient();
    const errors: string[] = [];

    const result: JudgePipelineResult = {
      errors,
    };

    try {
      // 1. Fetch probe run details
      const { data: run, error: runErr } = await supabase
        .from('probe_runs')
        .select('*')
        .eq('id', probeRunId)
        .single();

      if (runErr || !run) {
        throw new Error(`Failed to fetch probe run ${probeRunId}: ${runErr?.message || 'Not found'}`);
      }

      const responseText = run.raw_response_text;
      const probeQuestionId = run.probe_question_id;

      // 2. Build Brand SSoT and QBS context adapters
      const brandSsot = await buildBrandSSoTContext(workspaceId);
      const qbsContext = await buildQBSItemContext(probeQuestionId);

      // 3. Step 1: Concept Extractor Judge (Produces upstream concepts)
      let extractionRes;
      try {
        extractionRes = await this.extractor.evaluate(
          workspaceId,
          probeRunId,
          brandSsot,
          qbsContext,
          responseText
        );
        result.concept_extraction = extractionRes;
      } catch (err: any) {
        errors.push(`ConceptExtractor failed: ${err.message}`);
        return result; // Stop early because downstream judges depend on extracted concepts
      }

      // 4. Step 2: Fidelity Judge
      try {
        const fidelityRes = await this.fidelityJudge.evaluate(
          workspaceId,
          probeRunId,
          extractionRes.id,
          brandSsot,
          qbsContext,
          extractionRes.extracted_concepts,
          responseText
        );
        result.fidelity = fidelityRes;
      } catch (err: any) {
        errors.push(`FidelityJudge failed: ${err.message}`);
      }

      // 5. Step 3: Distortion Judge
      try {
        const distortionRes = await this.distortionJudge.evaluate(
          workspaceId,
          probeRunId,
          extractionRes.id,
          brandSsot,
          qbsContext,
          extractionRes.extracted_concepts,
          responseText
        );
        result.distortion = distortionRes;
      } catch (err: any) {
        errors.push(`DistortionJudge failed: ${err.message}`);
      }

      // 6. Step 4: Hallucination Judge
      try {
        const hallucinationRes = await this.hallucinationJudge.evaluate(
          workspaceId,
          probeRunId,
          extractionRes.id,
          brandSsot,
          qbsContext,
          extractionRes.extracted_concepts,
          responseText
        );
        result.hallucination = hallucinationRes;
      } catch (err: any) {
        errors.push(`HallucinationJudge failed: ${err.message}`);
      }

      // 7. Step 5: Risk Judge
      try {
        const riskRes = await this.riskJudge.evaluate(
          workspaceId,
          probeRunId,
          brandSsot,
          qbsContext,
          responseText
        );
        result.risk = riskRes;
      } catch (err: any) {
        errors.push(`RiskJudge failed: ${err.message}`);
      }

      // 8. Step 6: Policy Judge
      try {
        const policyRes = await this.policyJudge.evaluate(
          workspaceId,
          probeRunId,
          brandSsot,
          qbsContext,
          responseText
        );
        result.policy = policyRes;
      } catch (err: any) {
        errors.push(`PolicyJudge failed: ${err.message}`);
      }

    } catch (err: any) {
      errors.push(`Pipeline execution fatal error: ${err.message}`);
    }

    return result;
  }

  /**
   * Run the full Judge Pipeline for all probe runs under an observation run.
   */
  public async runForObservationRun(
    workspaceId: string,
    observationRunId: string,
    onProgress?: (completed: number, total: number) => void
  ): Promise<void> {
    const supabase = getSupabaseAdminClient();

    // Fetch all probe runs in this observation run
    const { data: runs, error } = await supabase
      .from('probe_runs')
      .select('id')
      .eq('ai_observation_run_id', observationRunId);

    if (error || !runs) {
      throw new Error(`Failed to fetch probe runs in observation run ${observationRunId}: ${error?.message}`);
    }

    const total = runs.length;
    let completed = 0;

    for (const run of runs) {
      await this.runForProbeRun(workspaceId, run.id);
      completed++;
      if (onProgress) {
        onProgress(completed, total);
      }
    }
  }
}
