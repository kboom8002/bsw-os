import { ParameterValues, StatisticalProbeResult } from './statistical-prober';

export interface ToleranceBand {
  [axis: string]: [number, number]; // [lower_bound, upper_bound]
}

export interface DriftedAxis {
  axis: string;
  type: 'OVER' | 'UNDER';
  observed: number;
  expected_range: [number, number];
  delta: number;
  interpretation: string;
}

export interface VibeAlignmentResult {
  alignment_score: number; // 0~100
  drift_score: number; // 0~1 (lower is better)
  drifted_axes: DriftedAxis[];
}

export class VibeDriftDetector {
  /**
   * Detects drifts by comparing observed parameter distributions to expected tolerance bands.
   */
  detect(
    observedResult: StatisticalProbeResult,
    toleranceBand: ToleranceBand
  ): VibeAlignmentResult {
    const drifts: DriftedAxis[] = [];
    const axesToCheck = Object.keys(toleranceBand) as Array<keyof ParameterValues>;
    
    if (axesToCheck.length === 0) {
      return {
        alignment_score: 100,
        drift_score: 0,
        drifted_axes: []
      };
    }

    for (const axis of axesToCheck) {
      const distribution = observedResult.parameterDistributions[axis];
      if (!distribution) continue;

      const observed_value = distribution.mean;
      const [lower, upper] = toleranceBand[axis as string];

      if (observed_value < lower) {
        drifts.push({
          axis: axis as string,
          type: 'UNDER',
          observed: observed_value,
          expected_range: [lower, upper],
          delta: lower - observed_value,
          interpretation: `AI가 의도보다 이 축(${axis})의 톤이 부족합니다 (관측값: ${observed_value.toFixed(2)}, 하한: ${lower})`
        });
      } else if (observed_value > upper) {
        drifts.push({
          axis: axis as string,
          type: 'OVER',
          observed: observed_value,
          expected_range: [lower, upper],
          delta: observed_value - upper,
          interpretation: `AI가 의도보다 이 축(${axis})의 톤이 과도합니다 (관측값: ${observed_value.toFixed(2)}, 상한: ${upper})`
        });
      }
    }

    const alignment_score = ((axesToCheck.length - drifts.length) / axesToCheck.length) * 100;
    const drift_score = drifts.length / axesToCheck.length;

    return {
      alignment_score: Math.round(alignment_score),
      drift_score,
      drifted_axes: drifts
    };
  }
}
