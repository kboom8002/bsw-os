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

// 3. Sandboxed Mock Crawler Provider (Ensures perfect reproducibility of existing tests)
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
      text = "Convenience retail locator shows Quick25 fresh sandwich offers a 2-for-1 discount.";
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
