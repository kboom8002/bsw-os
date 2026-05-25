import { RunnerAdapter, JudgeAdapter, EvalTraceContext, RawProviderOutput, NormalizedRunnerOutput, NormalizedJudgeOutput } from './types';

export class GeminiProvider implements RunnerAdapter, JudgeAdapter {
  providerName = 'gemini';

  private async callGeminiAPI(model: string, payload: any): Promise<any> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing GOOGLE_AI_API_KEY in environment.");
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Gemini API Error: ${err}`);
    }

    return response.json();
  }

  async executeStrictRun(
    promptPack: string,
    questionText: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedRunnerOutput }> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      // Graceful local/CI mock fallback
      return {
        raw: {
          providerName: this.providerName,
          rawJsonString: "{}",
          finishReason: "stop",
          tokenUsage: { prompt: 0, completion: 0 },
          latencyMs: 0
        },
        normalized: {
          status: 'SUCCESS',
          answerText: `Mock strict Gemini response for: ${questionText}.`
        }
      };
    }

    const start = Date.now();
    try {
      const payload = {
        contents: [
          {
            parts: [
              { text: `${promptPack}\n\nQuestion: ${questionText}` }
            ]
          }
        ],
        generationConfig: {
          temperature: 0.0
        }
      };
      const res = await this.callGeminiAPI('gemini-1.5-flash', payload);
      const latencyMs = Date.now() - start;

      const answerText = res.candidates?.[0]?.content?.parts?.[0]?.text || '';
      const tokenUsage = {
        prompt: res.usageMetadata?.promptTokenCount || 0,
        completion: res.usageMetadata?.candidatesTokenCount || 0
      };

      return {
        raw: {
          providerName: this.providerName,
          rawJsonString: JSON.stringify(res),
          finishReason: res.candidates?.[0]?.finishReason || 'stop',
          tokenUsage,
          latencyMs
        },
        normalized: {
          status: 'SUCCESS',
          answerText
        }
      };
    } catch (e: any) {
      return {
        raw: {
          providerName: this.providerName,
          rawJsonString: JSON.stringify({ error: e.message }),
          finishReason: "error",
          tokenUsage: { prompt: 0, completion: 0 },
          latencyMs: Date.now() - start
        },
        normalized: {
          status: 'FAILED',
          errorCode: 'gemini_run_error',
          errorDetail: e.message
        }
      };
    }
  }

  async executeGroundedRun(
    promptPack: string,
    questionText: string,
    retrievedContext: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedRunnerOutput }> {
    const userPrompt = `Retrieved Context:\n${retrievedContext}\n\nQuestion: ${questionText}`;
    return this.executeStrictRun(promptPack, userPrompt, context);
  }

  async evaluateRunnerOutput(
    judgeRubric: string,
    expectedLayer: string,
    runnerOutputText: string,
    context: EvalTraceContext
  ): Promise<{ raw: RawProviderOutput; normalized: NormalizedJudgeOutput }> {
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      // Graceful local/CI mock fallback
      const mockResult: NormalizedJudgeOutput = {
        centered_brand_name: runnerOutputText.toLowerCase().includes('bsw') ? 'BSW' : null,
        mentioned_brand_names: runnerOutputText.toLowerCase().includes('bsw') ? ['BSW'] : [],
        centeredness_score: runnerOutputText.toLowerCase().includes('bsw') ? 1.0 : 0.0,
        official_citation: runnerOutputText.toLowerCase().includes('http'),
        source_mix_type: runnerOutputText.toLowerCase().includes('http') ? 'official' : 'none',
        concept_transfer_score: 0.9,
        concept_distortion_score: 0.0,
        missing_concepts: [],
        hallucinated_claims: [],
        explanation_quality_score: 0.9,
        trust_visible: true,
        boundary_visible: true,
        action_alignment_score: 0.95,
        confidence: 0.95,
        reasoning_summary: "Mock fallback Gemini structured evaluation result."
      };
      return {
        raw: {
          providerName: this.providerName,
          rawJsonString: JSON.stringify(mockResult),
          finishReason: "stop",
          tokenUsage: { prompt: 0, completion: 0 },
          latencyMs: 0
        },
        normalized: mockResult
      };
    }

    const start = Date.now();
    try {
      const userText = `${judgeRubric}\n\nEvaluate the following answer according to the Expected Layer rules:\nExpected Layer: ${expectedLayer}\n\nAnswer to evaluate: ${runnerOutputText}`;
      const payload = {
        contents: [
          { parts: [{ text: userText }] }
        ],
        generationConfig: {
          temperature: 0.0,
          responseMimeType: "application/json"
        }
      };

      const res = await this.callGeminiAPI('gemini-1.5-flash', payload);
      const latencyMs = Date.now() - start;

      const parsedJson = JSON.parse(res.candidates?.[0]?.content?.parts?.[0]?.text || '{}');
      const tokenUsage = {
        prompt: res.usageMetadata?.promptTokenCount || 0,
        completion: res.usageMetadata?.candidatesTokenCount || 0
      };

      return {
        raw: {
          providerName: this.providerName,
          rawJsonString: JSON.stringify(res),
          finishReason: res.candidates?.[0]?.finishReason || 'stop',
          tokenUsage,
          latencyMs
        },
        normalized: parsedJson
      };
    } catch (e: any) {
      throw new Error(`Gemini Judge Evaluation failed: ${e.message}`);
    }
  }
}
