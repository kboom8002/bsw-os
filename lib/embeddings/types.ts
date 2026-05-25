export interface EmbeddingProvider {
  providerName: string;
  modelName: string;
  defaultDimensions: number;
  embed(text: string, dimensions?: number): Promise<EmbeddingResult>;
  embedBatch(texts: string[], dimensions?: number): Promise<EmbeddingResult[]>;
}

export interface EmbeddingResult {
  vector: number[];
  dimensions: number;
  modelName: string;
  tokenCount: number;
  latencyMs: number;
}
