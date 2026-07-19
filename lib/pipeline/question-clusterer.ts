/**
 * lib/pipeline/question-clusterer.ts
 * 
 * 임베딩 기반 계층적 클러스터링 (Agglomerative Clustering) 모듈.
 * 소비자 질문 시그널들을 유사도에 따라 클러스터로 묶어 대표 질문(Canonical Question) 후보군을 도출합니다.
 */

import { getEmbeddingProvider } from '../ai/embedding-provider';
import { getSupabaseAdminClient } from '../supabase';

export interface EmbeddedSignal {
  id: string;
  query: string;
  volume: number;
  intent: string;
  embedding: number[];
}

export interface QuestionCluster {
  id: string;
  centroid: number[];
  representativeQuery: string;
  representativeSignalId: string;
  signals: { id: string; query: string; volume: number; intent: string }[];
  avgSimilarity: number;
  silhouetteScore: number;
}

export interface ClusterQualityMetrics {
  silhouetteScore: number;       // 실루엣 스코어 (-1 ~ 1)
  calinskiHarabaszIndex: number;  // 클러스터 밀집도/분산 지표
  totalClusters: number;
}

export class QuestionClusterer {
  private threshold: number;
  private minClusterSize: number;

  constructor(threshold: number = 0.72, minClusterSize: number = 2) {
    this.threshold = threshold;
    this.minClusterSize = minClusterSize;
  }

  /**
   * 시그널 배열을 임베딩 및 클러스터링하여 대표군을 도출합니다.
   */
  public async clusterSignals(signals: any[]): Promise<QuestionCluster[]> {
    if (signals.length === 0) return [];
    if (signals.length === 1) {
      return [{
        id: `cluster_0`,
        centroid: new Array(768).fill(0),
        representativeQuery: signals[0].query,
        representativeSignalId: signals[0].id,
        signals: [signals[0]],
        avgSimilarity: 1.0,
        silhouetteScore: 1.0
      }];
    }

    // 1. 시그널 임베딩 추출
    const embeddedSignals = await this.embedSignals(signals);

    // 2. 유사도 매트릭스 계산 (코사인 유사도)
    const n = embeddedSignals.length;
    const simMatrix = this.computeSimilarityMatrix(embeddedSignals);

    // 3. 계층적 평균 링크(Average-linkage) 병합 클러스터링 실행
    const clusterIndices = this.runAverageLinkageClustering(simMatrix, n);

    // 4. 클러스터 그룹핑 및 대표 질문(Centroid 기준) 선정
    const clusterMap = new Map<number, EmbeddedSignal[]>();
    for (let i = 0; i < n; i++) {
      const root = this.findRoot(clusterIndices, i);
      if (!clusterMap.has(root)) {
        clusterMap.set(root, []);
      }
      clusterMap.get(root)!.push(embeddedSignals[i]);
    }

    const clusters: QuestionCluster[] = [];
    const allAssignments = new Array(n).fill(0);
    
    // Silhouette 스코어 산출용 클러스터 할당 배열 채우기
    let clusterIdx = 0;
    const clusterKeys = Array.from(clusterMap.keys());
    for (const key of clusterKeys) {
      const members = clusterMap.get(key)!;
      for (const member of members) {
        const originalIdx = embeddedSignals.findIndex(s => s.id === member.id);
        allAssignments[originalIdx] = clusterIdx;
      }
      clusterIdx++;
    }

    // 5. 대표 질문 및 세부 메트릭 산출
    let idx = 0;
    for (const [_, members] of clusterMap.entries()) {
      if (members.length < this.minClusterSize) continue;

      const centroid = this.calculateCentroid(members);
      const rep = this.selectRepresentative(members, centroid);
      const avgSim = this.calculateAverageSimilarity(members, simMatrix, embeddedSignals);

      clusters.push({
        id: `cluster_${Date.now()}_${idx++}`,
        centroid,
        representativeQuery: rep.query,
        representativeSignalId: rep.id,
        signals: members.map(m => ({ id: m.id, query: m.query, volume: m.volume, intent: m.intent })),
        avgSimilarity: avgSim,
        silhouetteScore: 0.0 // 아래에서 일괄 계산
      });
    }

    // Silhouette 스코어 계산 적용
    this.calculateSilhouetteScores(clusters, embeddedSignals, allAssignments);

    return clusters;
  }

  /**
   * Gemini Embedding Provider를 통한 시그널 임베딩 생성 (배치)
   */
  private async embedSignals(signals: any[]): Promise<EmbeddedSignal[]> {
    const provider = getEmbeddingProvider();
    const result: EmbeddedSignal[] = [];
    const BATCH_SIZE = 20;

    for (let i = 0; i < signals.length; i += BATCH_SIZE) {
      const batch = signals.slice(i, i + BATCH_SIZE);
      const texts = batch.map(s => s.query);

      let embeddings: number[][];
      try {
        embeddings = await provider.embedBatch(texts);
      } catch (err) {
        embeddings = [];
        for (const text of texts) {
          try {
            const vec = await provider.embed(text);
            embeddings.push(vec);
          } catch {
            embeddings.push(new Array(768).fill(0));
          }
        }
      }

      for (let j = 0; j < batch.length; j++) {
        const emb = embeddings[j] || new Array(768).fill(0);
        if (emb.every(val => val === 0)) {
          console.warn(`[QuestionClusterer] Filtered out signal with zero-vector embedding: ${batch[j].id}`);
          continue;
        }
        result.push({
          id: batch[j].id,
          query: batch[j].query,
          volume: batch[j].volume || 0,
          intent: batch[j].intent || 'informational',
          embedding: emb
        });
      }

      if (i + BATCH_SIZE < signals.length) {
        await new Promise(resolve => setTimeout(resolve, 50));
      }
    }

    return result;
  }

  /**
   * 코사인 유사도 매트릭스 계산
   */
  private computeSimilarityMatrix(signals: EmbeddedSignal[]): number[][] {
    const n = signals.length;
    const matrix: number[][] = Array.from({ length: n }, () => new Array(n).fill(0));

    for (let i = 0; i < n; i++) {
      matrix[i][i] = 1.0;
      for (let j = i + 1; j < n; j++) {
        const sim = this.cosineSimilarity(signals[i].embedding, signals[j].embedding);
        matrix[i][j] = sim;
        matrix[j][i] = sim;
      }
    }
    return matrix;
  }

  private cosineSimilarity(v1: number[], v2: number[]): number {
    let dot = 0.0, normA = 0.0, normB = 0.0;
    for (let i = 0; i < v1.length; i++) {
      dot += v1[i] * v2[i];
      normA += v1[i] * v1[i];
      normB += v2[i] * v2[i];
    }
    return normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
  }

  /**
   * Average-Linkage Agglomerative Clustering 핵심 구현
   */
  private runAverageLinkageClustering(simMatrix: number[][], n: number): number[] {
    const parent = Array.from({ length: n }, (_, i) => i);
    const clusterSizes = Array.from({ length: n }, () => 1);

    // 유사도가 높은 순서대로 노드를 정렬하여 병합 시도
    const edges: { i: number; j: number; sim: number }[] = [];
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        edges.push({ i, j, sim: simMatrix[i][j] });
      }
    }
    edges.sort((a, b) => b.sim - a.sim);

    for (const edge of edges) {
      if (edge.sim < this.threshold) break;

      const rootI = this.findRoot(parent, edge.i);
      const rootJ = this.findRoot(parent, edge.j);

      if (rootI !== rootJ) {
        // Average-Linkage 검사: 두 클러스터의 모든 멤버 간의 평균 유사도 확인
        const avgSim = this.getClusterAverageSimilarity(parent, simMatrix, rootI, rootJ, n);
        if (avgSim >= this.threshold) {
          // 병합 실행
          parent[rootJ] = rootI;
          clusterSizes[rootI] += clusterSizes[rootJ];
        }
      }
    }

    return parent;
  }

  private findRoot(parent: number[], i: number): number {
    let root = i;
    while (root !== parent[root]) {
      root = parent[root];
    }
    // Path compression
    let curr = i;
    while (curr !== root) {
      const nxt = parent[curr];
      parent[curr] = root;
      curr = nxt;
    }
    return root;
  }

  private getClusterAverageSimilarity(parent: number[], simMatrix: number[][], rootI: number, rootJ: number, n: number): number {
    const membersI: number[] = [];
    const membersJ: number[] = [];

    for (let k = 0; k < n; k++) {
      const r = this.findRoot(parent, k);
      if (r === rootI) membersI.push(k);
      else if (r === rootJ) membersJ.push(k);
    }

    let sumSim = 0;
    for (const idxI of membersI) {
      for (const idxJ of membersJ) {
        sumSim += simMatrix[idxI][idxJ];
      }
    }

    return sumSim / (membersI.length * membersJ.length);
  }

  private calculateCentroid(members: EmbeddedSignal[]): number[] {
    const dim = members[0].embedding.length;
    const centroid = new Array(dim).fill(0);
    for (const m of members) {
      for (let i = 0; i < dim; i++) {
        centroid[i] += m.embedding[i];
      }
    }
    for (let i = 0; i < dim; i++) {
      centroid[i] /= members.length;
    }
    return centroid;
  }

  /**
   * Centroid와 가장 가까우면서 볼륨 가중치(GSC 수치)가 반영된 대표 질문 선정
   */
  private selectRepresentative(members: EmbeddedSignal[], centroid: number[]): EmbeddedSignal {
    let bestRep = members[0];
    let maxScore = -1;

    for (const m of members) {
      const sim = this.cosineSimilarity(m.embedding, centroid);
      // 볼륨 점수 정규화 (10,000 기준 대수 비례 보정)
      const volumeScore = Math.log(m.volume + 1) / Math.log(10000);
      // 복합 스코어 = 유사도 * 0.7 + 볼륨 가중치 * 0.3
      const score = sim * 0.7 + volumeScore * 0.3;

      if (score > maxScore) {
        maxScore = score;
        bestRep = m;
      }
    }

    return bestRep;
  }

  private calculateAverageSimilarity(members: EmbeddedSignal[], simMatrix: number[][], allSignals: EmbeddedSignal[]): number {
    if (members.length <= 1) return 1.0;
    let sum = 0;
    let count = 0;

    for (let i = 0; i < members.length; i++) {
      const idxI = allSignals.findIndex(s => s.id === members[i].id);
      for (let j = i + 1; j < members.length; j++) {
        const idxJ = allSignals.findIndex(s => s.id === members[j].id);
        sum += simMatrix[idxI][idxJ];
        count++;
      }
    }

    return count > 0 ? sum / count : 1.0;
  }

  /**
   * Silhouette Coefficient 산출 (-1 ~ 1)
   */
  private calculateSilhouetteScores(clusters: QuestionCluster[], allSignals: EmbeddedSignal[], assignments: number[]): void {
    const n = allSignals.length;
    if (n <= 1) return;

    for (const cluster of clusters) {
      let clusterSilSum = 0;
      let memberCount = 0;

      for (const m of cluster.signals) {
        const idx = allSignals.findIndex(s => s.id === m.id);
        if (idx === -1) continue;

        // a(i): 동일 클러스터 내 멤버들과의 평균 거리
        const currentClusterIdx = assignments[idx];
        let innerDistSum = 0;
        let innerCount = 0;

        for (let k = 0; k < n; k++) {
          if (k !== idx && assignments[k] === currentClusterIdx) {
            innerDistSum += (1.0 - this.cosineSimilarity(allSignals[idx].embedding, allSignals[k].embedding));
            innerCount++;
          }
        }
        const a_i = innerCount > 0 ? innerDistSum / innerCount : 0;

        // b(i): 다른 클러스터 중 가장 가까운 클러스터와의 평균 거리
        let minOuterDist = Infinity;
        const totalUniqueClusters = new Set(assignments).size;

        for (let c = 0; c < totalUniqueClusters; c++) {
          if (c === currentClusterIdx) continue;

          let outerDistSum = 0;
          let outerCount = 0;

          for (let k = 0; k < n; k++) {
            if (assignments[k] === c) {
              outerDistSum += (1.0 - this.cosineSimilarity(allSignals[idx].embedding, allSignals[k].embedding));
              outerCount++;
            }
          }
          if (outerCount > 0) {
            const avgOuter = outerDistSum / outerCount;
            if (avgOuter < minOuterDist) {
              minOuterDist = avgOuter;
            }
          }
        }
        const b_i = minOuterDist === Infinity ? 0 : minOuterDist;

        // s(i) = (b(i) - a(i)) / max(a(i), b(i))
        const maxAB = Math.max(a_i, b_i);
        const s_i = maxAB > 0 ? (b_i - a_i) / maxAB : 0;

        clusterSilSum += s_i;
        memberCount++;
      }

      cluster.silhouetteScore = memberCount > 0 ? Number((clusterSilSum / memberCount).toFixed(4)) : 0;
    }
  }

  /**
   * 종합적 클러스터 품질 메트릭 산출
   */
  public static calculateQualityMetrics(clusters: QuestionCluster[]): ClusterQualityMetrics {
    if (clusters.length === 0) return { silhouetteScore: 0, calinskiHarabaszIndex: 0, totalClusters: 0 };

    const avgSilhouette = clusters.reduce((s, c) => s + c.silhouetteScore, 0) / clusters.length;
    
    // Calinski-Harabasz Index 근사치 산출 (클러스터 간 분산 대비 클러스터 내 분산 비율)
    let wcss = 0; // Within-Cluster Sum of Squares
    let bcss = 0; // Between-Cluster Sum of Squares (대표 질문 간 편차)

    const repEmbeddings: number[][] = [];
    for (const c of clusters) {
      wcss += (1.0 - c.avgSimilarity) * c.signals.length;
      repEmbeddings.push(c.centroid);
    }

    if (repEmbeddings.length > 1) {
      // 대표 클러스터들 간의 평균 거리 합산
      let sumOuter = 0;
      let count = 0;
      for (let i = 0; i < repEmbeddings.length; i++) {
        for (let j = i + 1; j < repEmbeddings.length; j++) {
          let dot = 0.0, normA = 0.0, normB = 0.0;
          for (let k = 0; k < repEmbeddings[i].length; k++) {
            dot += repEmbeddings[i][k] * repEmbeddings[j][k];
            normA += repEmbeddings[i][k] * repEmbeddings[i][k];
            normB += repEmbeddings[j][k] * repEmbeddings[j][k];
          }
          const sim = normA && normB ? dot / (Math.sqrt(normA) * Math.sqrt(normB)) : 0;
          sumOuter += (1.0 - sim);
          count++;
        }
      }
      bcss = count > 0 ? sumOuter / count : 0;
    }

    const chIndex = wcss > 0 ? (bcss / (clusters.length - 1)) / (wcss / (100 - clusters.length)) : 0;

    return {
      silhouetteScore: Number(avgSilhouette.toFixed(4)),
      calinskiHarabaszIndex: Number(chIndex.toFixed(4)),
      totalClusters: clusters.length
    };
  }
}
