import { GoogleGenAI } from '@google/genai';

export interface AIProviderOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AIProvider {
  generateText(prompt: string, options?: AIProviderOptions): Promise<string>;
  generateStructuredOutput<T>(prompt: string, schema: any, options?: AIProviderOptions): Promise<T>;
}

// 1. Gemini Pro Direct Provider
class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not defined. Falling back to mock-like behavior.");
    }
    // Initialize Google GenAI SDK
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });
    this.modelName = 'gemini-2.5-flash';
  }

  async generateText(prompt: string, options?: AIProviderOptions): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.2,
          maxOutputTokens: options?.maxOutputTokens,
        }
      });
      return response.text || '';
    } catch (err: any) {
      console.error(`Gemini generateText error: ${err.message}`);
      throw new Error(`Gemini API Failure: ${err.message}`);
    }
  }

  async generateStructuredOutput<T>(prompt: string, schema: any, options?: AIProviderOptions): Promise<T> {
    try {
      // Prompt Gemini for structured output using jsonSchema option of the SDK
      const response = await this.ai.models.generateContent({
        model: this.modelName,
        contents: prompt,
        config: {
          temperature: options?.temperature ?? 0.1,
          responseMimeType: 'application/json',
          responseSchema: schema,
          maxOutputTokens: options?.maxOutputTokens,
        }
      });

      const text = response.text || '{}';
      return JSON.parse(text) as T;
    } catch (err: any) {
      console.error(`Gemini generateStructuredOutput error: ${err.message}`);
      throw new Error(`Gemini Structured Output Failure: ${err.message}`);
    }
  }
}

// 2. Deterministic Mock Provider (Guarantees backward compatibility for test suites)
class MockProvider implements AIProvider {
  async generateText(prompt: string, options?: AIProviderOptions): Promise<string> {
    const lower = prompt.toLowerCase();
    if (lower.includes('retinol') && lower.includes('insight')) {
      return "AI Draft Insight: The active website observation run achieved an observed AEO Readiness Score (ARS) of 92.50%. " +
        "Our verified citation rate (OCR) is at 88.00%. Competitor retinol formulations maintain high brand answer shares, " +
        "but our clinical squalane is cited safely with zero scarcity dark patterns.";
    }
    return "Mock generated text response aligned with brand guidelines.";
  }

  async generateStructuredOutput<T>(prompt: string, schema: any, options?: AIProviderOptions): Promise<T> {
    const lower = prompt.toLowerCase();

    // Truth extraction mock mapping
    if (lower.includes('niacinamide') || lower.includes('skincare')) {
      return {
        claims: [
          'Active compound contains 10% clinical Niacinamide formula.',
          'Restores skin barrier health in under 7 days of routine.'
        ]
      } as any;
    }

    if (lower.includes('convenience') || lower.includes('retail')) {
      return {
        claims: [
          'Store offers 24/7 self-checkout actions across city venues.',
          'Weekly fresh menu sandwiches are priced at 2-for-1 discount.'
        ]
      } as any;
    }

    if (lower.includes('wedding') || lower.includes('hall')) {
      return {
        claims: [
          'Grand Wedding Hall booking includes premium studio makeup specs.'
        ]
      } as any;
    }

    // Vibe rating mock mapping
    if (lower.includes('vibe') || lower.includes('clinical') || lower.includes('luxury')) {
      return {
        clinical: 60,
        warm: 20,
        luxury: 20
      } as any;
    }

    // Default fallback claims mapping to ensure truth extractor loop executes
    return {
      claims: [
        'AI Extracted Claim: Active factual statement identified inside crawled source.'
      ]
    } as any;
  }
}

/**
 * AI Provider Factory.
 * Determines the active AI provider based on environment config.
 */
export function getAIProvider(): AIProvider {
  const mode = process.env.AI_PROVIDER_MODE || 'mock';
  if (mode === 'gemini') {
    return new GeminiProvider();
  }
  return new MockProvider();
}
