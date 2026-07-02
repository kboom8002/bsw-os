import React from 'react';
import {
  EntityReflectionSnapshot,
  SurfaceGapAnalysis
} from '../../lib/schema';
import { TechInfraAuditResult } from '../../lib/surface/tech-infra-auditor';
import { SchemaQualityAuditResult } from '../../lib/surface/schema-quality-auditor';
import { ContentSemanticResult } from '../../lib/surface/content-semantic-analyzer';
import { TemporalTrend } from '../../lib/benchmark/temporal-tracker';

import LayerScoreCards from './LayerScoreCards';
import CriticalIssuesList from './CriticalIssuesList';
import ERRRadarChart from './ERRRadarChart';
import GapQuadrantMatrix from './GapQuadrantMatrix';
import TemporalTrendChart from './TemporalTrendChart';
import AEPIScoreCard from './AEPIScoreCard';

interface OverviewPanelProps {
  snapshot: EntityReflectionSnapshot | null;
  techInfra: TechInfraAuditResult | null;
  schemaQuality: SchemaQualityAuditResult | null;
  contentSemantic: ContentSemanticResult | null;
  gaps: SurfaceGapAnalysis[];
  trends: TemporalTrend[];
  auditMode: 'estimated' | 'measured' | 'partial';
}

export default function OverviewPanel({
  snapshot,
  techInfra,
  schemaQuality,
  contentSemantic,
  gaps,
  trends,
  auditMode
}: OverviewPanelProps) {
  // Extract scores or default to 50
  const techScore = techInfra ? techInfra.techInfraScore : 50;
  const schemaScore = schemaQuality ? schemaQuality.schemaQualityScore : 50;
  const contentScore = contentSemantic ? contentSemantic.contentSemanticScore : 50;
  const reflectionScore = snapshot ? Math.round(snapshot.aepi_score) : null;

  // Gather all critical issues from L1, L2, L3
  const criticalIssues: any[] = [];
  
  if (techInfra?.issues) {
    criticalIssues.push(...techInfra.issues.filter(i => i.severity === 'critical').map(i => ({ ...i, layer: 'L1: 기술 인프라' })));
  }
  if (schemaQuality?.issues) {
    criticalIssues.push(...schemaQuality.issues.filter(i => i.severity === 'critical').map(i => ({ ...i, layer: 'L2: 구조화 시맨틱' })));
  }
  if (contentSemantic?.issues) {
    criticalIssues.push(...contentSemantic.issues.filter(i => i.severity === 'critical').map(i => ({ ...i, layer: 'L3: 콘텐츠 시맨틱' })));
  }

  return (
    <div className="space-y-8">
      {/* 4-Layer Score cards grid */}
      <LayerScoreCards
        techScore={techScore}
        schemaScore={schemaScore}
        contentScore={contentScore}
        reflectionScore={reflectionScore}
      />

      {/* AEPI Score Card */}
      {snapshot && (
        <AEPIScoreCard
          aepiScore={snapshot.aepi_score}
          techScore={snapshot.tech_mod_score}
          eeatScore={snapshot.eeat_mod_score}
          totalEntities={snapshot.total_entities_checked}
          reflectedEntities={snapshot.total_entities_reflected}
          auditMode={auditMode}
        />
      )}

      {/* Overview Grid split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Radar and Gap Matrix */}
        <div className="lg:col-span-1">
          {snapshot && (
            <ERRRadarChart
              errFactoid={snapshot.err_factoid}
              errProcedural={snapshot.err_procedural}
              errComparative={snapshot.err_comparative}
              errAuthority={snapshot.err_authority}
              errSchema={snapshot.err_schema}
              errTopical={snapshot.err_topical}
              errGeo={snapshot.err_geo}
            />
          )}
        </div>
        
        <div className="lg:col-span-2">
          <GapQuadrantMatrix gaps={gaps} />
        </div>
      </div>

      {/* Critical Issues List summary */}
      <CriticalIssuesList issues={criticalIssues} />

      {/* Time-series trends */}
      {trends.length > 0 && (
        <TemporalTrendChart trends={trends} />
      )}
    </div>
  );
}
