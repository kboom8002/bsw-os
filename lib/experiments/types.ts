export interface ExperimentComparison {
  experimentId: string;
  baseline: any;
  intervention: any;
  improvements: {
    metric: string;
    baseline_value: number;
    intervention_value: number;
    absolute_improvement: number;
    relative_improvement: number;
  }[];
  risk_reduction: number;
  summary: string;
}
