"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission, requireAuth, requireAuthOrDemo, checkWorkspacePermissionOrDemo } from "../../lib/auth";
import { 
  brandStrategicTruthSchema, 
  evidenceItemSchema, 
  boundaryRuleSchema, 
  questionCapitalNodeSchema, 
  canonicalQuestionSchema, 
  tcoConceptSchema, 
  vibeSpecSchema, 
  personaSpecSchema 
} from "../../lib/schema";


interface SyncResult {
  status: 'success' | 'error';
  syncedRecords: {
    brandTruth?: string;
    evidenceCount: number;
    boundaryCount: number;
    capitalCount: number;
    cqCount: number;
    conceptCount: number;
    vibeSpecCount: number;
    personaSpecCount: number;
  };
  lastSyncedAt: string;
}

/**
 * Mocks/Simulates the external API payload from AIHompyHub for a tenant.
 */
function mockFetchAIHompyHubData(tenantId: string, industry: string) {
  return {
    brand_profile: {
      brand_name: `MOCK-${industry.toUpperCase()}-BRAND`,
      strategic_intent: `AIHompyHub: Deliver best in class semantic coverage for ${industry} segment.`,
      claims: { strategic: `Top tier ${industry} provider` }
    },
    answer_cards: [
      {
        card_name: `Top-intent-answer-card-for-${industry}`,
        question_text: `이 업종(${industry})에서 가장 인기 있는 추천은 무엇인가요?`,
        unique_signature: `cq-aihompy-${tenantId.substring(0, 8)}-1`,
        demographics: ['general_public'],
        market_size: 15000
      }
    ],
    taxonomy_nodes: [
      {
        name: `${industry} core taxonomy concept`,
        slug: `${industry}-core-taxonomy-concept`,
        classification: 'standard_core'
      }
    ],
    trust_assets: [
      {
        name: `${industry} official ISO certification`,
        asset_type: 'certification',
        payload: { issuer: 'Global Standards Body', year: 2026 }
      }
    ],
    policy_cards: [
      {
        policy_name: `${industry} risk compliance boundary`,
        restrictions: ['cures chronic conditions', 'guarantees financial gains'],
        safety_disclaimers: ['Consult certified professionals.']
      }
    ],
    vibe_vector_7d: {
      vibe_name: `Balanced ${industry} Brand Vibe`,
      slug: `balanced-${industry}-brand-vibe`,
      vibe_ratios: { trustworthiness: 0.40, clarity: 0.30, warmth: 0.30 }
    },
    fit_archetypes: {
      archetype_name: `Helpful ${industry} Virtual Agent`,
      slug: `helpful-${industry}-virtual-agent`,
      tone_weights: { formal: 0.5, helpful: 0.5 },
      instructions: ['Be precise', 'Always cite sources']
    }
  };
}

/**
 * Triggers full tenant-to-workspace content synchronization.
 */
export async function syncTenantContent(bridgeId: string): Promise<SyncResult> {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch bridge details for authorization validation
  const { data: bridge, error: bridgeErr } = await supabase
    .from("tenant_workspace_bridge")
    .select("bsw_workspace_id")
    .eq("id", bridgeId)
    .single();

  if (bridgeErr || !bridge) {
    throw new Error(`BridgeNotFound: The bridge connection ${bridgeId} does not exist.`);
  }

  // 2. Security validation
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(
    bridge.bsw_workspace_id,
    userId,
    ["owner", "admin", "brand_strategist"]
  );
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permission to run synchronization.");
  }

  const { syncTenantContentCore } = await import("../../lib/db/sync-db");
  return syncTenantContentCore(bridgeId);
}
