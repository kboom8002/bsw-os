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
  Wrench, Settings, Clock, User, ChevronDown, ChevronRight, LayoutDashboard,
  Menu, X, Search, Award, Diamond, Target, LogOut, Loader2, Store,
  Megaphone, MapPin, Globe, Network, GitMerge, ListFilter, Cpu, BookOpen, Activity, Users,
  Database, SlidersHorizontal, Factory, Stethoscope
} from "lucide-react";

import { useTranslation } from "@/lib/i18n/context";
import { LanguageToggle } from "@/components/LanguageToggle";

interface SidebarItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  module: string;
  scope?: 'industry' | 'brand';
  requiredRoles?: string[];
  readOnlyRoles?: string[];
  children?: SidebarItem[];
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
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'semantic-core': true
  });

  const toggleExpanded = (module: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setExpandedModules(prev => ({ ...prev, [module]: !prev[module] }));
  };

  const { locale, t } = useTranslation();

  const workspaceSlug = (params?.workspace_slug as string) || "";

  const [workspacesList, setWorkspacesList] = useState<Array<{ id: string; name: string; slug: string; role: string; workspace_type?: string }>>([]);
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
      } else {
        router.push(`/${locale}/onboarding`);
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
  const userRole = activeWorkspace && 'role' in activeWorkspace ? (activeWorkspace as any).role : 'owner';
  const activeWsType = activeWorkspace && 'workspace_type' in activeWorkspace ? (activeWorkspace as any).workspace_type : 'brand';
  const mainWorkspaces = workspacesList.filter(ws => ws.workspace_type === 'main');
  const brandWorkspaces = workspacesList.filter(ws => ws.workspace_type === 'brand' || !ws.workspace_type);
  const isLoadingWorkspaces = workspacesList.length === 0;

  const checkAccess = (item: SidebarItem) => {
    // BSW 플랫폼 어드민 전용 메뉴는 메인 워크스페이스에서만 보임
    if (item.module === 'brands' && activeWsType !== 'main') return false;
    
    // 메인 워크스페이스에서는 브랜드 실무 관리 메뉴들은 비활성화 (브랜드 WS로 전환하여 작업 권장)
    const brandOnlyModules = [
      'truth', 'semantic-core', 'objects', 'surfaces', 'persona', 'website', 
      'aihompy-pack', 'sales-automation', 'regional-report', 'fixit', 'kculture',
      'site-audit-history', 'industry-benchmark', 'site-audit-llms', 'site-audit-settings'
    ];
    if (brandOnlyModules.includes(item.module) && activeWsType === 'main') return false;

    if (userRole === 'owner' || userRole === 'admin') return true;
    const isRequired = item.requiredRoles?.includes(userRole);
    const isReadOnly = item.readOnlyRoles?.includes(userRole);
    if (!item.requiredRoles && !item.readOnlyRoles) return true;
    return isRequired || isReadOnly;
  };

  const isReadOnlyAccess = (item: SidebarItem) => {
    if (userRole === 'owner' || userRole === 'admin') return false;
    return item.readOnlyRoles?.includes(userRole) && !item.requiredRoles?.includes(userRole);
  };

  const navigation: SidebarItem[] = [
    // ─ Dashboard ─
    { name: "common.workspace", href: `/${locale}/${workspaceSlug}`, icon: LayoutDashboard, module: "dashboard", scope: 'brand' },

    // ─ BSW Platform Admin (메인 WS 전용) ─
    { name: "nav.brands", href: `/${locale}/${workspaceSlug}/brands`, icon: Building2, module: "brands", scope: 'brand', requiredRoles: ['owner', 'admin'] },

    // ─ AI Visibility (공개 대시보드) ─
    { 
      name: "nav.benchmark", 
      href: `/${locale}/${workspaceSlug}/benchmark`, 
      icon: FileBarChart, 
      badge: "Live", 
      module: "benchmark", 
      scope: 'industry', 
      requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst', 'executive_viewer', 'agency_operator'],
      children: [
        { name: "nav.benchmark_admin", href: `/${locale}/${workspaceSlug}/benchmark/admin`, icon: Settings, module: "benchmark-admin", requiredRoles: ['owner', 'admin'] }
      ]
    },
    { name: "nav.sbs_index", href: `/${locale}/sbs-index`, icon: Award, badge: "SBS", module: "sbs-index", scope: 'industry', requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst', 'executive_viewer', 'agency_operator'] },
    { name: "nav.industry_report", href: `/${locale}/industry-report`, icon: Globe, badge: "NEW", module: "industry-report", scope: 'industry', requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst', 'executive_viewer', 'agency_operator'] },
    { name: "nav.site_audit", href: `/${locale}/site-audit`, icon: Search, badge: "Crawl", module: "site-audit", scope: 'industry', requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst', 'agency_operator'] },

    // ─ Site Audit Brand ─
    { name: "nav.site_audit_history", href: `/${locale}/${workspaceSlug}/site-audit/history`, icon: Clock, module: "site-audit-history", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst', 'agency_operator'] },
    { name: "nav.industry_benchmark", href: `/${locale}/${workspaceSlug}/site-audit/industry-benchmark`, icon: Eye, module: "industry-benchmark", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst', 'agency_operator'] },
    { name: "nav.site_audit_llms", href: `/${locale}/${workspaceSlug}/site-audit/llms-generator`, icon: FileBarChart, module: "site-audit-llms", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'agency_operator'] },
    { name: "nav.site_audit_settings", href: `/${locale}/${workspaceSlug}/site-audit/settings`, icon: Settings, module: "site-audit-settings", scope: 'brand', requiredRoles: ['semantic_architect'] },

    // ─ Semantic Intelligence (시맨틱 분석) ─
    { name: "nav.truth_studio", href: `/${locale}/${workspaceSlug}/truth`, icon: ShieldAlert, badge: "L2", module: "truth", scope: 'brand', requiredRoles: ['semantic_architect', 'content_editor', 'evidence_reviewer'], readOnlyRoles: ['brand_strategist', 'executive_viewer'] },
    { 
      name: "QPA-OS (Semantic Core)", 
      href: `/${locale}/${workspaceSlug}/semantic-core`, 
      icon: Network, 
      badge: "QIS", 
      module: "semantic-core", 
      scope: 'brand', 
      requiredRoles: ['semantic_architect'], 
      readOnlyRoles: ['brand_strategist', 'content_editor', 'evidence_reviewer'],
      children: [
        { name: "QIS Signals", href: `/${locale}/${workspaceSlug}/semantic-core/signals`, icon: Activity, module: "signals" },
        { name: "Canonical Questions", href: `/${locale}/${workspaceSlug}/semantic-core/canonical-questions`, icon: ListFilter, module: "canonical-questions" },
        { name: "QIS Scenes", href: `/${locale}/${workspaceSlug}/semantic-core/qis`, icon: Layers, module: "qis-scenes" },
        { name: "🏭 Answer Factory", href: `/${locale}/${workspaceSlug}/semantic-core/answer-factory`, icon: Factory, badge: "NEW", module: "answer-factory" },
        { name: "TCO Concepts", href: `/${locale}/${workspaceSlug}/semantic-core/concepts`, icon: BookOpen, module: "concepts" },
        { name: "Pattern Attractors", href: `/${locale}/${workspaceSlug}/semantic-core/attractors`, icon: Target, module: "attractors" },
        { name: "Orchestration", href: `/${locale}/${workspaceSlug}/semantic-core/orchestration`, icon: GitMerge, module: "orchestration" },
        { name: "QIS Tri-Axis Sync", href: `/${locale}/${workspaceSlug}/semantic-core/qis-triaxis`, icon: Cpu, module: "qis-triaxis" },
        { name: "📊 Pipeline Artifacts", href: `/${locale}/${workspaceSlug}/semantic-core/pipeline-artifacts`, icon: Database, module: "pipeline-artifacts" },
        { name: "⚙️ Pipeline Config", href: `/${locale}/${workspaceSlug}/semantic-core/pipeline-config`, icon: SlidersHorizontal, module: "pipeline-config" }
      ]
    },

    // ─ Execution (실행) ─
    { name: "nav.objects_studio", href: `/${locale}/${workspaceSlug}/objects`, icon: Layers, module: "objects", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'content_editor'] },
    { name: "nav.surfaces", href: `/${locale}/${workspaceSlug}/surfaces`, icon: Layers, module: "surfaces", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'content_editor'] },
    { name: "nav.persona", href: `/${locale}/${workspaceSlug}/persona`, icon: User, badge: "AI", module: "persona", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'content_editor', 'persona_vibe_designer'] },
    { name: "nav.website", href: `/${locale}/${workspaceSlug}/website`, icon: Layers, badge: "AEO", module: "website", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'content_editor'] },

    // ─ Monitoring (모니터링) ─
    { name: "nav.observatory", href: `/${locale}/${workspaceSlug}/observatory`, icon: Eye, module: "observatory", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'evidence_reviewer', 'observatory_analyst', 'executive_viewer', 'agency_operator'] },
    { name: "nav.deep_dive", href: `/${locale}/${workspaceSlug}/deep-dive`, icon: Search, badge: "심층", module: "deep-dive", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst', 'executive_viewer', 'agency_operator'] },
    { name: "nav.reports", href: `/${locale}/${workspaceSlug}/reports`, icon: FileBarChart, module: "reports", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'evidence_reviewer', 'observatory_analyst', 'executive_viewer', 'agency_operator'] },
    { name: "Brand MRI", href: `/${locale}/${workspaceSlug}/reports/brand-mri`, icon: Stethoscope, badge: "MRI", module: "brand-mri", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst', 'executive_viewer', 'agency_operator'] },
    { name: "nav.golden_reference", href: `/${locale}/${workspaceSlug}/golden-reference`, icon: Diamond, badge: "GR", module: "golden-reference", scope: 'brand', requiredRoles: ['semantic_architect', 'brand_strategist', 'observatory_analyst'] },

    // ─ Products (진단 상품) ─
    { name: "nav.aihompy_pack", href: `/${locale}/${workspaceSlug}/aihompy-pack`, icon: Store, badge: "Pack", module: "aihompy-pack", scope: 'brand', requiredRoles: ['brand_strategist', 'executive_viewer', 'agency_operator'] },
    { name: "nav.sales_automation", href: `/${locale}/${workspaceSlug}/sales-automation`, icon: Megaphone, badge: "Sales", module: "sales-automation", scope: 'brand', requiredRoles: ['brand_strategist', 'executive_viewer', 'agency_operator'] },
    { name: "nav.regional_report", href: `/${locale}/${workspaceSlug}/regional-report`, icon: MapPin, badge: "지역", module: "regional-report", scope: 'brand', requiredRoles: ['brand_strategist', 'executive_viewer', 'agency_operator'] },
    { name: "nav.fixit", href: `/${locale}/${workspaceSlug}/fixit`, icon: Wrench, badge: "Hypo", module: "fixit", scope: 'brand', requiredRoles: ['brand_strategist', 'executive_viewer', 'agency_operator'] },
    { name: "nav.kculture_studio", href: `/${locale}/${workspaceSlug}/kculture`, icon: Building2, module: "kculture", scope: 'brand', requiredRoles: ['brand_strategist', 'executive_viewer', 'agency_operator'] },
    { name: "nav.settings", href: `/${locale}/${workspaceSlug}/settings`, icon: Settings, module: "settings", scope: 'brand', requiredRoles: ['owner', 'admin'] },
    { name: "nav.domain_packs", href: `/${locale}/${workspaceSlug}/settings/packs`, icon: Database, badge: "Pack", module: "domain-packs", scope: 'brand', requiredRoles: ['owner', 'admin'] },
    { name: "nav.team", href: `/${locale}/${workspaceSlug}/settings/team`, icon: Users, module: "team", scope: 'brand', requiredRoles: ['owner', 'admin'] }
  ];

  const navGroups = [
    { label: null, items: ["dashboard"], scope: 'brand' },
    { label: "nav.group_admin", items: ["brands"], scope: 'brand' },
    { label: "nav.group_ai_visibility", items: ["benchmark", "sbs-index", "industry-report", "site-audit"], scope: 'industry', scopeIndicator: '🌐' },
    { label: "nav.group_site_audit", items: ["site-audit-history", "industry-benchmark", "site-audit-llms", "site-audit-settings"], scope: 'brand' },
    { label: "nav.group_semantic_intel", items: ["truth", "semantic-core"], scope: 'brand' },
    { label: "nav.group_execution", items: ["objects", "surfaces", "persona", "website"], scope: 'brand' },
    { label: "nav.group_monitoring", items: ["observatory", "deep-dive", "reports", "brand-mri", "golden-reference"], scope: 'brand' },
    { label: "nav.group_products", items: ["aihompy-pack", "sales-automation", "regional-report", "fixit", "kculture"], scope: 'brand' },
    { label: "nav.group_settings", items: ["settings", "domain-packs", "team"], scope: 'brand' }
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
              {activeWsType === 'main' ? '★' : 'Ω'}
            </div>
            <div className="min-w-0">
              <div className="text-xs text-slate-400 font-mono leading-none mb-1">{t('common.workspace').toUpperCase()}</div>
              <div className="font-semibold text-sm truncate text-slate-100 leading-tight">
                {isLoadingWorkspaces ? (
                  <span className="inline-block w-28 h-3 bg-white/10 rounded animate-pulse" />
                ) : (
                  activeWorkspace?.name || workspaceSlug
                )}
              </div>
            </div>
          </div>
          <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
        </button>

        {/* Switcher Dropdown - rendered as fixed overlay to avoid sidebar overflow clipping */}
        {showWorkspaceMenu && (
          <>
            {/* Invisible backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowWorkspaceMenu(false)}
            />
            <div className="fixed left-4 top-20 w-64 z-50 rounded-xl border border-white/10 bg-slate-900 p-2.5 shadow-2xl shadow-black/80 space-y-2">
              {/* Main Workspaces Group */}
              {mainWorkspaces.length > 0 && (
                <div>
                  <div className="text-[10px] text-amber-400 font-mono px-2 py-1 uppercase tracking-wider font-bold">BSW 관제 센터</div>
                  {mainWorkspaces.map((ws) => (
                    <button
                      key={ws.slug}
                      onClick={() => switchWorkspace(ws.slug)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                        ws.slug === workspaceSlug
                          ? "bg-amber-500/10 text-amber-400 font-bold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>⭐ {ws.name}</span>
                      {ws.slug === workspaceSlug && <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Brand Workspaces Group */}
              {brandWorkspaces.length > 0 && (
                <div>
                  <div className="text-[10px] text-cyan-400 font-mono px-2 py-1 uppercase tracking-wider font-bold">브랜드 워크스페이스</div>
                  {brandWorkspaces.map((ws) => (
                    <button
                      key={ws.slug}
                      onClick={() => switchWorkspace(ws.slug)}
                      className={`w-full text-left px-2 py-1.5 rounded-lg text-xs font-semibold flex items-center justify-between transition-all ${
                        ws.slug === workspaceSlug
                          ? "bg-cyan-500/10 text-cyan-400 font-bold"
                          : "text-slate-300 hover:bg-white/5 hover:text-white"
                      }`}
                    >
                      <span>🏢 {ws.name}</span>
                      {ws.slug === workspaceSlug && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                    </button>
                  ))}
                </div>
              )}

              {/* Create Brand Workspace Link (Only for Super Admin) */}
              {mainWorkspaces.length > 0 && (
                <div className="border-t border-white/5 pt-2 mt-1">
                  <Link
                    href={`/${locale}/onboarding`}
                    onClick={() => setShowWorkspaceMenu(false)}
                    className="w-full text-center block px-2 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all"
                  >
                    + 새 브랜드 워크스페이스 생성
                  </Link>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Main navigation - grouped */}
      <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-4">
        {navGroups.map((group, gi) => {
          const groupItems = navigation
            .filter(n => group.items.includes(n.module))
            .filter(checkAccess); // Apply RBAC filtering
            
          if (groupItems.length === 0) return null;
          return (
            <div key={gi}>
              {group.label && (
                <div className="px-3 mb-1.5 flex items-center gap-1.5">
                  {'scopeIndicator' in group && (
                    <span className="text-[10px]">{group.scopeIndicator}</span>
                  )}
                  <span className={`text-[10px] font-bold uppercase tracking-widest ${
                    group.scope === 'industry' ? 'text-amber-500/80' : 'text-slate-600'
                  }`}>
                    {t(group.label)}
                  </span>
                </div>
              )}
              <div className="space-y-0.5">
                {groupItems.map((item) => {
                  const readOnly = isReadOnlyAccess(item);
                  const isExpanded = expandedModules[item.module];
                  const hasChildren = item.children && item.children.length > 0;
                  
                  return (
                    <div key={item.module}>
                      <Link
                        href={item.href}
                        onClick={(e) => {
                          if (readOnly) e.preventDefault();
                          else setMobileOpen(false);
                        }}
                        className={`${navClass(item.href, item.module === 'dashboard')} ${
                          readOnly ? 'opacity-50 cursor-not-allowed' : ''
                        } ${item.scope === 'industry' ? 'hover:bg-amber-500/10 hover:text-amber-400' : ''}`}
                        title={t(item.name) + (readOnly ? ' (Read Only)' : '')}
                      >
                        <item.icon className={`w-4 h-4 flex-shrink-0 ${
                          item.scope === 'industry' && pathname?.startsWith(item.href) ? 'text-amber-400' : ''
                        }`} />
                        <span className="flex-1 text-xs leading-snug" style={{ wordBreak: 'keep-all' }}>
                          {item.name.startsWith('nav.') || item.name.startsWith('common.') ? t(item.name) : item.name}
                        </span>
                        {item.badge && (
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded-full flex-shrink-0 ${
                            item.scope === 'industry' 
                              ? 'bg-amber-950 border border-amber-800/40 text-amber-400'
                              : 'bg-cyan-950 border border-cyan-800/40 text-cyan-400'
                          }`}>
                            {item.badge}
                          </span>
                        )}
                        {hasChildren && (
                          <button 
                            onClick={(e) => toggleExpanded(item.module, e)}
                            className="p-1 hover:bg-white/10 rounded-md"
                          >
                            <ChevronRight className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                          </button>
                        )}
                        {readOnly && (
                          <ShieldAlert className="w-3 h-3 text-slate-500 flex-shrink-0" />
                        )}
                      </Link>
                      
                      {/* Sub-menu rendering */}
                      {hasChildren && isExpanded && (
                        <div className="mt-0.5 ml-3 pl-3 border-l border-white/10 space-y-0.5">
                          {item.children?.map(child => (
                            <Link
                              key={child.module}
                              href={child.href}
                              onClick={(e) => {
                                if (readOnly) e.preventDefault();
                                else setMobileOpen(false);
                              }}
                              className={`flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                pathname?.startsWith(child.href)
                                  ? "bg-cyan-500/10 text-cyan-400"
                                  : "text-slate-400 hover:text-white hover:bg-white/5"
                              } ${readOnly ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                              <child.icon className="w-3.5 h-3.5 flex-shrink-0" />
                              <span className="flex-1 leading-snug">{child.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
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
              {currentUser?.email || '로딩 중...'}
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
