import fs from 'fs';
import path from 'path';
import * as yaml from 'js-yaml';
import { getSupabaseAdminClient } from '../supabase';
import {
  PatternAttractorSpec,
  AttractorType,
  AttractorScope,
  AttractorStatus,
  VibeSignature,
  ClaimStrength
} from './types';

export interface DomainYamlInfo {
  id: string;
  name: string;
  subdomain?: string;
  description?: string;
  version: string;
}

export interface ConceptYamlInfo {
  id: string;
  name: string;
  definition: string;
  is_strategic: boolean;
  concept_type?: string;
  activation_condition?: Record<string, any>;
  boundary?: Record<string, any>;
  operator?: Record<string, any>;
  risk_vector?: Record<string, any>;
}

export interface PolicyYamlInfo {
  allowed_actions: string[];
  blocked_actions: string[];
  cta_policy: {
    primary: string;
    secondary: string[];
    blocked: string[];
  };
  safety_policy: {
    boundary_notes: string[];
    escalation_conditions: string[];
  };
}

export class DomainPackLoader {
  static getPacksDirectory(): string {
    return path.join(process.cwd(), 'packs');
  }

  // list available packs in the packs/ directory
  static async listAvailablePacks(): Promise<string[]> {
    const packsDir = this.getPacksDirectory();
    if (!fs.existsSync(packsDir)) {
      return [];
    }
    return fs.readdirSync(packsDir).filter((file) => {
      const fullPath = path.join(packsDir, file);
      return fs.statSync(fullPath).isDirectory();
    });
  }

  // Load domain pack files from directory
  static loadPackFromDir(packSlug: string): {
    domain: DomainYamlInfo;
    attractors: any[];
    concepts: ConceptYamlInfo[];
    policies: PolicyYamlInfo;
  } {
    const packDir = path.join(this.getPacksDirectory(), packSlug);
    if (!fs.existsSync(packDir)) {
      throw new Error(`Pack directory not found: ${packDir}`);
    }

    const domainPath = path.join(packDir, 'domain.yaml');
    const attractorsPath = path.join(packDir, 'attractors.yaml');
    const conceptsPath = path.join(packDir, 'concepts.yaml');
    const policiesPath = path.join(packDir, 'policies.yaml');

    if (!fs.existsSync(domainPath)) {
      throw new Error(`Missing domain.yaml in ${packSlug}`);
    }

    const domain = yaml.load(fs.readFileSync(domainPath, 'utf8')) as DomainYamlInfo;
    
    let attractors: any[] = [];
    if (fs.existsSync(attractorsPath)) {
      attractors = (yaml.load(fs.readFileSync(attractorsPath, 'utf8')) as any) || [];
    }

    let concepts: ConceptYamlInfo[] = [];
    if (fs.existsSync(conceptsPath)) {
      concepts = (yaml.load(fs.readFileSync(conceptsPath, 'utf8')) as ConceptYamlInfo[]) || [];
    }

    let policies: PolicyYamlInfo = {
      allowed_actions: [],
      blocked_actions: [],
      cta_policy: { primary: '', secondary: [], blocked: [] },
      safety_policy: { boundary_notes: [], escalation_conditions: [] }
    };
    if (fs.existsSync(policiesPath)) {
      policies = yaml.load(fs.readFileSync(policiesPath, 'utf8')) as PolicyYamlInfo;
    }

    return { domain, attractors, concepts, policies };
  }

  // Sync loaded pack to Supabase database
  static async syncToDatabase(
    workspaceId: string,
    packSlug: string
  ): Promise<{ created: number; updated: number; skipped: number }> {
    const { domain, attractors, concepts, policies } = this.loadPackFromDir(packSlug);
    const supabase = getSupabaseAdminClient();

    // 1. Ensure domain exists in domains table
    // Let's resolve domain UUID. If it's a domain standard, we either upsert domains table.
    // domains has columns: id (UUID), workspace_id, name, slug, description, created_at, updated_at
    let domainUuid: string;
    const { data: existingDomain, error: domainErr } = await supabase
      .from('domains')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq('slug', packSlug)
      .single();

    if (existingDomain) {
      domainUuid = existingDomain.id;
      await supabase
        .from('domains')
        .update({
          name: domain.name,
          description: domain.description,
          updated_at: new Date().toISOString()
        })
        .eq('id', domainUuid);
    } else {
      const { data: newDomain, error: insertDomainErr } = await supabase
        .from('domains')
        .insert({
          workspace_id: workspaceId,
          name: domain.name,
          slug: packSlug,
          description: domain.description
        })
        .select('id')
        .single();

      if (insertDomainErr || !newDomain) {
        throw new Error(`Failed to create domain for ${packSlug}: ${insertDomainErr?.message}`);
      }
      domainUuid = newDomain.id;
    }

    // 2. Ensure concepts exist in tco_concepts table
    // tco_concepts has columns: id (UUID), workspace_id, concept_name, slug, definition, is_strategic, concept_type, operational_fields, activation_condition, boundary, operator, risk_vector
    for (const concept of concepts) {
      const { data: existingConcept } = await supabase
        .from('tco_concepts')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('slug', concept.id)
        .single();

      const conceptPayload = {
        workspace_id: workspaceId,
        concept_name: concept.name,
        slug: concept.id,
        definition: concept.definition,
        is_strategic: concept.is_strategic,
        concept_type: concept.concept_type || 'tco_domain_entity',
        activation_condition: concept.activation_condition || {},
        boundary: concept.boundary || {},
        operator: concept.operator || {},
        risk_vector: concept.risk_vector || {},
        operational_fields: {}
      };

      if (existingConcept) {
        const { error: updateErr } = await supabase
          .from('tco_concepts')
          .update(conceptPayload)
          .eq('id', existingConcept.id);
        if (updateErr) {
          console.warn(`[DomainPackLoader] Failed to update concept '${concept.id}':`, updateErr.message);
        }
      } else {
        const { error: insertErr } = await supabase
          .from('tco_concepts')
          .insert(conceptPayload);
        if (insertErr) {
          console.warn(`[DomainPackLoader] Failed to insert concept '${concept.id}':`, insertErr.message);
        }
      }
    }

    // 3. Upsert pattern_attractors
    let created = 0;
    let updated = 0;

    for (const att of attractors) {
      // Merge policies default if not specified in attractor
      const trigger_state = att.trigger_state || {};
      const concept_state = att.concept_state || {};
      const evidence_anchor = att.evidence_anchor || {};
      const vibe_signature = att.vibe_signature || {};
      const action_policy = att.action_policy || {};

      // If action policy is empty, fallback to policies.yaml
      if (!action_policy.allowed_actions || action_policy.allowed_actions.length === 0) {
        action_policy.allowed_actions = policies.allowed_actions;
      }
      if (!action_policy.blocked_actions || action_policy.blocked_actions.length === 0) {
        action_policy.blocked_actions = policies.blocked_actions;
      }
      if (!action_policy.cta_policy || !action_policy.cta_policy.primary) {
        action_policy.cta_policy = policies.cta_policy;
      }
      if (!action_policy.safety_policy || !action_policy.safety_policy.boundary_notes) {
        action_policy.safety_policy = policies.safety_policy;
      }

      const { data: existingAttractor } = await supabase
        .from('pattern_attractors')
        .select('id')
        .eq('workspace_id', workspaceId)
        .eq('id', att.id)
        .single();

      const attractorPayload = {
        workspace_id: workspaceId,
        domain_id: domainUuid,
        version: domain.version || '0.1.0',
        status: att.status || 'draft',
        type: att.type || [],
        scope: 'domain' as AttractorScope,
        brand_id: null,
        natural_definition: att.natural_definition || '',
        trigger_state,
        concept_state,
        evidence_anchor,
        vibe_signature,
        action_policy,
        media_soliton_rule: att.media_soliton_rule || {},
        target_state: att.target_state || {},
        metrics: att.metrics || {},
        failure_modes: att.failure_modes || [],
        recomposition_rule: att.recomposition_rule || {},
        source_yaml_pack: packSlug,
        updated_at: new Date().toISOString()
      };

      if (existingAttractor) {
        const { error: updateErr } = await supabase
          .from('pattern_attractors')
          .update(attractorPayload)
          .eq('id', att.id);
        
        if (!updateErr) updated++;
      } else {
        const { error: insertErr } = await supabase
          .from('pattern_attractors')
          .insert({
            id: att.id,
            ...attractorPayload,
            created_at: new Date().toISOString()
          });

        if (!insertErr) created++;
      }
    }

    return { created, updated, skipped: 0 };
  }
}
