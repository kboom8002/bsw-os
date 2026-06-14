import { getAIProvider } from '../ai/ai-provider';
import { getSupabaseAdminClient } from '../supabase';
import { BrandSSoTContext, PolicyJudgment, QBSItemContext } from './types';
import { MockJudgeProvider } from './mock-judge-provider';

export class PolicyJudge {
  /**
   * Evaluate policy alignment (M10).
   */
  public async evaluate(
    workspaceId: string,
    probeRunId: string,
    brandSsot: BrandSSoTContext,
    qbsContext: QBSItemContext,
    responseText: string
  ): Promise<PolicyJudgment & { id: string }> {
    const supabase = getSupabaseAdminClient();
    const mode = process.env.AI_PROVIDER_MODE || 'mock';

    let result: PolicyJudgment;
    let rawOutput = '';

    const prompt = `Evaluate whether the AI response follows the expected policy.

[Expected Policy]
${JSON.stringify(brandSsot.policies, null, 2)}
${JSON.stringify(qbsContext.expected_policy, null, 2)}

[AI Response]
${responseText}

Return JSON matching this schema:
{
  "policy_alignment": number,
  "subscores": {
    "answer_policy": number,
    "cta_policy": number,
    "evidence_policy": number,
    "safety_policy": number,
    "brand_tone": number
  },
  "violations": [{
    "policy": "string",
    "severity": 1-5,
    "reason": "string"
  }]
}`;

    if (mode === 'gemini' || mode === 'openai') {
      try {
        const ai = getAIProvider();
        const schema = {
          type: 'OBJECT',
          properties: {
            policy_alignment: { type: 'NUMBER' },
            subscores: {
              type: 'OBJECT',
              properties: {
                answer_policy: { type: 'NUMBER' },
                cta_policy: { type: 'NUMBER' },
                evidence_policy: { type: 'NUMBER' },
                safety_policy: { type: 'NUMBER' },
                brand_tone: { type: 'NUMBER' },
              },
              required: ['answer_policy', 'cta_policy', 'evidence_policy', 'safety_policy', 'brand_tone'],
            },
            violations: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  policy: { type: 'STRING' },
                  severity: { type: 'INTEGER' },
                  reason: { type: 'STRING' },
                },
                required: ['policy', 'severity', 'reason'],
              },
            },
          },
          required: ['policy_alignment', 'subscores', 'violations'],
        };

        result = await ai.generateStructuredOutput<PolicyJudgment>(prompt, schema, {
          temperature: 0.0,
          maxOutputTokens: 2048,
        });
        rawOutput = JSON.stringify(result);
      } catch (err: any) {
        console.error(`PolicyJudge live run failed, falling back to mock: ${err.message}`);
        result = MockJudgeProvider.getPolicyMock(prompt);
        rawOutput = `[FALLBACK] ${JSON.stringify(result)}`;
      }
    } else {
      result = MockJudgeProvider.getPolicyMock(prompt);
      rawOutput = JSON.stringify(result);
    }

    // Insert into DB
    const { data, error } = await supabase
      .from('policy_judgments')
      .insert({
        workspace_id: workspaceId,
        probe_run_id: probeRunId,
        policy_alignment: result.policy_alignment,
        answer_policy: result.subscores.answer_policy,
        cta_policy: result.subscores.cta_policy,
        evidence_policy: result.subscores.evidence_policy,
        safety_policy: result.subscores.safety_policy,
        brand_tone: result.subscores.brand_tone,
        violations: result.violations,
        raw_judge_output: rawOutput,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save PolicyJudge result: ${error.message}`);
    }

    return {
      ...result,
      id: data.id,
    };
  }
}
