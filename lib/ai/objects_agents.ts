import { getSupabaseAdminClient } from '../supabase';
import { 
  createRepresentationObjectCore, 
  composeSemanticPageCore 
} from '../db/objects-db';

/**
 * 1. Representation Object Agent
 * Translates organic QIS scenes and claims into clean structured representation data blocks.
 */
export async function runRepresentationObjectAgent(workspaceId: string, qisSceneId: string, objectName: string) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Representation Object Agent",
      input_payload: { qisSceneId, objectName },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // 1. Fetch claims and concepts associated with the QIS scene context
    // For MVP, we extract mock concept references and claim nodes
    const claimRefs = ["22222222-2222-2222-2222-222222222222"];
    const conceptRefs = ["33333333-3333-3333-3333-333333333333"];
    
    // 2. Create the Representation Object
    const slug = objectName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const repObj = await createRepresentationObjectCore(workspaceId, {
      object_name: objectName,
      slug,
      object_type: "ingredient",
      qis_refs: [qisSceneId],
      claim_refs: claimRefs,
      concept_refs: conceptRefs,
      raw_properties: { concentration: "5%", purity: "99.8%", ph: "5.5" },
      readiness_status: "draft"
    });

    // 3. Mark run as draft (candidate -> draft)
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { representationObjectId: repObj.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, representationObject: repObj };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}

/**
 * 2. Surface/Page Composer Agent
 * Formulates visual sections and composed visible text structures from a valid Surface Contract.
 */
export async function runSurfacePageComposerAgent(workspaceId: string, contractId: string, pageTitle: string) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Surface/Page Composer Agent",
      input_payload: { contractId, pageTitle },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // 1. Compose the page based on the valid surface contract specifications
    const slug = "products/" + pageTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const page = await composeSemanticPageCore(workspaceId, contractId, {
      page_title: pageTitle,
      slug,
      meta_description: `AI-structured visible pages matching the specifications of contract: ${contractId}`
    });

    // 2. Mark run as draft (candidate -> draft)
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { semanticPageId: page.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, semanticPage: page };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}
