import { getAIProvider } from '../ai/ai-provider';
import { PatternAttractorSpec, ChannelType, MediaSolitonAsset } from './types';

export class MediaSolitonGenerator {
  // Generate multi-channel media solitons
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
        },
        preservation_scores: {
          type: "OBJECT",
          properties: {
            proposition_preserved: { type: "NUMBER" },
            evidence_preserved: { type: "NUMBER" },
            vibe_preserved: { type: "NUMBER" },
            cta_preserved: { type: "NUMBER" },
            overall: { type: "NUMBER" }
          },
          required: ["proposition_preserved", "evidence_preserved", "vibe_preserved", "cta_preserved", "overall"]
        }
      },
      required: ["content", "metadata", "preservation_scores"]
    };

    try {
      const result = await ai.generateStructuredOutput<any>(prompt, schema, { temperature: 0.2 });
      return {
        channel,
        content: result.content || '',
        metadata: result.metadata || { word_count: 0, estimated_reading_time_sec: 0 },
        preservation_scores: result.preservation_scores || {
          proposition_preserved: 0.9,
          evidence_preserved: 0.9,
          vibe_preserved: 0.9,
          cta_preserved: 0.9,
          overall: 0.9
        }
      };
    } catch (err) {
      console.error(`MediaSolitonGenerator failed for channel ${channel}, using fallback`, err);
      // Fallback
      return {
        channel,
        content: attractor.media_soliton_rule?.channel_adaptation_rules?.[channel] || attractor.natural_definition,
        metadata: { word_count: 0, estimated_reading_time_sec: 0 },
        preservation_scores: {
          proposition_preserved: 0.8,
          evidence_preserved: 0.8,
          vibe_preserved: 0.8,
          cta_preserved: 0.8,
          overall: 0.8
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
