import { getFallbackAuditData, runFullSiteAudit } from "../../actions/site-audit";
import SiteAuditDashboard from "../../../components/site-audit/SiteAuditDashboard";
import SiteAuditLanding from "../../../components/site-audit/SiteAuditLanding";

export const metadata = {
  title: "AEO/GEO Surface Auditor | BSW-OS",
  description: "Reverse engineer website visibility and E-E-A-T performance for AI search engines like ChatGPT and Gemini.",
};

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ url?: string; brand?: string }>;
}

export default async function SiteAuditPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { url: rawUrl, brand: rawBrand } = await searchParams;

  // No URL → show landing input page
  if (!rawUrl) {
    return <SiteAuditLanding locale={locale} />;
  }

  // Normalize URL and brand name
  let targetUrl = decodeURIComponent(rawUrl);
  if (!targetUrl.startsWith("http")) targetUrl = "https://" + targetUrl;

  let brandName = rawBrand ? decodeURIComponent(rawBrand) : "";
  if (!brandName) {
    try { brandName = new URL(targetUrl).hostname.replace(/^www\./, ""); } catch { brandName = targetUrl; }
  }

  const workspaceId = "c2498c4f-aee3-49e0-bb80-171a0852128f";

  // Always load fallback data first for fast rendering
  const initialData = await getFallbackAuditData(workspaceId, targetUrl, brandName);

  // Bind server action to the current URL so the "실시간 감사 실행" button works for ANY site
  const boundRunAudit = runFullSiteAudit.bind(null, workspaceId, targetUrl, brandName);

  return (
    <SiteAuditDashboard
      brandName={brandName}
      websiteUrl={targetUrl}
      entities={initialData.entities}
      cards={initialData.cards}
      snapshot={initialData.snapshot}
      observedPersona={initialData.observedPersona}
      personaSpec={initialData.personaSpec}
      gaps={initialData.gaps}
      onTriggerReRun={boundRunAudit}
    />
  );
}
