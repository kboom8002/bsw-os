import { getSupabaseAdminClient } from '../supabase';
import { representationObjectSchema, semanticPageSchema } from '../schema';

/**
 * Core DB execution layer for creating a representation object.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createRepresentationObjectCore(workspaceId: string, data: any) {
  const parsed = representationObjectSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("representation_objects")
    .insert({
      workspace_id: parsed.workspace_id,
      object_name: parsed.object_name,
      slug: parsed.slug,
      object_type: parsed.object_type,
      qis_refs: parsed.qis_refs,
      claim_refs: parsed.claim_refs,
      concept_refs: parsed.concept_refs,
      evidence_refs: parsed.evidence_refs,
      boundary_refs: parsed.boundary_refs,
      raw_properties: parsed.raw_properties,
      readiness_status: parsed.readiness_status
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Core DB execution layer for composing a semantic page.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function composeSemanticPageCore(workspaceId: string, contractId: string, data: any) {
  const supabase = getSupabaseAdminClient();

  // 1. Fetch & Verify Contract is active and valid
  const { data: contract } = await supabase
    .from("surface_contracts")
    .select("is_valid, allowed_objects, required_blocks")
    .eq("id", contractId)
    .single();

  if (!contract) throw new Error("Surface Contract not found.");
  if (!contract.is_valid) {
    throw new Error("DEPENDENCY BLOCK: Cannot compose pages from an invalid or unvalidated Surface Contract.");
  }

  // 2. Fetch representation objects to inherit content facts
  const objectRefs: string[] = [];
  const qisRefs: string[] = [];
  const claimRefs: string[] = [];
  const conceptRefs: string[] = [];
  let visibleContent = `Visible Factual Specs: composed from contract. `;
  let sourceContent = `Source Trace Content: `;

  if (contract.allowed_objects && contract.allowed_objects.length > 0) {
    for (const objId of contract.allowed_objects) {
      const { data: obj } = await supabase
        .from("representation_objects")
        .select("id, object_name, raw_properties, qis_refs, claim_refs, concept_refs")
        .eq("id", objId)
        .single();

      if (obj) {
        objectRefs.push(obj.id);
        if (obj.qis_refs) qisRefs.push(...obj.qis_refs);
        if (obj.claim_refs) claimRefs.push(...obj.claim_refs);
        if (obj.concept_refs) conceptRefs.push(...obj.concept_refs);

        visibleContent += `[Ingredient Spec: ${obj.object_name} details: ${JSON.stringify(obj.raw_properties)}]. `;
        sourceContent += `[Source Object: ${obj.object_name} refs QIS: ${obj.qis_refs}]. `;
      }
    }
  }

  // 3. Compose Page Record
  const parsed = semanticPageSchema.parse({
    ...data,
    workspace_id: workspaceId,
    surface_contract_id: contractId,
    visible_content: visibleContent,
    source_content: sourceContent,
    object_refs: objectRefs,
    qis_refs: qisRefs,
    claim_refs: claimRefs,
    concept_refs: conceptRefs
  });

  const { data: page, error: pageErr } = await supabase
    .from("semantic_pages")
    .insert({
      workspace_id: parsed.workspace_id,
      surface_contract_id: parsed.surface_contract_id,
      page_title: parsed.page_title,
      slug: parsed.slug,
      meta_description: parsed.meta_description,
      visible_content: parsed.visible_content,
      source_content: parsed.source_content,
      object_refs: parsed.object_refs,
      qis_refs: parsed.qis_refs,
      claim_refs: parsed.claim_refs,
      concept_refs: parsed.concept_refs
    })
    .select()
    .single();

  if (pageErr || !page) throw new Error(`Page Composition Failed: ${pageErr?.message}`);

  // 4. Formulate Visual Page Sections
  // Create clinical facts section
  await supabase
    .from("page_sections")
    .insert({
      workspace_id: workspaceId,
      semantic_page_id: page.id,
      section_title: "Clinical Specifications & Formulations",
      section_type: "clinical_facts",
      content_body: page.visible_content,
      source_artifact_refs: { claimRefs, objectRefs }
    });

  // If safety_boundary is required, add safety boundary section
  if (contract.required_blocks.includes("safety_boundary")) {
    await supabase
      .from("page_sections")
      .insert({
        workspace_id: workspaceId,
        semantic_page_id: page.id,
        section_title: "Regulatory Safety Disclosures & Boundaries",
        section_type: "safety_boundary",
        content_body: "Warning: Apply only on intact outer skin stratum corneum barriers. Do not ingest.",
        source_artifact_refs: { boundaryRefs: ["rule-1"] }
      });
  }

  return page;
}
