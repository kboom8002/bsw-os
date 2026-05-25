/**
 * Vector similarity and distance calculation helpers.
 */

/**
 * Calculates the Cosine Similarity between two arrays of numbers.
 * Formula: (A . B) / (||A|| * ||B||)
 * Returns a value between -1.0 and 1.0 (normally [0, 1] for positive vector dimensions).
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) {
    throw new Error(`Vector length mismatch or empty: A(${a.length}) vs B(${b.length})`);
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
  if (magnitude === 0) return 0;

  return parseFloat((dotProduct / magnitude).toFixed(6));
}

/**
 * Calculates Euclidean Distance between two arrays of numbers.
 */
export function euclideanDistance(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vector dimension mismatch for Euclidean Distance");
  }

  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const diff = a[i] - b[i];
    sum += diff * diff;
  }
  return parseFloat(Math.sqrt(sum).toFixed(6));
}

/**
 * Existing VPA Absolute Difference alignment metric formula.
 * Computes: 100 - (Absolute Difference Sum / 2)
 */
export function absoluteDifferenceAlignment(
  target: Record<string, number>,
  actual: Record<string, number>
): number {
  const keys = ['clinical', 'warm', 'luxury'];
  let diffSum = 0;

  for (const key of keys) {
    const t = target[key] ?? 0;
    const a = actual[key] ?? 0;
    diffSum += Math.abs(t - a);
  }

  // Cap at 0 to prevent negative values
  return parseFloat(Math.max(0, 100 - diffSum / 2).toFixed(2));
}

/**
 * Helper to translate a Record mapping to a sorted numerical array based on predefined keys.
 */
export function recordToVector(record: Record<string, number>, keys: string[]): number[] {
  return keys.map(k => record[k] ?? 0);
}

/**
 * Computes a pairwise similarity matrix for a set of high-dimensional vectors.
 */
export function pairwiseSimilarityMatrix(vectors: number[][]): number[][] {
  const size = vectors.length;
  const matrix: number[][] = Array.from({ length: size }, () => new Array(size).fill(0));

  for (let i = 0; i < size; i++) {
    for (let j = i; j < size; j++) {
      if (i === j) {
        matrix[i][j] = 1.0;
      } else {
        const sim = cosineSimilarity(vectors[i], vectors[j]);
        matrix[i][j] = sim;
        matrix[j][i] = sim; // Symmetric
      }
    }
  }

  return matrix;
}

/**
 * Computes the centroid vector (average vector) of multiple high-dimensional vectors.
 * Returns a normalized unit vector centroid.
 */
export function computeCentroid(vectors: number[][]): number[] {
  if (vectors.length === 0) {
    throw new Error('Cannot compute centroid of an empty vector array');
  }

  const dims = vectors[0].length;
  const centroid: number[] = new Array(dims).fill(0);

  // Sum up all coordinate axes
  for (const vec of vectors) {
    if (vec.length !== dims) {
      throw new Error('Vector dimension mismatch during centroid calculation');
    }
    for (let i = 0; i < dims; i++) {
      centroid[i] += vec[i];
    }
  }

  // Average
  const avgCentroid = centroid.map(val => val / vectors.length);

  // Normalize to unit vector
  let sumSq = 0;
  for (const val of avgCentroid) {
    sumSq += val * val;
  }
  const norm = Math.sqrt(sumSq);

  if (norm === 0) return avgCentroid;
  return avgCentroid.map(val => parseFloat((val / norm).toFixed(6)));
}

