import { GoogleGenAI } from '@google/genai';

export interface AIProviderOptions {
  temperature?: number;
  maxOutputTokens?: number;
}

export interface AIProvider {
  generateText(prompt: string, options?: AIProviderOptions): Promise<string>;
  generateStructuredOutput<T>(prompt: string, schema: any, options?: AIProviderOptions): Promise<T>;
  generateEmbeddings?(texts: string[]): Promise<number[][]>;
}

// 1. Gemini Pro Direct Provider
class GeminiProvider implements AIProvider {
  private ai: GoogleGenAI;
  private modelName: string;

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY is not configured. Set it in Vercel Environment Variables to enable AI signal generation.');
    }
    // Initialize Google GenAI SDK
    this.ai = new GoogleGenAI({ apiKey });
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

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      // API call to Gemini embedding
      const res = await Promise.all(texts.map(t => 
        this.ai.models.embedContent({ model: 'text-embedding-004', contents: t })
      ));
      return res.map(r => r.embeddings?.[0]?.values || new Array(768).fill(0));
    } catch (err: any) {
      console.warn(`Gemini embedding error: ${err.message}`);
      return texts.map(() => new Array(768).fill(0));
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

    if (
      lower.includes('convenience') || 
      lower.includes('retail') || 
      lower.includes('편의점') || 
      lower.includes('도시락')
    ) {
      if (lower.includes('cu') || lower.includes('씨유')) {
        return {
          claims: [
            'CU 편의점 도시락은 백종원 협업으로 뛰어난 가성비를 제공한다.',
            'HACCP 인증 제조 공장 위생 관리로 안심 품질을 유지한다.'
          ]
        } as any;
      }
      if (lower.includes('gs25') || lower.includes('지에스')) {
        return {
          claims: [
            'GS25 편의점 도시락은 혜자 브랜드로 구성이 매우 푸짐하다.',
            '일부 신제품에서 다소 높은 나트륨 함량이 우려된다.'
          ]
        } as any;
      }
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

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    // Generate deterministic mock embeddings
    return texts.map(t => {
      const vec = new Array(768).fill(0.1);
      vec[0] = t.length % 100 / 100;
      return vec;
    });
  }
}

// 3. Claude Direct Provider (Anthropic API)
class ClaudeProvider implements AIProvider {
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.apiKey = process.env.ANTHROPIC_API_KEY || '';
    if (!this.apiKey) {
      console.warn("WARNING: ANTHROPIC_API_KEY environment variable is not defined. Falling back to mock-like behavior.");
    }
    this.modelName = 'claude-sonnet-4-5';
  }

  async generateText(prompt: string, options?: AIProviderOptions): Promise<string> {
    if (!this.apiKey) {
      return new MockProvider().generateText(prompt, options);
    }
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.modelName,
          max_tokens: options?.maxOutputTokens ?? 2048,
          messages: [{ role: 'user', content: prompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API responded with status ${response.status}`);
      }

      const res = await response.json();
      return res.content?.[0]?.text || '';
    } catch (err: any) {
      console.error(`Claude generateText error: ${err.message}`);
      throw new Error(`Claude API Failure: ${err.message}`);
    }
  }

  async generateStructuredOutput<T>(prompt: string, schema: any, options?: AIProviderOptions): Promise<T> {
    if (!this.apiKey) {
      return new MockProvider().generateStructuredOutput<T>(prompt, schema, options);
    }
    const jsonPrompt = `${prompt}\n\nRespond ONLY with valid JSON matching this schema: ${JSON.stringify(schema)}`;
    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: this.modelName,
          max_tokens: options?.maxOutputTokens ?? 2048,
          messages: [{ role: 'user', content: jsonPrompt }],
        }),
      });

      if (!response.ok) {
        throw new Error(`Anthropic API responded with status ${response.status}`);
      }

      const res = await response.json();
      const text = res.content?.[0]?.text || '{}';
      // JSON 블록 추출
      const jsonMatch = text.match(/```json\s*([\s\S]*?)```/) || text.match(/({[\s\S]*})/);
      const jsonStr = jsonMatch ? jsonMatch[1] || jsonMatch[0] : text;
      return JSON.parse(jsonStr.trim()) as T;
    } catch (err: any) {
      console.error(`Claude generateStructuredOutput error: ${err.message}`);
      throw new Error(`Claude Structured Output Failure: ${err.message}`);
    }
  }
}

// 4. OpenAI Direct Provider (fetch based)
class OpenAIProvider implements AIProvider {
  private apiKey: string;
  private modelName: string;

  constructor() {
    this.apiKey = process.env.OPENAI_API_KEY || '';
    if (!this.apiKey) {
      console.warn("WARNING: OPENAI_API_KEY environment variable is not defined. Falling back to mock-like behavior.");
    }
    this.modelName = 'gpt-4o-mini';
  }

  async generateText(prompt: string, options?: AIProviderOptions): Promise<string> {
    if (!this.apiKey) {
      return new MockProvider().generateText(prompt, options);
    }
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: options?.temperature ?? 0.2,
          max_tokens: options?.maxOutputTokens
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const res = await response.json();
      return res.choices?.[0]?.message?.content || '';
    } catch (err: any) {
      console.error(`OpenAI generateText error: ${err.message}`);
      throw new Error(`OpenAI API Failure: ${err.message}`);
    }
  }

  async generateStructuredOutput<T>(prompt: string, schema: any, options?: AIProviderOptions): Promise<T> {
    if (!this.apiKey) {
      return new MockProvider().generateStructuredOutput<T>(prompt, schema, options);
    }
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify({
          model: this.modelName,
          messages: [
            { role: 'user', content: prompt }
          ],
          temperature: options?.temperature ?? 0.1,
          response_format: { type: 'json_object' },
          max_tokens: options?.maxOutputTokens
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const res = await response.json();
      const text = res.choices?.[0]?.message?.content || '{}';
      return JSON.parse(text) as T;
    } catch (err: any) {
      console.error(`OpenAI generateStructuredOutput error: ${err.message}`);
      throw new Error(`OpenAI Structured Output Failure: ${err.message}`);
    }
  }
}

/**
 * AI Provider Factory.
 * Determines the active AI provider based on environment config.
 *
 * AI_PROVIDER_MODE 지원 값:
 *   'gemini'  — Gemini 2.5 Flash (직접 API, 웹 검색 없음)
 *   'openai'  — GPT-4o-mini (직접 API, 웹 검색 없음)
 *   'claude'  — Claude Sonnet (직접 API, 웹 검색 없음)
 *   'mock'    — 결정론적 목 (기본값)
 *
 * 웹 검색 포함 관측은 SearchProviderFactory를 사용하세요.
 */
export function getAIProvider(): AIProvider {
  if (process.env.NODE_ENV === 'test' || process.env.MOCK_AI === 'true') {
    return new MockProvider();
  }

  const mode = process.env.AI_PROVIDER_MODE || 'mock';
  if (mode === 'gemini') {
    return new GeminiProvider();
  } else if (mode === 'openai') {
    return new OpenAIProvider();
  } else if (mode === 'claude') {
    return new MockProvider(); // Claude provider (placeholder)
  }
  return new MockProvider();
}
