"use server";

import crypto from "crypto";
import { getSupabaseAdminClient } from "../../lib/supabase";
import { checkWorkspacePermission } from "../../lib/auth";
import { 
  questionSignalSchema,
  questionCapitalNodeSchema,
  canonicalQuestionSchema,
  qisSceneSchema,
  tcoConceptSchema,
  brandOntologyNodeSchema,
  brandOntologyEdgeSchema,
  conceptRelationSchema,
  conceptOperatorSchema,
  claimNodeSchema,
  lineageRecordSchema
} from "../../lib/schema";
import { SignalOrchestrator } from "../../lib/signal-collection/orchestrator";

const SIMULATED_USER_ID = "00000000-0000-0000-0000-000000000001";

/**
 * 0. Run Upstream Pipeline
 */
export async function runUpstreamPipeline(workspaceId: string, domainName: string, brandName: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to run pipeline.");
  }

  // The orchestrator handles meta, chain, recursive, evaluate, and save.
  const result = await SignalOrchestrator.runFullPipeline(workspaceId, domainName, brandName);
  return result;
}

/**
 * 1. Create Question Signal
 */
export async function createQuestionSignal(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create question signals.");
  }

  const parsed = questionSignalSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("question_signals")
    .insert({
      workspace_id: parsed.workspace_id,
      query: parsed.query,
      volume: parsed.volume,
      intent: parsed.intent,
      status: parsed.status
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 2. Update Question Signal Status
 */
export async function updateQuestionSignalStatus(workspaceId: string, id: string, status: "mined" | "ignored" | "promoted") {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify question signals.");
  }

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from("question_signals")
    .update({ status })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 3. Promote Signal to Question Capital Node
 */
export async function promoteSignalToQuestionCapital(workspaceId: string, signalId: string, territoryTitle: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to promote signals.");
  }

  const supabase = getSupabaseAdminClient();
  
  // 1. Fetch signal details
  const { data: signal, error: sigErr } = await supabase
    .from("question_signals")
    .select("query")
    .eq("id", signalId)
    .single();

  if (sigErr || !signal) throw new Error("Signal not found.");

  // 2. Promote to Capital Node
  const slug = territoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const { data: capitalNode, error: capErr } = await supabase
    .from("question_capital_nodes")
    .insert({
      workspace_id: workspaceId,
      title: territoryTitle,
      slug,
      strategic_weight: 1.0
    })
    .select()
    .single();

  if (capErr || !capitalNode) throw new Error(`Promotion Failed: ${capErr?.message}`);

  // 3. Mark signal status as promoted
  await updateQuestionSignalStatus(workspaceId, signalId, "promoted");

  // Write audit trail record for critical mutation
  await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    user_id: SIMULATED_USER_ID,
    action: "PROMOTE_SIGNAL_TO_CAPITAL",
    target_type: "question_capital_nodes",
    target_id: capitalNode.id,
    payload: { title: capitalNode.title }
  });

  return capitalNode;
}

/**
 * 3.1. Promote Multiple Signals to Question Capital Nodes
 */
export async function promoteMultipleSignalsToQuestionCapital(workspaceId: string, signalIds: string[], territoryTitle: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to promote signals.");
  }

  const supabase = getSupabaseAdminClient();
  
  // 1. Create a common Capital Node (or you could create one for each, but usually they go to one territory)
  const slug = territoryTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") + "-" + Date.now();
  const { data: capitalNode, error: capErr } = await supabase
    .from("question_capital_nodes")
    .insert({
      workspace_id: workspaceId,
      title: territoryTitle,
      slug,
      strategic_weight: 1.0
    })
    .select()
    .single();

  if (capErr || !capitalNode) throw new Error(`Promotion Failed: ${capErr?.message}`);

  // 2. Mark signal statuses as promoted
  await supabase
    .from("question_signals")
    .update({ status: "promoted" })
    .in("id", signalIds)
    .eq("workspace_id", workspaceId);

  // 3. Write audit trail
  await supabase.from("audit_events").insert({
    workspace_id: workspaceId,
    user_id: SIMULATED_USER_ID,
    action: "PROMOTE_MULTIPLE_SIGNALS",
    target_type: "question_capital_nodes",
    target_id: capitalNode.id,
    payload: { title: capitalNode.title, count: signalIds.length }
  });

  return capitalNode;
}

/**
 * 3.2. Update Multiple Question Signal Statuses (Batch Ignore/Promote)
 */
export async function updateMultipleQuestionSignalStatus(workspaceId: string, ids: string[], status: "mined" | "ignored" | "promoted") {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify question signals.");
  }

  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from("question_signals")
    .update({ status })
    .in("id", ids)
    .eq("workspace_id", workspaceId);

  if (error) throw new Error(`DB Error: ${error.message}`);
  return true;
}

/**
 * 4. Create Question Capital Node
 */
export async function createQuestionCapitalNode(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create strategic question nodes.");
  }

  const parsed = questionCapitalNodeSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("question_capital_nodes")
    .insert({
      workspace_id: parsed.workspace_id,
      title: parsed.title,
      slug: parsed.slug,
      strategic_weight: parsed.strategic_weight,
      parent_id: parsed.parent_id
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 5. Update Question Capital Node
 */
export async function updateQuestionCapitalNode(workspaceId: string, id: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify strategic question nodes.");
  }

  const parsed = questionCapitalNodeSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("question_capital_nodes")
    .update({
      title: parsed.title,
      slug: parsed.slug,
      strategic_weight: parsed.strategic_weight,
      parent_id: parsed.parent_id
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 6. Create Canonical Question (with unique signature constraint checks)
 */
export async function createCanonicalQuestion(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to define canonical questions.");
  }

  const parsed = canonicalQuestionSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  // Signature check inside Node server action to prevent duplicated inserts beforehand
  const { data: existing } = await supabase
    .from("canonical_questions")
    .select("id")
    .eq("workspace_id", workspaceId)
    .eq("signature", parsed.signature)
    .maybeSingle();

  if (existing) {
    throw new Error("DEDUPLICATION ERROR: A canonical question with matching semantic signature already exists.");
  }

  const { data: result, error } = await supabase
    .from("canonical_questions")
    .insert({
      workspace_id: parsed.workspace_id,
      question_capital_node_id: parsed.question_capital_node_id,
      normalized_question: parsed.normalized_question,
      slug: parsed.slug,
      signature: parsed.signature
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 7. Merge Canonical Questions (Deduplication resolving tool)
 */
export async function mergeCanonicalQuestions(workspaceId: string, targetCqId: string, sourceCqIds: string[]) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to merge canonical questions.");
  }

  const supabase = getSupabaseAdminClient();

  // 1. Move all QIS scenes from source canonical questions to the target canonical question
  await supabase
    .from("qis_scenes")
    .update({ canonical_question_id: targetCqId })
    .in("canonical_question_id", sourceCqIds);

  // 2. Delete source canonical questions
  await supabase
    .from("canonical_questions")
    .delete()
    .in("id", sourceCqIds);

  return { success: true, mergedCount: sourceCqIds.length };
}

/**
 * 8. Create QIS Scene
 */
export async function createQisScene(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create QIS scenes.");
  }

  const parsed = qisSceneSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  // Ensure CQ is referenced
  if (!parsed.canonical_question_id) {
    throw new Error("DEPENDENCY BLOCK: QIS Scenes must link to a valid Canonical Question.");
  }

  const { data: result, error } = await supabase
    .from("qis_scenes")
    .insert({
      workspace_id: parsed.workspace_id,
      canonical_question_id: parsed.canonical_question_id,
      scene_name: parsed.scene_name,
      query_template: parsed.query_template,
      intent_model: parsed.intent_model,
      scenario_context: parsed.scenario_context,
      risk_level: parsed.risk_level
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 9. Update QIS Scene
 */
export async function updateQisScene(workspaceId: string, id: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify QIS scenes.");
  }

  const parsed = qisSceneSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("qis_scenes")
    .update({
      scene_name: parsed.scene_name,
      query_template: parsed.query_template,
      intent_model: parsed.intent_model,
      scenario_context: parsed.scenario_context,
      risk_level: parsed.risk_level
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 10. Create TCO Concept
 */
export async function createTcoConcept(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to define TCO Concepts.");
  }

  const parsed = tcoConceptSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("tco_concepts")
    .insert({
      workspace_id: parsed.workspace_id,
      concept_name: parsed.concept_name,
      slug: parsed.slug,
      definition: parsed.definition,
      is_strategic: parsed.is_strategic,
      concept_type: parsed.concept_type,
      operational_fields: parsed.operational_fields
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 11. Update TCO Concept
 */
export async function updateTcoConcept(workspaceId: string, id: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify TCO Concepts.");
  }

  const parsed = tcoConceptSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("tco_concepts")
    .update({
      concept_name: parsed.concept_name,
      slug: parsed.slug,
      definition: parsed.definition,
      is_strategic: parsed.is_strategic,
      concept_type: parsed.concept_type,
      operational_fields: parsed.operational_fields
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 12. Create Ontology Node
 */
export async function createOntologyNode(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to write ontology graph nodes.");
  }

  const parsed = brandOntologyNodeSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("brand_ontology_nodes")
    .insert({
      workspace_id: parsed.workspace_id,
      node_name: parsed.node_name,
      node_type: parsed.node_type,
      reference_id: parsed.reference_id
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 13. Create Ontology Edge
 */
export async function createOntologyEdge(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to write ontology graph paths.");
  }

  const parsed = brandOntologyEdgeSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  // Cross-workspace and existence verification checks to secure multi-tenant isolation
  const { data: sourceNode } = await supabase
    .from("brand_ontology_nodes")
    .select("id, workspace_id")
    .eq("id", parsed.source_node_id)
    .maybeSingle();

  const { data: targetNode } = await supabase
    .from("brand_ontology_nodes")
    .select("id, workspace_id")
    .eq("id", parsed.target_node_id)
    .maybeSingle();

  if (!sourceNode || !targetNode) {
    throw new Error("KG INTEGRITY ERROR: Source or Target node not found");
  }

  if (sourceNode.workspace_id !== workspaceId || targetNode.workspace_id !== workspaceId) {
    throw new Error("SECURITY VIOLATION: Cross-workspace ontology edge mutation blocked");
  }

  const { data: result, error } = await supabase
    .from("brand_ontology_edges")
    .insert({
      workspace_id: parsed.workspace_id,
      source_node_id: parsed.source_node_id,
      target_node_id: parsed.target_node_id,
      relation_type: parsed.relation_type
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 14. Create Concept Relation
 */
export async function createConceptRelation(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to relate TCO Concepts.");
  }

  const parsed = conceptRelationSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("concept_relations")
    .insert({
      workspace_id: parsed.workspace_id,
      source_concept_id: parsed.source_concept_id,
      target_concept_id: parsed.target_concept_id,
      relation_name: parsed.relation_name
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 15. Create Concept Operator
 */
export async function createConceptOperator(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to define concept operators.");
  }

  const parsed = conceptOperatorSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("concept_operators")
    .insert({
      workspace_id: parsed.workspace_id,
      concept_id: parsed.concept_id,
      operator_name: parsed.operator_name,
      logic_rules: parsed.logic_rules
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 16. Create Claim Node
 */
export async function createClaimNode(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create claim nodes.");
  }

  const parsed = claimNodeSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("claim_nodes")
    .insert({
      workspace_id: parsed.workspace_id,
      operational_truth_id: parsed.operational_truth_id,
      claim_summary: parsed.claim_summary
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 17. Update Claim Node
 */
export async function updateClaimNode(workspaceId: string, id: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "content_editor"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to modify claim nodes.");
  }

  const parsed = claimNodeSchema.parse({ ...data, workspace_id: workspaceId, id });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("claim_nodes")
    .update({
      operational_truth_id: parsed.operational_truth_id,
      claim_summary: parsed.claim_summary
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 18. Create Lineage Record
 */
export async function createLineageRecord(workspaceId: string, data: any) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "evidence_reviewer"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to write lineage records.");
  }

  const parsed = lineageRecordSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("lineage_records")
    .insert({
      workspace_id: parsed.workspace_id,
      claim_node_id: parsed.claim_node_id,
      evidence_item_id: parsed.evidence_item_id,
      boundary_rule_id: parsed.boundary_rule_id,
      is_publishable: parsed.is_publishable,
      verification_signature: parsed.verification_signature
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 19. Evaluate Claim Lineage Completeness (Claim-Evidence-Boundary trace check)
 * Verifies if a factual claim node has both a verified evidence pdf linked,
 * and if risk is critical/high, checks that a boundary rule is attached.
 * If valid, hashes the trace values into a cryptographic system verification signature seal.
 */
export async function evaluateLineageCompleteness(workspaceId: string, claimNodeId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "evidence_reviewer"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to trigger lineage evaluation checks.");
  }

  const supabase = getSupabaseAdminClient();
  const blockers: string[] = [];

  // 1. Fetch the target Claim Node details
  const { data: claimNode, error: claimErr } = await supabase
    .from("claim_nodes")
    .select("id, operational_truth_id, claim_summary")
    .eq("id", claimNodeId)
    .single();

  if (claimErr || !claimNode) throw new Error("Claim Node not found.");

  // 2. Fetch parent Operational Truth risk level
  const { data: operTruth } = await supabase
    .from("brand_operational_truths")
    .select("risk_level, claim")
    .eq("id", claimNode.operational_truth_id)
    .single();

  const riskLevel = operTruth?.risk_level || "medium";

  // 3. Query the lineage record mapped to this claim node
  const { data: lineage } = await supabase
    .from("lineage_records")
    .select("id, evidence_item_id, boundary_rule_id")
    .eq("claim_node_id", claimNodeId)
    .maybeSingle();

  if (!lineage) {
    throw new Error("Lineage record missing for this claim node.");
  }

  // 4. Verify Evidence Item presence and validation status
  if (!lineage.evidence_item_id) {
    blockers.push("Lineage Blocker: Factual claim node lacks clinical evidence referencing.");
  } else {
    const { data: evidence } = await supabase
      .from("evidence_items")
      .select("is_verified, title")
      .eq("id", lineage.evidence_item_id)
      .single();

    if (!evidence || !evidence.is_verified) {
      blockers.push(`Lineage Blocker: Linked evidence document "${evidence?.title || 'Unknown'}" has not been verified.`);
    }
  }

  // 5. Verify Boundary Rule presence if the risk level is high or critical
  if (riskLevel === "high" || riskLevel === "critical") {
    if (!lineage.boundary_rule_id) {
      blockers.push(`Lineage Blocker: Claim is marked as ${riskLevel} risk, but lacks a mandatory safety Boundary Rule.`);
    } else {
      const { data: rule } = await supabase
        .from("boundary_rules")
        .select("is_active, rule_name")
        .eq("id", lineage.boundary_rule_id)
        .single();

      if (!rule || !rule.is_active) {
        blockers.push(`Lineage Blocker: Linked safety boundary rule "${rule?.rule_name || 'Unknown'}" is inactive.`);
      }
    }
  }

  const isPublishable = blockers.length === 0;
  let signature: string | null = null;

  // 6. Generate cryptographic seal hash if passed
  if (isPublishable) {
    const rawString = `${claimNodeId}-${lineage.evidence_item_id}-${lineage.boundary_rule_id || 'no-boundary'}-signed`;
    signature = crypto.createHash("sha256").update(rawString).digest("hex");
  }

  // 7. Persist the lineage outcome back to the DB
  const { data: result, error: updateErr } = await supabase
    .from("lineage_records")
    .update({
      is_publishable: isPublishable,
      verification_signature: signature
    })
    .eq("id", lineage.id)
    .select()
    .single();

  if (updateErr) throw new Error(`DB Update failed: ${updateErr.message}`);
  return { 
    lineageId: lineage.id,
    isPublishable,
    blockers,
    verificationSignature: signature
  };
}

/**
 * 20. Evaluate Semantic Lineage Gate (QIS Safety and Action stage check)
 */
export async function evaluateSemanticLineageGate(workspaceId: string, qisSceneId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to trigger semantic lineage evaluation.");
  }

  const supabase = getSupabaseAdminClient();
  const blockers: string[] = [];

  // 1. Fetch QIS Scene
  const { data: qis, error: qisErr } = await supabase
    .from("qis_scenes")
    .select("scene_name, risk_level, intent_model")
    .eq("id", qisSceneId)
    .single();

  if (qisErr || !qis) throw new Error("QIS Scene not found.");

  // 2. High-Risk safety check (requires active boundary rules in workspace)
  if (qis.risk_level === "high" || qis.risk_level === "critical") {
    const { data: boundaryRules } = await supabase
      .from("boundary_rules")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("is_active", true);

    if (!boundaryRules || boundaryRules.length === 0) {
      blockers.push(`L2 QIS Blocker: High-risk QIS scene "${qis.scene_name}" lacks an active Boundary Rule in workspace.`);
    }
  }

  // 3. Action-Stage check (intent local/transactional requires active action policies in workspace)
  if (qis.intent_model === "local" || qis.intent_model === "transactional") {
    const { data: actionPolicies } = await supabase
      .from("action_policies")
      .select("id")
      .eq("workspace_id", workspaceId)
      .eq("is_allowed", true);

    if (!actionPolicies || actionPolicies.length === 0) {
      blockers.push(`L2 QIS Blocker: Action-stage QIS scene "${qis.scene_name}" lacks a mandatory Action Policy configuration.`);
    }
  }

  return {
    isPassed: blockers.length === 0,
    blockers
  };
}

/**
 * 21. Get Knowledge Graph Data
 * Compiles a unified representation of both the Brand Ontology layer (strategic, operational, observed claims, evidence, boundaries)
 * and the general Knowledge Graph / Claim Lineage elements on a single canvas, allowing overlapping layers.
 */
export async function getKnowledgeGraphData(workspaceId: string) {
  const isAuthorized = await checkWorkspacePermission(workspaceId, SIMULATED_USER_ID, [
    "owner", "admin", "brand_strategist", "semantic_architect", "executive_viewer"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to view the Knowledge Graph.");
  }

  const supabase = getSupabaseAdminClient();

  // 1. Fetch Brand Ontology Nodes
  const { data: ontologyNodes, error: onErr } = await supabase
    .from("brand_ontology_nodes")
    .select("id, node_name, node_type, reference_id")
    .eq("workspace_id", workspaceId);

  // 2. Fetch Brand Ontology Edges
  const { data: ontologyEdges, error: oeErr } = await supabase
    .from("brand_ontology_edges")
    .select("id, source_node_id, target_node_id, relation_type")
    .eq("workspace_id", workspaceId);

  if (onErr || oeErr) {
    throw new Error(`DB Error loading ontology graph: ${onErr?.message || oeErr?.message}`);
  }

  const nodesMap = new Map<string, any>();
  const links: any[] = [];

  // Map Ontology nodes
  if (ontologyNodes) {
    for (const node of ontologyNodes) {
      nodesMap.set(node.id, {
        id: node.id,
        label: node.node_name,
        type: node.node_type, // 'strategic_claim', 'operational_claim', 'evidence', etc.
        reference_id: node.reference_id,
        layer: 'ontology'
      });
    }
  }

  // Map Ontology edges
  if (ontologyEdges) {
    for (const edge of ontologyEdges) {
      links.push({
        id: edge.id,
        source: edge.source_node_id,
        target: edge.target_node_id,
        type: edge.relation_type,
        layer: 'ontology'
      });
    }
  }

  // 3. Fetch auxiliary entities to enrich the canvas and create the KG layer
  // Fetch CQs
  const { data: cqs } = await supabase
    .from("canonical_questions")
    .select("id, question_text, slug")
    .eq("workspace_id", workspaceId);

  // Fetch QIS Scenes
  const { data: qis } = await supabase
    .from("qis_scenes")
    .select("id, scene_name, risk_level")
    .eq("workspace_id", workspaceId);

  // Fetch TCO Concepts
  const { data: concepts } = await supabase
    .from("tco_concepts")
    .select("id, concept_name, category")
    .eq("workspace_id", workspaceId);

  // Hydrate KG Layer Nodes
  if (cqs) {
    for (const cq of cqs) {
      if (!nodesMap.has(cq.id)) {
        nodesMap.set(cq.id, {
          id: cq.id,
          label: cq.question_text,
          type: 'canonical_question',
          layer: 'kg'
        });
      }
    }
  }

  if (qis) {
    for (const scene of qis) {
      if (!nodesMap.has(scene.id)) {
        nodesMap.set(scene.id, {
          id: scene.id,
          label: scene.scene_name,
          type: 'qis_scene',
          layer: 'kg',
          details: { risk_level: scene.risk_level }
        });
      }
    }
  }

  if (concepts) {
    for (const concept of concepts) {
      if (!nodesMap.has(concept.id)) {
        nodesMap.set(concept.id, {
          id: concept.id,
          label: concept.concept_name,
          type: 'concept',
          layer: 'kg',
          details: { category: concept.category }
        });
      }
    }
  }

  // Establish links between KG entities if claim lineage references them
  // (In seeds, claim lineages connect claims to CQs and QIS, creating cross-layer overlaps!)
  const { data: lineages } = await supabase
    .from("lineage_records")
    .select("id, claim_node_id, evidence_item_id, boundary_rule_id, is_publishable");

  if (lineages) {
    for (const lin of lineages) {
      // Find matching ontology claim node
      const matchingClaimNode = ontologyNodes?.find(
        n => n.reference_id === lin.claim_node_id
      );

      if (matchingClaimNode) {
        // Link Claim to Evidence in Ontology if not already linked
        if (lin.evidence_item_id) {
          const matchingEvidenceNode = ontologyNodes?.find(
            n => n.reference_id === lin.evidence_item_id
          );
          if (matchingEvidenceNode) {
            links.push({
              id: `lin-ev-${lin.id}`,
              source: matchingClaimNode.id,
              target: matchingEvidenceNode.id,
              type: 'supported_by',
              layer: 'lineage',
              details: { is_publishable: lin.is_publishable }
            });
          }
        }

        // Link Claim to Boundary
        if (lin.boundary_rule_id) {
          const matchingBoundaryNode = ontologyNodes?.find(
            n => n.reference_id === lin.boundary_rule_id
          );
          if (matchingBoundaryNode) {
            links.push({
              id: `lin-bo-${lin.id}`,
              source: matchingClaimNode.id,
              target: matchingBoundaryNode.id,
              type: 'guarded_by',
              layer: 'lineage'
            });
          }
        }
      }
    }
  }

  return {
    nodes: Array.from(nodesMap.values()),
    links,
    stats: {
      nodeCount: nodesMap.size,
      edgeCount: links.length,
      conceptCount: concepts?.length || 0
    }
  };
}

