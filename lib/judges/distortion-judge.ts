import { getAIProvider } from '../ai/ai-provider';
import { getSupabaseAdminClient } from '../supabase';
import { BrandSSoTContext, DistortionJudgment, ExtractedConcept, QBSItemContext } from './types';
import { MockJudgeProvider } from './mock-judge-provider';

export class DistortionJudge {
  /**
   * Evaluate concept distortions in the AI response.
   */
  public async evaluate(
    workspaceId: string,
    probeRunId: string,
    conceptExtractionId: string,
    brandSsot: BrandSSoTContext,
    qbsContext: QBSItemContext,
    extractedConcepts: ExtractedConcept[],
    responseText: string
  ): Promise<DistortionJudgment & { id: string; severity_weighted_rate: number }> {
    const supabase = getSupabaseAdminClient();
    const mode = process.env.AI_PROVIDER_MODE || 'mock';

    let result: DistortionJudgment;
    let rawOutput = '';

    // Extract concept definitions
    const definitions = brandSsot.core_concepts.map((c) => ({
      concept_id: c.concept_id,
      label: c.label,
      definition: c.definition,
    }));

    const prompt = `Detect concept distortions in the AI response.
A distortion means the concept IS mentioned but INCORRECTLY represented or exaggerated.

Distortion types:
- category_distortion: Brand is misclassified into wrong category
- function_distortion: Feature/service is reduced or exaggerated
- claim_distortion: Unsupported performance claim
- policy_distortion: Wrong CTA or action recommendation
- boundary_distortion: Forbidden/unsafe claim without conditions

[Canonical Concept Definitions]
${JSON.stringify(definitions, null, 2)}

[Boundary and Forbidden Conditions]
${JSON.stringify(brandSsot.forbidden_concepts, null, 2)}

[AI Response]
${responseText}

Return JSON matching this schema:
{
  "distortions": [{
    "concept_id": "string",
    "distortion_type": "category_distortion" | "function_distortion" | "claim_distortion" | "policy_distortion" | "boundary_distortion",
    "severity": 1-5,
    "response_expression": "string",
    "correct_definition": "string",
    "reason": "string"
  }],
  "concept_distortion_rate": number
}`;

    if (mode === 'gemini' || mode === 'openai') {
      try {
        const ai = getAIProvider();
        const schema = {
          type: 'OBJECT',
          properties: {
            distortions: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  concept_id: { type: 'STRING' },
                  distortion_type: { type: 'STRING' },
                  severity: { type: 'INTEGER' },
                  response_expression: { type: 'STRING' },
                  correct_definition: { type: 'STRING' },
                  reason: { type: 'STRING' },
                },
                required: ['concept_id', 'distortion_type', 'severity', 'response_expression', 'correct_definition', 'reason'],
              },
            },
            concept_distortion_rate: { type: 'NUMBER' },
          },
          required: ['distortions', 'concept_distortion_rate'],
        };

        result = await ai.generateStructuredOutput<DistortionJudgment>(prompt, schema, {
          temperature: 0.0,
          maxOutputTokens: 2048,
        });
        rawOutput = JSON.stringify(result);
      } catch (err: any) {
        console.error(`DistortionJudge live run failed, falling back to mock: ${err.message}`);
        result = MockJudgeProvider.getDistortionMock(prompt);
        rawOutput = `[FALLBACK] ${JSON.stringify(result)}`;
      }
    } else {
      result = MockJudgeProvider.getDistortionMock(prompt);
      rawOutput = JSON.stringify(result);
    }

    // Mathematical verification/calculation of distortion rates
    const presentConceptsCount = extractedConcepts.filter((c) => c.present).length || 1;
    const distortionRate = result.distortions.length / presentConceptsCount;

    // Severity weighted calculation
    const totalSeverity = result.distortions.reduce((acc, curr) => acc + curr.severity, 0);
    const severityWeightedRate = totalSeverity / (presentConceptsCount * 5);

    result.concept_distortion_rate = parseFloat(Math.min(1.0, distortionRate).toFixed(4));
    const finalSeverityWeightedRate = parseFloat(Math.min(1.0, severityWeightedRate).toFixed(4));

    // Insert into DB
    const { data, error } = await supabase
      .from('distortion_judgments')
      .insert({
        workspace_id: workspaceId,
        probe_run_id: probeRunId,
        concept_extraction_id: conceptExtractionId,
        distortions: result.distortions,
        concept_distortion_rate: result.concept_distortion_rate,
        severity_weighted_rate: finalSeverityWeightedRate,
        raw_judge_output: rawOutput,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save DistortionJudge result: ${error.message}`);
    }

    return {
      ...result,
      id: data.id,
      severity_weighted_rate: finalSeverityWeightedRate,
    };
  }
}
