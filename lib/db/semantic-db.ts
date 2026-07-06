import { getSupabaseAdminClient } from '../supabase';
import { 
  questionSignalSchema,
  qisSceneSchema,
  tcoConceptSchema,
  brandOntologyNodeSchema,
  brandOntologyEdgeSchema
} from '../schema';

/**
 * Core DB execution layer for creating a question signal.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createQuestionSignalCore(workspaceId: string, data: any) {
  const parsed = questionSignalSchema.parse({ ...data, workspace_id: workspaceId });
  const supabase = getSupabaseAdminClient();

  const { data: result, error } = await supabase
    .from("question_signals")
    .insert({
      workspace_id: parsed.workspace_id,
      query: parsed.query,
      volume: parsed.volume,
      intent: parsed.intent,
      status: parsed.status,
      qvs_total: parsed.qvs_total,
      qvs_dimensions: parsed.qvs_dimensions,
      cps_score: parsed.cps_score,
      is_ymyl: parsed.is_ymyl,
      gate_status: parsed.gate_status,
      eval_confidence: parsed.eval_confidence,
      panel_layer: parsed.panel_layer,
      matched_tco_concepts: parsed.matched_tco_concepts,
      matched_kg_nodes: parsed.matched_kg_nodes
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Core DB execution layer for creating a QIS scene.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createQisSceneCore(workspaceId: string, data: any) {
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
      risk_level: parsed.risk_level,
      scene_type: parsed.scene_type,
      answer_text: parsed.answer_text,
      must_include: parsed.must_include,
      must_not_do: parsed.must_not_do,
      confidence_score: parsed.confidence_score
    })
    .select()
    .single();

  if (error) throw new Error(`DB Error: ${error.message}`);
  return result;
}

/**
 * Core DB execution layer for defining a TCO Concept.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createTcoConceptCore(workspaceId: string, data: any) {
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
 * Core DB execution layer for writing ontology graph nodes.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createOntologyNodeCore(workspaceId: string, data: any) {
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
 * Core DB execution layer for writing ontology graph edges.
 * Bypasses HTTP-only Server Action authentication checks.
 */
export async function createOntologyEdgeCore(workspaceId: string, data: any) {
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
