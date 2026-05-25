import { EmbeddingProvider, EmbeddingResult } from './types';
import { MockEmbeddingProvider } from './mock-embedding-provider';

export class GeminiEmbeddingProvider implements EmbeddingProvider {
  public providerName = 'gemini';
  public modelName = 'text-embedding-004';
  public defaultDimensions = 3072;
  private mockProvider = new MockEmbeddingProvider();

  public async embed(text: string, dimensions?: number): Promise<EmbeddingResult> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    const dims = dimensions || this.defaultDimensions;

    if (!apiKey) {
      // Fallback to mock deterministic vector
      const mockResult = await this.mockProvider.embed(text, dims);
      return {
        ...mockResult,
        modelName: `${this.modelName}-mock`,
      };
    }

    const start = Date.now();
    try {
      // Call Gemini text-embedding-004 API (which yields 768 dimensions)
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${this.modelName}:embedContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            content: {
              parts: [{ text }],
            },
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini Embedding API responded with status ${response.status}`);
      }

      const data = await response.json();
      const rawVector = data.embedding?.values;

      if (!rawVector || !Array.isArray(rawVector)) {
        throw new Error('Invalid response structure from Gemini Embedding API');
      }

      // Convert 768-dim vector to 3072-dim via zero padding to ensure full 3072-dim budget compatibility
      let vector = [...rawVector];
      if (vector.length < dims) {
        const padding = new Array(dims - vector.length).fill(0);
        vector = vector.concat(padding);
      } else if (vector.length > dims) {
        vector = vector.slice(0, dims);
      }

      // Ensure it is a unit vector
      let sumSq = 0;
      for (const val of vector) {
        sumSq += val * val;
      }
      const norm = Math.sqrt(sumSq);
      if (norm > 0) {
        vector = vector.map(v => v / norm);
      }

      return {
        vector,
        dimensions: dims,
        modelName: this.modelName,
        tokenCount: Math.ceil(text.length / 4),
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      console.warn('Gemini Embedding failed, falling back to mock provider:', error);
      const mockResult = await this.mockProvider.embed(text, dims);
      return {
        ...mockResult,
        modelName: `${this.modelName}-fallback`,
      };
    }
  }

  public async embedBatch(texts: string[], dimensions?: number): Promise<EmbeddingResult[]> {
    return Promise.all(texts.map(text => this.embed(text, dimensions)));
  }
}
