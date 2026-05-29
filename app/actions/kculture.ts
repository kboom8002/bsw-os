"use server";

import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission } from "../../lib/auth";
import { 
  organizationSchema,
  organizationMembershipSchema,
  kcultureDomainPackSchema,
  culturalConceptSchema,
  culturalOpportunitySchema,
  humanReviewSchema
} from "../../lib/kculture/types";
import { seedKCultureForWorkspace } from "../../lib/kculture/domain-pack-registry";

const SIMULATED_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * 1. Upsert Organization
 */
export async function upsertOrganization(data: any) {
  const supabase = getSupabaseAdminClient();
  const parsed = organizationSchema.parse(data);

  const { data: result, error } = await supabase
    .from("organizations")
    .upsert({
      id: parsed.id || undefined,
      name: parsed.name,
      slug: parsed.slug,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 2. Join Organization (Add Membership)
 */
export async function joinOrganization(orgId: string, userId: string, role: 'owner' | 'admin' | 'member' | 'viewer') {
  const supabase = getSupabaseAdminClient();
  const parsed = organizationMembershipSchema.parse({
    organization_id: orgId,
    user_id: userId,
    role,
  });

  const { data: result, error } = await supabase
    .from("organization_memberships")
    .upsert({
      organization_id: parsed.organization_id,
      user_id: parsed.user_id,
      role: parsed.role,
      updated_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 3. Get Organizations for simulated/active user
 */
export async function getOrganizations() {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("organizations")
    .select(`
      *,
      organization_memberships!inner(user_id, role)
    `)
    .eq("organization_memberships.user_id", SIMULATED_USER_ID);

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 4. Assign Workspace to Organization
 */
export async function assignWorkspaceToOrganization(workspaceId: string, orgId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("workspaces")
    .update({ organization_id: orgId })
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 5. Set Workspace Module Type (hybrid, kculture, brand)
 */
export async function setWorkspaceModuleType(workspaceId: string, moduleType: 'brand' | 'kculture' | 'hybrid') {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("workspaces")
    .update({ module_type: moduleType })
    .eq("id", workspaceId)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 6. Seed Workspace K-Culture Domain Packs and Concepts
 */
export async function seedWorkspaceKCulture(workspaceId: string) {
  const supabase = getSupabaseAdminClient();
  const success = await seedKCultureForWorkspace(supabase, workspaceId);
  if (!success) {
    throw new Error("Failed to seed K-Culture domain packs.");
  }
  return { success: true };
}

/**
 * 7. Get Domain Packs
 */
export async function getDomainPacks(workspaceId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("domain_packs")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 8. Get Cultural Concepts
 */
export async function getCulturalConcepts(workspaceId: string, domainPackId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cultural_concepts")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("domain_pack_id", domainPackId);

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 9. Upsert Cultural Concept
 */
export async function upsertCulturalConcept(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify cultural concepts.");
  }

  const parsed = culturalConceptSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("cultural_concepts")
    .upsert({
      id: parsed.id || undefined,
      workspace_id: parsed.workspace_id,
      domain_pack_id: parsed.domain_pack_id,
      concept_id: parsed.concept_id,
      version: parsed.version,
      status: parsed.status,
      preferred_label: parsed.preferred_label,
      aliases: parsed.aliases,
      concept_type: parsed.concept_type,
      definition: parsed.definition,
      defining_attributes: parsed.defining_attributes,
      boundary_conditions: parsed.boundary_conditions,
      parent_concepts: parsed.parent_concepts,
      relation_edges: parsed.relation_edges,
      affective_vector: parsed.affective_vector,
      risk_vector: parsed.risk_vector,
      commerce_vector: parsed.commerce_vector,
      identity_vector: parsed.identity_vector,
      evidence_sources: parsed.evidence_sources,
      action_policies: parsed.action_policies,
      created_by: parsed.created_by || SIMULATED_USER_ID,
      reviewed_by: parsed.reviewed_by,
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 10. Get Cultural Opportunities
 */
export async function getCulturalOpportunities(workspaceId: string) {
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from("cultural_opportunities")
    .select("*")
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`DB Error: ${error.message}`);
  return data;
}

/**
 * 11. Upsert Cultural Opportunity
 */
export async function upsertCulturalOpportunity(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "observatory_analyst"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create opportunities.");
  }

  const parsed = culturalOpportunitySchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("cultural_opportunities")
    .upsert({
      id: parsed.id || undefined,
      workspace_id: parsed.workspace_id,
      domain_pack_id: parsed.domain_pack_id,
      opportunity_type: parsed.opportunity_type,
      title: parsed.title,
      description: parsed.description,
      target_market: parsed.target_market,
      target_microgroup: parsed.target_microgroup,
      linked_concepts: parsed.linked_concepts,
      resonance_score: parsed.resonance_score,
      commercial_transferability: parsed.commercial_transferability,
      risk_score: parsed.risk_score,
      recommended_actions: parsed.recommended_actions,
      source_evidence: parsed.source_evidence,
      status: parsed.status,
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 12. Submit Human Review Audit
 */
export async function submitHumanReview(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "evidence_reviewer"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to audit reviews.");
  }

  const parsed = humanReviewSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("human_reviews")
    .insert({
      workspace_id: parsed.workspace_id,
      object_type: parsed.object_type,
      object_id: parsed.object_id,
      reviewer_id: SIMULATED_USER_ID,
      review_status: parsed.review_status,
      comments: parsed.comments,
      correction_payload: parsed.correction_payload,
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);

  // If approved or corrected, update the target object's status accordingly
  if (parsed.review_status === "approved" || parsed.review_status === "corrected") {
    if (parsed.object_type === "cultural_concept") {
      await supabase
        .from("cultural_concepts")
        .update({
          status: "active",
          reviewed_by: SIMULATED_USER_ID,
          updated_at: new Date().toISOString(),
          ...(parsed.review_status === "corrected" ? parsed.correction_payload : {})
        })
        .eq("id", parsed.object_id);
    } else if (parsed.object_type === "opportunity") {
      await supabase
        .from("cultural_opportunities")
        .update({
          status: "approved",
          ...(parsed.review_status === "corrected" ? parsed.correction_payload : {})
        })
        .eq("id", parsed.object_id);
    }
  }

  return result;
}
