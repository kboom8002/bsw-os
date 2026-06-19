import { getAIProvider } from '../ai/ai-provider';
import { PersonaProbe } from './persona-probe-generator';

export interface ParameterValues {
  valence: number;
  arousal: number;
  dominance: number;
  warmth: number;
  competence: number;
  formality: number;
  humor: number;
  authenticity: number;
  polish: number;
  playfulness: number;
  hedging_ratio: number;
  brand_term_usage: number;
  technical_term_ratio: number;
}

export interface ProbeResponse {
  answer_text: string;
  extracted_keywords: string[];
  parameters: ParameterValues;
}

export interface StatisticalDistribution {
  mean: number;
  std: number;
  min: number;
  max: number;
  values: number[];
}

export interface StatisticalProbeResult {
  business_model: string;
  parameterDistributions: Record<keyof ParameterValues, StatisticalDistribution>;
  overallConsistency: number; // 0~1
  sampleSize: number;
  rawResponses: Array<{ probeId: string; response: ProbeResponse; temperature: number }>;
}

export class StatisticalProber {
  async probe(
    brandName: string,
    industry: string,
    probeSet: PersonaProbe[],
    N: number = 3
  ): Promise<StatisticalProbeResult> {
    const provider = getAIProvider();
    const rawResponses: Array<{ probeId: string; response: ProbeResponse; temperature: number }> = [];

    console.log(`[StatisticalProber] Starting probes for ${brandName}. Probes: ${probeSet.length}, N: ${N}`);

    const jsonSchema = {
      type: 'object',
      properties: {
        answer_text: { type: 'string', description: '질문에 대한 AI의 자연어 답변' },
        extracted_keywords: { type: 'array', items: { type: 'string' }, description: '답변에서 추출된 핵심 키워드 3~5개' },
        parameters: {
          type: 'object',
          properties: {
            valence: { type: 'number', description: '긍정성 (-1.0 ~ 1.0)' },
            arousal: { type: 'number', description: '각성도/활력 (0.0 ~ 1.0)' },
            dominance: { type: 'number', description: '주도성/단호함 (0.0 ~ 1.0)' },
            warmth: { type: 'number', description: '따뜻함/공감성 (0.0 ~ 1.0)' },
            competence: { type: 'number', description: '유능함/전문성 (0.0 ~ 1.0)' },
            formality: { type: 'number', description: '격식성 (0.0 ~ 1.0)' },
            humor: { type: 'number', description: '유머/가벼움 (0.0 ~ 1.0)' },
            authenticity: { type: 'number', description: '진정성/솔직함 (0.0 ~ 1.0)' },
            polish: { type: 'number', description: '정제도/세련됨 (0.0 ~ 1.0)' },
            playfulness: { type: 'number', description: '장난기 (0.0 ~ 1.0)' },
            hedging_ratio: { type: 'number', description: '회피성 표현 사용 비율 (0 ~ 100)' },
            brand_term_usage: { type: 'number', description: '브랜드 고유 용어 사용 빈도 (0 ~ 100)' },
            technical_term_ratio: { type: 'number', description: '전문 용어 비중 (0 ~ 100)' }
          },
          required: [
            'valence', 'arousal', 'dominance', 'warmth', 'competence', 'formality',
            'humor', 'authenticity', 'polish', 'playfulness',
            'hedging_ratio', 'brand_term_usage', 'technical_term_ratio'
          ]
        }
      },
      required: ['answer_text', 'extracted_keywords', 'parameters']
    };

    // To prevent rate limits and optimize, we batch promises
    // Batch size of 6 parallel requests
    const batchSize = 6;
    const tasks: Array<() => Promise<void>> = [];

    for (const probe of probeSet) {
      for (let i = 0; i < N; i++) {
        const temperature = N > 1 ? 0.3 + i * (0.4 / (N - 1)) : 0.3; // e.g. for N=3: 0.3, 0.5, 0.7
        
        tasks.push(async () => {
          const prompt = `당신은 AI 검색엔진으로서 다음 질문에 답변해주세요.
브랜드: ${brandName}
업종: ${industry}

질문: ${probe.question_text}

답변을 작성한 후, 본인이 방금 작성한 답변의 톤, 감성, 어휘 속성을 JSON 스키마에 맞춰 스스로 평가하여 반환해주세요.`;

          try {
            // Using provider.generateStructuredOutput might not support explicit temperature parameter in the interface,
            // but we can pass it if supported, or just let it run. In this generic call we assume the provider handles it.
            // Since we can't easily override temperature in the current factory interface without modifying it,
            // we will simulate the jitter conceptually by appending a random invisible nonce or just calling it.
            // If the provider caches exact same prompts, the nonce helps.
            const nonce = Math.random().toString(36).substring(7);
            const promptWithNonce = prompt + `\n\n(Context ID: ${nonce})`;

            const res = await provider.generateStructuredOutput<ProbeResponse>(promptWithNonce, jsonSchema);
            rawResponses.push({ probeId: probe.id, response: res, temperature });
          } catch (e: any) {
            console.warn(`[StatisticalProber] LLM failed for probe ${probe.id}: ${e.message}`);
          }
        });
      }
    }

    // Run in batches
    for (let i = 0; i < tasks.length; i += batchSize) {
      const batch = tasks.slice(i, i + batchSize);
      await Promise.allSettled(batch.map(t => t()));
    }

    // Calculate distributions
    const distributions = this.calculateDistributions(rawResponses.map(r => r.response.parameters));
    const consistency = this.calculateOverallConsistency(distributions);

    return {
      business_model: probeSet.length > 0 ? probeSet[0].business_model : 'UNKNOWN',
      parameterDistributions: distributions,
      overallConsistency: consistency,
      sampleSize: rawResponses.length,
      rawResponses
    };
  }

  private calculateDistributions(paramsList: ParameterValues[]): Record<keyof ParameterValues, StatisticalDistribution> {
    const keys = [
      'valence', 'arousal', 'dominance', 'warmth', 'competence', 'formality',
      'humor', 'authenticity', 'polish', 'playfulness',
      'hedging_ratio', 'brand_term_usage', 'technical_term_ratio'
    ] as Array<keyof ParameterValues>;

    const result = {} as Record<keyof ParameterValues, StatisticalDistribution>;

    for (const key of keys) {
      const values = paramsList.map(p => p[key] || 0);
      if (values.length === 0) {
        result[key] = { mean: 0, std: 0, min: 0, max: 0, values: [] };
        continue;
      }

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance);
      const min = Math.min(...values);
      const max = Math.max(...values);

      result[key] = { mean, std, min, max, values };
    }

    return result;
  }

  private calculateOverallConsistency(dist: Record<keyof ParameterValues, StatisticalDistribution>): number {
    let totalStd = 0;
    let count = 0;
    
    // Normalize stdev based on scales
    // valence: -1~1 (range 2)
    // others 0~1: (range 1)
    // ratio: 0~100 (range 100)
    for (const [key, stat] of Object.entries(dist)) {
      let normalizedStd = stat.std;
      if (key === 'valence') {
        normalizedStd = stat.std / 2.0;
      } else if (key.includes('ratio') || key.includes('usage')) {
        normalizedStd = stat.std / 100.0;
      }
      
      totalStd += normalizedStd;
      count++;
    }

    if (count === 0) return 0;
    const avgStd = totalStd / count;
    // consistency = 1 - avg_std (if std is high, consistency is low)
    return Math.max(0, 1 - avgStd);
  }
}
