import { getAIProvider } from '../ai/ai-provider';
import { getSupabaseAdminClient } from '../supabase';
import { BrandSSoTContext, ExtractedConcept, FidelityJudgment, QBSItemContext } from './types';
import { MockJudgeProvider } from './mock-judge-provider';

export class FidelityJudge {
  /**
   * Evaluate the brand concept fidelity for an AI response.
   */
  public async evaluate(
    workspaceId: string,
    probeRunId: string,
    conceptExtractionId: string,
    brandSsot: BrandSSoTContext,
    qbsContext: QBSItemContext,
    extractedConcepts: ExtractedConcept[],
    responseText: string
  ): Promise<FidelityJudgment & { id: string; grade: string }> {
    const supabase = getSupabaseAdminClient();
    const mode = process.env.AI_PROVIDER_MODE || 'mock';

    let result: FidelityJudgment;
    let rawOutput = '';

    const prompt = `Evaluate how faithfully the AI response reconstructs the Brand SSoT.

Evaluation dimensions (score each 0.0 to 1.0):
1. Core concept transfer — Are required concepts accurately present?
2. Relation accuracy — Are concept relationships preserved?
3. Differentiation preservation — Are brand differentiators maintained?
4. Evidence binding — Are claims backed by official evidence?
5. Forbidden concept suppression — Are forbidden concepts absent?
6. Policy alignment — Does the response follow expected policies?

[Brand SSoT]
${JSON.stringify(brandSsot, null, 2)}

[Question]
${qbsContext.query_text}

[Extracted Concepts]
${JSON.stringify(extractedConcepts, null, 2)}

[AI Response]
${responseText}

Return JSON matching this schema:
{
  "brand_concept_fidelity": number,
  "subscores": {
    "concept_transfer": number,
    "relation_accuracy": number,
    "differentiation_preservation": number,
    "evidence_binding": number,
    "forbidden_suppression": number,
    "policy_alignment": number
  },
  "main_issue": "string"
}`;

    if (mode === 'gemini' || mode === 'openai') {
      try {
        const ai = getAIProvider();
        const schema = {
          type: 'OBJECT',
          properties: {
            brand_concept_fidelity: { type: 'NUMBER' },
            subscores: {
              type: 'OBJECT',
              properties: {
                concept_transfer: { type: 'NUMBER' },
                relation_accuracy: { type: 'NUMBER' },
                differentiation_preservation: { type: 'NUMBER' },
                evidence_binding: { type: 'NUMBER' },
                forbidden_suppression: { type: 'NUMBER' },
                policy_alignment: { type: 'NUMBER' },
              },
              required: ['concept_transfer', 'relation_accuracy', 'differentiation_preservation', 'evidence_binding', 'forbidden_suppression', 'policy_alignment'],
            },
            main_issue: { type: 'STRING' },
          },
          required: ['brand_concept_fidelity', 'subscores', 'main_issue'],
        };

        result = await ai.generateStructuredOutput<FidelityJudgment>(prompt, schema, {
          temperature: 0.0,
          maxOutputTokens: 2048,
        });
        rawOutput = JSON.stringify(result);
      } catch (err: any) {
        console.error(`FidelityJudge live run failed, falling back to mock: ${err.message}`);
        result = MockJudgeProvider.getFidelityMock(prompt);
        rawOutput = `[FALLBACK] ${JSON.stringify(result)}`;
      }
    } else {
      result = MockJudgeProvider.getFidelityMock(prompt);
      rawOutput = JSON.stringify(result);
    }

    // Mathematical verification / re-calculation of BCF to ensure strict scoring consistency
    const bcf =
      0.30 * result.subscores.concept_transfer +
      0.20 * result.subscores.relation_accuracy +
      0.15 * result.subscores.differentiation_preservation +
      0.15 * result.subscores.evidence_binding +
      0.10 * result.subscores.forbidden_suppression +
      0.10 * result.subscores.policy_alignment;

    // Apply corrected value
    result.brand_concept_fidelity = parseFloat(bcf.toFixed(4));

    // Map to Grade
    let grade: 'A' | 'B' | 'C' | 'D' | 'F' = 'F';
    const score = result.brand_concept_fidelity;
    if (score >= 0.85) grade = 'A';
    else if (score >= 0.70) grade = 'B';
    else if (score >= 0.55) grade = 'C';
    else if (score >= 0.40) grade = 'D';

    // Insert into DB
    const { data, error } = await supabase
      .from('fidelity_judgments')
      .insert({
        workspace_id: workspaceId,
        probe_run_id: probeRunId,
        concept_extraction_id: conceptExtractionId,
        brand_concept_fidelity: result.brand_concept_fidelity,
        concept_transfer: result.subscores.concept_transfer,
        relation_accuracy: result.subscores.relation_accuracy,
        differentiation_preservation: result.subscores.differentiation_preservation,
        evidence_binding: result.subscores.evidence_binding,
        forbidden_suppression: result.subscores.forbidden_suppression,
        policy_alignment: result.subscores.policy_alignment,
        main_issue: result.main_issue,
        grade,
        raw_judge_output: rawOutput,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save FidelityJudge result: ${error.message}`);
    }

    return {
      ...result,
      id: data.id,
      grade,
    };
  }
}
