import { z } from 'zod';

// Roles allowed in Organization Memberships
export const ORG_ROLES = ['owner', 'admin', 'member', 'viewer'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

// 1. Organization Schema
export const organizationSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type Organization = z.infer<typeof organizationSchema>;

// 2. Organization Membership Schema
export const organizationMembershipSchema = z.object({
  id: z.string().uuid().optional(),
  organization_id: z.string().uuid(),
  user_id: z.string().uuid(),
  role: z.enum(ORG_ROLES),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type OrganizationMembership = z.infer<typeof organizationMembershipSchema>;

// 3. KCulture Domain Pack Schema (Extended Domain Pack)
export const kcultureDomainPackSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  domain_id: z.string().uuid().optional().nullable(),
  name: z.string().min(2).max(255),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-_]+$/),
  description: z.string().optional().nullable(),
  version: z.string().default('0.1'),
  supported_languages: z.array(z.string()).default(['ko', 'en']),
  concept_types: z.array(z.object({
    type_id: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).default([]),
  rating_axes: z.array(z.object({
    axis_id: z.string(),
    label: z.string(),
    description: z.string().optional(),
  })).default([]),
  forbidden_patterns: z.array(z.object({
    pattern_id: z.string(),
    expression: z.string(),
    reason: z.string().optional(),
  })).default([]),
  risk_policies: z.record(z.string(), z.any()).default({}),
  default_qbs_templates: z.array(z.object({
    question_text: z.string(),
    intent_type: z.string(),
    required_concepts: z.array(z.string()),
    forbidden_concepts: z.array(z.string()).optional(),
  })).default([]),
  status: z.enum(['draft', 'active', 'archived']).default('draft'),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type KCultureDomainPack = z.infer<typeof kcultureDomainPackSchema>;

// 4. Cultural Concept Schema
export const culturalConceptSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  domain_pack_id: z.string().uuid(),
  concept_id: z.string().min(1).max(100),
  version: z.string().default('0.1'),
  status: z.enum(['draft', 'expert_review', 'active', 'deprecated']).default('draft'),
  preferred_label: z.object({
    ko: z.string(),
    en: z.string(),
  }),
  aliases: z.record(z.string(), z.array(z.string())).default({}),
  concept_type: z.string(),
  definition: z.string().optional().nullable(),
  defining_attributes: z.array(z.string()).default([]),
  boundary_conditions: z.record(z.string(), z.any()).default({}),
  parent_concepts: z.array(z.string()).default([]),
  relation_edges: z.array(z.object({
    target_concept_id: z.string(),
    relation_type: z.string(),
    weight: z.number().optional(),
  })).default([]),
  affective_vector: z.record(z.string(), z.number()).default({}),
  risk_vector: z.record(z.string(), z.number()).default({}),
  commerce_vector: z.record(z.string(), z.number()).default({}),
  identity_vector: z.record(z.string(), z.number()).default({}),
  evidence_sources: z.array(z.object({
    source_type: z.string(),
    reference: z.string(),
    quote: z.string().optional(),
  })).default([]),
  action_policies: z.record(z.string(), z.any()).default({}),
  created_by: z.string().optional().nullable(),
  reviewed_by: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});
export type CulturalConcept = z.infer<typeof culturalConceptSchema>;

// 5. Cultural Opportunity Schema
export const culturalOpportunitySchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  domain_pack_id: z.string().uuid().optional().nullable(),
  opportunity_type: z.enum(['product', 'tourism', 'content']),
  title: z.string().min(2).max(255),
  description: z.string().optional().nullable(),
  target_market: z.string().optional().nullable(),
  target_microgroup: z.string().optional().nullable(),
  linked_concepts: z.array(z.string()).default([]),
  resonance_score: z.number().min(0).max(1).optional().nullable(),
  commercial_transferability: z.number().min(0).max(1).optional().nullable(),
  risk_score: z.number().min(0).max(1).optional().nullable(),
  recommended_actions: z.array(z.string()).default([]),
  source_evidence: z.record(z.string(), z.any()).default({}),
  status: z.enum(['draft', 'reviewed', 'approved', 'archived']).default('draft'),
  created_at: z.string().optional(),
});
export type CulturalOpportunity = z.infer<typeof culturalOpportunitySchema>;

// 6. Human Review Schema
export const humanReviewSchema = z.object({
  id: z.string().uuid().optional(),
  workspace_id: z.string().uuid(),
  object_type: z.string(), // e.g. 'cultural_concept', 'opportunity'
  object_id: z.string().uuid(),
  reviewer_id: z.string().optional().nullable(),
  review_status: z.enum(['approved', 'corrected', 'rejected', 'needs_discussion']),
  comments: z.string().optional().nullable(),
  correction_payload: z.record(z.string(), z.any()).default({}),
  created_at: z.string().optional(),
});
export type HumanReview = z.infer<typeof humanReviewSchema>;
