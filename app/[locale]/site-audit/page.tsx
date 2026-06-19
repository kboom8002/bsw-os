import { runQuickSiteAudit } from "../../actions/site-audit";
import SiteAuditDashboard from "../../../components/site-audit/SiteAuditDashboard";
import SiteAuditLanding from "../../../components/site-audit/SiteAuditLanding";

export const metadata = {
  title: "AEO/GEO Surface Auditor | BSW-OS",
  description: "Reverse engineer website visibility and E-E-A-T performance for AI search engines like ChatGPT and Gemini.",
};

// Vercel serverless function에서 크롤링이 충분히 완료될 수 있도록 maxDuration 설정
export const maxDuration = 30;

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ url?: string; brand?: string; industry?: string; tier?: string }>;
}

export default async function SiteAuditPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const { url: rawUrl, brand: rawBrand, industry, tier = "free" } = await searchParams;

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

  // Quick Audit: crawl-only estimation (~5 sec, no AI API calls)
  let initialData;
  try {
    initialData = await runQuickSiteAudit(workspaceId, targetUrl, brandName, industry);
  } catch (error: any) {
    console.error("[SiteAuditPage] runQuickSiteAudit failed:", error?.message || error);
    // Return a fallback UI instead of crashing the page
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="max-w-md bg-slate-900/80 border border-red-500/30 rounded-2xl p-8 text-center space-y-4">
          <div className="text-4xl">⚠️</div>
          <h2 className="text-xl font-bold text-slate-100">진단 중 오류 발생</h2>
          <p className="text-sm text-slate-400 leading-relaxed">
            <strong className="text-slate-200">{brandName}</strong> ({targetUrl}) 사이트 진단 중 오류가 발생했습니다.
          </p>
          <p className="text-xs text-slate-500">
            사이트가 크롤링을 차단(robots.txt, Cloudflare 등)하고 있거나, 일시적인 네트워크 오류일 수 있습니다.
          </p>
          <div className="pt-4 space-y-2">
            <a
              href={`/${locale}/site-audit`}
              className="block w-full py-2.5 px-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-xl text-sm transition-all"
            >
              ← 다시 시도하기
            </a>
            <p className="text-xs text-slate-600">오류: {error?.message || "Unknown error"}</p>
          </div>
        </div>
      </div>
    );
  }

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
      trends={initialData.trends}
      auditMode={initialData.auditMode}
      tier={tier as any}
    />
  );
}
