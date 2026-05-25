import { EmbeddingProvider, EmbeddingResult } from './types';
import { MockEmbeddingProvider } from './mock-embedding-provider';

export class OpenAIEmbeddingProvider implements EmbeddingProvider {
  public providerName = 'openai';
  public modelName = 'text-embedding-3-large';
  public defaultDimensions = 3072;
  private mockProvider = new MockEmbeddingProvider();

  public async embed(text: string, dimensions?: number): Promise<EmbeddingResult> {
    const apiKey = process.env.OPENAI_API_KEY;
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
      const response = await fetch('https://api.openai.com/v1/embeddings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          input: text,
          model: this.modelName,
          dimensions: dims,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API responded with status ${response.status}`);
      }

      const data = await response.json();
      const vector = data.data[0].embedding;

      return {
        vector,
        dimensions: dims,
        modelName: this.modelName,
        tokenCount: data.usage?.total_tokens || Math.ceil(text.length / 4),
        latencyMs: Date.now() - start,
      };
    } catch (error) {
      console.warn('OpenAI Embedding failed, falling back to mock provider:', error);
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
