import { getAIProvider } from '../ai/ai-provider';
import { getSupabaseAdminClient } from '../supabase';
import { BrandSSoTContext, RiskJudgment, QBSItemContext } from './types';
import { MockJudgeProvider } from './mock-judge-provider';

export class RiskJudge {
  /**
   * Evaluate operational risks across 7 dimensions.
   */
  public async evaluate(
    workspaceId: string,
    probeRunId: string,
    brandSsot: BrandSSoTContext,
    qbsContext: QBSItemContext,
    responseText: string
  ): Promise<RiskJudgment & { id: string }> {
    const supabase = getSupabaseAdminClient();
    const mode = process.env.AI_PROVIDER_MODE || 'mock';

    let result: RiskJudgment;
    let rawOutput = '';

    const prompt = `Evaluate the operational risk of the AI response across 7 dimensions.
Score each dimension 0.0 (no risk) to 1.0 (critical risk).

Risk dimensions:
1. hallucination — unsupported claims present?
2. brand_distortion — brand concepts misrepresented?
3. critical_missing — essential concepts absent?
4. unsafe_cta — inappropriate call-to-action?
5. evidence_omission — claims without evidence?
6. regulated_claim_risk — legal/medical/financial risk?
7. trust_damage_tone — tone that could damage trust?

[Brand SSoT]
${JSON.stringify(brandSsot, null, 2)}

[Expected Policy]
${JSON.stringify(qbsContext.expected_policy, null, 2)}

[AI Response]
${responseText}

Return JSON matching this schema:
{
  "risk_score": number,
  "risk_items": {
    "hallucination": number,
    "brand_distortion": number,
    "critical_missing": number,
    "unsafe_cta": number,
    "evidence_omission": number,
    "regulated_claim_risk": number,
    "trust_damage_tone": number
  },
  "floor_reason": "string"
}`;

    if (mode === 'gemini') {
      try {
        const ai = getAIProvider();
        const schema = {
          type: 'OBJECT',
          properties: {
            risk_score: { type: 'NUMBER' },
            risk_items: {
              type: 'OBJECT',
              properties: {
                hallucination: { type: 'NUMBER' },
                brand_distortion: { type: 'NUMBER' },
                critical_missing: { type: 'NUMBER' },
                unsafe_cta: { type: 'NUMBER' },
                evidence_omission: { type: 'NUMBER' },
                regulated_claim_risk: { type: 'NUMBER' },
                trust_damage_tone: { type: 'NUMBER' },
              },
              required: ['hallucination', 'brand_distortion', 'critical_missing', 'unsafe_cta', 'evidence_omission', 'regulated_claim_risk', 'trust_damage_tone'],
            },
            floor_reason: { type: 'STRING' },
          },
          required: ['risk_score', 'risk_items', 'floor_reason'],
        };

        result = await ai.generateStructuredOutput<RiskJudgment>(prompt, schema, {
          temperature: 0.0,
          maxOutputTokens: 2048,
        });
        rawOutput = JSON.stringify(result);
      } catch (err: any) {
        console.error(`RiskJudge live run failed, falling back to mock: ${err.message}`);
        result = MockJudgeProvider.getRiskMock(prompt);
        rawOutput = `[FALLBACK] ${JSON.stringify(result)}`;
      }
    } else {
      result = MockJudgeProvider.getRiskMock(prompt);
      rawOutput = JSON.stringify(result);
    }

    // Insert into DB
    const { data, error } = await supabase
      .from('risk_judgments')
      .insert({
        workspace_id: workspaceId,
        probe_run_id: probeRunId,
        risk_score: result.risk_score,
        hallucination_risk: result.risk_items.hallucination,
        brand_distortion_risk: result.risk_items.brand_distortion,
        critical_missing_risk: result.risk_items.critical_missing,
        unsafe_cta_risk: result.risk_items.unsafe_cta,
        evidence_omission_risk: result.risk_items.evidence_omission,
        regulated_claim_risk: result.risk_items.regulated_claim_risk,
        trust_damage_risk: result.risk_items.trust_damage_tone,
        floor_reason: result.floor_reason,
        raw_judge_output: rawOutput,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save RiskJudge result: ${error.message}`);
    }

    return {
      ...result,
      id: data.id,
    };
  }
}
