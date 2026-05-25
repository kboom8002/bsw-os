export interface EvalTraceContext {
  runId: string;
  workspaceId: string;
  probeQuestionId: string;
  lane: 'official' | 'manual_calibration';
  mode: 'cb_strict' | 'grounded';
}

export interface RawProviderOutput {
  providerName: string;
  rawJsonString: string;
  finishReason: string;
  tokenUsage: { prompt: number; completion: number };
  latencyMs: number;
}

export interface NormalizedRunnerOutput {
  status: 'SUCCESS' | 'PARTIAL_FAILED' | 'FAILED';
  answerText?: string;
  errorCode?: string;
  errorDetail?: string;
  citations?: string[];
  serpFeatures?: {
    hasKnowledgePanel: boolean;
    hasAiOverview: boolean;
    hasAnswerBox: boolean;
    organicPosition?: number;
  };
}


export interface NormalizedJudgeOutput {
  centered_brand_name: string | null;
  mentioned_brand_names: string[];
  centeredness_score: number;
  official_citation: boolean;
  source_mix_type: 'official' | 'third_party' | 'mixed' | 'unknown' | 'none';
  concept_transfer_score: number;
  concept_distortion_score: number;
  missing_concepts: string[];
  hallucinated_claims: string[];
  explanation_quality_score: number;
  trust_visible: boolean;
  boundary_visible: boolean;
  action_alignment_score: number;
  confidence: number;
  reasoning_summary: string;
}

export interface RunnerAdapter {
  providerName: string;
  executeStrictRun(
    promptPack: string,
    questionText: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedRunnerOutput }>;

  executeGroundedRun(
    promptPack: string,
    questionText: string,
    retrievedContext: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedRunnerOutput }>;
}

export interface JudgeAdapter {
  providerName: string;
  evaluateRunnerOutput(
    judgeRubric: string,
    expectedLayer: string,
    runnerOutputText: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedJudgeOutput }>;
}
