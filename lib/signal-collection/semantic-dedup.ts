/**
 * lib/signal-collection/semantic-dedup.ts
 *
 * S-OGDE v2.0 — 임베딩 기반 시맨틱 중복 제거 엔진.
 *
 * "AHA 부작용"과 "아하 성분 단점"을 동일 의도로 판단하여 클러스터링합니다.
 * 기존 EmbeddingProvider(Gemini text-embedding-004)를 재활용하여
 * 추가 API 키 없이 동작합니다.
 *
 * 이론적 기반: 코사인 유사도 기반 Agglomerative Clustering (Single-linkage)
 */

import { getEmbeddingProvider } from '../ai/embedding-provider';
import type {
  RawSignalCandidate,
  EmbeddedSignal,
  SignalCluster,
  DedupResult
} from './types';

/** 기본 유사도 임계값. 0.85 이상이면 동일 의도로 판단. */
const DEFAULT_SIMILARITY_THRESHOLD = 0.85;

/** 임베딩 배치 크기. Rate limit 방지. */
const EMBEDDING_BATCH_SIZE = 20;

export class SemanticDedup {
  private threshold: number;

  constructor(threshold: number = DEFAULT_SIMILARITY_THRESHOLD) {
    this.threshold = threshold;
  }

  /**
   * 후보 시그널들을 임베딩 → 코사인 유사도 클러스터링 → 대표 질문 선정.
   *
   * @param candidates - 수집된 원시 시그널 배열
   * @returns DedupResult — 클러스터 배열 + 통계
   */
  async deduplicate(candidates: RawSignalCandidate[]): Promise<DedupResult> {
    if (candidates.length <= 1) {
      return {
        clusters: candidates.map((c, i) => ({
          id: `cluster_${i}`,
          representative: c,
          variants: [],
          weight: 1,
          avgSimilarity: 1.0
        })),
        totalInput: candidates.length,
        totalOutput: candidates.length,
        duplicatesRemoved: 0
      };
    }

    // 1. 임베딩 생성 (배치 처리)
    const embedded = await this.embedCandidates(candidates);

    // 2. 코사인 유사도 매트릭스 계산
    const simMatrix = this.computeSimilarityMatrix(embedded);

    // 3. Single-linkage Agglomerative Clustering
    const clusterAssignments = this.cluster(simMatrix, embedded.length);

    // 4. 클러스터별 대표 질문 선정 + 결과 구성
    const clusters = this.buildClusters(embedded, clusterAssignments, simMatrix);

    return {
      clusters,
      totalInput: candidates.length,
      totalOutput: clusters.length,
      duplicatesRemoved: candidates.length - clusters.length
    };
  }

  /**
   * 후보 질문들을 배치로 임베딩합니다.
   * Rate limit 방지를 위해 EMBEDDING_BATCH_SIZE씩 나누어 처리합니다.
   */
  private async embedCandidates(candidates: RawSignalCandidate[]): Promise<EmbeddedSignal[]> {
    const provider = getEmbeddingProvider();
    const result: EmbeddedSignal[] = [];

    for (let i = 0; i < candidates.length; i += EMBEDDING_BATCH_SIZE) {
      const batch = candidates.slice(i, i + EMBEDDING_BATCH_SIZE);
      const texts = batch.map(c => c.query);

      let embeddings: number[][];
      try {
        embeddings = await provider.embedBatch(texts);
      } catch (err) {
        console.warn(`[SemanticDedup] Batch embedding failed for batch ${i}, falling back to individual calls`, err);
        // Fallback: individual embedding calls
        embeddings = [];
        for (const text of texts) {
          try {
            const vec = await provider.embed(text);
            embeddings.push(vec);
          } catch {
            // Last resort: zero vector (will not match anything)
            embeddings.push(new Array(768).fill(0));
          }
        }
      }

      for (let j = 0; j < batch.length; j++) {
        result.push({
          ...batch[j],
          embedding: embeddings[j] || new Array(768).fill(0)
        });
      }

      // Rate limit 간격 (50ms)
      if (i + EMBEDDING_BATCH_SIZE < candidates.length) {
        await delay(50);
      }
    }

    return result;
  }

  /**
   * N×N 코사인 유사도 매트릭스를 계산합니다.
   * O(n² × d) — 50개 × 768차원이면 ~0.01초 이내.
   */
  private computeSimilarityMatrix(signals: EmbeddedSignal[]): number[][] {
    const n = signals.length;
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1.0; // 자기 자신과의 유사도 = 1
      for (let j = i + 1; j < n; j++) {
        const sim = cosineSimilarity(signals[i].embedding, signals[j].embedding);
        matrix[i][j] = sim;
        matrix[j][i] = sim;
      }
    }

    return matrix;
  }

  /**
   * Single-linkage Agglomerative Clustering.
   * threshold 이상의 유사도를 가진 노드들을 같은 클러스터로 묶습니다.
   *
   * Union-Find 알고리즘으로 구현 (O(n² α(n)) ≈ O(n²)).
   */
  private cluster(simMatrix: number[][], n: number): number[] {
    // Union-Find
    const parent = Array.from({ length: n }, (_, i) => i);

    const find = (x: number): number => {
      if (parent[x] !== x) parent[x] = find(parent[x]);
      return parent[x];
    };

    const union = (x: number, y: number): void => {
      const px = find(x);
      const py = find(y);
      if (px !== py) parent[px] = py;
    };

    // threshold 이상인 쌍을 모두 합침
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        if (simMatrix[i][j] >= this.threshold) {
          union(i, j);
        }
      }
    }

    // 클러스터 ID 정규화
    return Array.from({ length: n }, (_, i) => find(i));
  }

  /**
   * 클러스터별 대표 질문 선정.
   * 규칙: 클러스터 내 가장 짧은(간결한) 질문이 대표.
   */
  private buildClusters(
    signals: EmbeddedSignal[],
    assignments: number[],
    simMatrix: number[][]
  ): SignalCluster[] {
    // 클러스터 ID → 인덱스 배열 매핑
    const groups = new Map<number, number[]>();
    for (let i = 0; i < assignments.length; i++) {
      const cid = assignments[i];
      if (!groups.has(cid)) groups.set(cid, []);
      groups.get(cid)!.push(i);
    }

    const clusters: SignalCluster[] = [];
    let clusterId = 0;

    for (const [, indices] of groups) {
      // 대표 질문: 가장 짧은 질문 (동률 시 먼저 생성된 것)
      const sorted = [...indices].sort((a, b) =>
        signals[a].query.length - signals[b].query.length
      );
      const repIdx = sorted[0];

      // 클러스터 내 평균 유사도 계산
      let totalSim = 0;
      let simCount = 0;
      for (let i = 0; i < indices.length; i++) {
        for (let j = i + 1; j < indices.length; j++) {
          totalSim += simMatrix[indices[i]][indices[j]];
          simCount++;
        }
      }
      const avgSimilarity = simCount > 0 ? totalSim / simCount : 1.0;

      // RawSignalCandidate로 변환 (embedding 제거)
      const toRaw = (idx: number): RawSignalCandidate => ({
        query: signals[idx].query,
        source: signals[idx].source,
        volume: signals[idx].volume,
        metadata: signals[idx].metadata
      });

      clusters.push({
        id: `cluster_${clusterId++}`,
        representative: toRaw(repIdx),
        variants: indices.filter(i => i !== repIdx).map(toRaw),
        weight: indices.length,
        avgSimilarity: parseFloat(avgSimilarity.toFixed(4))
      });
    }

    // weight(빈도) 기준 내림차순 정렬 — 많이 중복된 질문이 더 전략적으로 중요
    clusters.sort((a, b) => b.weight - a.weight);

    return clusters;
  }
}

// ─────────────────────────────────────────
// Utility Functions
// ─────────────────────────────────────────

/**
 * 코사인 유사도 계산.
 * cos(A, B) = (A·B) / (|A| × |B|)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}

/** Simple delay for rate limiting. */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}
