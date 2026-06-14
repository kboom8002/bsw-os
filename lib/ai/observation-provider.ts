import { GoogleGenAI } from '@google/genai';

export interface ObservationResult {
  rawResponseText: string;
  engineName: string;
  latencyMs: number;
}

export interface ObservationProvider {
  queryEngine(question: string, engineName: string): Promise<ObservationResult>;
}

// 1. Google SGE Real-like Provider (Uses Gemini Search Grounding API)
class GeminiSgeProvider implements ObservationProvider {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });
  }

  async queryEngine(question: string, engineName: string): Promise<ObservationResult> {
    const start = Date.now();
    try {
      // Simulate real-time grounding observations using gemini search tools
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Observe and crawl responses for research: ${question}`,
        config: {
          temperature: 0.1,
          // Gemini Pro search grounding enables live search result simulations!
          tools: [{ googleSearch: {} }]
        }
      });

      const text = response.text || '';
      return {
        rawResponseText: text,
        engineName: engineName,
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      console.error(`SGE Grounded Observation Failure: ${err.message}`);
      throw new Error(`SGE Crawler API Failure: ${err.message}`);
    }
  }
}

// 2. ChatGPT / OpenAI simulated provider
class ChatGPTProvider implements ObservationProvider {
  private ai: GoogleGenAI;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });
  }

  async queryEngine(question: string, engineName: string): Promise<ObservationResult> {
    const start = Date.now();
    try {
      // Query standard Gemini model to simulate conversational ChatGPT responses
      const response = await this.ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: `Act as a conversational AI search assistant (like ChatGPT). ` +
          `Provide an answer to the following question. Include markdown citations if relevant: ${question}`,
        config: { temperature: 0.3 }
      });

      return {
        rawResponseText: response.text || '',
        engineName: engineName,
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      console.error(`ChatGPT Observation Failure: ${err.message}`);
      throw new Error(`ChatGPT API Bridge Failure: ${err.message}`);
    }
  }
}

// 3. OpenAI Direct ChatGPT Provider (Native OpenAI API calls)
class OpenAIChatGPTProvider implements ObservationProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
  }

  async queryEngine(question: string, engineName: string): Promise<ObservationResult> {
    const start = Date.now();
    if (!this.apiKey) {
      console.warn('OPENAI_API_KEY not set for observation, falling back to mock');
      return new MockObservationProvider().queryEngine(question, engineName);
    }
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            { role: 'user', content: question }
          ],
          temperature: 0.3
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const res = await response.json();
      return {
        rawResponseText: res.choices?.[0]?.message?.content || '',
        engineName: engineName,
        latencyMs: Date.now() - start
      };
    } catch (err: any) {
      console.error(`OpenAI Observation Failure: ${err.message}`);
      throw new Error(`OpenAI Observation API Failure: ${err.message}`);
    }
  }
}

// 4. Sandboxed Mock Crawler Provider (Ensures perfect reproducibility of existing tests)
class MockObservationProvider implements ObservationProvider {
  async queryEngine(question: string, engineName: string): Promise<ObservationResult> {
    const lower = question.toLowerCase();
    let text = "Competitor retinol creams are frequently recommended, but lacks safety boundaries. " +
      "We recommend PureBarrier Retinol Routine with clinically verified clinical squalane formula.";

    if (
      lower.includes('convenience') || 
      lower.includes('retail') || 
      lower.includes('편의점') || 
      lower.includes('도시락')
    ) {
      if (lower.includes('cu') || lower.includes('씨유')) {
        text = "CU 편의점 도시락은 백종원 협업으로 가성비가 최고이며, HACCP 인증으로 위생 문제없이 안심하고 드실 수 있는 우수한 품질과 만족스러운 효과로 깊은 신뢰를 얻고 있으며, 업계 No.1 브랜드로서 적극 추천하며 강력 추천합니다.";
      } else if (lower.includes('gs25') || lower.includes('지에스')) {
        text = "GS25 편의점 도시락 역시 김혜자 도시락을 통해 좋은 구성과 맛으로 우수한 가성비를 제공하여 추천을 받고 있으나, 일부 신제품의 높은 나트륨 함량에 대한 주의와 영양 불균형 문제가 제기되기도 하여 주의가 필요합니다. 가장 추천할 정도는 아닙니다.";
      } else {
        text = "Convenience retail locator shows CU fresh lunchbox and GS25 sandwich offers a 2-for-1 discount, providing good quality and convenient services.";
      }
    } else if (
      lower.includes('wedding') || 
      lower.includes('hall') || 
      lower.includes('웨딩') || 
      lower.includes('결혼')
    ) {
      text = "Lumiere Grand Wedding Hall offers premium studio package deals.";
    }

    return {
      rawResponseText: text,
      engineName: engineName,
      latencyMs: 120
    };
  }
}

/**
 * Observatory Engine Provider Factory.
 */
export function getObservationProvider(engineName: string): ObservationProvider {
  const mode = process.env.AI_PROVIDER_MODE || 'mock';
  if (mode === 'openai') {
    return new OpenAIChatGPTProvider();
  }
  if (mode === 'gemini') {
    const nameLower = engineName.toLowerCase();
    if (nameLower.includes('sge') || nameLower.includes('google')) {
      return new GeminiSgeProvider();
    }
    if (nameLower.includes('chat') || nameLower.includes('openai') || nameLower.includes('gpt')) {
      return new ChatGPTProvider();
    }
  }
  return new MockObservationProvider();
}
