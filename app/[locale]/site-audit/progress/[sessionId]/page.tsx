import React from 'react';
import ProgressTracker from "../../../../../components/site-audit/ProgressTracker";

interface Props {
  params: Promise<{ locale: string; sessionId: string }>;
  searchParams: Promise<{ tier?: string }>;
}

export default async function ProgressPage({ params, searchParams }: Props) {
  const { locale, sessionId } = await params;
  const { tier } = await searchParams;

  let tierName = "Pro";
  if (tier === 'tier3') tierName = "Enterprise";
  else if (tier === 'tier1') tierName = "Lite";
  else if (tier === 'free') tierName = "Quick Scan";

  return <ProgressTracker sessionId={sessionId} locale={locale} tierName={tierName} />;
}
