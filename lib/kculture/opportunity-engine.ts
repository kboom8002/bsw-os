import { getSupabaseAdminClient } from '../supabase';

export interface GeneratedOpportunity {
  opportunity_type: 'product' | 'tourism' | 'content';
  title: string;
  description: string;
  target_market: string;
  target_microgroup: string;
  linked_concepts: string[];
  resonance_score: number;
  commercial_transferability: number;
  risk_score: number;
  recommended_actions: string[];
  source_evidence: any;
}

export class OpportunityEngine {
  /**
   * Generates tailored K-Culture opportunities by analyzing cultural concept vectors.
   */
  public static async generateOpportunities(
    workspaceId: string,
    domainPackId: string
  ): Promise<GeneratedOpportunity[]> {
    const supabase = getSupabaseAdminClient();

    // Fetch active concepts in the domain pack
    const { data: concepts, error } = await supabase
      .from('cultural_concepts')
      .select('*')
      .eq('workspace_id', workspaceId)
      .eq('domain_pack_id', domainPackId)
      .eq('status', 'active');

    if (error || !concepts || concepts.length === 0) {
      return [];
    }

    const opportunities: GeneratedOpportunity[] = [];

    // Analyze high marketability and high heritage concepts to couple them
    const productConcepts = concepts.filter(c => c.concept_type === 'ingredients' || c.concept_type === 'fermentation');
    const lifestyleConcepts = concepts.filter(c => c.concept_type === 'skincare_routine' || c.concept_type === 'food_culture' || c.concept_type === 'local_lifestyle');
    const traditionalConcepts = concepts.filter(c => c.concept_type === 'skincare_philosophy' || c.concept_type === 'wellness' || c.concept_type === 'traditional_heritage');

    // 1. Generate K-Product Opportunity
    if (productConcepts.length > 0) {
      const topProduct = productConcepts[0];
      const lifestyle = lifestyleConcepts[0] || topProduct;

      opportunities.push({
        opportunity_type: 'product',
        title: `Premium K-Heritage Active Daily Treatment: ${topProduct.preferred_label.ko} Blend`,
        description: `Combine the potent skin properties of ${topProduct.preferred_label.en} with a modern ${lifestyle.preferred_label.en} routine. Perfect for global consumers seeking clean, fast-acting skincare with authentic heritage.`,
        target_market: 'North America / EU',
        target_microgroup: 'Gen Z / Young Professionals seeking clean beauty',
        linked_concepts: [topProduct.concept_id, lifestyle.concept_id],
        resonance_score: 0.89,
        commercial_transferability: 0.92,
        risk_score: 0.12,
        recommended_actions: [
          `Formulate a daily lightweight essence linking ${topProduct.preferred_label.en} to clinical barrier restoration.`,
          `Highlight the local harvesting source to build trust and storytelling appeal.`,
          `Launch a social media micro-challenge showing glow transformation in 7 days.`
        ],
        source_evidence: {
          concept_weight: topProduct.commerce_vector?.marketability || 0.9,
          barrier_relevance: 'High'
        }
      });
    }

    // 2. Generate K-Tourism Opportunity
    if (traditionalConcepts.length > 0) {
      const topTrad = traditionalConcepts[0];
      const life = lifestyleConcepts[1] || lifestyleConcepts[0] || topTrad;

      opportunities.push({
        opportunity_type: 'tourism',
        title: `Authentic K-Healing Retreat: ${topTrad.preferred_label.ko} Mindfulness Trail`,
        description: `An immersive mindfulness experience matching ${topTrad.preferred_label.en} traditions with modern local culinary or outdoor activities (${life.preferred_label.en}). Tailored for global wellness travelers.`,
        target_market: 'Asia-Pacific / global wellness travelers',
        target_microgroup: 'Slow-travelers, cultural heritage enthusiasts',
        linked_concepts: [topTrad.concept_id, life.concept_id],
        resonance_score: 0.91,
        commercial_transferability: 0.85,
        risk_score: 0.08,
        recommended_actions: [
          `Partner with accredited local heritage providers to design a 3-day premium program.`,
          `Integrate seasonal organic culinary bansang menus tailored for health-conscious tourists.`,
          `Create visual media highlighting tranquil Hanok backdrops and slow-living philosophy.`
        ],
        source_evidence: {
          authenticity_index: topTrad.affective_vector?.authenticity || 0.95,
          healing_factor: 'Premium'
        }
      });
    }

    // 3. Generate K-Content Opportunity
    if (lifestyleConcepts.length > 0) {
      const topLife = lifestyleConcepts[0];
      const companion = concepts.find(c => c.concept_id !== topLife.concept_id) || topLife;

      opportunities.push({
        opportunity_type: 'content',
        title: `Global Viral Trend Blueprint: ${topLife.preferred_label.ko} Challenge`,
        description: `A creative social media campaign linking the authentic everyday routine of ${topLife.preferred_label.en} with relatable global consumer hooks (${companion.preferred_label.en}).`,
        target_market: 'Global Tik Tok & YouTube shorts users',
        target_microgroup: 'K-Culture fandom and lifestyle enthusiasts',
        linked_concepts: [topLife.concept_id, companion.concept_id],
        resonance_score: 0.94,
        commercial_transferability: 0.88,
        risk_score: 0.15,
        recommended_actions: [
          `Design a 15-second visual signature showing the transformation loop using ${topLife.preferred_label.en} expressions.`,
          `Collaborate with global lifestyle creators to adapt the term into their local language.`,
          `Include a clear call-to-action to experience the official Answer Card context.`
        ],
        source_evidence: {
          joy_index: topLife.affective_vector?.joy || 0.85,
          virality_score: 0.92
        }
      });
    }

    return opportunities;
  }
}
