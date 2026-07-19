import { getAIProvider } from '../ai/ai-provider';
import { PatternAttractorSpec, ChannelType, MediaSolitonAsset } from './types';
import { PreservationChecker } from './preservation-checker';

export class MediaSolitonGenerator {
  private preservationChecker: PreservationChecker;

  constructor() {
    this.preservationChecker = new PreservationChecker();
  }

  // Generate multi-channel media solitons with mandatory cross-validation
  async generateForChannel(
    attractor: PatternAttractorSpec,
    channel: ChannelType
  ): Promise<MediaSolitonAsset> {
    const ai = getAIProvider();

    const prompt = `You are a Media Soliton Generator.
Your job is to convert a Pattern Attractor into channel-specific content while preserving the Core Proposition, Evidence Anchor, Vibe Signature, and CTA.

Pattern Attractor details:
- Natural Definition: "${attractor.natural_definition}"
- Core Proposition: "${attractor.media_soliton_rule?.core_proposition || ''}"
- Evidence Anchor: "${attractor.media_soliton_rule?.evidence_anchor || ''}"
- Vibe Signature: ${JSON.stringify(attractor.vibe_signature || {})}
- CTA Vector: "${attractor.media_soliton_rule?.cta_vector || ''}"
- Channel Rule: "${attractor.media_soliton_rule?.channel_adaptation_rules?.[channel] || ''}"

Target Channel: "${channel}"

Generate content for the "${channel}" channel following these rules:
- homepage: Hero section copy, heading, sub-heading, and call-to-action button text.
- answer_card: AEO/GEO optimized answer with a direct answer at the beginning, followed by reasoning and clear citation markers.
- chatbot: Natural dialog message asking follow-up questions or providing guidance based on risk level.
- cardnews: A sequence of 3 to 5 slide text elements, separated by "---".
- ad: A short, high-conversion ad copy with a safe claim (15-50 characters) and CTA text.
- sales_script: A conversation guide or script for customer support agents.
- llm_txt: A machine-readable, concise text defining the brand positioning for AI crawlers.

Return the result matching the requested schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        content: { type: "STRING" },
        metadata: {
          type: "OBJECT",
          properties: {
            word_count: { type: "INTEGER" },
            estimated_reading_time_sec: { type: "INTEGER" }
          },
          required: ["word_count", "estimated_reading_time_sec"]
        }
      },
      required: ["content", "metadata"]
    };

    try {
      const result = await ai.generateStructuredOutput<any>(prompt, schema, { temperature: 0.2 });
      const generatedContent = result.content || '';
      const metadata = result.metadata || { word_count: 0, estimated_reading_time_sec: 0 };

      // Cross-validate preservation via independent PreservationChecker
      // instead of trusting LLM self-evaluation scores
      const asset: MediaSolitonAsset = {
        channel,
        content: generatedContent,
        metadata,
        preservation_scores: {
          proposition_preserved: 0,
          evidence_preserved: 0,
          vibe_preserved: 0,
          cta_preserved: 0,
          overall: 0
        }
      };

      try {
        const crossValidation = await this.preservationChecker.checkPreservation(attractor, asset);
        asset.preservation_scores = {
          proposition_preserved: crossValidation.proposition_preserved ?? 0.5,
          evidence_preserved: crossValidation.evidence_preserved ?? 0.5,
          vibe_preserved: crossValidation.vibe_preserved ?? 0.5,
          cta_preserved: crossValidation.cta_preserved ?? 0.5,
          overall: crossValidation.overall ?? 0.5
        };

        // Log cross-validation issues for observability
        if (crossValidation.issues && crossValidation.issues.length > 0) {
          console.warn(`[MediaSoliton] Cross-validation issues for ${channel}:`, crossValidation.issues);
        }
      } catch (checkErr) {
        console.warn(`[MediaSoliton] PreservationChecker failed for ${channel}, using conservative defaults`, checkErr);
        // Conservative fallback — scores intentionally lower than LLM self-eval
        // to signal that cross-validation was unavailable
        asset.preservation_scores = {
          proposition_preserved: 0.6,
          evidence_preserved: 0.6,
          vibe_preserved: 0.6,
          cta_preserved: 0.6,
          overall: 0.6
        };
      }

      return asset;
    } catch (err) {
      console.error(`MediaSolitonGenerator failed for channel ${channel}, using fallback`, err);
      // Fallback: use channel adaptation rule or natural definition as content
      return {
        channel,
        content: attractor.media_soliton_rule?.channel_adaptation_rules?.[channel] || attractor.natural_definition,
        metadata: { word_count: 0, estimated_reading_time_sec: 0 },
        preservation_scores: {
          proposition_preserved: 0.5,
          evidence_preserved: 0.5,
          vibe_preserved: 0.5,
          cta_preserved: 0.5,
          overall: 0.5
        }
      };
    }
  }

  async generateAllChannels(
    attractor: PatternAttractorSpec
  ): Promise<MediaSolitonAsset[]> {
    const channels: ChannelType[] = ['homepage', 'answer_card', 'chatbot', 'cardnews', 'ad', 'sales_script', 'llm_txt'];
    return Promise.all(channels.map(channel => this.generateForChannel(attractor, channel)));
  }
}
