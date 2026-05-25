import { GoogleGenAI } from '@google/genai';

export interface EmbeddingProvider {
  embed(text: string): Promise<number[]>;
  embedBatch(texts: string[]): Promise<number[][]>;
}

// 1. Gemini Embedding Provider (text-embedding-004)
class GeminiEmbeddingProvider implements EmbeddingProvider {
  private ai: GoogleGenAI;
  private modelName = 'text-embedding-004';

  constructor() {
    const apiKey = process.env.GEMINI_API_KEY;
    this.ai = new GoogleGenAI({ apiKey: apiKey || 'DUMMY_KEY' });
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.ai.models.embedContent({
        model: this.modelName,
        contents: text
      }) as any;
      // The API returns coordinates in values
      if (response.embedding?.values) {
        return response.embedding.values;
      }
      throw new Error("No embedding values returned from Gemini API");
    } catch (err: any) {
      console.error(`Gemini embed error: ${err.message}`);
      throw new Error(`Embedding API Failure: ${err.message}`);
    }
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.ai.models.embedContent({
        model: this.modelName,
        contents: texts
      }) as any;
      // Handle array of embeddings (the API values could be array of arrays or single depending on batch structure,
      // but in newer SDKs, it wraps multiple embeddings cleanly).
      // Let's implement robust translation.
      if (Array.isArray(response.embeddings)) {
        return response.embeddings.map((e: any) => e.values || []);
      }
      if (response.embedding?.values) {
        return [response.embedding.values];
      }
      return texts.map(() => new Array(768).fill(0.0));
    } catch (err: any) {
      console.error(`Gemini embedBatch error: ${err.message}`);
      throw new Error(`Embedding Batch API Failure: ${err.message}`);
    }
  }
}

// 2. Deterministic Mock Embedding Provider (Produces stable mock vectors based on text hash)
class MockEmbeddingProvider implements EmbeddingProvider {
  private getDeterministicVector(text: string): number[] {
    const vec = new Array(768).fill(0.0);
    let hash = 0;
    for (let i = 0; i < text.length; i++) {
      hash = text.charCodeAt(i) + ((hash << 5) - hash);
    }
    for (let j = 0; j < 768; j++) {
      // Seed values between -1.0 and 1.0 based on deterministic hash offsets
      const seed = Math.sin(hash + j) * 10000;
      vec[j] = parseFloat((seed - Math.floor(seed)).toFixed(4)) * 2 - 1;
    }
    // Normalize to unit length (important for cosine similarity)
    const magnitude = Math.sqrt(vec.reduce((sum, v) => sum + v * v, 0));
    return vec.map(v => v / (magnitude || 1));
  }

  async embed(text: string): Promise<number[]> {
    return this.getDeterministicVector(text);
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return texts.map(t => this.getDeterministicVector(t));
  }
}

/**
 * Embedding Provider Factory.
 */
export function getEmbeddingProvider(): EmbeddingProvider {
  const mode = process.env.AI_PROVIDER_MODE || 'mock';
  if (mode === 'gemini') {
    return new GeminiEmbeddingProvider();
  }
  return new MockEmbeddingProvider();
}
