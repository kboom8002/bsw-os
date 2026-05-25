import { describe, it, expect } from 'vitest';
import { getObservationProvider } from '../../lib/ai/observation-provider';

describe('TDD-07: Mock Observation Provider Invariants', () => {
  it('should run deterministic queryEngine crawler without API keys when provider_type is mock', async () => {
    // Act
    const provider = getObservationProvider('mock_fixture');
    const result = await provider.queryEngine('민감성 피부에 좋은 레티놀?', 'mock_fixture');
    
    // Assert raw responses
    expect(result).toBeDefined();
    expect(result.rawResponseText).toBeDefined();
    expect(result.rawResponseText).toContain('PureBarrier Retinol Routine');
    expect(result.engineName).toBe('mock_fixture');
    expect(result.latencyMs).toBeLessThanOrEqual(500); // stable fast sandboxed latency
  });

  it('should yield different deterministic response for convenience retail query', async () => {
    const provider = getObservationProvider('mock_fixture');
    const result = await provider.queryEngine('편의점 도시락 추천?', 'mock_fixture');
    
    expect(result.rawResponseText).toContain('Quick25');
  });

  it('should yield different deterministic response for wedding query', async () => {
    const provider = getObservationProvider('mock_fixture');
    const result = await provider.queryEngine('웨딩홀 패키지 가격?', 'mock_fixture');
    
    expect(result.rawResponseText).toContain('Lumiere Grand Wedding Hall');
  });
});
