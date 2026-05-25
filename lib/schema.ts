import { z } from 'zod';

// Roles allowed in Workspace Memberships
export const WORKSPACE_ROLES = [
  'owner',
  'admin',
  'brand_strategist',
  'semantic_architect',
  'content_editor',
  'evidence_reviewer',
  'persona_vibe_designer',
  'observatory_analyst',
  'executive_viewer',
  'agency_operator',
] as const;

export type WorkspaceRole = (typeof WORKSPACE_ROLES)[number];

// Agent Run Statuses
export const AGENT_RUN_STATUSES = [
  'candidate',
  'draft',
  'in_review',
  'approved',
  'active',
  'quarantined',
] as const;

export type AgentRunStatus = (typeof AGENT_RUN_STATUSES)[number];

// 1. Workspace
export const workspaceSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Workspace = z.infer<typeof workspaceSchema>;

// 2. Workspace Membership
export const workspaceMembershipSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(WORKSPACE_ROLES),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type WorkspaceMembership = z.infer<typeof workspaceMembershipSchema>;

// 3. Domain
export const domainSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(50).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type Domain = z.infer<typeof domainSchema>;

// 4. Domain Pack
export const domainPackSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  domain_id: z.string().uuid(),
  name: z.string().min(2).max(100),
  config: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type DomainPack = z.infer<typeof domainPackSchema>;

// 5. Brand Entity
export const brandEntitySchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(50).regex(/^[a-z0-9-]+$/),
  domain_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BrandEntity = z.infer<typeof brandEntitySchema>;

// 6. Source Snapshot
export const sourceSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  brand_entity_id: z.string().uuid().optional().nullable(),
  source_type: z.string().min(2).max(50),
  content: z.string().min(1),
  metadata: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type SourceSnapshot = z.infer<typeof sourceSnapshotSchema>;

// 7. Audit Event
export const auditEventSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  user_id: z.string().min(1),
  action: z.string().min(2),
  target_type: z.string().min(2),
  target_id: z.string().uuid(),
  payload: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type AuditEvent = z.infer<typeof auditEventSchema>;

// 8. Agent Run
export const agentRunSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  agent_name: z.string().min(2).max(100),
  input_payload: z.record(z.string(), z.any()),
  output_payload: z.record(z.string(), z.any()).optional().nullable(),
  status: z.enum(AGENT_RUN_STATUSES).default('candidate'),
  error_summary: z.string().max(2000).optional().nullable(),
  raw_output_ref: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export type AgentRun = z.infer<typeof agentRunSchema>;

// 9. Action Policy
export const actionPolicySchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  role: z.enum(WORKSPACE_ROLES),
  action: z.string().min(2),
  is_allowed: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type ActionPolicy = z.infer<typeof actionPolicySchema>;

// 10. Release Gate Result
export const releaseGateResultSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  gate_type: z.string().min(2),
  target_type: z.string().min(2),
  target_id: z.string().uuid(),
  status: z.enum(['pass', 'fail']),
  blocking_reasons: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  required_fixes: z.array(z.string()).default([]),
  evaluated_at: z.string().optional(),
});

export type ReleaseGateResult = z.infer<typeof releaseGateResultSchema>;

// --- Brand Truth Module Schemas ---

// 11. Brand Strategic Truth
export const brandStrategicTruthSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  statement: z.string().min(5),
  vision: z.string().optional().nullable(),
  core_pillars: z.array(z.string()).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BrandStrategicTruth = z.infer<typeof brandStrategicTruthSchema>;

// 12. Brand Operational Truth
export const brandOperationalTruthSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  claim: z.string().min(5),
  description: z.string().optional().nullable(),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  confidence_score: z.number().min(0).max(100).default(0),
  review_status: z.enum(['draft', 'in_review', 'approved', 'rejected']).default('draft'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BrandOperationalTruth = z.infer<typeof brandOperationalTruthSchema>;

// 13. Brand Observed Truth
export const brandObservedTruthSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  observed_claim: z.string().min(5),
  source_domain: z.string().min(3),
  observed_at: z.string().optional(),
  confidence_score: z.number().min(0).max(100).optional().nullable(),
  is_aligned_with_operational: z.boolean().default(true),
  raw_payload: z.record(z.string(), z.any()).default({}),
});

export type BrandObservedTruth = z.infer<typeof brandObservedTruthSchema>;

// 14. Evidence Item
export const evidenceItemSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  title: z.string().min(3).max(255),
  content: z.string().min(5),
  url: z.string().url().optional().nullable().or(z.literal("")),
  evidence_type: z.enum(['clinical_trial', 'lab_report', 'certificate', 'manual_verify']).default('clinical_trial'),
  is_verified: z.boolean().default(false),
  verified_at: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type EvidenceItem = z.infer<typeof evidenceItemSchema>;

// 15. Boundary Rule
export const boundaryRuleSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  rule_name: z.string().min(3).max(255),
  forbidden_terms: z.array(z.string()).default([]),
  required_disclosures: z.array(z.string()).default([]),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BoundaryRule = z.infer<typeof boundaryRuleSchema>;

// 16. Truth Delta Snapshot
export const truthDeltaSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  source_observed_truth_id: z.string().uuid(),
  target_operational_truth_id: z.string().uuid().optional().nullable(),
  delta_summary: z.string().min(5),
  severity: z.enum(['low', 'medium', 'high']).default('low'),
  is_resolved: z.boolean().default(false),
  created_at: z.string().optional(),
});

export type TruthDeltaSnapshot = z.infer<typeof truthDeltaSnapshotSchema>;

// 17. Truth Lock Evaluation
export const truthLockEvaluationSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  gate_level: z.enum(['L0', 'L1', 'L2', 'L3', 'L4']).default('L0'),
  is_passed: z.boolean().default(false),
  blocking_reasons: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  evaluated_at: z.string().optional(),
});

export type TruthLockEvaluation = z.infer<typeof truthLockEvaluationSchema>;

// --- Semantic Core Module Schemas ---

// 18. Question Signal
export const questionSignalSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  query: z.string().min(2),
  volume: z.number().min(0).default(0),
  intent: z.enum(['informational', 'transactional', 'commercial', 'local']).default('informational'),
  status: z.enum(['mined', 'ignored', 'promoted']).default('mined'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type QuestionSignal = z.infer<typeof questionSignalSchema>;

// 19. Question Capital Node
export const questionCapitalNodeSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  title: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  strategic_weight: z.number().min(0).max(100).default(1),
  parent_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type QuestionCapitalNode = z.infer<typeof questionCapitalNodeSchema>;

// 20. Canonical Question
export const canonicalQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  question_capital_node_id: z.string().uuid().optional().nullable(),
  normalized_question: z.string().min(5),
  slug: z.string().min(5).max(255).regex(/^[a-z0-9-]+$/),
  signature: z.string().min(5).max(64),
  created_at: z.string().optional(),
});

export type CanonicalQuestion = z.infer<typeof canonicalQuestionSchema>;

// 21. QIS Scene
export const qisSceneSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  canonical_question_id: z.string().uuid(),
  scene_name: z.string().min(3).max(255),
  query_template: z.string().min(3),
  intent_model: z.string().min(2),
  scenario_context: z.string().min(5),
  risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  created_at: z.string().optional(),
});

export type QisScene = z.infer<typeof qisSceneSchema>;

// 22. TCO Concept
export const tcoConceptSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  concept_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  definition: z.string().min(5),
  is_strategic: z.boolean().default(false),
  concept_type: z.string().min(2).default('tco_domain_entity'),
  operational_fields: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type TcoConcept = z.infer<typeof tcoConceptSchema>;

// 23. Brand Ontology Node
export const brandOntologyNodeSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  node_name: z.string().min(2).max(255),
  node_type: z.string().min(2),
  reference_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
});

export type BrandOntologyNode = z.infer<typeof brandOntologyNodeSchema>;

// 24. Brand Ontology Edge
export const brandOntologyEdgeSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  source_node_id: z.string().uuid(),
  target_node_id: z.string().uuid(),
  relation_type: z.string().min(2),
  created_at: z.string().optional(),
});

export type BrandOntologyEdge = z.infer<typeof brandOntologyEdgeSchema>;

// 25. Concept Relation
export const conceptRelationSchema = z.object({
  workspace_id: z.string().uuid(),
  source_concept_id: z.string().uuid(),
  target_concept_id: z.string().uuid(),
  relation_name: z.string().min(2),
});

export type ConceptRelation = z.infer<typeof conceptRelationSchema>;

// 26. Concept Operator
export const conceptOperatorSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  concept_id: z.string().uuid(),
  operator_name: z.string().min(2),
  logic_rules: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type ConceptOperator = z.infer<typeof conceptOperatorSchema>;

// 27. Claim Node
export const claimNodeSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  operational_truth_id: z.string().uuid(),
  claim_summary: z.string().min(5),
  created_at: z.string().optional(),
});

export type ClaimNode = z.infer<typeof claimNodeSchema>;

// 28. Lineage Record
export const lineageRecordSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  claim_node_id: z.string().uuid(),
  evidence_item_id: z.string().uuid().optional().nullable(),
  boundary_rule_id: z.string().uuid().optional().nullable(),
  is_publishable: z.boolean().default(false),
  verification_signature: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export type LineageRecord = z.infer<typeof lineageRecordSchema>;

// 29. Representation Object
export const representationObjectSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  object_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  object_type: z.string().min(2).max(50).default('ingredient'),
  qis_refs: z.array(z.string().uuid()).default([]),
  claim_refs: z.array(z.string().uuid()).default([]),
  concept_refs: z.array(z.string().uuid()).default([]),
  evidence_refs: z.array(z.string().uuid()).default([]),
  boundary_refs: z.array(z.string().uuid()).default([]),
  raw_properties: z.record(z.string(), z.any()).default({}),
  readiness_status: z.enum(['draft', 'ready', 'failed_safety']).default('draft'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type RepresentationObject = z.infer<typeof representationObjectSchema>;

// 30. Surface Contract
export const surfaceContractSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  contract_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  allowed_objects: z.array(z.string().uuid()).default([]),
  qis_refs: z.array(z.string().uuid()).default([]),
  required_blocks: z.array(z.string()).default([]),
  is_valid: z.boolean().default(false),
  validation_details: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type SurfaceContract = z.infer<typeof surfaceContractSchema>;

// 31. Semantic Page
export const semanticPageSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  surface_contract_id: z.string().uuid(),
  page_title: z.string().min(2).max(255),
  slug: z.string().min(2).max(255).regex(/^[a-z0-9-/]+$/),
  meta_description: z.string().max(500).optional().nullable(),
  visible_content: z.string().min(1),
  source_content: z.string().min(1),
  object_refs: z.array(z.string().uuid()).default([]),
  qis_refs: z.array(z.string().uuid()).default([]),
  claim_refs: z.array(z.string().uuid()).default([]),
  concept_refs: z.array(z.string().uuid()).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type SemanticPage = z.infer<typeof semanticPageSchema>;

// 32. Page Section
export const pageSectionSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  semantic_page_id: z.string().uuid(),
  section_title: z.string().min(2).max(255),
  section_type: z.string().min(2).max(50).default('clinical_facts'),
  content_body: z.string().min(1),
  source_artifact_refs: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type PageSection = z.infer<typeof pageSectionSchema>;

// 33. SEO/AEO/GEO Export
export const seoAeoGeoExportSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  semantic_page_id: z.string().uuid(),
  export_type: z.string().min(2).max(50),
  rendered_payload: z.string().min(1),
  traceability_carrier: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type SeoAeoGeoExport = z.infer<typeof seoAeoGeoExportSchema>;

// 34. Schema Mapping
export const schemaMappingSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  semantic_page_id: z.string().uuid(),
  schema_type: z.string().min(2).max(50).default('Product'),
  jsonld_mapping: z.record(z.string(), z.any()).default({}),
  is_valid: z.boolean().default(true),
  validation_logs: z.array(z.string()).default([]),
  created_at: z.string().optional(),
});

export type SchemaMapping = z.infer<typeof schemaMappingSchema>;

// 35. Internal Link Rule
export const internalLinkRuleSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  rule_name: z.string().min(2).max(255),
  source_concept_id: z.string().uuid().optional().nullable(),
  target_page_id: z.string().uuid(),
  anchor_text: z.string().min(1).max(255),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type InternalLinkRule = z.infer<typeof internalLinkRuleSchema>;

// 36. Website Generation Run
export const websiteGenerationRunSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  run_status: z.enum(['candidate', 'draft', 'completed', 'failed']).default('candidate'),
  generated_pages_count: z.number().min(0).default(0),
  details: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type WebsiteGenerationRun = z.infer<typeof websiteGenerationRunSchema>;

// --- Persona & Vibe Module Schemas ---

// 37. Persona Spec
export const personaSpecSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  persona_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  governance_layer: z.record(z.string(), z.any()).default({}),
  authority_scope: z.array(z.string()).default([]),
  legal_guardrails: z.array(z.string()).default([]),
  allowed_modes: z.array(z.string()).default(['standard']),
  current_mode: z.enum(['standard', 'advisory', 'crisis']).default('standard'),
  prompt_text: z.string().min(1),
  version: z.number().int().positive().default(1),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PersonaSpec = z.infer<typeof personaSpecSchema>;

// 38. Persona Assignment
export const personaAssignmentSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  persona_spec_id: z.string().uuid(),
  domain_id: z.string().uuid(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type PersonaAssignment = z.infer<typeof personaAssignmentSchema>;

// 39. Persona Eval Run
export const personaEvalRunSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  persona_spec_id: z.string().uuid(),
  run_status: z.enum(['candidate', 'draft', 'completed', 'failed']).default('candidate'),
  evaluation_metrics: z.record(z.string(), z.any()).default({}),
  details: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type PersonaEvalRun = z.infer<typeof personaEvalRunSchema>;

// 40. Persona Observatory Snapshot
export const personaObservatorySnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  snapshot_name: z.string().min(2).max(255),
  metrics: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type PersonaObservatorySnapshot = z.infer<typeof personaObservatorySnapshotSchema>;

// 41. Persona Patch
export const personaPatchSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  persona_spec_id: z.string().uuid(),
  proposed_patch_text: z.string().min(1),
  status: z.enum(['candidate', 'draft', 'approved', 'rejected']).default('candidate'),
  created_at: z.string().optional(),
});

export type PersonaPatch = z.infer<typeof personaPatchSchema>;

// 42. Vibe Spec
export const vibeSpecSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  vibe_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  target_vector: z.record(z.string(), z.number()).default({ clinical: 50, warm: 30, luxury: 20 }),
  anti_vibe_keywords: z.array(z.string()).default([]),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type VibeSpec = z.infer<typeof vibeSpecSchema>;

// 43. Vibe Assignment
export const vibeAssignmentSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  vibe_spec_id: z.string().uuid(),
  target_id: z.string().uuid(),
  target_type: z.enum(['qis', 'object', 'surface', 'page', 'section']).default('page'),
  created_at: z.string().optional(),
});

export type VibeAssignment = z.infer<typeof vibeAssignmentSchema>;

// 44. Vibe Rating Event
export const vibeRatingEventSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  vibe_spec_id: z.string().uuid(),
  target_id: z.string().uuid(),
  target_type: z.string().min(2).max(50).default('page'),
  rating_scores: z.record(z.string(), z.number()).default({ clinical: 0, warm: 0, luxury: 0 }),
  evidence_item_id: z.string().uuid(), // strictly required UUID check
  created_at: z.string().optional(),
});

export type VibeRatingEvent = z.infer<typeof vibeRatingEventSchema>;

// 45. Vibe Profile
export const vibeProfileSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  target_id: z.string().uuid(),
  target_type: z.string().min(2).max(50).default('page'),
  aggregated_vector: z.record(z.string(), z.number()).default({ clinical: 0, warm: 0, luxury: 0 }),
  created_at: z.string().optional(),
});

export type VibeProfile = z.infer<typeof vibeProfileSchema>;

// 46. Vibe Alignment Snapshot
export const vibeAlignmentSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  vibe_spec_id: z.string().uuid(),
  vpa: z.number().or(z.string()).default(0.00),
  vcs: z.number().or(z.string()).default(0.00),
  created_at: z.string().optional(),
});

export type VibeAlignmentSnapshot = z.infer<typeof vibeAlignmentSnapshotSchema>;

// 47. Vibe Diagnosis
export const vibeDiagnosisSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  vibe_spec_id: z.string().uuid(),
  msa: z.number().or(z.string()).default(0.00),
  findings: z.string().min(1),
  created_at: z.string().optional(),
});

export type VibeDiagnosis = z.infer<typeof vibeDiagnosisSchema>;

// 48. Vibe Intervention
export const vibeInterventionSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  vibe_diagnosis_id: z.string().uuid(),
  proposed_adjustments: z.record(z.string(), z.any()).default({}),
  is_applied: z.boolean().default(false),
  created_at: z.string().optional(),
});

export type VibeIntervention = z.infer<typeof vibeInterventionSchema>;

// 49. Vibe Validation Run
export const vibeValidationRunSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  vibe_spec_id: z.string().uuid(),
  vmri: z.number().or(z.string()).default(0.00),
  status: z.string().min(2).max(50).default('candidate'),
  created_at: z.string().optional(),
});

export type VibeValidationRun = z.infer<typeof vibeValidationRunSchema>;

// 50. Dark Pattern Rule
export const darkPatternRuleSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  rule_name: z.string().min(2).max(255),
  forbidden_linguistic_triggers: z.array(z.string()).default([]),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
});

export type DarkPatternRule = z.infer<typeof darkPatternRuleSchema>;

// --- Observatory & Metrics Module Schemas ---

// 51. Probe Panel
export const probePanelSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  panel_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(2000).optional().nullable(),
  version: z.number().int().positive().default(1),
  is_locked: z.boolean().default(false),
  industry: z.string().max(100).optional().nullable(),
  panel_type: z.string().max(50).default('standard'),
  sbs_index_target: z.string().max(50).optional().nullable(),
  parent_panel_id: z.string().uuid().optional().nullable(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ProbePanel = z.infer<typeof probePanelSchema>;

export const probeQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  probe_panel_id: z.string().uuid(),
  question_text: z.string().min(5),
  intent_context: z.string().min(2).max(255),
  target_keyword: z.string().min(2).max(255),
  risk_level: z.enum(['low', 'medium', 'high']).default('low'),
  decision_stage: z.string().max(50).optional().nullable(),
  question_type: z.string().max(50).optional().nullable(),
  weight: z.number().default(1.00),
  query_variants: z.array(z.string()).default([]),
  lifecycle_status: z.enum(['draft', 'review', 'active', 'deprecated', 'archived']).default('active'),
  lifecycle_changed_at: z.string().optional(),
  ttl_expires_at: z.string().optional().nullable(),
  is_time_sensitive: z.boolean().default(false),
  base_weight: z.number().default(1.00),
  calibrated_weight: z.number().optional().nullable(),
  last_calibrated_at: z.string().optional().nullable(),
  funnel_stage: z.string().max(50).default('intake'),
  is_ymyl: z.boolean().default(false),
  regulatory_ref_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ProbeQuestion = z.infer<typeof probeQuestionSchema>;

// 53. AI Observation Run
export const aiObservationRunSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  run_name: z.string().min(2).max(255),
  probe_panel_id: z.string().uuid(),
  run_status: z.enum(['candidate', 'draft', 'completed', 'failed']).default('candidate'),
  run_metadata: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type AIObservationRun = z.infer<typeof aiObservationRunSchema>;

// 54. Probe Run
export const probeRunSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  ai_observation_run_id: z.string().uuid(),
  probe_question_id: z.string().uuid(),
  engine_name: z.string().min(2).max(100).default('mock_provider'),
  raw_response_text: z.string().min(1),
  metadata: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type ProbeRun = z.infer<typeof probeRunSchema>;

// 55. Response Judgment
export const responseJudgmentSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  probe_run_id: z.string().uuid(),
  is_citation_found: z.boolean().default(false),
  brand_semantic_fidelity_score: z.number().or(z.string()).default(0.00),
  question_territory_covered: z.boolean().default(false),
  geo_concept_transferred: z.boolean().default(false),
  reviewer_notes: z.string().optional().nullable(),
  review_status: z.enum(['candidate', 'draft', 'approved', 'rejected']).default('candidate'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ResponseJudgment = z.infer<typeof responseJudgmentSchema>;

// 56. Metric Snapshot
export const metricSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  ai_observation_run_id: z.string().uuid(),
  metric_name: z.string().min(2).max(100),
  metric_value: z.number().or(z.string()).default(0.00),
  details: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type MetricSnapshot = z.infer<typeof metricSnapshotSchema>;

// 57. Domain Index Definition
export const domainIndexDefinitionSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  index_name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  configured_weights: z.record(z.string(), z.number()).default({ AAS: 0.2, OCR: 0.2, BSF: 0.3, QTC: 0.1, GCTR: 0.2 }),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type DomainIndexDefinition = z.infer<typeof domainIndexDefinitionSchema>;

// 58. Domain Index Snapshot
export const domainIndexSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  domain_index_definition_id: z.string().uuid(),
  ai_observation_run_id: z.string().uuid(),
  computed_value: z.number().or(z.string()).default(0.00),
  details: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type DomainIndexSnapshot = z.infer<typeof domainIndexSnapshotSchema>;

// 59. Benchmark Report
export const benchmarkReportSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  report_name: z.string().min(2).max(255),
  panel_version: z.number().int().positive().default(1),
  scores: z.record(z.string(), z.any()).default({}),
  methodology_disclosure_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
});

export type BenchmarkReport = z.infer<typeof benchmarkReportSchema>;

// 60. Methodology Disclosure
export const methodologyDisclosureSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  disclosure_name: z.string().min(2).max(255),
  methodology_description: z.string().min(5),
  proxy_caveat_text: z.string().min(5),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type MethodologyDisclosure = z.infer<typeof methodologyDisclosureSchema>;

// 61. Semantic Website Lift Snapshot
export const semanticWebsiteLiftSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  base_observation_run_id: z.string().uuid(),
  active_observation_run_id: z.string().uuid(),
  lift_metrics: z.record(z.string(), z.any()).default({}),
  proxy_caveat_text: z.string().min(5),
  created_at: z.string().optional(),
});

export type SemanticWebsiteLiftSnapshot = z.infer<typeof semanticWebsiteLiftSnapshotSchema>;

// --- Benchmark Report Publisher Module Schemas ---

// 62. Report Section
export const reportSectionSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  benchmark_report_id: z.string().uuid(),
  section_title: z.string().min(2).max(255),
  section_body: z.string().min(1),
  section_type: z.enum(['executive_summary', 'metrics_analysis', 'competitive_landscape', 'methodology_appendix']).default('executive_summary'),
  status: z.enum(['candidate', 'draft', 'completed']).default('candidate'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ReportSection = z.infer<typeof reportSectionSchema>;

// 63. Report Export
export const reportExportSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  benchmark_report_id: z.string().uuid(),
  export_format: z.enum(['markdown', 'html']).default('markdown'),
  exported_payload: z.string().min(1),
  is_published: z.boolean().default(false),
  created_at: z.string().optional(),
});

export type ReportExport = z.infer<typeof reportExportSchema>;

// 64. Report Review
export const reportReviewSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  benchmark_report_id: z.string().uuid(),
  reviewer_id: z.string().uuid(),
  decision: z.enum(['approved', 'rejected']).default('approved'),
  notes: z.string().max(2000).optional().nullable(),
  created_at: z.string().optional(),
});

export type ReportReview = z.infer<typeof reportReviewSchema>;

// 65. Report Gate Result
export const reportGateResultSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  benchmark_report_id: z.string().uuid(),
  status: z.enum(['pass', 'fail']).default('fail'),
  blocking_reasons: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),
  required_fixes: z.array(z.string()).default([]),
  evaluated_at: z.string().optional(),
});

export type ReportGateResult = z.infer<typeof reportGateResultSchema>;

// 66. Unsafe Wording Finding
export const unsafeWordingFindingSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  benchmark_report_id: z.string().uuid(),
  finding_type: z.string().min(2).max(100),
  offending_text: z.string().min(1),
  is_resolved: z.boolean().default(false),
  resolution_notes: z.string().max(2000).optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UnsafeWordingFinding = z.infer<typeof unsafeWordingFindingSchema>;

// --- Fix-It & Factory Module Schemas (AG-B8) ---

// 67. RCA Case
export const rcaCaseSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  source_metric_snapshot_id: z.string().uuid().optional().nullable(),
  metric_name: z.string().min(1),
  metric_value: z.number(),
  cause_hypothesis: z.string().min(10, { message: "Structured cause hypothesis must be at least 10 characters long" }),
  status: z.enum(['candidate', 'approved', 'rejected']).default('candidate'),
  justification_notes: z.string().max(2000).optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type RcaCase = z.infer<typeof rcaCaseSchema>;

// 68. Patch Ticket
export const patchTicketSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  rca_case_id: z.string().uuid(),
  patch_name: z.string().min(1),
  patch_hypothesis: z.string().min(10, { message: "Patch hypothesis must be at least 10 characters long" }),
  status: z.enum(['candidate', 'approved', 'applied', 'completed', 'rejected']).default('candidate'),
  approver_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type PatchTicket = z.infer<typeof patchTicketSchema>;

// 69. Patch Artifact Change
export const patchArtifactChangeSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  patch_ticket_id: z.string().uuid(),
  target_artifact_type: z.string().min(1),
  target_artifact_id: z.string().uuid(),
  original_payload: z.any().optional().nullable(),
  modified_payload: z.any().optional().nullable(),
  status: z.enum(['candidate', 'applied', 'rolled_back']).default('candidate'),
  created_at: z.string().optional(),
});

export type PatchArtifactChange = z.infer<typeof patchArtifactChangeSchema>;

// 70. Retest Plan
export const retestPlanSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  patch_ticket_id: z.string().uuid(),
  probe_panel_id: z.string().uuid(),
  baseline_run_id: z.string().uuid(),
  description: z.string().max(2000).optional().nullable(),
  created_at: z.string().optional(),
});

export type RetestPlan = z.infer<typeof retestPlanSchema>;

// 71. Retest Run
export const retestRunSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  retest_plan_id: z.string().uuid(),
  retest_observation_run_id: z.string().uuid().optional().nullable(),
  status: z.enum(['pending', 'running', 'completed', 'failed']).default('pending'),
  retest_scores: z.any().optional().nullable(),
  retest_verdict: z.enum(['pass', 'fail']).optional().nullable(),
  created_at: z.string().optional(),
  completed_at: z.string().optional().nullable(),
});

export type RetestRun = z.infer<typeof retestRunSchema>;

// 72. Post Patch Lift Snapshot
export const postPatchLiftSnapshotSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  retest_run_id: z.string().uuid(),
  baseline_scores: z.any(),
  retest_scores: z.any(),
  lift_values: z.any(),
  is_guardrail_regressed: z.boolean().default(false),
  regression_details: z.any().optional().nullable(),
  final_verdict: z.enum(['pass', 'fail']).default('fail'),
  created_at: z.string().optional(),
});

export type PostPatchLiftSnapshot = z.infer<typeof postPatchLiftSnapshotSchema>;

// 73. Factory Reuse Candidate
export const factoryReuseCandidateSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  patch_ticket_id: z.string().uuid(),
  post_patch_lift_snapshot_id: z.string().uuid(),
  candidate_name: z.string().min(1),
  artifact_type: z.string().min(1),
  artifact_payload: z.any(),
  status: z.enum(['candidate', 'promoted', 'rejected']).default('candidate'),
  promoted_at: z.string().optional().nullable(),
  created_at: z.string().optional(),
});

export type FactoryReuseCandidate = z.infer<typeof factoryReuseCandidateSchema>;

// 74. Fix-It Playbook Rule
export const fixitPlaybookRuleSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  rule_name: z.string().min(1),
  trigger_metric: z.string().min(1),
  threshold_operator: z.enum(['<', '<=']).default('<'),
  threshold_value: z.number(),
  recommended_action: z.string().min(1),
  created_at: z.string().optional(),
});

export type FixitPlaybookRule = z.infer<typeof fixitPlaybookRuleSchema>;

// 75. Expected Layer
export const expectedLayerSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  probe_question_id: z.string().uuid(),
  must_include: z.array(z.string()).default([]),
  strongly_recommended: z.array(z.string()).default([]),
  should_include: z.array(z.string()).default([]),
  caution: z.array(z.string()).default([]),
  must_not_do: z.array(z.string()).default([]),
  expected_layer_version: z.number().int().default(1),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ExpectedLayer = z.infer<typeof expectedLayerSchema>;

// 76. Tenant-Workspace Bridge
export const tenantWorkspaceBridgeSchema = z.object({
  id: z.string().uuid().optional(),
  aihompy_tenant_id: z.string().uuid(),
  aihompy_tenant_slug: z.string().max(100).optional().nullable(),
  aihompy_industry: z.string().max(100),
  bsw_workspace_id: z.string().uuid(),
  sync_status: z.enum(['pending', 'active', 'paused', 'error']).default('pending'),
  last_synced_at: z.string().optional().nullable(),
  sync_config: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type TenantWorkspaceBridge = z.infer<typeof tenantWorkspaceBridgeSchema>;

// 77. Question Value Score
export const questionValueScoreSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  probe_question_id: z.string().uuid().optional().nullable(),
  predicted_question_id: z.string().uuid().optional().nullable(),
  volume_score: z.number().default(0),
  conversion_score: z.number().default(0),
  arpu_score: z.number().default(0),
  first_mover_score: z.number().default(1.0),
  competition_score: z.number().default(0),
  qvs_composite: z.number().default(0),
  estimated_monthly_value: z.number().default(0),
  preemption_deadline: z.string().optional().nullable(),
  industry: z.string().max(100),
  scoring_method: z.enum(['auto', 'manual']).default('auto'),
  scored_at: z.string().optional(),
});

export type QuestionValueScore = z.infer<typeof questionValueScoreSchema>;

// 78. Emergence Signal
export const emergenceSignalSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid().optional().nullable(),
  source_type: z.string().max(50),
  industry: z.string().max(100),
  raw_text: z.string().min(1),
  source_url: z.string().url().optional().nullable().or(z.literal("")),
  ai_analysis: z.record(z.string(), z.any()).default({}),
  predicted_impact: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  detected_at: z.string().optional(),
  expires_at: z.string().optional().nullable(),
  status: z.enum(['new', 'analyzed', 'archived']).default('new'),
});

export type EmergenceSignal = z.infer<typeof emergenceSignalSchema>;

// 79. Predicted Question
export const predictedQuestionSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid().optional().nullable(),
  signal_id: z.string().uuid().optional().nullable(),
  question_text: z.string().min(5),
  question_variants: z.array(z.string()).default([]),
  predicted_intent: z.string().min(2),
  industry: z.string().max(100),
  predicted_volume: z.enum(['low', 'medium', 'high']).default('medium'),
  current_ai_coverage: z.enum(['none', 'sparse', 'moderate', 'saturated']).default('none'),
  first_mover_window_days: z.number().int().default(30),
  preemption_urgency: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
  confidence: z.number().min(0).max(1).default(0.50),
  auto_must_include: z.array(z.string()).optional().default([]),
  auto_strongly_recommended: z.array(z.string()).optional(),
  auto_should_include: z.array(z.string()).optional().default([]),
  auto_caution: z.array(z.string()).optional(),
  auto_must_not_do: z.array(z.string()).optional().default([]),
  actually_emerged: z.boolean().optional().nullable(),
  emerged_at: z.string().optional().nullable(),
  prediction_accuracy: z.number().optional().nullable(),
  created_at: z.string().optional(),
});

export type PredictedQuestion = z.infer<typeof predictedQuestionSchema>;

// 80. Content Blueprint Schema
export const contentBlueprintSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  predicted_question_id: z.string().uuid(),
  recommended_structure: z.string().max(50),
  recommended_schema: z.array(z.record(z.string(), z.any())).default([]),
  recommended_length: z.object({
    min: z.number().int().default(300),
    max: z.number().int().default(800),
    optimal: z.number().int().default(500),
  }).default({ min: 300, max: 800, optimal: 500 }),
  required_eeat_level: z.string().max(30).default('basic'),
  target_vpa: z.number().default(75.00),
  tone_guidelines: z.array(z.string()).default([]),
  forbidden_expressions: z.array(z.string()).default([]),
  brand_voice_keywords: z.array(z.string()).default([]),
  draft_content: z.string().optional().nullable(),
  draft_vpa_score: z.number().optional().nullable(),
  status: z.enum(['draft', 'verified', 'queued', 'published']).default('draft'),
  tenant_bridge_id: z.string().uuid().optional().nullable(),
  created_at: z.string().optional(),
});

export type ContentBlueprint = z.infer<typeof contentBlueprintSchema>;

// 81. Question Funnel Event
export const questionFunnelEventSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  probe_question_id: z.string().uuid().optional().nullable(),
  predicted_question_id: z.string().uuid().optional().nullable(),
  from_stage: z.string().min(1),
  to_stage: z.string().min(1),
  event_metadata: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});

export type QuestionFunnelEvent = z.infer<typeof questionFunnelEventSchema>;

// 82. YMYL Regulatory Reference
export const ymylRegulatoryReferenceSchema = z.object({
  id: z.string().uuid().optional(),
  agency: z.string().min(2),
  article_code: z.string().min(2),
  safety_guideline: z.string().min(5),
  created_at: z.string().optional()
});

export type YmylRegulatoryReference = z.infer<typeof ymylRegulatoryReferenceSchema>;








