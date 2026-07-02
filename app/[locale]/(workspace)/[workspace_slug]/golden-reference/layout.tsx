"use client";

/**
 * app/[locale]/(workspace)/[workspace_slug]/golden-reference/layout.tsx
 * 골든 레퍼런스 섹션 레이아웃 — 서브 네비게이션 포함
 */

import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { BarChart3, Microscope, Package } from "lucide-react";

const subNav = [
  { label: "대시보드", href: "", icon: BarChart3 },
  { label: "비주얼 분석", href: "/analysis", icon: Microscope },
  { label: "산출물 뷰어", href: "/outputs", icon: Package },
];

export default function GoldenReferenceLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const pathname = usePathname();
  const locale = params?.locale as string ?? "ko";
  const slug = params?.workspace_slug as string ?? "demo-brand-semantic-lab";
  const base = `/${locale}/${slug}/golden-reference`;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* 서브 네비게이션 */}
      <div className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur border-b border-white/5">
        <div className="flex items-center gap-1 px-6 py-2">
          <div className="flex items-center gap-2 mr-6">
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center">
              <span className="text-white text-xs font-bold">GR</span>
            </div>
            <span className="text-sm font-semibold text-white/80">골든 레퍼런스</span>
          </div>
          {subNav.map(({ label, href, icon: Icon }) => {
            const fullHref = `${base}${href}`;
            const isActive = href === ""
              ? pathname === base
              : pathname?.startsWith(fullHref);
            return (
              <Link
                key={href}
                href={fullHref}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-violet-500/20 text-violet-300 border border-violet-500/30"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
      <div>{children}</div>
    </div>
  );
}
