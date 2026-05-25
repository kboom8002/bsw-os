"use client";

import { useEffect } from "react";
import { useRouter, useParams } from "next/navigation";

export default function DemoRedirect() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || "ko";

  useEffect(() => {
    // Redirect to the default lab workspace demo page with locale
    router.push(`/${locale}/demo-brand-semantic-lab/demo`);
  }, [router, locale]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-slate-400 font-mono text-xs">
      REDIRECTING TO WORKSPACE DEMO PORTAL...
    </div>
  );
}
