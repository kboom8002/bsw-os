"use client";

import React, { useState, useEffect } from "react";
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
  Award,
  Diamond,
  Target,
  LogOut,
  Loader2
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

  // Dynamic workspace list from DB
  const [workspacesList, setWorkspacesList] = useState<Array<{ id: string; name: string; slug: string; role: string }>>([
    { id: 'demo-ws', name: 'Demo Brand Semantic Lab', slug: 'demo-brand-semantic-lab', role: 'owner' }
  ]);
  const [currentUser, setCurrentUser] = useState<{ id: string; email: string } | null>(null);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    loadWorkspaceData();
  }, []);

  const loadWorkspaceData = async () => {
    try {
      const { getUserWorkspaces, getCurrentUser } = await import('@/app/actions/workspace');
      const [workspaces, user] = await Promise.all([
        getUserWorkspaces(),
        getCurrentUser()
      ]);
      if (workspaces.length > 0) {
        setWorkspacesList(workspaces);
      }
      if (user) {
        setCurrentUser(user);
      }
    } catch (err) {
      console.warn('Failed to load workspace data:', err);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      const { logout } = await import('@/app/actions/auth');
      await logout();
    } catch (err) {
      console.error('Logout failed:', err);
      setIsLoggingOut(false);
    }
  };

  const activeWorkspace = workspacesList.find(w => w.slug === workspaceSlug) || workspacesList[0];

  const navigation: SidebarItem[] = [
    // ─ Dashboard ─
    { name: "common.workspace", href: `/${locale}/${workspaceSlug}`, icon: LayoutDashboard, module: "dashboard" },

    // ─ AI Visibility (공개 대시보드) ─
    { name: "nav.benchmark", href: `/${locale}/benchmark`, icon: FileBarChart, badge: "Live", module: "benchmark" },
    { name: "nav.sbs_index", href: `/${locale}/sbs-index`, icon: Award, badge: "SBS", module: "sbs-index" },
    { name: "nav.industry_report", href: `/${locale}/industry-report`, icon: Eye, badge: "NEW", module: "industry-report" },

    // ─ Site Audit ─
    { name: "nav.site_audit", href: `/${locale}/site-audit`, icon: Search, badge: "Crawl", module: "site-audit" },
    { name: "nav.site_audit_history", href: `/${locale}/${workspaceSlug}/site-audit/history`, icon: Clock, module: "site-audit-history" },
    { name: "nav.industry_benchmark", href: `/${locale}/${workspaceSlug}/site-audit/industry-benchmark`, icon: Eye, module: "industry-benchmark" },
    { name: "nav.site_audit_llms", href: `/${locale}/${workspaceSlug}/site-audit/llms-generator`, icon: FileBarChart, module: "site-audit-llms" },
    { name: "nav.site_audit_settings", href: `/${locale}/${workspaceSlug}/site-audit/settings`, icon: Settings, module: "site-audit-settings" },

    // ─ Semantic Intelligence (시맨틱 분석) ─
    { name: "nav.truth_studio", href: `/${locale}/${workspaceSlug}/truth`, icon: ShieldAlert, badge: "L2", module: "truth" },
    { name: "nav.semantic_core", href: `/${locale}/${workspaceSlug}/semantic-core`, icon: HelpCircle, badge: "QIS", module: "semantic-core" },
    { name: "nav.qis_triaxis", href: `/${locale}/${workspaceSlug}/semantic-core/qis-triaxis`, icon: Eye, badge: "3축", module: "qis-triaxis" },
    { name: "nav.qis_predictions", href: `/${locale}/${workspaceSlug}/semantic-core/qis`, icon: HelpCircle, badge: "예측", module: "qis-predictions" },
    { name: "nav.pattern_attractors", href: `/${locale}/${workspaceSlug}/semantic-core/attractors`, icon: Target, badge: "PAF", module: "attractors" },

    // ─ Execution (실행) ─
    { name: "nav.objects_studio", href: `/${locale}/${workspaceSlug}/objects`, icon: Layers, module: "objects" },
    { name: "nav.surfaces", href: `/${locale}/${workspaceSlug}/surfaces`, icon: Layers, module: "surfaces" },
    { name: "nav.persona", href: `/${locale}/${workspaceSlug}/persona`, icon: User, badge: "AI", module: "persona" },
    { name: "nav.website", href: `/${locale}/${workspaceSlug}/website`, icon: Layers, badge: "AEO", module: "website" },

    // ─ Monitoring (모니터링) ─
    { name: "nav.observatory", href: `/${locale}/${workspaceSlug}/observatory`, icon: Eye, module: "observatory" },
    { name: "nav.deep_dive", href: `/${locale}/${workspaceSlug}/deep-dive`, icon: Search, badge: "심층", module: "deep-dive" },
    { name: "nav.reports", href: `/${locale}/${workspaceSlug}/reports`, icon: FileBarChart, module: "reports" },

    // ─ Tools ─
    { name: "nav.fixit", href: `/${locale}/${workspaceSlug}/fixit`, icon: Wrench, badge: "Hypo", module: "fixit" },
    { name: "nav.kculture_studio", href: `/${locale}/${workspaceSlug}/kculture`, icon: Building2, module: "kculture" },

    // ─ Reference ─
    { name: "nav.golden_reference", href: `/${locale}/${workspaceSlug}/golden-reference`, icon: Diamond, badge: "GR", module: "golden-reference" },
  ];


  const navGroups = [
    { label: null, items: ["dashboard"] },
    { label: "nav.group_ai_visibility", items: ["benchmark", "sbs-index", "industry-report"] },
    { label: "nav.group_site_audit", items: ["site-audit", "site-audit-history", "industry-benchmark", "site-audit-llms", "site-audit-settings"] },
    { label: "nav.group_semantic_intel", items: ["truth", "semantic-core", "qis-triaxis", "qis-predictions", "attractors"] },
    { label: "nav.group_execution", items: ["objects", "surfaces", "persona", "website"] },
    { label: "nav.group_monitoring", items: ["observatory", "deep-dive", "reports"] },
    { label: "nav.group_tools", items: ["fixit", "kculture"] },
    { label: "nav.group_reference", items: ["golden-reference"] },
  ];



  const switchWorkspace = (slug: string) => {
    setShowWorkspaceMenu(false);
    router.push(`/${locale}/${slug}`);
  };

  const navClass = (href: string, isExact = false) => {
    const isActive = isExact
      ? pathname === href
      : (href !== `/${locale}/${workspaceSlug}` && pathname?.startsWith(href));
    return `flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
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

      {/* Main navigation - grouped */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {navGroups.map((group, gi) => {
          const groupItems = navigation.filter(n => group.items.includes(n.module));
          if (groupItems.length === 0) return null;
          return (
            <div key={gi}>
              {group.label && (
                <div className="px-3 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-600">
                    {t(group.label)}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {groupItems.map((item) => (
                  <Link
                    key={item.module}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={navClass(item.href, item.module === 'dashboard')}
                    title={t(item.name)}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span className="flex-1 text-xs leading-snug"style={{ wordBreak: 'keep-all' }}>
                      {t(item.name)}
                    </span>
                    {item.badge && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-cyan-950 border border-cyan-800/40 text-cyan-400 flex-shrink-0">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
              {gi < navGroups.length - 1 && <hr className="border-white/5 mx-2" />}
            </div>
          );
        })}
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
            {currentUser?.email ? currentUser.email.substring(0, 2).toUpperCase() : 'DS'}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-semibold leading-tight truncate">
              {currentUser?.email || 'Demo Strategist'}
            </div>
            <div className="text-[10px] text-slate-500 font-mono truncate">
              Role: {activeWorkspace && 'role' in activeWorkspace ? (activeWorkspace as any).role : 'owner'}
            </div>
          </div>
        </div>
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl border border-red-500/10 text-red-400/70 hover:text-red-400 hover:bg-red-500/5 text-xs font-medium transition-all disabled:opacity-50"
        >
          {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
        </button>
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
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 transform transition-transform duration-300 md:translate-x-0 md:static md:h-screen flex-shrink-0 ${
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
