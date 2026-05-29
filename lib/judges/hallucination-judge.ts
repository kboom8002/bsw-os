import { getAIProvider } from '../ai/ai-provider';
import { getSupabaseAdminClient } from '../supabase';
import { BrandSSoTContext, HallucinationJudgment, ExtractedConcept, QBSItemContext } from './types';
import { MockJudgeProvider } from './mock-judge-provider';

export class HallucinationJudge {
  /**
   * Evaluate hallucinations in the AI response.
   */
  public async evaluate(
    workspaceId: string,
    probeRunId: string,
    conceptExtractionId: string,
    brandSsot: BrandSSoTContext,
    qbsContext: QBSItemContext,
    extractedConcepts: ExtractedConcept[],
    responseText: string
  ): Promise<HallucinationJudgment & { id: string; critical_count: number }> {
    const supabase = getSupabaseAdminClient();
    const mode = process.env.AI_PROVIDER_MODE || 'mock';

    let result: HallucinationJudgment;
    let rawOutput = '';

    // Determine if YMQL Industry boost applies
    const { data: ws } = await supabase
      .from('workspaces')
      .select('slug')
      .eq('id', workspaceId)
      .single();

    const slugLower = (ws?.slug || '').toLowerCase();
    const isYmqlIndustry =
      slugLower.includes('clinic') ||
      slugLower.includes('legal') ||
      slugLower.includes('finance') ||
      slugLower.includes('insurance') ||
      slugLower.includes('medical') ||
      slugLower.includes('hospital');

    // Extract allowed claims
    const allowedClaims = brandSsot.core_concepts.map((c) => ({
      concept: c.label,
      definition: c.definition,
      evidence: c.evidence_sources,
    }));

    const prompt = `Break the AI response into individual claims and concepts.
Classify each as supported, inferred, or unsupported based on the allowed claims and evidence.

[Allowed Concepts]
${JSON.stringify(brandSsot.core_concepts.map((c) => c.label), null, 2)}

[Allowed Claims and Evidence Sources]
${JSON.stringify(allowedClaims, null, 2)}

[AI Response]
${responseText}

Return JSON matching this schema:
{
  "claims": [{
    "claim": "string",
    "support_status": "supported" | "inferred" | "unsupported",
    "hallucination_type": "unsupported_claim" | "unsupported_service" | "unsupported_comparison" | "unsupported_policy" | "unsupported_safety_claim" | null,
    "severity": 1-5,
    "reason": "string"
  }],
  "hallucinated_concept_rate": number
}`;

    if (mode === 'gemini') {
      try {
        const ai = getAIProvider();
        const schema = {
          type: 'OBJECT',
          properties: {
            claims: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  claim: { type: 'STRING' },
                  support_status: { type: 'STRING' },
                  hallucination_type: { type: 'STRING', nullable: true },
                  severity: { type: 'INTEGER' },
                  reason: { type: 'STRING' },
                },
                required: ['claim', 'support_status', 'severity', 'reason'],
              },
            },
            hallucinated_concept_rate: { type: 'NUMBER' },
          },
          required: ['claims', 'hallucinated_concept_rate'],
        };

        result = await ai.generateStructuredOutput<HallucinationJudgment>(prompt, schema, {
          temperature: 0.0,
          maxOutputTokens: 2048,
        });
        rawOutput = JSON.stringify(result);
      } catch (err: any) {
        console.error(`HallucinationJudge live run failed, falling back to mock: ${err.message}`);
        result = MockJudgeProvider.getHallucinationMock(prompt);
        rawOutput = `[FALLBACK] ${JSON.stringify(result)}`;
      }
    } else {
      result = MockJudgeProvider.getHallucinationMock(prompt);
      rawOutput = JSON.stringify(result);
    }

    // Apply YMQL Industry Boost to severity (+1 for unsafe claims in medical/finance/legal, capped at 5)
    if (isYmqlIndustry) {
      result.claims = result.claims.map((item) => {
        if (item.support_status !== 'supported') {
          return {
            ...item,
            severity: Math.min(5, item.severity + 1) as 1 | 2 | 3 | 4 | 5,
          };
        }
        return item;
      });
    }

    // Mathematical verification of hallucinated rate
    const totalClaimsCount = result.claims.length || 1;
    const unsupportedClaimsCount = result.claims.filter((c) => c.support_status === 'unsupported').length;
    result.hallucinated_concept_rate = parseFloat((unsupportedClaimsCount / totalClaimsCount).toFixed(4));

    // Calculate critical count (severity >= 4)
    const criticalCount = result.claims.filter((c) => c.severity >= 4).length;

    // Insert into DB
    const { data, error } = await supabase
      .from('hallucination_judgments')
      .insert({
        workspace_id: workspaceId,
        probe_run_id: probeRunId,
        concept_extraction_id: conceptExtractionId,
        claims: result.claims,
        hallucinated_concept_rate: result.hallucinated_concept_rate,
        critical_count: criticalCount,
        raw_judge_output: rawOutput,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save HallucinationJudge result: ${error.message}`);
    }

    return {
      ...result,
      id: data.id,
      critical_count: criticalCount,
    };
  }
}
