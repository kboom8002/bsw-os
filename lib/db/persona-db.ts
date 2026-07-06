import { getSupabaseAdminClient } from '../supabase';
import { personaSpecSchema, vibeSpecSchema, vibeRatingEventSchema } from '../schema';
import { validatePersonaSpec } from '../../app/actions/persona';

/**
 * Validates vibe spec fields.
 */
function validateVibeSpec(spec: any) {
  if (!spec.target_vector || Object.keys(spec.target_vector).length === 0) {
    throw new Error("Validation Error: VibeSpec must carry a valid target_vector definition.");
  }
  const sum = Object.values(spec.target_vector).reduce((acc: number, v: any) => acc + Number(v), 0);
  if (Math.abs(sum - 100) > 0.01) {
    throw new Error(`Validation Error: VibeSpec target_vector percentages must sum to exactly 100%. Current sum: ${sum}%`);
  }
}

/**
 * Core DB execution layer for creating a Persona Spec.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createPersonaSpecCore(workspaceId: string, data: any) {
  validatePersonaSpec(data);
  const parsed = personaSpecSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("persona_specs")
    .insert({
      workspace_id: parsed.workspace_id,
      persona_name: parsed.persona_name,
      slug: parsed.slug,
      governance_layer: parsed.governance_layer,
      authority_scope: parsed.authority_scope,
      legal_guardrails: parsed.legal_guardrails,
      allowed_modes: parsed.allowed_modes,
      current_mode: parsed.current_mode,
      prompt_text: parsed.prompt_text,
      version: parsed.version
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Core DB execution layer for creating a Vibe Spec.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createVibeSpecCore(workspaceId: string, data: any) {
  validateVibeSpec(data);
  const parsed = vibeSpecSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("vibe_specs")
    .insert({
      workspace_id: parsed.workspace_id,
      vibe_name: parsed.vibe_name,
      slug: parsed.slug,
      target_vector: parsed.target_vector,
      anti_vibe_keywords: parsed.anti_vibe_keywords
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Core DB execution layer for creating a Vibe Rating Event.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createVibeRatingEventCore(workspaceId: string, data: any) {
  if (!data.evidence_item_id) {
    throw new Error("No evidence, no vibe score. The vibe rating event lacks a clinical evidence reference link.");
  }

  const supabase = getSupabaseAdminClient();
  
  const { data: evidence, error: evError } = await supabase
    .from("evidence_items")
    .select("is_verified")
    .eq("id", data.evidence_item_id)
    .single();

  if (evError || !evidence) {
    throw new Error("No evidence, no vibe score. The provided evidence_item_id does not reference an existing clinical evidence record.");
  }
  if (!evidence.is_verified) {
    throw new Error("No evidence, no vibe score. The linked evidence item must be actively VERIFIED first.");
  }

  const parsed = vibeRatingEventSchema.parse({ ...data, workspace_id: workspaceId });

  const { data: rating, error } = await supabase
    .from("vibe_rating_events")
    .insert({
      workspace_id: parsed.workspace_id,
      vibe_spec_id: parsed.vibe_spec_id,
      target_id: parsed.target_id,
      target_type: parsed.target_type,
      rating_scores: parsed.rating_scores,
      evidence_item_id: parsed.evidence_item_id
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);

  // 3. Update active Vibe Profile aggregated vectors
  const { data: ratings } = await supabase
    .from("vibe_rating_events")
    .select("rating_scores")
    .eq("target_id", parsed.target_id)
    .eq("target_type", parsed.target_type);

  const allRatings = ratings || [];
  let cSum = 0, wSum = 0, lSum = 0;
  for (const r of allRatings) {
    cSum += Number(r.rating_scores?.clinical || 0);
    wSum += Number(r.rating_scores?.warm || 0);
    lSum += Number(r.rating_scores?.luxury || 0);
  }
  const count = allRatings.length;
  const aggregated_vector = {
    clinical: count > 0 ? Number((cSum / count).toFixed(2)) : 0,
    warm: count > 0 ? Number((wSum / count).toFixed(2)) : 0,
    luxury: count > 0 ? Number((lSum / count).toFixed(2)) : 0
  };

  await supabase
    .from("vibe_profiles")
    .upsert({
      workspace_id: workspaceId,
      target_id: parsed.target_id,
      target_type: parsed.target_type,
      aggregated_vector
    }, { onConflict: "workspace_id,target_id,target_type" });

  return rating;
}
