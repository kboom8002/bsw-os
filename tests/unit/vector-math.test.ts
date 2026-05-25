import { describe, it, expect } from 'vitest';
import { cosineSimilarity, euclideanDistance, absoluteDifferenceAlignment, recordToVector } from '../../lib/math/vector-math';

describe('Vector Math & Cosine Similarity tests (Phase 2)', () => {
  it('should calculate identical vector similarity as 1.0', () => {
    const a = [1, 0, 0];
    const b = [1, 0, 0];
    expect(cosineSimilarity(a, b)).toBe(1.0);
  });

  it('should calculate orthogonal vector similarity as 0.0', () => {
    const a = [1, 0, 0];
    const b = [0, 1, 0];
    expect(cosineSimilarity(a, b)).toBe(0.0);
  });

  it('should calculate identical normalized actual similarity properly', () => {
    const a = [3, 4, 0];
    const b = [6, 8, 0];
    // Both point in same direction, similarity should be 1.0
    expect(cosineSimilarity(a, b)).toBe(1.0);
  });

  it('should calculate Euclidean Distance correctly', () => {
    const a = [0, 3, 0];
    const b = [4, 0, 0];
    // Distance between (0,3) and (4,0) in 2D is 5.0 (Pythagorean)
    expect(euclideanDistance(a, b)).toBe(5.0);
  });

  it('should calculate standard absolute difference alignment', () => {
    const target = { clinical: 50, warm: 30, luxury: 20 };
    const actual = { clinical: 40, warm: 30, luxury: 30 };
    // Diff clinical = 10, warm = 0, luxury = 10. Sum = 20. Diff/2 = 10. Alignment = 100 - 10 = 90
    expect(absoluteDifferenceAlignment(target, actual)).toBe(90.00);
  });

  it('should translate record to vector array properly based on keys', () => {
    const record = { clinical: 50, warm: 30, luxury: 20 };
    const keys = ['clinical', 'warm', 'luxury'];
    const vec = recordToVector(record, keys);
    expect(vec).toEqual([50, 30, 20]);
  });
});
