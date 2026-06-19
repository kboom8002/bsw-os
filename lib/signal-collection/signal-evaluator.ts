import { getAIProvider } from '../ai/ai-provider';

export interface SignalEvaluationResult {
  intent: 'informational' | 'navigational' | 'transactional' | 'local' | 'comparison' | 'risk';
  brand_fit: 'fit' | 'partial' | 'unfit';
  is_ymyl: boolean;
  strategic_score: number; // 0 - 100
  cluster_id?: string;
  // QVS 5차원 스코어 (S-05)
  qvs_relevance?: number; // V_rel (0-10)
  qvs_specificity?: number; // V_spec (0-10)
  qvs_urgency?: number; // V_urg (0-10)
  qvs_competitiveness?: number; // V_comp (0-10)
  qvs_conversion?: number; // V_conv (0-10)
  qvs_total_score?: number; // QVS (0-100)
  gate_status?: 'Go' | 'Watch' | 'No-Go';
}

export class SignalEvaluator {
  /**
   * Evaluates a raw question signal automatically.
   */
  static async evaluateSignal(question: string, brandName: string): Promise<SignalEvaluationResult> {
    const ai = getAIProvider();
    
    const systemPrompt = `You are a search signal evaluator.
Analyze the question: "${question}"
In the context of the brand: "${brandName}"

Evaluate these dimensions:
1. intent: informational, navigational, transactional, local, comparison, or risk.
2. brand_fit: 'fit' (highly relevant to brand), 'partial' (somewhat relevant), 'unfit' (irrelevant).
3. is_ymyl: true if it touches Your Money or Your Life topics (health, safety, finance, severe side effects).
4. strategic_score: 0 to 100 representing how valuable it is for the brand to capture this question.

Furthermore, evaluate the QVS (Quality-Volume Score) 5 dimensions (0 to 10 scale for each):
- qvs_relevance: Relevance to the brand's core domain.
- qvs_specificity: How specific the intent is (long-tail vs head).
- qvs_urgency: Immediate need or pain point for the user.
- qvs_competitiveness: Expected level of competition (10 means very competitive).
- qvs_conversion: Commercial intent and likelihood to convert.
`;

    try {
      const response = await ai.generateStructuredOutput<any>(`System:\n${systemPrompt}\n\nUser:\nEvaluate the question.`, {
        type: 'object',
        properties: {
          intent: { type: 'string', enum: ['informational', 'navigational', 'transactional', 'local', 'comparison', 'risk'] },
          brand_fit: { type: 'string', enum: ['fit', 'partial', 'unfit'] },
          is_ymyl: { type: 'boolean' },
          strategic_score: { type: 'number' },
          qvs_relevance: { type: 'number' },
          qvs_specificity: { type: 'number' },
          qvs_urgency: { type: 'number' },
          qvs_competitiveness: { type: 'number' },
          qvs_conversion: { type: 'number' }
        },
        required: ['intent', 'brand_fit', 'is_ymyl', 'strategic_score', 'qvs_relevance', 'qvs_specificity', 'qvs_urgency', 'qvs_competitiveness', 'qvs_conversion']
      });

      const V_rel = response.qvs_relevance || 0;
      const V_spec = response.qvs_specificity || 0;
      const V_urg = response.qvs_urgency || 0;
      const V_comp = response.qvs_competitiveness || 0;
      const V_conv = response.qvs_conversion || 0;
      
      // Weights: Relevance 30%, Specificity 20%, Urgency 10%, Comp 10%, Conversion 30%
      const qvs_total = (V_rel * 3) + (V_spec * 2) + (V_urg * 1) + (V_comp * 1) + (V_conv * 3); // max 100
      
      let gate_status: 'Go' | 'Watch' | 'No-Go' = 'Watch';
      if (qvs_total >= 70 && response.brand_fit === 'fit') gate_status = 'Go';
      else if (qvs_total < 40 || response.brand_fit === 'unfit') gate_status = 'No-Go';

      return {
        intent: response.intent || 'informational',
        brand_fit: response.brand_fit || 'partial',
        is_ymyl: response.is_ymyl || false,
        strategic_score: response.strategic_score || 50,
        qvs_relevance: V_rel,
        qvs_specificity: V_spec,
        qvs_urgency: V_urg,
        qvs_competitiveness: V_comp,
        qvs_conversion: V_conv,
        qvs_total_score: qvs_total,
        gate_status
      };
    } catch (error) {
      console.warn("SignalEvaluator LLM call failed", error);
      return {
        intent: 'informational',
        brand_fit: 'partial',
        is_ymyl: false,
        strategic_score: 50
      };
    }
  }

  /**
   * Simple clustering simulation for deduping.
   */
  static async groupSimilarSignals(questions: string[]): Promise<Map<string, string[]>> {
    // In a real implementation, this would use embeddings (e.g. OpenAI ada-002) and cosine similarity.
    // For this LLM-native phase without vector DB, we'll ask the LLM to group them.
    const ai = getAIProvider();
    
    if (questions.length <= 1) {
       const map = new Map();
       if (questions.length === 1) map.set('cluster_1', [questions[0]]);
       return map;
    }

    const systemPrompt = `Group these questions into distinct semantic clusters based on similarity.
Questions:
${questions.map((q, i) => `${i+1}. ${q}`).join('\n')}

Output an array of clusters, where each cluster contains an array of question strings.`;

    try {
      const response = await ai.generateStructuredOutput<any>(`System:\n${systemPrompt}\n\nUser:\nGroup them.`, {
        type: 'object',
        properties: {
          clusters: {
            type: 'array',
            items: {
              type: 'array',
              items: { type: 'string' }
            }
          }
        },
        required: ['clusters']
      });

      const map = new Map<string, string[]>();
      (response.clusters || []).forEach((cluster: string[], i: number) => {
        map.set(`cluster_${i+1}`, cluster);
      });
      return map;
    } catch (e) {
      // Fallback: put each in its own cluster
      const map = new Map<string, string[]>();
      questions.forEach((q, i) => map.set(`cluster_${i}`, [q]));
      return map;
    }
  }
}
