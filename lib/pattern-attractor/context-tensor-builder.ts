import { getAIProvider } from '../ai/ai-provider';
import { ContextTensor, ChannelType } from './types';

export class ContextTensorBuilder {
  // LLM-based 7-axis context extraction
  static async buildFromQuery(
    query: string,
    domainSlug: string,
    channelType: ChannelType,
    additionalContext?: Record<string, string>
  ): Promise<ContextTensor> {
    const ai = getAIProvider();

    const prompt = `You are a Pattern Attractor Context Tensor Builder.
Analyze the user query and extract context dimensions to form a 7-axis Context Tensor.

Inputs:
- Query: "${query}"
- Domain Slug: "${domainSlug}"
- Channel Type: "${channelType}"
- Additional context (JSON): ${JSON.stringify(additionalContext || {})}

Extract these axes:
1. domain: The domain slug.
2. user_state: Natural language description of user state/situation (e.g. "active ingredient beginner", "irritated skin", "elderly traveler with family").
3. risk_state: The risk level (low, medium, high, uncertain). If there are symptoms of irritation, procedure, or safety concerns, classify as "medium" or "high".
4. intent_state: Natural language user intent (e.g. "continue retinol decision", "rainy day course alternative", "price packaging comparison").
5. evidence_state: What kind of evidence or sources are needed (e.g. "safety disclaimer", "official attraction info", "pricing breakdown").
6. time_state: Temporal factors if any (e.g. "post-clinic 72h", "rainy day", "first visit", "none").
7. channel_state: The channel type (must be exactly "${channelType}").

Return the output matching the requested schema.`;

    const schema = {
      type: "OBJECT",
      properties: {
        domain: { type: "STRING" },
        user_state: { type: "STRING" },
        risk_state: { type: "STRING", enum: ["low", "medium", "high", "uncertain"] },
        intent_state: { type: "STRING" },
        evidence_state: { type: "STRING" },
        time_state: { type: "STRING" },
        channel_state: { type: "STRING", enum: ["homepage", "answer_card", "chatbot", "cardnews", "ad", "sales_script", "llm_txt"] }
      },
      required: ["domain", "user_state", "risk_state", "intent_state", "evidence_state", "time_state", "channel_state"]
    };

    try {
      const tensor = await ai.generateStructuredOutput<ContextTensor>(prompt, schema, { temperature: 0.1 });
      return {
        domain: tensor.domain || domainSlug,
        user_state: tensor.user_state || 'unknown',
        risk_state: tensor.risk_state || 'medium',
        intent_state: tensor.intent_state || 'informational',
        evidence_state: tensor.evidence_state || 'none',
        time_state: tensor.time_state || 'none',
        channel_state: tensor.channel_state || channelType
      };
    } catch (err) {
      console.warn("LLM Context Tensor extraction failed, returning fallback tensor", err);
      // Fallback
      return {
        domain: domainSlug,
        user_state: 'default_visitor',
        risk_state: 'medium',
        intent_state: 'general_inquiry',
        evidence_state: 'general',
        time_state: 'none',
        channel_state: channelType
      };
    }
  }

  // Convert existing QVS results to tensor
  static fromQvsResult(qvsResult: any, domainSlug: string): ContextTensor {
    const isYmyl = qvsResult.is_ymyl || false;
    const gateStatus = qvsResult.gate_status || 'Watch';
    
    let risk_state: 'low' | 'medium' | 'high' | 'uncertain' = 'low';
    if (isYmyl || gateStatus === 'No-Go') {
      risk_state = 'high';
    } else if (gateStatus === 'Watch') {
      risk_state = 'medium';
    }

    return {
      domain: domainSlug,
      user_state: 'mined_question_state',
      risk_state,
      intent_state: qvsResult.intent || 'informational',
      evidence_state: 'supported_evidence',
      time_state: 'none',
      channel_state: 'answer_card'
    };
  }
}
