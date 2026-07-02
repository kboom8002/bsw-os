/**
 * lib/aihompy-pack/tier-config.ts
 *
 * AI홈피 팩 Basic, Pro, Premium 요금제 티어별 기능 제약 조건 구성
 */

export interface TierConfiguration {
  id: 'basic' | 'pro' | 'premium';
  name: string;
  price_krw: number;
  max_attractors: number;
  max_faq_count: number;
  active_channels: string[];
  features: {
    alt_text_generation: boolean;
    llm_txt_support: boolean;
    recomposition_support: boolean;
    gap_analysis_support: boolean;
    multi_language_support: boolean;
  };
}

export const TIER_CONFIGS: Record<'basic' | 'pro' | 'premium', TierConfiguration> = {
  basic: {
    id: 'basic',
    name: 'Basic - AI검색 기본 노출팩',
    price_krw: 29000,
    max_attractors: 2,
    max_faq_count: 5,
    active_channels: ['homepage', 'llm_txt'],
    features: {
      alt_text_generation: true,
      llm_txt_support: true,
      recomposition_support: false,
      gap_analysis_support: false,
      multi_language_support: false
    }
  },
  pro: {
    id: 'pro',
    name: 'Pro - Attractor Pack',
    price_krw: 59000,
    max_attractors: 6,
    max_faq_count: 10,
    active_channels: ['homepage', 'answer_card', 'chatbot', 'cardnews', 'ad', 'llm_txt'],
    features: {
      alt_text_generation: true,
      llm_txt_support: true,
      recomposition_support: true,
      gap_analysis_support: true,
      multi_language_support: false
    }
  },
  premium: {
    id: 'premium',
    name: 'Premium - Local GEO Pack',
    price_krw: 129000, // custom or strategic pricing
    max_attractors: 10,
    max_faq_count: 15,
    active_channels: ['homepage', 'answer_card', 'chatbot', 'cardnews', 'ad', 'sales_script', 'llm_txt'],
    features: {
      alt_text_generation: true,
      llm_txt_support: true,
      recomposition_support: true,
      gap_analysis_support: true,
      multi_language_support: true
    }
  }
};
