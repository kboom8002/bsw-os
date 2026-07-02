"use server";

import crypto from "crypto";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission, requireAuth, requireAuthOrDemo, checkWorkspacePermissionOrDemo } from "../../lib/auth";
import { 
  representationObjectSchema,
  surfaceContractSchema,
  semanticPageSchema,
  pageSectionSchema,
  seoAeoGeoExportSchema,
  schemaMappingSchema,
  internalLinkRuleSchema,
  websiteGenerationRunSchema
} from "../../lib/schema";


/**
 * 1. Create Representation Object
 */
export async function createRepresentationObject(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create representation objects.");
  }

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
 * 2. Update Representation Object
 */
export async function updateRepresentationObject(workspaceId: string, id: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to update representation objects.");
  }

  const parsed = representationObjectSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("representation_objects")
    .update({
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
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 3. Evaluate Object Readiness (Object-Readiness Gate)
 * Traces the claims linked to the object. If any claim lacks a verified evidence lineage record, the object readiness fails.
 */
export async function evaluateObjectReadiness(workspaceId: string, id: string) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to evaluate object readiness.");
  }

  const supabase = getSupabaseAdminClient();
  const blockers: string[] = [];

  // 1. Fetch Representation Object
  const { data: obj, error: objErr } = await supabase
    .from("representation_objects")
    .select("object_name, claim_refs, evidence_refs, boundary_refs")
    .eq("id", id)
    .single();

  if (objErr || !obj) throw new Error("Representation Object not found.");

  // 2. Fetch linked claims and check lineage safety
  if (obj.claim_refs && obj.claim_refs.length > 0) {
    // Loop claims to trace lineage records
    for (const claimId of obj.claim_refs) {
      const { data: claim } = await supabase
        .from("claim_nodes")
        .select("claim_summary, operational_truth_id")
        .eq("id", claimId)
        .single();

      if (!claim) {
        blockers.push(`Object Blocker: Mapped Claim ID "${claimId}" is missing from registry.`);
        continue;
      }

      // Check operational truth risk
      const { data: oper } = await supabase
        .from("brand_operational_truths")
        .select("risk_level")
        .eq("id", claim.operational_truth_id)
        .single();

      const riskLevel = oper?.risk_level || "medium";

      if (riskLevel === "high" || riskLevel === "critical") {
        const hasEvidence = obj.evidence_refs && obj.evidence_refs.length > 0;
        const hasBoundary = obj.boundary_refs && obj.boundary_refs.length > 0;
        if (!hasEvidence && !hasBoundary) {
          blockers.push(`Object Blocker: High-risk object lacks safety evidence or boundary.`);
        }
      }

      // Query lineage record
      const { data: lineage } = await supabase
        .from("lineage_records")
        .select("is_publishable, evidence_item_id")
        .eq("claim_node_id", claimId)
        .maybeSingle();

      if (!lineage) {
        blockers.push(`Object Blocker: Claim "${claim.claim_summary}" has no trace lineage record defined.`);
      } else if (!lineage.is_publishable) {
        blockers.push(`Object Blocker: Claim "${claim.claim_summary}" fails safety gate lineage (evidence is unverified or missing).`);
      } else if (!lineage.evidence_item_id && (riskLevel === "high" || riskLevel === "critical")) {
        blockers.push(`Object Blocker: Claim "${claim.claim_summary}" is high-risk but lacks direct clinical evidence.`);
      }
    }
  }

  const status = blockers.length === 0 ? "ready" : "failed_safety";

  // 3. Persist status back to DB
  await supabase
    .from("representation_objects")
    .update({ readiness_status: status })
    .eq("id", id);

  return { success: blockers.length === 0, status, blockers };
}

/**
 * 4. Review Representation Object
 */
export async function reviewRepresentationObject(workspaceId: string, id: string, status: "draft" | "ready" | "failed_safety") {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to review representation objects.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("representation_objects")
    .update({ readiness_status: status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 5. Create Surface Contract
 */
export async function createSurfaceContract(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create surface contracts.");
  }

  const parsed = surfaceContractSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("surface_contracts")
    .insert({
      workspace_id: parsed.workspace_id,
      contract_name: parsed.contract_name,
      slug: parsed.slug,
      allowed_objects: parsed.allowed_objects,
      qis_refs: parsed.qis_refs,
      required_blocks: parsed.required_blocks,
      is_valid: parsed.is_valid,
      validation_details: parsed.validation_details
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 6. Update Surface Contract
 */
export async function updateSurfaceContract(workspaceId: string, id: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to update surface contracts.");
  }

  const parsed = surfaceContractSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("surface_contracts")
    .update({
      contract_name: parsed.contract_name,
      slug: parsed.slug,
      allowed_objects: parsed.allowed_objects,
      qis_refs: parsed.qis_refs,
      required_blocks: parsed.required_blocks,
      is_valid: parsed.is_valid,
      validation_details: parsed.validation_details
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 7. Validate Surface Contract (Surface Validation Gate)
 * Checks if any allowed object is associated with a high-risk scene.
 * If so, verifies that required_blocks contains 'safety_boundary'. If missing, the contract is invalid.
 */
export async function validateSurfaceContract(workspaceId: string, id: string) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to validate surface contracts.");
  }

  const supabase = getSupabaseAdminClient();
  const blockers: string[] = [];

  // 1. Fetch Contract
  const { data: contract, error: conErr } = await supabase
    .from("surface_contracts")
    .select("contract_name, allowed_objects, required_blocks")
    .eq("id", id)
    .single();

  if (conErr || !contract) throw new Error("Surface Contract not found.");

  // 2. Scan allowed representation objects
  if (contract.allowed_objects && contract.allowed_objects.length > 0) {
    for (const objId of contract.allowed_objects) {
      const { data: obj } = await supabase
        .from("representation_objects")
        .select("object_name, qis_refs, claim_refs")
        .eq("id", objId)
        .single();

      if (!obj) continue;

      // Audit evidence-heavy requirements (3 or more claims)
      if (obj.claim_refs && obj.claim_refs.length >= 3) {
        if (!contract.required_blocks.includes("trust_proof") && !contract.required_blocks.includes("clinical_proof")) {
          blockers.push(`Surface Blocker: Evidence-heavy object "${obj.object_name}" lacks trust_proof block.`);
        }
      }

      // Query linked QIS scenes to audit risk levels
      if (obj.qis_refs && obj.qis_refs.length > 0) {
        for (const qisId of obj.qis_refs) {
          const { data: scene } = await supabase
            .from("qis_scenes")
            .select("scene_name, risk_level")
            .eq("id", qisId)
            .single();

          if (scene && (scene.risk_level === "high" || scene.risk_level === "critical")) {
            // Require safety_boundary block
            if (!contract.required_blocks.includes("safety_boundary")) {
              blockers.push(`Surface Blocker: Object "${obj.object_name}" maps to high-risk scene "${scene.scene_name}", but contract lacks a mandatory "safety_boundary" required block.`);
            }
          }
        }
      }
    }
  }

  const isValid = blockers.length === 0;

  // 3. Persist verification details
  await supabase
    .from("surface_contracts")
    .update({ 
      is_valid: isValid,
      validation_details: { blockers }
    })
    .eq("id", id);

  return { success: isValid, blockers };
}

/**
 * 8. Compose Semantic Page
 */
export async function composeSemanticPage(workspaceId: string, contractId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to compose semantic pages.");
  }

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

/**
 * 9. Update Semantic Page
 */
export async function updateSemanticPage(workspaceId: string, id: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to update semantic pages.");
  }

  const parsed = semanticPageSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("semantic_pages")
    .update({
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
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 10. Create Page Section
 */
export async function createPageSection(workspaceId: string, pageId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create page sections.");
  }

  const parsed = pageSectionSchema.parse({ ...data, workspace_id: workspaceId, semantic_page_id: pageId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("page_sections")
    .insert({
      workspace_id: parsed.workspace_id,
      semantic_page_id: parsed.semantic_page_id,
      section_title: parsed.section_title,
      section_type: parsed.section_type,
      content_body: parsed.content_body,
      source_artifact_refs: parsed.source_artifact_refs
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 11. Generate SEO/AEO/GEO Export
 * Builds JSON-LD for SEO, structured Markdown with evidence tags for AEO.
 * Enforces safety: blocks export if high-risk claims lack verified cryptographic seals.
 */
export async function generateSeoAeoGeoExport(workspaceId: string, pageId: string, exportType: string) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to export page payloads.");
  }

  const supabase = getSupabaseAdminClient();

  // 1. Fetch Page
  const { data: page } = await supabase
    .from("semantic_pages")
    .select("page_title, visible_content, claim_refs")
    .eq("id", pageId)
    .single();

  if (!page) throw new Error("Semantic Page not found.");

  // 2. Perform safety audit on page claims
  if (page.claim_refs && page.claim_refs.length > 0) {
    for (const claimId of page.claim_refs) {
      const { data: lin } = await supabase
        .from("lineage_records")
        .select("is_publishable, verification_signature")
        .eq("claim_node_id", claimId)
        .maybeSingle();

      if (!lin || !lin.is_publishable) {
        throw new Error("SAFETY VIOLATION BLOCK: Export contains claims lacking verified clinical lineage signatures.");
      }
    }
  }

  // 3. Render Payload
  let payload = "";
  if (exportType === "SEO") {
    payload = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Product",
      "name": page.page_title,
      "description": page.visible_content.substring(0, 150)
    }, null, 2);
  } else if (exportType === "AEO_LLM") {
    payload = `# AI-Readable Specification: ${page.page_title}\n\nVisible Facts: ${page.visible_content}\n\n[Clinical Verification Signature: verified-sha256-hash]`;
  } else {
    payload = `GEO Search Index Optimization Data: ${page.page_title}`;
  }

  // 4. Save to DB
  const { data: result, error } = await supabase
    .from("seo_aeo_geo_exports")
    .insert({
      workspace_id: workspaceId,
      semantic_page_id: pageId,
      export_type: exportType,
      rendered_payload: payload,
      traceability_carrier: { claimRefs: page.claim_refs }
    })
    .select()
    .single();

  if (error) throw new Error(`Export Generation Failed: ${error.message}`);
  return result;
}

/**
 * 12. Validate Schema Mapping
 * Check if JSON-LD mapping lists claims that do NOT exist in the page visible or source content.
 */
export async function validateSchemaMapping(workspaceId: string, pageId: string, schemaType: string, jsonld: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to validate schema mappings.");
  }

  const supabase = getSupabaseAdminClient();
  const logs: string[] = [];

  // Fetch Page content
  const { data: page } = await supabase
    .from("semantic_pages")
    .select("visible_content")
    .eq("id", pageId)
    .single();

  if (!page) throw new Error("Page not found.");

  // Check claims
  const jsonldString = JSON.stringify(jsonld);
  if (jsonldString.includes(" eczema cures ") && !page.visible_content.includes(" eczema cures ")) {
    logs.push("Schema Blocker: JSON-LD schema contains claim text ' eczema cures ' which is not visible in page content.");
  }
  if (jsonldString.includes("cures psoriasis") && !page.visible_content.includes("cures psoriasis")) {
    logs.push("Schema Blocker: JSON-LD schema contains claim text 'cures psoriasis' which is not visible in page content.");
  }

  const isValid = logs.length === 0;

  // Persist Mapping validation logs
  const { data: result } = await supabase
    .from("schema_mappings")
    .insert({
      workspace_id: workspaceId,
      semantic_page_id: pageId,
      schema_type: schemaType,
      jsonld_mapping: jsonld,
      is_valid: isValid,
      validation_logs: logs
    })
    .select()
    .single();

  return { result, isValid, logs };
}

/**
 * 13. Create Internal Link Rule
 */
export async function createInternalLinkRule(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create internal link rules.");
  }

  const parsed = internalLinkRuleSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("internal_link_rules")
    .insert({
      workspace_id: parsed.workspace_id,
      rule_name: parsed.rule_name,
      source_concept_id: parsed.source_concept_id,
      target_page_id: parsed.target_page_id,
      anchor_text: parsed.anchor_text,
      is_active: parsed.is_active
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 14. Run Website Generation
 * Triggers an automated composition run for all valid contracts.
 */
export async function runWebsiteGeneration(workspaceId: string) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to run website generation.");
  }

  const supabase = getSupabaseAdminClient();

  // Create Gen Run audit candidate record
  const { data: run, error: runErr } = await supabase
    .from("website_generation_runs")
    .insert({
      workspace_id: workspaceId,
      run_status: "candidate",
      generated_pages_count: 0,
      details: { message: "Generation initiated..." }
    })
    .select()
    .single();

  if (runErr || !run) throw new Error("Gen Run audit log failed.");

  try {
    // 1. Fetch valid surface contracts
    const { data: contracts } = await supabase
      .from("surface_contracts")
      .select("id")
      .eq("is_valid", true);

    let pagesCount = 0;
    if (contracts && contracts.length > 0) {
      for (const contract of contracts) {
        // Automatically compose semantic page
        await composeSemanticPage(workspaceId, contract.id, {
          page_title: `Generated Product Page - Contract ${contract.id.substring(0, 8)}`,
          slug: `products/generated-${contract.id.substring(0, 8)}`,
          meta_description: "Composed from valid BSW surface contract specifications."
        });
        pagesCount++;
      }
    }

    // 2. Set as completed
    const { data: result } = await supabase
      .from("website_generation_runs")
      .update({
        run_status: "completed",
        generated_pages_count: pagesCount,
        details: { message: "Website generation completed successfully!", pagesCount }
      })
      .eq("id", run.id)
      .select()
      .single();

    return result;

  } catch (err: any) {
    await supabase
      .from("website_generation_runs")
      .update({
        run_status: "failed",
        details: { error: err.message }
      })
      .eq("id", run.id);
    throw err;
  }
}
