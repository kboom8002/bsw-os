import { z } from 'zod';

export const E2EPipelineInputSchema = z.object({
  workspaceId: z.string().uuid('workspaceId must be a valid UUID'),
  domainName: z.string().min(1, 'domainName cannot be empty').max(200),
  brandName: z.string().max(200).optional(),
  options: z.object({
    mode: z.enum(['hub', 'standalone']).default('standalone'),
    autoPromoteTopN: z.number().int().min(1).max(20).default(5),
    brandUSP: z.string().max(1000).optional(),
    industryKey: z.string().min(1).optional(),
  }).optional(),
});

export const PromoteSignalInputSchema = z.object({
  workspaceId: z.string().uuid('workspaceId must be a valid UUID'),
  signalId: z.string().uuid('signalId must be a valid UUID'),
  options: z.object({
    autoCreateQisScene: z.boolean().default(false),
    industryKey: z.string().optional(),
  }).optional(),
});

export type E2EPipelineInput = z.infer<typeof E2EPipelineInputSchema>;
export type PromoteSignalInput = z.infer<typeof PromoteSignalInputSchema>;
