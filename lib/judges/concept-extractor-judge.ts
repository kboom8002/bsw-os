import { getAIProvider } from '../ai/ai-provider';
import { getSupabaseAdminClient } from '../supabase';
import { BrandSSoTContext, ConceptExtractionResult, QBSItemContext } from './types';
import { MockJudgeProvider } from './mock-judge-provider';

export class ConceptExtractorJudge {
  /**
   * Run the Concept Extractor Judge for a specific probe run.
   */
  public async evaluate(
    workspaceId: string,
    probeRunId: string,
    brandSsot: BrandSSoTContext,
    qbsContext: QBSItemContext,
    responseText: string
  ): Promise<ConceptExtractionResult & { id: string }> {
    const supabase = getSupabaseAdminClient();
    const mode = process.env.AI_PROVIDER_MODE || 'mock';

    let result: ConceptExtractionResult;
    let rawOutput = '';

    const prompt = `You are a concept-fidelity judge for brand AI response evaluation.

Extract all concepts, relations, and claims from the AI response.
Match each concept against the Brand SSoT required concepts.

[Brand SSoT]
${JSON.stringify(brandSsot, null, 2)}

[Question]
${qbsContext.query_text}

[Required Concepts]
${JSON.stringify(qbsContext.required_concepts, null, 2)}

[AI Response]
${responseText}

Return JSON matching this schema:
{
  "extracted_concepts": [{
    "concept_id": "string",
    "label": "string",
    "present": boolean,
    "accuracy": 0 | 0.5 | 1,
    "matched_expression": "string or null",
    "rank": number,
    "evidence_bound": boolean,
    "distortion": boolean,
    "distortion_type": "string or null",
    "hallucinated": boolean,
    "confidence": number
  }],
  "extracted_relations": [{
    "source_concept_id": "string",
    "relation_type": "string",
    "target_concept_id": "string",
    "accuracy": number
  }],
  "extracted_claims": [{
    "claim_text": "string",
    "source_sentence": "string"
  }]
}`;

    if (mode === 'gemini') {
      try {
        const ai = getAIProvider();
        const schema = {
          type: 'OBJECT',
          properties: {
            extracted_concepts: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  concept_id: { type: 'STRING' },
                  label: { type: 'STRING' },
                  present: { type: 'BOOLEAN' },
                  accuracy: { type: 'NUMBER' },
                  matched_expression: { type: 'STRING', nullable: true },
                  rank: { type: 'INTEGER' },
                  evidence_bound: { type: 'BOOLEAN' },
                  distortion: { type: 'BOOLEAN' },
                  distortion_type: { type: 'STRING', nullable: true },
                  hallucinated: { type: 'BOOLEAN' },
                  confidence: { type: 'NUMBER' },
                },
                required: ['concept_id', 'label', 'present', 'accuracy', 'rank', 'evidence_bound', 'distortion', 'hallucinated', 'confidence'],
              },
            },
            extracted_relations: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  source_concept_id: { type: 'STRING' },
                  relation_type: { type: 'STRING' },
                  target_concept_id: { type: 'STRING' },
                  accuracy: { type: 'NUMBER' },
                },
                required: ['source_concept_id', 'relation_type', 'target_concept_id', 'accuracy'],
              },
            },
            extracted_claims: {
              type: 'ARRAY',
              items: {
                type: 'OBJECT',
                properties: {
                  claim_text: { type: 'STRING' },
                  source_sentence: { type: 'STRING' },
                },
                required: ['claim_text', 'source_sentence'],
              },
            },
          },
          required: ['extracted_concepts', 'extracted_relations', 'extracted_claims'],
        };

        result = await ai.generateStructuredOutput<ConceptExtractionResult>(prompt, schema, {
          temperature: 0.0,
          maxOutputTokens: 4096,
        });
        rawOutput = JSON.stringify(result);
      } catch (err: any) {
        console.error(`ConceptExtractorJudge live run failed, falling back to mock: ${err.message}`);
        result = MockJudgeProvider.getConceptExtractionMock(prompt);
        rawOutput = `[FALLBACK] ${JSON.stringify(result)}`;
      }
    } else {
      // Mock mode
      result = MockJudgeProvider.getConceptExtractionMock(prompt);
      rawOutput = JSON.stringify(result);
    }

    // Insert into DB
    const { data, error } = await supabase
      .from('concept_extraction_results')
      .insert({
        workspace_id: workspaceId,
        probe_run_id: probeRunId,
        extracted_concepts: result.extracted_concepts,
        extracted_relations: result.extracted_relations,
        extracted_claims: result.extracted_claims,
        judge_model: mode === 'gemini' ? 'gemini-2.5-flash' : 'mock_provider',
        judge_temperature: 0.0,
        raw_judge_output: rawOutput,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to save ConceptExtractor result: ${error.message}`);
    }

    return {
      ...result,
      id: data.id,
    };
  }
}
