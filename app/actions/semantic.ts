"use server";

import crypto from "crypto";
import { getSupabaseAdminClient } from "../../lib/supabase";
import {  checkWorkspacePermission , requireAuth, requireAuthOrDemo, checkWorkspacePermissionOrDemo } from "../../lib/auth";
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


/**
 * 0. Run Upstream Pipeline
 */
export async function runUpstreamPipeline(
  workspaceId: string,
  domainName: string,
  brandName?: string,
  options?: { brandUSP?: string }
) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to run pipeline.");
  }

  // The orchestrator handles meta, chain, recursive, evaluate, and save.
  const result = await SignalOrchestrator.runFullPipeline(workspaceId, domainName, brandName, {
    brandUSP: options?.brandUSP
  });
  return result;
}

/**
 * 1. Create Question Signal
 */
export async function createQuestionSignal(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create question signals.");
  }

  const { createQuestionSignalCore } = await import("../../lib/db/semantic-db");
  return createQuestionSignalCore(workspaceId, data);
}

/**
 * 2. Update Question Signal Status
 */
export async function updateQuestionSignalStatus(workspaceId: string, id: string, status: "mined" | "ignored" | "promoted") {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
    user_id: userId,
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
    user_id: userId,
    action: "PROMOTE_MULTIPLE_SIGNALS",
    target_type: "question_capital_nodes",
    target_id: capitalNode.id,
    payload: { title: capitalNode.title, count: signalIds.length }
  });

  return capitalNode;
}

/**
 * 3.2a. Auto-Promote Signal to CQ Pipeline
 * Automated pipeline that promotes a single signal into a Question Capital Node,
 * creates a Canonical Question (with signature dedup), and optionally a QIS Scene.
 */
export async function autoPromoteSignalToCQ(
  workspaceId: string,
  signalId: string,
  options?: { autoCreateQisScene?: boolean }
): Promise<{ capitalNodeId: string; canonicalQuestionId: string; qisSceneId?: string }> {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to auto-promote signals.");
  }

  const { autoPromoteSignalToCQ: coreFn } = await import('./qis-bridge');
  return coreFn(workspaceId, signalId, options);
}

/**
 * 3.2b. Feed Benchmark Opportunities to Signals
 * Ingests opportunities discovered by OpportunityAnalyzer as new question signals.
 * Handles duplicates gracefully via individual try/catch per insert.
 */
export async function feedBenchmarkOpportunitiesToSignals(
  workspaceId: string,
  opportunities: Array<{ query: string; intent: string; source: string }>
): Promise<{ fedCount: number }> {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to feed benchmark opportunities.");
  }

  let fedCount = 0;

  for (const opp of opportunities) {
    try {
      await createQuestionSignal(workspaceId, {
        query: opp.query,
        volume: 0,
        intent: opp.intent || "informational",
        status: "mined"
      });
      fedCount++;
    } catch (err) {
      // Gracefully handle duplicates or individual insert failures
      console.warn(`[feedBenchmarkOpportunities] Skipped: ${(err as Error).message}`);
    }
  }

  return { fedCount };
}

/**
 * 3.2. Update Multiple Question Signal Statuses (Batch Ignore/Promote)
 */
export async function updateMultipleQuestionSignalStatus(workspaceId: string, ids: string[], status: "mined" | "ignored" | "promoted") {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to create QIS scenes.");
  }

  const { createQisSceneCore } = await import("../../lib/db/semantic-db");
  return createQisSceneCore(workspaceId, data);
}

/**
 * 9. Update QIS Scene
 */
export async function updateQisScene(workspaceId: string, id: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
      risk_level: parsed.risk_level,
      scene_type: parsed.scene_type,
      answer_text: parsed.answer_text,
      must_include: parsed.must_include,
      must_not_do: parsed.must_not_do,
      confidence_score: parsed.confidence_score
    })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 9.5. Generate AI Answer Card Draft for QIS Scene
 */
export async function generateQisSceneAnswer(workspaceId: string, sceneId: string) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "brand_strategist", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to generate QIS answers.");
  }

  const supabase = getSupabaseAdminClient();

  // 1. Fetch QIS Scene details
  const { data: scene, error: sceneErr } = await supabase
    .from("qis_scenes")
    .select("*")
    .eq("workspace_id", workspaceId)
    .eq("id", sceneId)
    .single();

  if (sceneErr || !scene) {
    throw new Error(`QIS Scene not found: ${sceneErr?.message || 'unknown'}`);
  }

  // 2. Fetch matched claim nodes
  const { data: claims } = await supabase
    .from("claim_nodes")
    .select("claim_summary")
    .eq("workspace_id", workspaceId)
    .limit(10);

  const claimTexts = (claims || []).map(c => c.claim_summary);

  // 3. Call Content Generator
  const { QisContentGenerator } = await import("../../lib/qis/content-generator");
  const result = await QisContentGenerator.generateAnswerCard({
    query: scene.query_template,
    intentModel: scene.intent_model,
    scenarioContext: scene.scenario_context,
    mustInclude: scene.must_include || [],
    mustNotDo: scene.must_not_do || [],
    claims: claimTexts,
    riskLevel: scene.risk_level,
  });

  // 4. Save to DB
  const { data: updated, error: updateErr } = await supabase
    .from("qis_scenes")
    .update({
      answer_text: result.answerText,
      confidence_score: result.confidence,
    })
    .eq("id", sceneId)
    .select()
    .single();

  if (updateErr) {
    throw new Error(`Failed to update answer draft: ${updateErr.message}`);
  }

  return updated;
}

/**
 * 10. Create TCO Concept
 */
export async function createTcoConcept(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to define TCO Concepts.");
  }

  const { createTcoConceptCore } = await import("../../lib/db/semantic-db");
  return createTcoConceptCore(workspaceId, data);
}

/**
 * 11. Update TCO Concept
 */
export async function updateTcoConcept(workspaceId: string, id: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to write ontology graph nodes.");
  }

  const { createOntologyNodeCore } = await import("../../lib/db/semantic-db");
  return createOntologyNodeCore(workspaceId, data);
}

/**
 * 13. Create Ontology Edge
 */
export async function createOntologyEdge(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
    "owner", "admin", "semantic_architect"
  ]);
  if (!isAuthorized) {
    throw new Error("UNAUTHORIZED: Insufficient permissions to write ontology graph paths.");
  }

  const { createOntologyEdgeCore } = await import("../../lib/db/semantic-db");
  return createOntologyEdgeCore(workspaceId, data);
}

/**
 * 14. Create Concept Relation
 */
export async function createConceptRelation(workspaceId: string, data: any) {
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
    .eq("workspace_id", workspaceId)
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
    .eq("workspace_id", workspaceId)
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
  const userId = await requireAuthOrDemo();

  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, [
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
    .select("id, normalized_question, slug")
    .eq("workspace_id", workspaceId);

  // Fetch QIS Scenes
  const { data: qis } = await supabase
    .from("qis_scenes")
    .select("id, scene_name, risk_level")
    .eq("workspace_id", workspaceId);

  // Fetch TCO Concepts
  const { data: concepts } = await supabase
    .from("tco_concepts")
    .select("id, concept_name, concept_type")
    .eq("workspace_id", workspaceId);

  // Hydrate KG Layer Nodes
  if (cqs) {
    for (const cq of cqs) {
      if (!nodesMap.has(cq.id)) {
        nodesMap.set(cq.id, {
          id: cq.id,
          label: cq.normalized_question,
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
          details: { concept_type: concept.concept_type }
        });
      }
    }
  }

  // Establish links between KG entities if claim lineage references them
  // (In seeds, claim lineages connect claims to CQs and QIS, creating cross-layer overlaps!)
  const { data: lineages } = await supabase
    .from("lineage_records")
    .select("id, claim_node_id, evidence_item_id, boundary_rule_id, is_publishable")
    .eq("workspace_id", workspaceId);

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

// ═══════════════════════════════════════════════════════════════
// 30. 업종-브랜드 기반 TCO 개념 AI 자동 도출 (실측 그라운딩 Phase A)
// ═══════════════════════════════════════════════════════════════

/**
 * 업종명과 브랜드명, 그리고 업종 표준 질문 패널 실측 데이터를 기반으로 핵심 운영 개념 15~25개를 자동 도출하고
 * tco_concepts 테이블에 일괄 등록합니다.
 */
export async function generateIndustryConcepts(
  workspaceId: string,
  industryName: string,
  brandName?: string,
  industryKey?: string
): Promise<{ created: number; concepts: Array<{ id: string; concept_name: string; definition: string }> }> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, ["owner", "admin", "semantic_architect"]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const { getAIProvider } = await import('../../lib/ai/ai-provider');
  const ai = getAIProvider();
  const supabase = getSupabaseAdminClient();

  // 1. 실측 데이터 수집 A-1: 업종 패널 표준 질문 로드 (146개 중 필터링)
  const { INDUSTRY_PANELS_DATA } = await import('../../db/seed/industry-panels/questions-data');
  const panel = industryKey ? INDUSTRY_PANELS_DATA[industryKey as keyof typeof INDUSTRY_PANELS_DATA] : null;
  
  let panelSummary = '';
  if (panel?.questions) {
    // intent별 대표 질문 5개만 압축하여 프롬프트 토큰 절약 (LLM-3 해결)
    const reps = panel.questions.slice(0, 8).map(q => 
      `- [${q.intent_context}/${q.layer}] ${q.question_text} (필수: ${q.must_include?.join(', ') || '없음'}, risk: ${q.risk_level})`
    );
    panelSummary = reps.join('\n');
  }

  // 2. 실측 데이터 수집 A-2: 벤치마크 최근 GAP 및 BLIND_SPOT 분석
  const { data: snapshots } = await supabase
    .from('industry_benchmark_snapshots')
    .select('auto_generated_signals')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(5);

  let gapSummary = '';
  if (snapshots && snapshots.length > 0) {
    const gaps: string[] = [];
    for (const snap of snapshots) {
      if (snap.auto_generated_signals) {
        const sigs = snap.auto_generated_signals as any[];
        gaps.push(...sigs.slice(0, 5).map(s => `- ${s.query} (source: ${s.source})`));
      }
    }
    gapSummary = gaps.slice(0, 10).join('\n');
  }

  // 3. 실측 데이터 수집 A-3: 실시간 검색 그라운딩
  const { SearchProviderFactory } = await import('../../lib/ai/search-provider-factory');
  let searchSummary = '';
  try {
    const searchRes = await SearchProviderFactory.runMultiEngine(`${industryName} 인기 검색어 및 선택 기준`, ['gemini_grounding']);
    const res = searchRes.results['gemini_grounding'];
    if (res?.citations) {
      searchSummary = res.citations.slice(0, 5).map((c: any) => `- ${c.title} (출처: ${c.domain})`).join('\n');
    }
  } catch (err: any) {
    console.warn('[Concepts Grounding] Search failed:', err.message);
  }

  const prompt = `You are a domain expert for the "${industryName}" industry${brandName ? ` (brand: ${brandName})` : ''}.
Based on the following ground truth measurement data, generate exactly 20 core operational concepts (TCO - Topic-Concept-Ontology) for content and search engine optimization strategy.

<grounding_data>
## 업종 표준 실측 패널 질문 (일부)
${panelSummary || '표준 패널 데이터 없음'}

## 벤치마크 검출된 GAP/BLIND_SPOT
${gapSummary || '최근 벤치마크 기회 없음'}

## 실시간 검색 최상위 인용 정보
${searchSummary || '검색 정보 없음'}
</grounding_data>

For each concept, provide:
- concept_name: 한국어 개념명 (2-6 words)
- definition: 한국어 정의 (1-2 sentences explaining why this concept matters for search visibility based on the grounding data)
- is_strategic: boolean (true if this is a high-impact differentiator)

Return JSON: { "concepts": [{ "concept_name": "...", "definition": "...", "is_strategic": true/false }] }`;

  const result = await ai.generateStructuredOutput<{ concepts: Array<{ concept_name: string; definition: string; is_strategic: boolean }> }>(
    prompt,
    {
      type: 'object',
      properties: {
        concepts: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              concept_name: { type: 'string' },
              definition: { type: 'string' },
              is_strategic: { type: 'boolean' }
            },
            required: ['concept_name', 'definition', 'is_strategic']
          }
        }
      },
      required: ['concepts']
    },
    { temperature: 0 } // 채점/분석 성격은 결정적
  );

  const created: Array<{ id: string; concept_name: string; definition: string }> = [];

  for (const c of (result.concepts || [])) {
    const rawSlug = c.concept_name.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)/g, '').slice(0, 60);
    const slug = industryKey ? `${industryKey}-${rawSlug}`.substring(0, 100) : rawSlug;

    // 중복 방지
    const { data: existing } = await supabase
      .from('tco_concepts')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', slug)
      .maybeSingle();

    if (existing) continue;

    const { data: inserted, error } = await supabase
      .from('tco_concepts')
      .insert({
        workspace_id: workspaceId,
        concept_name: c.concept_name,
        slug,
        definition: c.definition,
        is_strategic: c.is_strategic,
      })
      .select('id, concept_name, definition')
      .single();

    if (!error && inserted) created.push(inserted);
  }

  return { created: created.length, concepts: created };
}

// ═══════════════════════════════════════════════════════════════
// 31. 업종-브랜드 기반 온톨로지 KG 자동 구축 (실측 그라운딩 Phase B)
// ═══════════════════════════════════════════════════════════════

/**
 * 업종명과 도출된 TCO 핵심 개념, 패널 질문들을 기반으로 LLM이 핵심 엔티티를 명확히 식별(NER)하고
 * 일관성 검증을 거쳐 brand_ontology_nodes + brand_ontology_edges에 일괄 등록합니다.
 */
export async function generateIndustryOntology(
  workspaceId: string,
  industryName: string,
  brandName?: string,
  industryKey?: string
): Promise<{ nodesCreated: number; edgesCreated: number }> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, ["owner", "admin", "semantic_architect"]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const { getAIProvider } = await import('../../lib/ai/ai-provider');
  const ai = getAIProvider();
  const supabase = getSupabaseAdminClient();

  // 1. 기존 TCO 개념 로드
  const { data: existingConcepts } = await supabase
    .from('tco_concepts')
    .select('concept_name, definition')
    .eq('workspace_id', workspaceId)
    .limit(20);

  // 2. 패널 질문 로드 (NER 용도)
  const { INDUSTRY_PANELS_DATA } = await import('../../db/seed/industry-panels/questions-data');
  const panel = industryKey ? INDUSTRY_PANELS_DATA[industryKey as keyof typeof INDUSTRY_PANELS_DATA] : null;
  const panelQuestions = panel?.questions ? panel.questions.slice(0, 15).map(q => q.question_text).join('\n') : '';

  const prompt = `You are a knowledge graph architect for the "${industryName}" industry${brandName ? ` (brand: ${brandName})` : ''}.
Build a comprehensive, logically consistent ontology graph using the strategic concepts and panel questions.

<grounding_data>
## TCO 전략 개념 목록
${existingConcepts?.map(c => `- ${c.concept_name}: ${c.definition}`).join('\n') || '전략 개념 없음'}

## 핵심 패널 질문 (NER 개체 추출용)
${panelQuestions || '질문 데이터 없음'}
</grounding_data>

Build a comprehensive ontology graph with:
- 15-25 nodes representing key entities (products, services, concerns, processes, regulations)
- 20-40 edges representing relationships between these entities

Node types: "concept", "product", "service", "concern", "process", "regulation", "persona"
Edge types: "is_a", "part_of", "resolves_question", "causes", "requires", "competes_with", "regulates", "targets_persona"

Return JSON:
{
  "nodes": [{ "name": "한국어 엔티티명", "type": "concept|product|service|concern|process|regulation|persona" }],
  "edges": [{ "source": "노드명1", "target": "노드명2", "relation": "관계타입" }]
}`;

  const result = await ai.generateStructuredOutput<{
    nodes: Array<{ name: string; type: string }>;
    edges: Array<{ source: string; target: string; relation: string }>;
  }>(prompt, {
    type: 'object',
    properties: {
      nodes: {
        type: 'array',
        items: {
          type: 'object',
          properties: { name: { type: 'string' }, type: { type: 'string' } },
          required: ['name', 'type']
        }
      },
      edges: {
        type: 'array',
        items: {
          type: 'object',
          properties: { source: { type: 'string' }, target: { type: 'string' }, relation: { type: 'string' } },
          required: ['source', 'target', 'relation']
        }
      }
    },
    required: ['nodes', 'edges']
  }, { temperature: 0 });

  const nodeIdMap: Record<string, string> = {};
  let nodesCreated = 0;
  let edgesCreated = 0;

  // Phase 1: 노드 삽입 및 ID 매핑 준비
  const nodesToInsert: Array<{ id: string; node_name: string; node_type: string }> = [];

  for (const n of (result.nodes || [])) {
    const { data: existing } = await supabase
      .from('brand_ontology_nodes')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('node_name', n.name)
      .maybeSingle();

    if (existing) {
      nodeIdMap[n.name] = existing.id;
      nodesToInsert.push({ id: existing.id, node_name: n.name, node_type: n.type });
      continue;
    }

    const { data: inserted, error } = await supabase
      .from('brand_ontology_nodes')
      .insert({ workspace_id: workspaceId, node_name: n.name, node_type: n.type, reference_id: null })
      .select('id')
      .single();

    if (!error && inserted) {
      nodeIdMap[n.name] = inserted.id;
      nodesToInsert.push({ id: inserted.id, node_name: n.name, node_type: n.type });
      nodesCreated++;
    }
  }

  // Phase 2: 온톨로지 제약 및 일관성 검증 (KGValidator 순환 참조/고아/타입 위반 제거)
  const { KGValidator } = await import('../../lib/knowledge-graph/ontology-schema');
  
  const rawEdges = (result.edges || []).map(e => ({
    source_node_id: nodeIdMap[e.source] || '',
    target_node_id: nodeIdMap[e.target] || '',
    relation_type: e.relation
  })).filter(e => e.source_node_id && e.target_node_id);

  const validation = KGValidator.validateAndFix(nodesToInsert, rawEdges);
  
  if (validation.issues.length > 0) {
    console.warn('[generateIndustryOntology] KG Validation resolved issues:', validation.issues);
  }

  // Phase 3: 검증 통과한 엣지만 DB 저장
  for (const e of validation.fixedEdges) {
    const { error } = await supabase
      .from('brand_ontology_edges')
      .insert({
        workspace_id: workspaceId,
        source_node_id: e.source_node_id,
        target_node_id: e.target_node_id,
        relation_type: e.relation_type
      });

    if (!error) edgesCreated++;
  }

  return { nodesCreated, edgesCreated };
}

// ═══════════════════════════════════════════════════════════════
// 32. Claim 페이지 인라인 생성 액션 (Operational Truth / Evidence / Boundary Rule)
// ═══════════════════════════════════════════════════════════════

export async function createOperationalTruth(
  workspaceId: string,
  data: { claim: string; risk_level: string }
): Promise<{ id: string; claim: string; risk_level: string }> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, ["owner", "admin", "brand_strategist"]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from('brand_operational_truths')
    .insert({ workspace_id: workspaceId, claim: data.claim, risk_level: data.risk_level })
    .select('id, claim, risk_level')
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

export async function createEvidenceItem(
  workspaceId: string,
  data: { title: string; source_url?: string; is_verified: boolean }
): Promise<{ id: string; title: string; is_verified: boolean }> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, ["owner", "admin", "evidence_reviewer"]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from('evidence_items')
    .insert({ workspace_id: workspaceId, title: data.title, source_url: data.source_url || null, is_verified: data.is_verified })
    .select('id, title, is_verified')
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

export async function createBoundaryRule(
  workspaceId: string,
  data: { rule_name: string; description?: string; is_active: boolean }
): Promise<{ id: string; rule_name: string; is_active: boolean }> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, ["owner", "admin", "brand_strategist"]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  const { data: result, error } = await supabase
    .from('boundary_rules')
    .insert({ workspace_id: workspaceId, rule_name: data.rule_name, description: data.description || null, is_active: data.is_active })
    .select('id, rule_name, is_active')
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * 32. Create Pipeline Run (Execution Tracker)
 */
export async function createPipelineRun(
  workspaceId: string,
  pipelineType: string,
  domainKey?: string,
  brandSlug?: string
): Promise<{ id: string; status: string }> {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, ["owner", "admin", "brand_strategist"]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();
  try {
    const { data: result, error } = await supabase
      .from('pipeline_runs')
      .insert({
        workspace_id: workspaceId,
        pipeline_type: pipelineType,
        domain_key: domainKey || null,
        brand_slug: brandSlug || null,
        status: 'running',
        started_at: new Date().toISOString()
      })
      .select('id, status')
      .single();

    if (error) throw error;
    return result;
  } catch (err: any) {
    // Graceful degradation: pipeline_runs 테이블 미존재 시 가상 ID 반환
    console.warn('[createPipelineRun] DB 기록 실패 (테이블 미존재 가능):', err.message);
    return { id: `ephemeral-${Date.now()}`, status: 'running' };
  }
}

/**
 * 33. Update Pipeline Run Status
 */
export async function updatePipelineRun(
  runId: string,
  status: 'completed' | 'failed' | 'cancelled',
  resultSummary?: any,
  errorMessage?: string
): Promise<boolean> {
  // ephemeral run은 DB 업데이트 불필요
  if (runId.startsWith('ephemeral-')) return true;

  const supabase = getSupabaseAdminClient();
  const updateData: any = {
    status,
    completed_at: new Date().toISOString(),
  };

  if (resultSummary) {
    updateData.result_summary = resultSummary;
  }
  if (errorMessage) {
    updateData.error_message = errorMessage;
  }

  try {
    const { error } = await supabase
      .from('pipeline_runs')
      .update(updateData)
      .eq('id', runId);

    if (error) throw error;
  } catch (err: any) {
    console.warn('[updatePipelineRun] DB 업데이트 실패:', err.message);
  }
  return true;
}

/**
 * 34. Get Pipeline Readiness & Metric Overview
 */
export async function getPipelineReadiness(workspaceId: string, domainKey: string) {
  const userId = await requireAuthOrDemo();
  const isAuthorized = await checkWorkspacePermissionOrDemo(workspaceId, userId, ["owner", "admin", "brand_strategist", "semantic_architect"]);
  if (!isAuthorized) throw new Error("UNAUTHORIZED");

  const supabase = getSupabaseAdminClient();

  // Helper: 테이블 미존재 시 0 반환
  const safeCount = async (table: string, filters: Record<string, string>): Promise<number> => {
    try {
      let q = supabase.from(table).select('*', { count: 'exact', head: true }) as any;
      for (const [k, v] of Object.entries(filters)) {
        q = q.eq(k, v);
      }
      const { count, error } = await q;
      if (error) return 0;
      return count || 0;
    } catch {
      return 0;
    }
  };

  const wsFilter = { workspace_id: workspaceId };
  const wsIndustryFilter = { workspace_id: workspaceId, sub_industry: domainKey };

  const [benchmarkCount, goldenCount, auditCount, deepDiveCount, tcoCount, kgCount, signalCount, cqCount, sceneCount] = await Promise.all([
    safeCount('benchmark_audit_results', wsIndustryFilter),
    safeCount('golden_reference_outputs', wsIndustryFilter),
    safeCount('audit_sessions', wsFilter),
    safeCount('deep_dive_sessions', wsFilter),
    safeCount('tco_concepts', wsFilter),
    safeCount('brand_ontology_nodes', wsFilter),
    safeCount('question_signals', wsFilter),
    safeCount('canonical_questions', wsFilter),
    safeCount('qis_scenes', wsFilter),
  ]);

  // Recent runs (graceful)
  let recentRuns: any[] = [];
  try {
    const { data, error } = await supabase
      .from('pipeline_runs')
      .select('*')
      .eq('workspace_id', workspaceId)
      .order('started_at', { ascending: false })
      .limit(10);
    if (!error) recentRuns = data || [];
  } catch {
    // pipeline_runs 테이블 미존재 — 무시
  }

  return {
    benchmarkCount,
    goldenCount,
    auditCount,
    deepDiveCount,
    tcoCount,
    kgCount,
    signalCount,
    cqCount,
    sceneCount,
    recentRuns
  };
}


/**
 * 36. Seed full demo database
 */
export async function seedDemoData(): Promise<{ success: boolean; message: string }> {
  await requireAuthOrDemo();
  try {
    const { seedFullDemo } = await import('../../db/seed/demo-full');
    await seedFullDemo();
    return { success: true, message: '데모 데이터 시딩이 완료되었습니다.' };
  } catch (err: any) {
    console.error('[seedDemoData] Error:', err);
    return { success: false, message: `시딩 실패: ${err.message}` };
  }
}

/**
 * 37. Get signal performance tracking records
 */
export async function getSignalPerformanceData(workspaceId: string): Promise<any[]> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('signal_performance_tracking')
    .select(`
      *,
      question_signals (
        query,
        cps_score,
        qvs_total
      )
    `)
    .eq('workspace_id', workspaceId)
    .order('promoted_at', { ascending: false });

  if (error) {
    console.error('[getSignalPerformanceData] Error:', error);
    return [];
  }
  return data || [];
}

/**
 * 38. Trigger online OLS weight recalibration
 */
export async function triggerWeightRecalibration(workspaceId: string): Promise<{ success: boolean; weights: any; message: string }> {
  await requireAuthOrDemo();
  try {
    const { SignalPerformanceTracker } = await import('../../lib/signal-collection/signal-performance-tracker');
    const weights = await SignalPerformanceTracker.learnWeights(workspaceId);
    if (!weights) {
      return { success: false, weights: null, message: '학습 데이터 부족 (최소 10개 이상의 활성 추적 노드 필요).' };
    }
    return { success: true, weights, message: 'OLS 가중치 재조정이 성공적으로 완료되었습니다.' };
  } catch (err: any) {
    return { success: false, weights: null, message: `재조정 실패: ${err.message}` };
  }
}

// =========================================================================
// PATTERN ATTRACTOR FOUNDRY SERVER ACTIONS
// =========================================================================

/**
 * 39. Create a new Pattern Attractor
 */
export async function createPatternAttractor(workspaceId: string, spec: any): Promise<{ id: string }> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('pattern_attractors')
    .insert({
      id: spec.id,
      workspace_id: workspaceId,
      domain_id: spec.domain_id,
      version: spec.version || '0.1.0',
      status: spec.status || 'draft',
      type: spec.type || [],
      scope: spec.scope || 'domain',
      brand_id: spec.brand_id || null,
      natural_definition: spec.natural_definition || '',
      trigger_state: spec.trigger_state || {},
      concept_state: spec.concept_state || {},
      evidence_anchor: spec.evidence_anchor || {},
      vibe_signature: spec.vibe_signature || {},
      action_policy: spec.action_policy || {},
      media_soliton_rule: spec.media_soliton_rule || {},
      target_state: spec.target_state || {},
      metrics: spec.metrics || {},
      failure_modes: spec.failure_modes || [],
      recomposition_rule: spec.recomposition_rule || {}
    })
    .select('id')
    .single();

  if (error) {
    throw new Error(`Failed to create pattern attractor: ${error.message}`);
  }
  return { id: data.id };
}

/**
 * 40. Update an existing Pattern Attractor
 */
export async function updatePatternAttractor(workspaceId: string, id: string, updates: any): Promise<void> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('pattern_attractors')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('workspace_id', workspaceId)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to update pattern attractor: ${error.message}`);
  }
}

/**
 * 41. Get Pattern Attractors with filters
 */
export async function getPatternAttractors(
  workspaceId: string,
  filters?: { domainId?: string; type?: string[]; status?: string; scope?: string }
): Promise<any[]> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  let query = supabase
    .from('pattern_attractors')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (filters?.domainId) {
    query = query.eq('domain_id', filters.domainId);
  }
  if (filters?.status) {
    query = query.eq('status', filters.status);
  }
  if (filters?.scope) {
    query = query.eq('scope', filters.scope);
  }
  if (filters?.type && filters.type.length > 0) {
    query = query.contains('type', filters.type);
  }

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) {
    console.error('[getPatternAttractors] Error:', error);
    return [];
  }
  return data || [];
}

/**
 * 42. Delete a Pattern Attractor
 */
export async function deletePatternAttractor(workspaceId: string, id: string): Promise<void> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('pattern_attractors')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('id', id);

  if (error) {
    throw new Error(`Failed to delete pattern attractor: ${error.message}`);
  }
}

/**
 * 43. Promote QIS Scene to Attractor
 */
export async function promoteQisSceneToAttractor(
  workspaceId: string,
  qisSceneId: string,
  attractorType: string[]
): Promise<{ id: string }> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  // Fetch the QIS scene first
  const { data: scene, error: sceneErr } = await supabase
    .from('qis_scenes')
    .select('*, canonical_questions(normalized_question, slug)')
    .eq('workspace_id', workspaceId)
    .eq('id', qisSceneId)
    .single();

  if (sceneErr || !scene) {
    throw new Error(`Failed to fetch QIS scene for promotion: ${sceneErr?.message}`);
  }

  // Create attractor spec from scene
  const attractorId = `attractor.promoted.${scene.canonical_questions.slug || 'scene'}.${Date.now().toString().slice(-4)}`;
  const spec = {
    id: attractorId,
    domain_id: null, // to be bound later or determined
    version: '0.1.0',
    status: 'draft',
    type: attractorType,
    scope: 'brand',
    brand_id: scene.canonical_questions.slug || 'brand_default',
    natural_definition: `${scene.scene_name || 'Promoted QIS Scene'}: ${scene.scenario_context || ''}`,
    trigger_state: {
      user_question_patterns: [scene.canonical_questions.normalized_question],
      context_requirements: [],
      risk_state: { level: scene.risk_level || 'medium' },
      intent_state: [scene.intent_model || 'informational'],
      missing_context: []
    },
    concept_state: {
      required_concepts: [],
      allowed_concepts: [],
      forbidden_concepts: []
    },
    evidence_anchor: {
      required_sources: [],
      evidence_visibility_rule: 'Show context first',
      claim_strength_limit: 'supported'
    },
    vibe_signature: {
      L0_core_affect: { valence: 'positive', arousal: 'low', control: 'high' },
      L1_expressive_style: {
        warmth_style: 'medium',
        precision: 'high',
        energy: 'low',
        sophistication: 'medium',
        novelty: 'low',
        intimacy: 'medium',
        authenticity: 'high'
      },
      L2_motivational_affordance: {
        autonomy_support: 'high',
        competence_support: 'high',
        relatedness_support: 'medium',
        promotion_frame: 'low',
        prevention_frame: 'high'
      },
      L3_social_appraisal: {
        warmth: 'medium',
        competence: 'high',
        trust: 'high',
        fairness: 'high',
        agency: 'medium'
      },
      avoid_vibe: ['panic']
    },
    action_policy: {
      allowed_actions: ['provide_answer'],
      blocked_actions: [],
      cta_policy: { primary: 'Check options', secondary: [], blocked: [] },
      safety_policy: {
        boundary_notes: scene.must_not_do || [],
        escalation_conditions: []
      }
    },
    media_soliton_rule: {
      core_proposition: scene.scenario_context || '',
      evidence_anchor: '',
      cta_vector: 'View Details',
      channel_adaptation_rules: {
        homepage: scene.answer_text || '',
        answer_card: scene.answer_text || '',
        chatbot: scene.answer_text || '',
        cardnews: '',
        ad: '',
        sales_script: '',
        llm_txt: ''
      }
    },
    target_state: {
      cognitive: ['understands_context'],
      affective: ['anxiety_reduced'],
      motivational: [],
      behavioral: []
    },
    source_qis_scene_id: qisSceneId
  };

  return createPatternAttractor(workspaceId, spec);
}

/**
 * 44. Get Brand Attractor Portfolio entries
 */
export async function getBrandAttractorPortfolio(workspaceId: string, brandId: string): Promise<any[]> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('brand_attractor_portfolios')
    .select('*, pattern_attractors(*)')
    .eq('workspace_id', workspaceId)
    .eq('brand_id', brandId);

  if (error) {
    console.error('[getBrandAttractorPortfolio] Error:', error);
    return [];
  }
  return data || [];
}

/**
 * 45. Update a portfolio entry
 */
export async function updatePortfolioEntry(workspaceId: string, entryId: string, updates: any): Promise<void> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  const { error } = await supabase
    .from('brand_attractor_portfolios')
    .update({
      ...updates,
      updated_at: new Date().toISOString()
    })
    .eq('workspace_id', workspaceId)
    .eq('id', entryId);

  if (error) {
    throw new Error(`Failed to update portfolio entry: ${error.message}`);
  }
}

/**
 * 46. Calculate Brand Attractor Portfolio readiness/strength score
 */
export async function calculatePortfolioScore(
  workspaceId: string,
  brandId: string,
  domainId: string
): Promise<number> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  
  const { data: entries } = await supabase
    .from('brand_attractor_portfolios')
    .select('readiness_score, status')
    .eq('workspace_id', workspaceId)
    .eq('brand_id', brandId)
    .eq('domain_id', domainId);

  if (!entries || entries.length === 0) return 0;

  // Calculate average score of active attractors
  let totalScore = 0;
  let count = 0;
  entries.forEach((e) => {
    if (e.status !== 'gap') {
      totalScore += Number(e.readiness_score || 0);
      count++;
    }
  });

  return count > 0 ? parseFloat((totalScore / count).toFixed(2)) : 0;
}

/**
 * 47. Generate Media Soliton assets for an Attractor (LLM-based)
 */
export async function generateMediaSolitons(
  workspaceId: string,
  attractorId: string,
  channels: string[]
): Promise<any[]> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  // Fetch the attractor
  const { data: attractor, error } = await supabase
    .from('pattern_attractors')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('id', attractorId)
    .single();

  if (error || !attractor) {
    throw new Error(`Failed to fetch attractor: ${error?.message}`);
  }

  // Import generator dynamically
  const { MediaSolitonGenerator } = await import('../../lib/pattern-attractor/media-soliton-generator');
  const generator = new MediaSolitonGenerator();
  const assets = [];

  for (const channel of channels) {
    try {
      const asset = await generator.generateForChannel(attractor as any, channel as any);
      
      // Save to media_solitons table
      const solitonId = `soliton.${attractor.id}.${channel}`;
      const payload = {
        id: solitonId,
        workspace_id: workspaceId,
        attractor_id: attractorId,
        core_proposition: asset.content.slice(0, 150), // summary of core proposition
        evidence_anchor: attractor.evidence_anchor?.evidence_visibility_rule || '',
        vibe_signature: attractor.vibe_signature || {},
        cta_vector: attractor.action_policy?.cta_policy?.primary || '',
        channel_type: channel,
        channel_content: asset.content,
        channel_metadata: asset.metadata || {},
        preservation_scores: asset.preservation_scores || {},
        generation_model: 'gemini-2.5-flash',
        status: 'draft',
        updated_at: new Date().toISOString()
      };

      const { error: upsertErr } = await supabase
        .from('media_solitons')
        .upsert({
          ...payload,
          created_at: new Date().toISOString()
        });

      if (!upsertErr) {
        assets.push(payload);
      }
    } catch (genErr) {
      console.error(`Failed to generate soliton for channel ${channel}:`, genErr);
    }
  }

  return assets;
}

/**
 * 48. Get generated Media Solitons
 */
export async function getMediaSolitons(workspaceId: string, attractorId: string): Promise<any[]> {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();
  const { data, error } = await supabase
    .from('media_solitons')
    .select('*')
    .eq('workspace_id', workspaceId)
    .eq('attractor_id', attractorId);

  if (error) {
    console.error('[getMediaSolitons] Error:', error);
    return [];
  }
  return data || [];
}

/**
 * 49. Log Run Receipt
 */
export async function logRunReceipt(workspaceId: string, receipt: any): Promise<string> {
  await requireAuthOrDemo();
  const { RunReceiptLogger } = await import('../../lib/pattern-attractor/run-receipt-logger');
  return RunReceiptLogger.logReceipt(workspaceId, receipt);
}

/**
 * 50. Get Run Receipt Analytics
 */
export async function getRunReceiptAnalytics(workspaceId: string, attractorId: string, period: string): Promise<any> {
  await requireAuthOrDemo();
  const { RunReceiptLogger } = await import('../../lib/pattern-attractor/run-receipt-logger');
  return RunReceiptLogger.aggregateMetrics(attractorId, period as any);
}

/**
 * 51. Load and sync Domain Pack
 */
export async function loadDomainPack(workspaceId: string, packId: string): Promise<{ created: number; updated: number }> {
  await requireAuthOrDemo();
  const { DomainPackLoader } = await import('../../lib/pattern-attractor/domain-pack-loader');
  const result = await DomainPackLoader.syncToDatabase(workspaceId, packId);
  return { created: result.created, updated: result.updated };
}

/**
 * 52. List available YAML Domain Packs
 */
export async function listDomainPacks(): Promise<any[]> {
  await requireAuthOrDemo();
  const { DomainPackLoader } = await import('../../lib/pattern-attractor/domain-pack-loader');
  const slugs = await DomainPackLoader.listAvailablePacks();
  
  return slugs.map((slug) => {
    try {
      const info = DomainPackLoader.loadPackFromDir(slug);
      return {
        id: slug,
        name: info.domain.name,
        subdomain: info.domain.subdomain,
        description: info.domain.description,
        version: info.domain.version,
        attractors_count: info.attractors.length,
        concepts_count: info.concepts.length
      };
    } catch (err) {
      return {
        id: slug,
        name: slug,
        error: true
      };
    }
  });
}

/**
 * 53. Match query to best Attractor and return fit score
 */
export async function findBestAttractor(
  workspaceId: string,
  query: string,
  domainId: string,
  channelType: string
): Promise<any> {
  await requireAuthOrDemo();
  const { AttractorRetriever } = await import('../../lib/pattern-attractor/attractor-retriever');
  const { AttractorFitScorer } = await import('../../lib/pattern-attractor/attractor-fit-scorer');
  const { ContextTensorBuilder } = await import('../../lib/pattern-attractor/context-tensor-builder');

  const retriever = new AttractorRetriever(workspaceId, domainId);
  const scorer = new AttractorFitScorer();

  // 1. Build context tensor
  const tensor = await ContextTensorBuilder.buildFromQuery(query, domainId, channelType as any);

  // 2. Retrieve candidates
  const candidates = await retriever.retrieveCandidates(query, tensor);
  if (candidates.length === 0) {
    return { best_fit: null, candidates: [], tensor };
  }

  // 3. Score candidates
  const fitResults = await scorer.batchScore(candidates, query, tensor);
  
  // Find highest scoring candidate
  const sorted = fitResults.sort((a, b) => b.total_score - a.total_score);
  const bestFit = sorted[0];

  return {
    best_fit: bestFit,
    candidates: sorted,
    tensor
  };
}

/**
 * 54. 업체 AI홈피 팩 생성 파이프라인
 */
export async function generateAihompyPack(
  workspaceId: string,
  businessData: any,
  tier: 'basic' | 'pro' | 'premium'
): Promise<any> {
  await requireAuthOrDemo();
  
  const { BusinessIntakeProcessor } = await import('../../lib/aihompy-pack/business-intake');
  const { HomepageComposer } = await import('../../lib/aihompy-pack/homepage-composer');
  const { LlmTxtGenerator } = await import('../../lib/aihompy-pack/llm-txt-generator');

  // 1. 해당 워크스페이스 내 로드된 모든 어트랙터 조회
  const attractors = await getPatternAttractors(workspaceId);

  // 2. 적합 어트랙터 자동 매칭
  const matchingCandidates = await BusinessIntakeProcessor.findApplicableAttractors(businessData, attractors);
  
  // 매칭된 ID를 기반으로 상세 어트랙터 객체 필터링
  const activeAttractorIds = matchingCandidates.map(c => c.attractor_id);
  const matchedAttractorSpecs = attractors.filter(a => activeAttractorIds.includes(a.id));

  // 3. 홈페이지 섹션 및 상황형 FAQ 조립
  const sections = await HomepageComposer.compose(businessData, matchedAttractorSpecs, tier);

  // 4. 이미지 alt text 생성 (사진 데이터가 있을 시)
  const photosWithAlt = businessData.photos?.length 
    ? await HomepageComposer.generateAltTexts(businessData.photos, businessData.business_name)
    : [];

  // 5. llm.txt 파일용 영문 텍스트 생성
  const llmTxt = await LlmTxtGenerator.generate(businessData, matchedAttractorSpecs);

  return {
    success: true,
    tier,
    matched_attractors: matchingCandidates,
    sections,
    photos: photosWithAlt,
    llm_txt: llmTxt
  };
}

/**
 * 55. 업종별 팩에서 적합 어트랙터 자동 매칭
 */
export async function matchBusinessToAttractors(
  workspaceId: string,
  businessData: any
): Promise<any[]> {
  await requireAuthOrDemo();
  const { BusinessIntakeProcessor } = await import('../../lib/aihompy-pack/business-intake');
  const attractors = await getPatternAttractors(workspaceId);
  return await BusinessIntakeProcessor.findApplicableAttractors(businessData, attractors);
}

/**
 * 56. llm.txt 생성 및 저장
 */
export async function generateLlmTxt(
  workspaceId: string,
  businessId: string,
  attractorIds: string[]
): Promise<string> {
  await requireAuthOrDemo();
  // Simple AI generate wrapper for a set of attractors
  const supabase = getSupabaseAdminClient();
  
  // Fetch workspace details and business if any table exists, else mock
  const { data: attractors } = await supabase
    .from('pattern_attractors')
    .select('*')
    .in('id', attractorIds)
    .eq('workspace_id', workspaceId);

  const { LlmTxtGenerator } = await import('../../lib/aihompy-pack/llm-txt-generator');
  
  // Dummy intake data for mapping
  const dummyIntake = {
    business_name: '로컬 시그니처 샵',
    address: '제주도 애월읍',
    phone: '064-000-0000',
    business_hours: '09:00 - 18:00',
    description: '로컬 팩스북 안심 파트너 매장',
    industry_type: 'restaurant_cafe' as const,
    facilities: {
      parking: true,
      indoor_seats: true,
      wheelchair_access: true,
      kids_menu: false,
      pet_allowed: false,
      foreign_language_menu: ['en']
    },
    menu_items: [],
    photos: [],
    faq_entries: []
  };

  return await LlmTxtGenerator.generate(dummyIntake, attractors || []);
}


// ────────────────────────────────────────────
// #57. 질문 시그널 전체 조회 (Admin Client — RLS 우회)
// ────────────────────────────────────────────
export async function getQuestionSignals(workspaceId: string) {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('question_signals')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('cps_score', { ascending: false });

  if (error) {
    console.error('[getQuestionSignals]', error);
    return [];
  }
  return data || [];
}

// ────────────────────────────────────────────
// #58. 질문 자본 노드 전체 조회 (Admin Client — RLS 우회)
// ────────────────────────────────────────────
export async function getQuestionCapitalNodes(workspaceId: string) {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('question_capital_nodes')
    .select('id, title, slug, strategic_weight, parent_id')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    console.error('[getQuestionCapitalNodes]', error);
    return [];
  }
  return data || [];
}

// ────────────────────────────────────────────
// #59. 도메인 목록 및 어트랙터 조회 (Admin Client — RLS 우회)
// ────────────────────────────────────────────
export async function getDomainsForWorkspace(workspaceId: string) {
  await requireAuthOrDemo();
  const supabase = getSupabaseAdminClient();

  const { data, error } = await supabase
    .from('domains')
    .select('*')
    .eq('workspace_id', workspaceId);

  if (error) {
    console.error('[getDomainsForWorkspace]', error);
    return [];
  }
  return data || [];
}

