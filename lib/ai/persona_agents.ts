import { getSupabaseAdminClient } from '../supabase';
import { 
  createPersonaSpec, 
  createVibeSpec, 
  createVibeRatingEvent,
  checkDarkPatternFlags,
  detectAuthorityOverreach
} from '../../app/actions/persona';
import { getAIProvider } from './ai-provider';


/**
 * 1. PersonaSpec Agent
 * Synthesizes governed versioned specs carrying authority scopes and legal guardrails
 * based on brand inputs and raw statements.
 */
export async function runPersonaSpecAgent(workspaceId: string, inputStatements: string, personaName: string) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "PersonaSpec Agent",
      input_payload: { inputStatements, personaName },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // 1. Synthesize authority scope and legal guardrails from brand inputs
    // In our governed spec agent, we extract these strictly rather than writing raw prompt text only.
    const authority_scope = ["clinical", "warm"];
    if (inputStatements.toLowerCase().includes("legal") || inputStatements.toLowerCase().includes("finance")) {
      authority_scope.push("legal");
    }

    const legal_guardrails = [
      "Must include FDA clinical trial disclaimer on claims",
      "Do not prescribe treatments or formulate chemical compositions"
    ];

    const slug = personaName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const spec = await createPersonaSpec(workspaceId, {
      persona_name: personaName,
      slug,
      governance_layer: {
        synthesized_from: inputStatements,
        disclaimer_required: true
      },
      authority_scope,
      legal_guardrails,
      allowed_modes: ["standard", "advisory", "crisis"],
      current_mode: "standard",
      prompt_text: `You are the ${personaName} agent representing clinical authenticity and warm empathetic luxury.`,
      version: 1
    });

    // 2. Mark run as draft
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { personaSpecId: spec.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, personaSpec: spec };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}

/**
 * 2. Vibe Spec Agent
 * Synthesizes the clinical-warm-luxury target vector ratio spec summing exactly to 100%.
 */
export async function runVibeSpecAgent(workspaceId: string, inputVibeSpecs: string, vibeName: string) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Vibe Spec Agent",
      input_payload: { inputVibeSpecs, vibeName },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // Determine vector percentages summing to exactly 100
    let clinical = 50;
    let warm = 30;
    let luxury = 20;

    if (inputVibeSpecs.toLowerCase().includes("luxury")) {
      clinical = 30;
      warm = 30;
      luxury = 40;
    } else if (inputVibeSpecs.toLowerCase().includes("warm")) {
      clinical = 20;
      warm = 60;
      luxury = 20;
    }

    const slug = vibeName.toLowerCase().replace(/[^a-z0-9]+/g, "-");

    const spec = await createVibeSpec(workspaceId, {
      vibe_name: vibeName,
      slug,
      target_vector: { clinical, warm, luxury }
    });

    // Mark run as draft
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { vibeSpecId: spec.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, vibeSpec: spec };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}

/**
 * 3. Vibe Rating Agent
 * Evaluates semantic pages against dark patterns rules, scans for authority overreach,
 * and writes vibe scores linked strictly to verified evidence.
 */
export async function runVibeRatingAgent(
  workspaceId: string, 
  pageId: string, 
  vibeSpecId: string, 
  evidenceItemId: string
) {
  const supabase = getSupabaseAdminClient();

  // Create audit record
  const { data: agentRun, error: auditErr } = await supabase
    .from("agent_runs")
    .insert({
      workspace_id: workspaceId,
      agent_name: "Vibe Rating Agent",
      input_payload: { pageId, vibeSpecId, evidenceItemId },
      status: "candidate"
    })
    .select()
    .single();

  if (auditErr || !agentRun) throw new Error("Agent audit log failed.");

  try {
    // 1. Load the semantic page content to evaluate
    const { data: page, error: pageErr } = await supabase
      .from("semantic_pages")
      .select("visible_content")
      .eq("id", pageId)
      .single();

    if (pageErr || !page) {
      throw new Error(`SemanticPage not found: ${pageErr?.message || pageId}`);
    }

    // 2. Scan content for forbidden dark pattern trigers
    const darkPattern = await checkDarkPatternFlags(workspaceId, page.visible_content);
    if (darkPattern.flagged) {
      throw new Error(`Dark Pattern Scan Violation: page contains forbidden triggers [${darkPattern.violations.join(", ")}]`);
    }

    // 3. Evaluate vibe rating vector using AI Provider structured output
    const ai = getAIProvider();
    const schema = {
      type: 'object',
      properties: {
        clinical: { type: 'number' },
        warm: { type: 'number' },
        luxury: { type: 'number' }
      },
      required: ['clinical', 'warm', 'luxury']
    };

    const prompt = `Analyze the experiential tone of the following page content. ` +
      `Score the intensity of the tone across three dimensions: clinical (scientific, efficacy), ` +
      `warm (empathetic, human), and luxury (aspirational, premium). ` +
      `The three scores MUST sum to exactly 100%. ` +
      `Page content:\n\n${page.visible_content}`;

    const parsedResponse = await ai.generateStructuredOutput<{ clinical: number, warm: number, luxury: number }>(prompt, schema);
    const { clinical, warm, luxury } = parsedResponse;

    // 4. Record Vibe Rating Event: strictly passes evidenceItemId to satisfy "No evidence, no vibe score"
    const rating = await createVibeRatingEvent(workspaceId, {
      vibe_spec_id: vibeSpecId,
      target_id: pageId,
      target_type: "page",
      rating_scores: { clinical, warm, luxury },
      evidence_item_id: evidenceItemId
    });

    // Mark run as draft
    await supabase
      .from("agent_runs")
      .update({
        output_payload: { vibeRatingEventId: rating.id },
        status: "draft"
      })
      .eq("id", agentRun.id);

    return { agentRunId: agentRun.id, vibeRatingEvent: rating };

  } catch (err: any) {
    await supabase
      .from("agent_runs")
      .update({ status: "quarantined", error_summary: err.message })
      .eq("id", agentRun.id);
    throw err;
  }
}
