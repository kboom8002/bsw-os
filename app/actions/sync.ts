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

  // 1. Fetch bridge details
  const { data: bridge, error: bridgeErr } = await supabase
    .from("tenant_workspace_bridge")
    .select("*")
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

  // 3. Fetch external data from AIHompyHub
  const externalData = mockFetchAIHompyHubData(bridge.aihompy_tenant_id, bridge.aihompy_industry);
  const workspaceId = bridge.bsw_workspace_id;

  let syncedTruthId = "";
  let evidenceCount = 0;
  let boundaryCount = 0;
  let capitalCount = 0;
  let cqCount = 0;
  let conceptCount = 0;
  let vibeSpecCount = 0;
  let personaSpecCount = 0;

  try {
    // A. Sync Brand Truth (Strategic Statement)
    const parsedTruth = brandStrategicTruthSchema.parse({
      workspace_id: workspaceId,
      statement: externalData.brand_profile.strategic_intent,
      vision: externalData.brand_profile.claims.strategic,
      core_pillars: []
    });
    const { data: truthRecord } = await supabase
      .from("brand_strategic_truths")
      .upsert(parsedTruth, { onConflict: "workspace_id" })
      .select("id")
      .single();
    if (truthRecord) syncedTruthId = truthRecord.id;

    // B. Sync Trust Assets (Evidence)
    for (const asset of externalData.trust_assets) {
      const parsedEvidence = evidenceItemSchema.parse({
        workspace_id: workspaceId,
        title: asset.name,
        content: `AIHompyHub synced asset payload: ${JSON.stringify(asset.payload)}`,
        url: "",
        evidence_type: 'certificate',
        is_verified: true
      });
      await supabase
        .from("evidence_items")
        .upsert(parsedEvidence, { onConflict: "workspace_id,title" });
      evidenceCount++;
    }

    // C. Sync Policy Cards (Boundaries)
    for (const policy of externalData.policy_cards) {
      const parsedBoundary = boundaryRuleSchema.parse({
        workspace_id: workspaceId,
        rule_name: policy.policy_name,
        forbidden_terms: policy.restrictions,
        required_disclosures: policy.safety_disclaimers,
        risk_level: 'medium',
        is_active: true
      });
      await supabase
        .from("boundary_rules")
        .upsert(parsedBoundary, { onConflict: "workspace_id,rule_name" });
      boundaryCount++;
    }

    // D. Sync Answer Cards (Question Capital & Canonical Questions)
    for (const card of externalData.answer_cards) {
      const parsedCapital = questionCapitalNodeSchema.parse({
        workspace_id: workspaceId,
        title: card.card_name,
        slug: card.card_name.toLowerCase().replace(/[^a-z0-9-]/g, "-").replace(/-+/g, "-"),
        strategic_weight: 1
      });
      const { data: capRecord } = await supabase
        .from("question_capital_nodes")
        .upsert(parsedCapital, { onConflict: "workspace_id,slug" })
        .select("id")
        .single();

      if (capRecord) {
        capitalCount++;
        const parsedCq = canonicalQuestionSchema.parse({
          workspace_id: workspaceId,
          question_capital_node_id: capRecord.id,
          normalized_question: card.question_text,
          slug: card.unique_signature,
          signature: card.unique_signature
        });
        await supabase
          .from("canonical_questions")
          .upsert(parsedCq, { onConflict: "unique_signature" });
        cqCount++;
      }
    }

    // E. Sync Taxonomy Nodes (TCO Concepts)
    for (const node of externalData.taxonomy_nodes) {
      const parsedConcept = tcoConceptSchema.parse({
        workspace_id: workspaceId,
        concept_name: node.name,
        slug: node.slug,
        definition: `AIHompyHub synced taxonomy concept: ${node.name}`,
        concept_type: 'tco_domain_entity'
      });
      await supabase
        .from("tco_concepts")
        .upsert(parsedConcept, { onConflict: "workspace_id,slug" });
      conceptCount++;
    }

    // F. Sync Vibe Vector 7d (Vibe Spec)
    const parsedVibe = vibeSpecSchema.parse({
      workspace_id: workspaceId,
      vibe_name: externalData.vibe_vector_7d.vibe_name,
      slug: externalData.vibe_vector_7d.slug,
      vibe_ratios: externalData.vibe_vector_7d.vibe_ratios,
      evidence_links_count: 3
    });
    await supabase
      .from("vibe_specs")
      .upsert(parsedVibe, { onConflict: "workspace_id,slug" });
    vibeSpecCount++;

    // G. Sync Fit Archetypes (Persona Spec)
    const parsedPersona = personaSpecSchema.parse({
      workspace_id: workspaceId,
      persona_name: externalData.fit_archetypes.archetype_name,
      slug: externalData.fit_archetypes.slug,
      prompt_text: `System Prompt Instructions: ${externalData.fit_archetypes.instructions.join(", ")}`,
      governance_layer: { tone_weights: externalData.fit_archetypes.tone_weights }
    });
    await supabase
      .from("persona_specs")
      .upsert(parsedPersona, { onConflict: "workspace_id,slug" });
    personaSpecCount++;

    // 4. Update Bridge Status
    const now = new Date().toISOString();
    await supabase
      .from("tenant_workspace_bridge")
      .update({
        sync_status: 'active',
        last_synced_at: now
      })
      .eq("id", bridgeId);

    return {
      status: 'success',
      syncedRecords: {
        brandTruth: syncedTruthId,
        evidenceCount,
        boundaryCount,
        capitalCount,
        cqCount,
        conceptCount,
        vibeSpecCount,
        personaSpecCount
      },
      lastSyncedAt: now
    };
  } catch (error: any) {
    await supabase
      .from("tenant_workspace_bridge")
      .update({ sync_status: 'error' })
      .eq("id", bridgeId);

    throw new Error(`SyncFailed: Data synchronization aborted - ${error.message}`);
  }
}
