export interface HubFeedbackPayload {
  version: string;
  region: string;
  hub_domain_id: string;
  date: string;
  search_patterns: SearchPattern[];
  top_cqs: TopCQ[];
  arena_top_answers: ArenaTopAnswer[];
  diagnosis_summary?: DiagnosisSummary;
}

export interface SearchPattern {
  query: string;
  tco: Record<string, string>;
  at_ctx: Record<string, string>;
  matched_count: number;
  resolved: boolean;
  cta_clicks?: Record<string, number>;
}

export interface TopCQ {
  bsw_question_id: string;
  question_text: string;
  view_count_24h: number;
  arena_thread_reply_count: number;
}

export interface ArenaTopAnswer {
  thread_title: string;
  best_layer: string;
  elo_score: number;
  helpful_ratio: number;
}

export interface DiagnosisSummary {
  avg_readiness: number;
  merchants_diagnosed: number;
  top_deficit_axis: string;
}

export interface FeedbackProcessResult {
  newSignals: number;
  cpsUpdated: number;
  errors: string[];
}
