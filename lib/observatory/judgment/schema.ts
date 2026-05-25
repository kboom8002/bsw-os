import { z } from 'zod';

export const judgeOutputSchema = z.object({
  centered_brand_name: z.string().nullable(),
  mentioned_brand_names: z.array(z.string()),
  centeredness_score: z.number().min(0).max(1),
  official_citation: z.boolean(),
  source_mix_type: z.enum(['official', 'third_party', 'mixed', 'unknown', 'none']),
  concept_transfer_score: z.number().min(0).max(1),
  concept_distortion_score: z.number().min(0).max(1),
  missing_concepts: z.array(z.string()),
  hallucinated_claims: z.array(z.string()),
  explanation_quality_score: z.number().min(0).max(1),
  trust_visible: z.boolean(),
  boundary_visible: z.boolean(),
  action_alignment_score: z.number().min(0).max(1),
  confidence: z.number().min(0).max(1),
  reasoning_summary: z.string()
});

export type JudgeOutput = z.infer<typeof judgeOutputSchema>;
