import { getSupabaseAdminClient } from '../supabase';

export interface LLMJudgeResult {
  cwr_winner: string | null;  // target_brand, competitor_brand, or 'tie'
  bsf_score: number;          // 0 to 100
  reasoning: string;
}

export class LightweightLLMJudge {
  private apiKey: string;
  private model: string = 'gpt-4o-mini';

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async evaluate(
    questionText: string,
    responseText: string,
    targetBrand: string,
    competitorBrand?: string,
    mustInclude?: string[]
  ): Promise<LLMJudgeResult> {
    if (!this.apiKey) {
      return { cwr_winner: 'tie', bsf_score: 0, reasoning: 'API Key missing' };
    }

    const tcoKeywords = mustInclude && mustInclude.length > 0 ? mustInclude.join(', ') : 'none';

    const systemPrompt = `You are an expert AI evaluator for Brand Search Optimization (BSO).
You will be given a User Question and an AI Response.
Your task is to evaluate two metrics:
1. CWR (Competitive Win Rate): Which brand is more strongly recommended or evaluated more positively in the context of the question?
   - Target Brand: "${targetBrand}"
   - Competitor Brand: "${competitorBrand || 'None'}"
   Return the name of the winning brand EXACTLY as it appears above, or "tie" if both are neutral or equal.
2. BSF (Brand Semantic Fidelity): Did the AI response successfully associate the Target Brand with its core TCO keywords: [${tcoKeywords}]?
   Return a score from 0 to 100. (100 = perfectly associated, 50 = somewhat, 0 = no association or not mentioned).

Output MUST be a valid JSON object:
{
  "cwr_winner": "...",
  "bsf_score": 0,
  "reasoning": "..."
}`;

    const userPrompt = `Question:
${questionText}

AI Response:
${responseText}`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          response_format: { type: "json_object" },
          temperature: 0.1
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`);
      }

      const json = await response.json();
      const content = json.choices[0].message.content;
      const parsed = JSON.parse(content);

      // Normalize cwr_winner
      let winner = 'tie';
      if (parsed.cwr_winner) {
        const w = String(parsed.cwr_winner).toLowerCase();
        if (w.includes(targetBrand.toLowerCase())) winner = targetBrand;
        else if (competitorBrand && w.includes(competitorBrand.toLowerCase())) winner = competitorBrand;
      }

      return {
        cwr_winner: winner,
        bsf_score: Number(parsed.bsf_score) || 0,
        reasoning: parsed.reasoning || ''
      };
    } catch (err: any) {
      console.error('[LightweightLLMJudge] Evaluation failed:', err.message);
      return { cwr_winner: 'tie', bsf_score: 0, reasoning: 'Evaluation failed' };
    }
  }
}

export const llmJudge = new LightweightLLMJudge();
