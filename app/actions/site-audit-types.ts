/**
 * site-audit-types.ts
 * 
 * 'use server' 파일(site-audit.ts)에서 interface/type export가 불가능하므로
 * 타입을 별도 파일로 분리합니다.
 */

import { TemporalTrend } from "../../lib/benchmark/temporal-tracker";
import {
  SurfaceEntity, ReversedAnswerCard,
  EntityReflectionSnapshot, ObservedParametricPersona,
  PersonaSpec, SurfaceGapAnalysis
} from "../../lib/schema";
import { ParametricPersonaSnapshot } from "../../lib/persona/parametric-persona-snapshot";
import { TechInfraAuditResult } from "../../lib/surface/tech-infra-auditor";
import { SchemaQualityAuditResult } from "../../lib/surface/schema-quality-auditor";
import { ContentSemanticResult } from "../../lib/surface/content-semantic-analyzer";
import { RelativePosition } from "../../lib/industry/relative-positioner";
import { ImprovementStrategy } from "../../lib/industry/strategy-generator";

export interface AuditResult {
  websiteUrl: string;
  brandName: string;
  entities: SurfaceEntity[];
  cards: ReversedAnswerCard[];
  snapshot: EntityReflectionSnapshot | null;
  observedPersona: ObservedParametricPersona | null;
  parametricSnapshot: ParametricPersonaSnapshot | null;
  personaSpec: PersonaSpec | null;
  gaps: SurfaceGapAnalysis[];
  trends: TemporalTrend[];
  auditMode: 'estimated' | 'measured' | 'partial';
  sessionId?: string;
  industry?: string;
  techInfra?: TechInfraAuditResult;
  schemaQuality?: SchemaQualityAuditResult;
  contentSemantic?: ContentSemanticResult;
  relativePosition?: RelativePosition | null;
  improvementStrategy?: ImprovementStrategy | null;
  canonicalQuestions?: any[];
  qisScenes?: any[];
}
