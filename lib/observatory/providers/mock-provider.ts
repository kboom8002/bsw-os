import { RunnerAdapter, JudgeAdapter, EvalTraceContext, RawProviderOutput, NormalizedRunnerOutput, NormalizedJudgeOutput } from './types';

export class MockProvider implements RunnerAdapter, JudgeAdapter {
  providerName = 'mock_provider';

  async executeStrictRun(
    promptPack: string,
    questionText: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedRunnerOutput }> {
    const raw: RawProviderOutput = {
      providerName: this.providerName,
      rawJsonString: JSON.stringify({ answer: "Mock Answer Text" }),
      finishReason: "stop",
      tokenUsage: { prompt: 150, completion: 200 },
      latencyMs: 120
    };

    // Determine mock responses based on question content
    let answerText = `Mock strict response for "${questionText}".`;
    if (questionText.toLowerCase().includes('http') || questionText.toLowerCase().includes('site') || questionText.toLowerCase().includes('link')) {
      answerText = `Mock strict response with official reference link: https://bsw-brand.com.`;
    }

    return {
      raw,
      normalized: {
        status: 'SUCCESS',
        answerText
      }
    };
  }

  async executeGroundedRun(
    promptPack: string,
    questionText: string,
    retrievedContext: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedRunnerOutput }> {
    const raw: RawProviderOutput = {
      providerName: this.providerName,
      rawJsonString: JSON.stringify({ answer: "Mock Grounded Answer" }),
      finishReason: "stop",
      tokenUsage: { prompt: 250, completion: 300 },
      latencyMs: 150
    };

    const answerText = `Grounded Answer based on: ${retrievedContext.substring(0, 100)}... Answer: BSW brand details are verified.`;

    return {
      raw,
      normalized: {
        status: 'SUCCESS',
        answerText
      }
    };
  }

  async evaluateRunnerOutput(
    judgeRubric: string,
    expectedLayer: string,
    runnerOutputText: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedJudgeOutput }> {
    const isCompetitor = runnerOutputText.toLowerCase().includes('competitor');
    const isCitation = runnerOutputText.toLowerCase().includes('http');

    let centered_brand_name: string | null = null;
    let mentioned_brand_names: string[] = [];
    let centeredness_score = 0.0;
    let concept_transfer_score = 0.5;
    let concept_distortion_score = 0.0;
    let explanation_quality_score = 0.5;

    if (runnerOutputText.toLowerCase().includes('bsw')) {
      centered_brand_name = 'BSW';
      mentioned_brand_names = ['BSW'];
      centeredness_score = 1.0;
      concept_transfer_score = 1.0;
      explanation_quality_score = 0.95;
    } else if (isCompetitor) {
      centered_brand_name = 'CompetitorA';
      mentioned_brand_names = ['CompetitorA', 'BSW'];
      centeredness_score = 0.3;
      concept_transfer_score = 0.4;
      concept_distortion_score = 0.3;
    }

    if (runnerOutputText.toLowerCase().includes('dark_pattern') || runnerOutputText.toLowerCase().includes('buy now')) {
      concept_distortion_score = 0.6;
    }

    const normalized: NormalizedJudgeOutput = {
      centered_brand_name,
      mentioned_brand_names,
      centeredness_score,
      official_citation: isCitation,
      source_mix_type: isCitation ? 'official' : 'none',
      concept_transfer_score,
      concept_distortion_score,
      missing_concepts: runnerOutputText.length > 20 ? [] : ['Core Topic Clarity'],
      hallucinated_claims: isCompetitor ? ['Competitor exaggerated ranking'] : [],
      explanation_quality_score,
      trust_visible: isCitation,
      boundary_visible: true,
      action_alignment_score: 0.9,
      confidence: 0.95,
      reasoning_summary: `Mock AI judge evaluated response. Centered: ${centered_brand_name}. Citation: ${isCitation}.`
    };

    const raw: RawProviderOutput = {
      providerName: this.providerName,
      rawJsonString: JSON.stringify(normalized),
      finishReason: "stop",
      tokenUsage: { prompt: 500, completion: 400 },
      latencyMs: 180
    };

    return {
      raw,
      normalized
    };
  }
}
