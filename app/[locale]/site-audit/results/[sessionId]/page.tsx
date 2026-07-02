import React from 'react';
import { notFound } from 'next/navigation';
import { getSupabaseAdminClient } from '../../../../../lib/supabase';
import SiteAuditDashboard from '../../../../../components/site-audit/SiteAuditDashboard';

interface Props {
  params: Promise<{ locale: string; sessionId: string }>;
}

export default async function ResultsPage({ params }: Props) {
  const { sessionId } = await params;

  const db = getSupabaseAdminClient();
  const { data, error } = await db
    .from('audit_sessions')
    .select('result_data, tier')
    .eq('id', sessionId)
    .single();

  if (error || !data || !data.result_data) {
    console.error("Result fetch error:", error);
    return notFound();
  }

  const res = data.result_data;

  return (
    <SiteAuditDashboard
      brandName={res.brandName}
      websiteUrl={res.websiteUrl}
      entities={res.entities}
      cards={res.cards}
      snapshot={res.snapshot}
      observedPersona={res.observedPersona}
      parametricSnapshot={res.parametricSnapshot}
      personaSpec={res.personaSpec}
      gaps={res.gaps}
      trends={res.trends}
      auditMode={res.auditMode}
      tier={data.tier as any}
      techInfra={res.techInfra}
      schemaQuality={res.schemaQuality}
      contentSemantic={res.contentSemantic}
      relativePosition={res.relativePosition ?? null}
      improvementStrategy={res.improvementStrategy ?? null}
      stepErrors={res.stepErrors ?? null}
    />
  );
}

