"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { 
  Building2, 
  ShieldAlert, 
  HelpCircle, 
  Layers, 
  Eye, 
  FileBarChart, 
  Wrench, 
  Settings, 
  Clock,
  User, 
  ChevronDown,
  LayoutDashboard,
  Menu,
  X,
  Search,
  Award
} from "lucide-react";
import { useTranslation } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/LanguageToggle";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  module: string;
}

export default function WorkspaceLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showWorkspaceMenu, setShowWorkspaceMenu] = useState(false);

  const { locale, t } = useTranslation();

  const workspaceSlug = (params?.workspace_slug as string) || "demo-brand-semantic-lab";

  // List of workspaces for switcher dropdown
  const workspacesList = [
    { name: "Demo Brand Semantic Lab", slug: "demo-brand-semantic-lab" },
    { name: "Acme Skincare Lab", slug: "acme-skincare-lab" },
    { name: "Cornerstore Retail Corp", slug: "cornerstore-retail" },
  ];

  const activeWorkspace = workspacesList.find(w => w.slug === workspaceSlug) || workspacesList[0];

  const navigation: SidebarItem[] = [
    { name: "common.workspace", href: `/${locale}/${workspaceSlug}`, icon: LayoutDashboard, module: "dashboard" },
    { name: "nav.site_audit", href: `/${locale}/site-audit`, icon: Search, badge: "Crawl", module: "site-audit" },
    { name: "nav.site_audit_settings", href: `/${locale}/${workspaceSlug}/site-audit/settings`, icon: Settings, module: "site-audit-settings" },
    { name: "nav.site_audit_history", href: `/${locale}/${workspaceSlug}/site-audit/history`, icon: Clock, module: "site-audit-history" },
    { name: "nav.site_audit_llms", href: `/${locale}/${workspaceSlug}/site-audit/llms-generator`, icon: FileBarChart, module: "site-audit-llms" },
    { name: "nav.benchmark", href: `/${locale}/benchmark`, icon: FileBarChart, badge: "Live", module: "benchmark" },
    { name: "nav.sbs_index", href: `/${locale}/sbs-index`, icon: Award, badge: "Public", module: "sbs-index" },
    { name: "nav.truth_studio", href: `/${locale}/${workspaceSlug}/truth`, icon: ShieldAlert, badge: "L2 Gate", module: "truth" },
    { name: "nav.semantic_core", href: `/${locale}/${workspaceSlug}/semantic-core`, icon: HelpCircle, badge: "CQ/QIS", module: "semantic-core" },
    { name: "nav.objects_studio", href: `/${locale}/${workspaceSlug}/objects`, icon: Layers, module: "objects" },
    { name: "nav.surfaces", href: `/${locale}/${workspaceSlug}/surfaces`, icon: Layers, module: "surfaces" },
    { name: "nav.persona", href: `/${locale}/${workspaceSlug}/persona`, icon: User, badge: "AI 매칭", module: "persona" },
    { name: "nav.website", href: `/${locale}/${workspaceSlug}/website`, icon: Layers, badge: "AEO/GEO", module: "website" },
    { name: "nav.observatory", href: `/${locale}/${workspaceSlug}/observatory`, icon: Eye, badge: "AAS 41%", module: "observatory" },
    { name: "nav.reports", href: `/${locale}/${workspaceSlug}/reports`, icon: FileBarChart, module: "reports" },
    { name: "nav.fixit", href: `/${locale}/${workspaceSlug}/fixit`, icon: Wrench, badge: "Hypo", module: "fixit" },
    { name: "nav.kculture_studio", href: `/${locale}/${workspaceSlug}/kculture`, icon: Building2, badge: "Hybrid", module: "kculture" },
  ];

  const switchWorkspace = (slug: string) => {
    setShowWorkspaceMenu(false);
    router.push(`/${locale}/${slug}`);
  };

  const navClass = (href: string) => {
    const isActive = pathname === href || (href !== `/${locale}/${workspaceSlug}` && pathname?.startsWith(href));
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
      isActive 
        ? "bg-cyan-500/10 text-cyan-400 border border-cyan-500/20" 
        : "text-slate-400 hover:text-white hover:bg-white/5 border border-transparent"
    }`;
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-slate-950 text-white border-r border-white/5 select-none font-sans">
      {/* Workspace Switcher Header */}
      <div className="relative px-4 py-5 border-b border-white/5">
        <button 
          onClick={() => setShowWorkspaceMenu(!showWorkspaceMenu)}
          className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 transition-all text-left"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-slate-950 flex-shrink-0">
              Ω
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-mono leading-none mb-1">{t('common.workspace').toUpperCase()}</div>
              <div className="font-semibold text-sm truncate text-slate-100 leading-tight">
                {activeWorkspace.name}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>

        {/* Switcher Dropdown */}
        {showWorkspaceMenu && (
          <div className="absolute left-4 right-4 top-[76px] z-50 rounded-xl border border-white/10 bg-slate-900 p-2.5 shadow-2xl shadow-black/80 space-y-1">
            <div className="text-[10px] text-slate-500 font-mono px-2 py-1 uppercase tracking-wider">Switch tenant workspace</div>
            {workspacesList.map((ws) => (
              <button
                key={ws.slug}
                onClick={() => switchWorkspace(ws.slug)}
                className={`w-full text-left px-2 py-2 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                  ws.slug === workspaceSlug 
                    ? "bg-cyan-500/10 text-cyan-400 font-bold" 
                    : "text-slate-300 hover:bg-white/5 hover:text-white"
                }`}
              >
                <span>{ws.name}</span>
                {ws.slug === workspaceSlug && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Main navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
        {navigation.map((item) => (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={navClass(item.href)}
          >
            <item.icon className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate">{t(item.name)}</span>
            {item.badge && (
              <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/40 text-cyan-400">
                {item.badge}
              </span>
            )}
          </Link>
        ))}
      </nav>

      {/* Language Selector Bar */}
      <div className="px-4 py-3 border-t border-white/5 bg-slate-950/20 flex items-center justify-between">
        <span className="text-xs text-slate-400 font-medium">{t('common.language')}</span>
        <LanguageToggle />
      </div>

      {/* Footer Profile Details */}
      <div className="p-4 border-t border-white/5 bg-slate-950/40 space-y-2">
        <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-white/5 border border-white/5 text-slate-200">
          <div className="w-7 h-7 rounded-full bg-cyan-900/50 flex items-center justify-center text-xs font-bold text-cyan-400">
            DS
          </div>
          <div className="min-w-0">
            <div className="text-xs font-semibold leading-tight truncate">Demo Strategist</div>
            <div className="text-[10px] text-slate-500 font-mono truncate">Role: owner</div>
          </div>
        </div>
        <div className="flex items-center justify-between px-3 text-xs text-slate-500 font-mono">
          <span>RLS Enforced: TRUE</span>
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-sm shadow-green-500/20" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row font-sans">
      {/* Mobile Header */}
      <div className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-950 border-b border-white/5 relative z-40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-sm text-slate-950">
            Ω
          </div>
          <span className="font-bold tracking-tight text-sm text-slate-100">BSW-OS</span>
        </div>
        <div className="flex items-center gap-2">
          <LanguageToggle />
          <button 
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1 rounded-lg border border-white/10 text-slate-400 hover:text-white"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30"
        />
      )}

      {/* Sidebar - Desktop and Mobile Drawer */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform transition-transform duration-300 md:translate-x-0 md:static md:h-screen flex-shrink-0 ${
        mobileOpen ? "translate-x-0" : "-translate-x-full"
      }`}>
        {sidebarContent}
      </aside>

      {/* Main Workspace Dashboard Panel */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto flex flex-col bg-slate-900">
        {children}
      </main>
    </div>
  );
}
