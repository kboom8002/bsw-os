/**
 * lib/aihompy-pack/homepage-composer.ts
 *
 * 어트랙터와 티어를 기반으로 소상공인 AI홈피 섹션을 조립하고 상황형 FAQ 등을 LLM으로 생성하는 컴포저
 */

import { getAIProvider } from '../ai/ai-provider';
import type { BusinessIntakeData } from './business-intake';

export interface HomepageSection {
  section_id: string;
  title: string;
  subtitle?: string;
  content: string;
  attractor_id?: string;
  section_type: 'hero' | 'situation' | 'faq' | 'accessibility' | 'cta' | 'map';
  order: number;
}

export class HomepageComposer {
  /**
   * 업체 기본 정보와 활성화된 어트랙터를 활용해 최종 AI홈피 웹사이트 구조를 빌드합니다.
   */
  public static async compose(
    businessData: BusinessIntakeData,
    matchedAttractors: any[],
    tier: 'basic' | 'pro' | 'premium'
  ): Promise<HomepageSection[]> {
    const sections: HomepageSection[] = [];
    let order = 1;

    // 1. Hero Section (기본 장착)
    sections.push({
      section_id: 'sec_hero',
      title: businessData.business_name,
      subtitle: businessData.description.split('.')[0] + '.',
      content: businessData.description,
      section_type: 'hero',
      order: order++
    });

    // 2. 상황형 어트랙터 섹션 매핑
    // basic은 상위 2개, pro는 상위 5개, premium은 전체 적용
    const maxSituationSections = tier === 'basic' ? 2 : tier === 'pro' ? 6 : 10;
    const applicable = matchedAttractors.slice(0, maxSituationSections);

    for (const attr of applicable) {
      const msRule = attr.media_soliton_rule || {};
      const rules = msRule.channel_adaptation_rules || {};
      const homepageText = rules.homepage || msRule.core_proposition || attr.natural_definition;

      sections.push({
        section_id: `sec_attr_${attr.id.replace(/\./g, '_')}`,
        title: attr.natural_definition.split(',')[0],
        subtitle: `이런 상황에 추천: ${attr.trigger_state?.user_question_patterns?.[0] || '맞춤 질문'}`,
        content: homepageText,
        attractor_id: attr.id,
        section_type: 'situation',
        order: order++
      });
    }

    // 3. 상세 정보 및 접근성/물류 섹션
    if (businessData.facilities.parking || businessData.facilities.wheelchair_access) {
      sections.push({
        section_id: 'sec_accessibility',
        title: '안심 오시는 길 & 편의 공간 정보',
        subtitle: '주차 및 배리어 프리 상세 가이드',
        content: `주차 정보: ${businessData.facilities.parking_detail || (businessData.facilities.parking ? '무료 주차 제공' : '주차 불가')}\n` +
                 `휠체어/유모차 진입: ${businessData.facilities.wheelchair_access ? '출입구 문턱 없음 (경사로 완비)' : '계단 진입 필요'}\n` +
                 `반려동물 동반: ${businessData.facilities.pet_allowed ? '동반 입장 가능' : '동반 불가'}`,
        section_type: 'accessibility',
        order: order++
      });
    }

    // 4. 상황별 FAQ 섹션 (LLM 생성)
    const faqCount = tier === 'basic' ? 5 : tier === 'pro' ? 10 : 15;
    const aiFaqs = await this.generateSituationalFAQ(businessData, applicable, faqCount);
    
    sections.push({
      section_id: 'sec_faq',
      title: '자주 묻는 질문 (AI 상황형 FAQ)',
      content: JSON.stringify(aiFaqs),
      section_type: 'faq',
      order: order++
    });

    // 5. CTA 및 지도 액션
    sections.push({
      section_id: 'sec_cta',
      title: '지금 방문하거나 예약하세요',
      content: JSON.stringify({
        primary_cta: businessData.industry_type === 'restaurant_cafe' ? '카카오맵 길찾기' : '실시간 예약 조회',
        secondary_ctas: ['전화 문의', '메뉴 보기'],
        phone: businessData.phone,
        address: businessData.address
      }),
      section_type: 'cta',
      order: order++
    });

    return sections;
  }

  /**
   * LLM을 사용해 업체의 맥락 속성과 활성화된 어트랙터를 융합한 1:1 상황형 FAQ를 자동 생성합니다.
   */
  public static async generateSituationalFAQ(
    businessData: BusinessIntakeData,
    attractors: any[],
    count: number
  ): Promise<Array<{ question: string; answer: string }>> {
    const ai = getAIProvider();

    const prompt = `You are a copywriting expert for small businesses.
Analyze this business profile:
Name: ${businessData.business_name}
Type: ${businessData.industry_type}
Description: ${businessData.description}
Facilities: ${JSON.stringify(businessData.facilities)}
Active Attractors: ${attractors.map(a => a.id).join(', ')}

Generate exactly ${count} realistic, helpful, situation-based FAQs (Korean) that customers actually ask when looking for specific conditions.
For example:
Q: "비 오는 날 아이랑 갈 만한가요?"
A: "네, 저희 매장은 실내 20대 규모 무료 주차장이 있어 비를 맞지 않고 들어올 수 있으며, 유모차 입구가 완만한 경사로로 되어 있고 원목 아기 의자 5대와 식기 세트가 구비되어 있습니다."

Ensure every answer is strictly grounded in the business facilities and details provided. Do not invent non-existent amenities.
Return a JSON array containing objects with keys: "question", "answer".`;

    try {
      const response = await ai.generateStructuredOutput<any>(
        `System:\n${prompt}\n\nUser:\nGenerate the FAQ list.`,
        {
          type: 'object',
          properties: {
            faqs: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  question: { type: 'string' },
                  answer: { type: 'string' }
                },
                required: ['question', 'answer']
              }
            }
          },
          required: ['faqs']
        },
        { temperature: 0.2 }
      );

      return response.faqs || [];
    } catch (err) {
      console.warn('[HomepageComposer] FAQ generation failed, returning base FAQs:', err);
      // Fallback
      return businessData.faq_entries.slice(0, count);
    }
  }

  /**
   * AI 크롤러와 접근성 스크린 리더용 이미지 Alt Text 자동 생성
   */
  public static async generateAltTexts(
    photos: BusinessIntakeData['photos'],
    businessName: string
  ): Promise<Array<{ url: string; alt_text: string }>> {
    const ai = getAIProvider();
    const results: Array<{ url: string; alt_text: string }> = [];

    for (const photo of photos) {
      const prompt = `Generate a descriptive, SEO/AEO-optimized alt text (Korean, 1-2 sentences) for an image of this business: "${businessName}".
Category: ${photo.category}
Image URL/Placeholder: ${photo.url}

Focus on explaining the accessibility features, interior cozy vibe, or food quality for search engine crawlers and visually impaired users.
Format: Return JSON object with key: "alt_text".`;

      try {
        const response = await ai.generateStructuredOutput<any>(
          `System:\n${prompt}\n\nUser:\nGenerate alt text.`,
          {
            type: 'object',
            properties: {
              alt_text: { type: 'string' }
            },
            required: ['alt_text']
          },
          { temperature: 0.1 }
        );
        results.push({ url: photo.url, alt_text: response.alt_text });
      } catch (err) {
        results.push({ url: photo.url, alt_text: `${businessName}의 ${photo.category} 관련 매장 사진` });
      }
    }

    return results;
  }
}
