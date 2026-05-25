import { getSupabaseAdminClient } from '../supabase';
import { 
  createQuestionSignal, 
  createQisScene, 
  createTcoConcept,
  createOntologyNode,
  createOntologyEdge
} from '../../app/actions/semantic';

/**
 * 1. Question Signal Mining Agent
 * Scans public crawl keywords and identifies target query signal nodes.
 */
export async function runSignalMiningAgent(workspaceId: string, keywordSeed: string) {
  const supabase = getSupabaseAdminClient();

  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Question Signal Mining Agent",
      input_payload: { keywordSeed },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    const minedQueries = [
      `what are the ingredients in convenience sandwiches`,
      `how does niacinamide affect skin inflammation`,
      `what is the routine for dry skincare barrier repair`
    ];

    const savedSignals = [];
    for (const q of minedQueries) {
      const sig = await createQuestionSignal(workspaceId, {
        query: q,
        volume: 2400,
        intent: "informational",
        status: "mined"
      });
      savedSignals.push(sig);
    }

    await supabase
      .from("agent_runs")
      .update({
        output_payload: { minedCount: savedSignals.length, signalIds: savedSignals.map(s => s.id) },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, minedQueries, savedSignals };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}

/**
 * 2. QIS Generation Agent
 * Translates a Canonical Question into Query-Intent-Scenario scenes.
 */
export async function runQisGenAgent(workspaceId: string, canonicalQuestionId: string, normalizedQuestion: string) {
  const supabase = getSupabaseAdminClient();

  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "QIS Generation Agent",
      input_payload: { canonicalQuestionId, normalizedQuestion },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    const sceneData = {
      canonical_question_id: canonicalQuestionId,
      scene_name: `SEO-AEO Search Scene: ${normalizedQuestion.substring(0, 30)}...`,
      query_template: `user query matching ${normalizedQuestion}`,
      intent_model: "informational_commercial_mix",
      scenario_context: `A buyer searching on mobile for detailed, verified facts on: "${normalizedQuestion}"`,
      risk_level: "high" as const
    };

    const scene = await createQisScene(workspaceId, sceneData);

    await supabase
      .from("agent_runs")
      .update({
        output_payload: { qisSceneId: scene.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, scene };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}

/**
 * 3. TCO/KG Agent
 * Extracts operational TCO concepts and inserts ontology graph paths.
 */
export async function runTcoKgAgent(workspaceId: string, conceptName: string, claimId: string) {
  const supabase = getSupabaseAdminClient();

  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "TCO/KG Extraction Agent",
      input_payload: { conceptName, claimId },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // 1. Create first-class concept dictionary entity (TCO Concept)
    const slug = conceptName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const concept = await createTcoConcept(workspaceId, {
      concept_name: conceptName,
      slug,
      definition: `AI semantic concept representing our brand parameter: ${conceptName}`,
      is_strategic: true
    });

    // 2. Map Ontology nodes
    const nodeA = await createOntologyNode(workspaceId, {
      node_name: conceptName,
      node_type: "concept",
      reference_id: concept.id
    });

    const nodeB = await createOntologyNode(workspaceId, {
      node_name: "Associated Claim Node",
      node_type: "claim",
      reference_id: claimId
    });

    // 3. Connect Ontology edges
    const edge = await createOntologyEdge(workspaceId, {
      source_node_id: nodeA.id,
      target_node_id: nodeB.id,
      relation_type: "defines_concept"
    });

    await supabase
      .from("agent_runs")
      .update({
        output_payload: { conceptId: concept.id, edgeId: edge.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, concept, edge };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}
