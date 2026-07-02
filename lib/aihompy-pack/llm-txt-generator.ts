/**
 * lib/aihompy-pack/llm-txt-generator.ts
 *
 * AI 크롤러와 LLM이 기계 가독식으로 해설할 수 있는 구조화된 llm.txt 파일 생성기 (영문 최우선)
 */

import { getAIProvider } from '../ai/ai-provider';
import type { BusinessIntakeData } from './business-intake';

export class LlmTxtGenerator {
  /**
   * 소상공인 업체 정보와 솔리톤(llm_txt 채널) 정보를 융합해 llm.txt 콘텐츠를 영문으로 빌드합니다.
   */
  public static async generate(
    businessData: BusinessIntakeData,
    matchedAttractors: any[]
  ): Promise<string> {
    const ai = getAIProvider();

    const prompt = `You are a Search Engine Optimization (SEO) and Artificial Intelligence Engine Optimization (AEO/GEO) Specialist.
Analyze the business profile:
Name: ${businessData.business_name}
Type: ${businessData.industry_type}
Address: ${businessData.address}
Description: ${businessData.description}
Facilities: ${JSON.stringify(businessData.facilities)}
Active Attractors: ${attractorsInfo(matchedAttractors)}

Generate a highly structured "llms.txt" file in English.
Follow this format:

# {Business Name}

{Short, clear 2-sentence summary of the core brand value, positioning, and target customers}

## Core Information
- **Industry Type**: {Industry Type}
- **Address**: {Full Address}
- **Phone**: {Phone}
- **Hours**: {Operating Hours}

## Verifiable Contexts & Attractors
{List the active attractors (e.g. Rainy Day Comfort, Wheelchair Accessible, Child Friendly) and detail their verification facts such as dedicated parking slots count, no-threshold doors, or multilingual menus.}

## Menu & Pricing
{Markdown list of menu items and prices in KRW}

## Conversions & Actions
- To direct navigation / map: KakaoMap URL or similar
- To reserve: Naver Booking or contact via phone

Return the plain markdown content containing the above fields. No other text or explanation.`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${prompt}\n\nUser:\nGenerate llm.txt contents.`,
        {
          type: 'object',
          properties: {
            llm_txt_content: { type: 'string' }
          },
          required: ['llm_txt_content']
        },
        { temperature: 0.1 }
      );

      return response.llm_txt_content || this.generateFallback(businessData, matchedAttractors);
    } catch (err) {
      console.warn('[LlmTxtGenerator] Failed to generate llm.txt using AI, using fallback:', err);
      return this.generateFallback(businessData, matchedAttractors);
    }
  }

  private static generateFallback(businessData: BusinessIntakeData, matchedAttractors: any[]): string {
    const activeList = matchedAttractors.map(a => `- **${a.id}**: ${a.natural_definition}`).join('\n');
    return `# ${businessData.business_name}

${businessData.description}

## Core Information
- **Industry Type**: ${businessData.industry_type}
- **Address**: ${businessData.address}
- **Phone**: ${businessData.phone}
- **Hours**: ${businessData.business_hours}

## Active Attractors
${activeList}

## Menu Items
${businessData.menu_items.map(m => `- ${m.name}: ${m.price} KRW`).join('\n')}
`;
  }
}

function attractorsInfo(attractors: any[]): string {
  return attractors.map(a => {
    const rules = a.media_soliton_rule || {};
    return `ID: ${a.id}\nDefinition: ${a.natural_definition}\nllm_txt adaptation rule: ${rules.channel_adaptation_rules?.llm_txt || rules.core_proposition}`;
  }).join('\n\n');
}
