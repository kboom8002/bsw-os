'use client';

import React, { useState, useEffect } from 'react';
import { SettingsPanel } from '../../../../../components/deep-dive/SettingsPanel';

import { useParams, useSearchParams } from 'next/navigation';
import { BENCHMARK_DOMAINS, DomainSlug } from '../../../../../lib/benchmark/domain-config';

// Native HTML replacements for Card and Button
const Card = ({ children, className = '' }: any) => <div className={`border border-white/10 rounded-xl bg-slate-950/50 backdrop-blur-sm shadow-sm overflow-hidden ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: any) => <div className={`px-6 py-4 border-b border-white/5 ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: any) => <h3 className={`text-lg font-bold text-white ${className}`}>{children}</h3>;
const CardDescription = ({ children, className = '' }: any) => <p className={`text-sm text-slate-400 mt-1 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }: any) => <div className={`p-6 text-slate-100 ${className}`}>{children}</div>;
const Button = ({ children, onClick, disabled, variant = 'default', className = '', size = 'default' }: any) => {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    default: "bg-cyan-500 text-slate-950 hover:bg-cyan-400 font-bold",
    outline: "border border-white/10 text-white hover:bg-white/5",
    destructive: "bg-red-600 text-white hover:bg-red-700",
  };
  const sizes: Record<string, string> = {
    default: "h-10 px-4 py-2 text-sm",
    sm: "h-9 px-3 text-sm",
    lg: "h-11 px-8 text-base",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}>
      {children}
    </button>
  );
};

export default function DeepDivePage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const workspaceId = params.workspace_slug as string;
  const [step, setStep] = useState(0);
  const [activeTab, setActiveTab] = useState('diagnostic');

  
  // Selection state
  const initialDomain = searchParams.get('domain') === 'seoul_district' ? 'seoul_district_ko' : (searchParams.get('domain') || 'skincare');
  const [selectedDomain, setSelectedDomain] = useState<DomainSlug>(initialDomain as DomainSlug);
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || BENCHMARK_DOMAINS[initialDomain as DomainSlug]?.brands[0]?.slug || 'dr-jart');

  useEffect(() => {
    // When domain changes, set the first brand of the domain as default if current is not in the list
    const domainConfig = BENCHMARK_DOMAINS[selectedDomain];
    if (domainConfig) {
      const isValid = domainConfig.brands.some(b => b.slug === selectedBrand);
      if (!isValid && domainConfig.brands.length > 0) {
        setSelectedBrand(domainConfig.brands[0].slug);
      }
    }
  }, [selectedDomain]);

  
  const [session, setSession] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Session history state
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [viewingPastSession, setViewingPastSession] = useState(false);

  // Load past sessions on mount and when domain/brand changes
  useEffect(() => {
    loadPastSessions();
  }, [selectedDomain, selectedBrand]);

  const loadPastSessions = async () => {
    setLoadingSessions(true);
    try {
      const res = await fetch(`/api/deep-dive/sessions?workspace=${workspaceId}&domain=${selectedDomain}&brand=${selectedBrand}`);
      const data = await res.json();
      setPastSessions(data.sessions || []);
    } catch (e) {
      console.warn('Could not load past sessions', e);
    } finally {
      setLoadingSessions(false);
    }
  };

  const loadSession = async (sessionId: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/deep-dive/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'load', session_id: sessionId })
      });
      const data = await res.json();
      if (data.session) {
        const s = data.session;
        setSession({ session_id: s.id, diagnostic: s.diagnostic_snapshot });
        setCandidates(s.discovered_candidates || []);
        setSimulation(s.simulation || null);
        setViewingPastSession(true);
        
        // Determine which step to show based on saved data
        if (s.simulation) {
          setStep(4);
        } else if (s.discovered_candidates && s.discovered_candidates.length > 0) {
          setStep(2);
        } else if (s.diagnostic_snapshot) {
          setStep(1);
        } else {
          setStep(0);
        }
      }
    } catch (e: any) {
      setErrorMsg('세션 로드 실패: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  const startNewSession = () => {
    setSession(null);
    setCandidates([]);
    setBlueprints([]);
    setSimulation(null);
    setStep(0);
    setViewingPastSession(false);
    setApprovalStatus(null);
    setErrorMsg(null);
  };

  const [bgSessionId, setBgSessionId] = useState<string | null>(null);
  const [bgStatus, setBgStatus] = useState<any>(null);

  useEffect(() => {
    let interval: any;
    if (bgSessionId && bgStatus?.status === 'running') {
      interval = setInterval(async () => {
        const res = await fetch('/api/benchmark/run', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', sessionId: bgSessionId })
        });
        const data = await res.json();
        if (data.success && data.status) {
          setBgStatus(data.status);
        }
      }, 3000);
    }
    return () => clearInterval(interval);
  }, [bgSessionId, bgStatus?.status]);

  const startBackgroundBenchmark = async () => {
    const res = await fetch('/api/benchmark/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'start', domainSlug: selectedDomain, targetBrandSlug: selectedBrand })
    });
    const data = await res.json();
    if (data.success && data.sessionId) {
      setBgSessionId(data.sessionId);
      setBgStatus({ status: 'running', completed_queries: 0, total_queries: 1 });
    }
  };

  const pauseBackgroundBenchmark = async () => {
    if (!bgSessionId) return;
    await fetch('/api/benchmark/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'pause', sessionId: bgSessionId })
    });
    setBgStatus((s: any) => ({ ...s, status: 'paused' }));
  };

  const resumeBackgroundBenchmark = async () => {
    if (!bgSessionId) return;
    await fetch('/api/benchmark/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'resume', sessionId: bgSessionId })
    });
    setBgStatus((s: any) => ({ ...s, status: 'running' }));
  };



  const startDiagnosis = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/deep-dive/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, brand_slug: selectedBrand, domain_slug: selectedDomain })
      });
      const data = await res.json();
      if (data.error) {
        setErrorMsg(data.error);
        return;
      }
      setSession(data);
      setStep(1);
      setViewingPastSession(false);
      loadPastSessions(); // Refresh the session list
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const discoverTargets = async () => {
    setLoading(true);
    try {
      // Pass the opportunity report from session if available
      const opportunityReport = session?.diagnostic?.opportunityReport;
      const res = await fetch('/api/deep-dive/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          session_id: session.session_id, 
          workspace_id: workspaceId, 
          brand_slug: selectedBrand, 
          domain_slug: selectedDomain,
          opportunity_report: opportunityReport
        })
      });
      const data = await res.json();
      setCandidates(data.candidates || []);
      setStep(2);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const generateBlueprints = async () => {
    setLoading(true);
    try {
      const acceptedIds = candidates.map(c => c.id || 'temp');
      const res = await fetch('/api/deep-dive/blueprint', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id, workspace_id: workspaceId, candidates, brand_slug: selectedBrand, domain_slug: selectedDomain })
      });
      const data = await res.json();
      setBlueprints(data.blueprints);
      setStep(3);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deep-dive/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id, diagnostic: session.diagnostic, candidates, brand_slug: selectedBrand, domain_slug: selectedDomain })
      });
      const data = await res.json();
      setSimulation(data.simulation);
      setStep(4);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };
  
  const handleApproval = async (approved: boolean) => {
    setLoading(true);
    try {
      const res = await fetch('/api/deep-dive/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id, approved, feedback: '' })
      });
      const data = await res.json();
      if (data.success) {
        setApprovalStatus(approved ? 'Approved' : 'Rejected');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Client Deep Dive</h1>
        <p className="text-slate-400 mt-2">LLM 기반 타겟 발굴 및 콘텐츠 블루프린트 생성 시뮬레이터</p>
      </div>
      <div className="flex space-x-4 border-b">
        <button className={`pb-2 ${activeTab === 'diagnostic' ? 'border-b-2 border-cyan-500 font-bold' : 'text-slate-400'}`} onClick={() => setActiveTab('diagnostic')}>Diagnostic</button>
        <button className={`pb-2 ${activeTab === 'benchmark' ? 'border-b-2 border-cyan-500 font-bold' : 'text-slate-400'}`} onClick={() => setActiveTab('benchmark')}>Benchmark (Large Scale)</button>
        <button className={`pb-2 ${activeTab === 'settings' ? 'border-b-2 border-cyan-500 font-bold' : 'text-slate-400'}`} onClick={() => setActiveTab('settings')}>Settings</button>
      </div>

      {activeTab === 'diagnostic' && (
        <div className="space-y-8">


      {errorMsg && (
        <div className="p-4 bg-red-950/40 border border-red-500/20 text-red-200 rounded-xl mb-4 text-sm font-semibold">
          Error: {errorMsg}
        </div>
      )}
      {step === 0 && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>1. Select Target Brand & Start Diagnostic</CardTitle>
              <CardDescription>측정할 브랜드와 도메인을 선택하세요.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex space-x-4">
                <select 
                  value={selectedDomain} 
                  onChange={(e) => setSelectedDomain(e.target.value as DomainSlug)}
                  className="border border-white/10 rounded-md px-3 py-2 text-sm bg-slate-900 text-white outline-none focus:border-cyan-500"
                >
                  {Object.values(BENCHMARK_DOMAINS).map((domain) => (
                    <option key={domain.slug} value={domain.slug}>{domain.name}</option>
                  ))}
                </select>
                
                <select 
                  value={selectedBrand} 
                  onChange={(e) => setSelectedBrand(e.target.value)}
                  className="border border-white/10 rounded-md px-3 py-2 text-sm flex-1 bg-slate-900 text-white outline-none focus:border-cyan-500"
                >
                  {BENCHMARK_DOMAINS[selectedDomain]?.brands.map((brand) => (
                    <option key={brand.slug} value={brand.slug}>{brand.name}</option>
                  ))}
                </select>
              </div>
              
              <Button onClick={startDiagnosis} disabled={loading} size="lg" className="w-full">
                {loading ? 'Running Real-time Diagnostic...' : '🚀 신규 진단 실행 (New Diagnostic)'}
              </Button>
            </CardContent>
          </Card>

          {/* Past Sessions History */}
          <Card>
            <CardHeader>
              <CardTitle>📋 실행 이력 (Session History)</CardTitle>
              <CardDescription>이전 Deep Dive 결과를 조회하거나, 위에서 신규 진단을 실행하세요.</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingSessions ? (
                <div className="text-center py-8 text-slate-400">세션 이력 로딩 중...</div>
              ) : pastSessions.length === 0 ? (
                <div className="text-center py-8 text-slate-500">
                  <div className="text-4xl mb-2">📭</div>
                  <div>이 브랜드의 실행 이력이 없습니다.</div>
                  <div className="text-xs mt-1">위의 '신규 진단 실행' 버튼을 눌러 첫 번째 진단을 시작하세요.</div>
                </div>
              ) : (
                <div className="space-y-2">
                  {pastSessions.map((ps: any) => {
                    const date = new Date(ps.created_at);
                    const dateStr = date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric' });
                    const timeStr = date.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
                    const statusColors: Record<string, string> = {
                      diagnosing: 'bg-yellow-900/50 text-yellow-300 border-yellow-500/30',
                      discovered: 'bg-blue-900/50 text-blue-300 border-blue-500/30',
                      blueprinted: 'bg-purple-900/50 text-purple-300 border-purple-500/30',
                      simulated: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/30',
                      approved: 'bg-cyan-900/50 text-cyan-300 border-cyan-500/30',
                      completed: 'bg-emerald-900/50 text-emerald-300 border-emerald-500/30',
                    };
                    const statusLabels: Record<string, string> = {
                      diagnosing: '진단 완료',
                      discovered: '타겟 발굴 완료',
                      blueprinted: '블루프린트 생성',
                      simulated: '시뮬레이션 완료',
                      approved: '승인됨',
                      completed: '완료',
                    };
                    return (
                      <button
                        key={ps.id}
                        onClick={() => loadSession(ps.id)}
                        className="w-full text-left p-4 border border-white/10 rounded-lg hover:bg-white/5 hover:border-cyan-500/30 transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div>
                              <div className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                {dateStr} {timeStr}
                              </div>
                              <div className="text-xs text-slate-500 mt-0.5">
                                {ps.brand_slug} · {ps.domain_slug || selectedDomain}
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${statusColors[ps.status] || 'bg-slate-800 text-slate-400 border-white/10'}`}>
                              {statusLabels[ps.status] || ps.status}
                            </span>
                            <span className="text-slate-600 group-hover:text-slate-400 transition-colors">→</span>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Back to sessions button when viewing a past or active session */}
      {step > 0 && (
        <div className="flex items-center gap-3 mb-2">
          <button 
            onClick={startNewSession}
            className="text-sm text-slate-400 hover:text-cyan-400 transition-colors flex items-center gap-1"
          >
            ← 세션 목록으로 돌아가기
          </button>
          {viewingPastSession && (
            <span className="text-xs bg-amber-900/40 text-amber-300 border border-amber-500/20 px-2 py-0.5 rounded-full">
              📂 과거 세션 조회 중
            </span>
          )}
          {session?.session_id && (
            <span className="text-xs text-slate-600">
              ID: {session.session_id.slice(0, 8)}...
            </span>
          )}
        </div>
      )}

      {step === 1 && session?.diagnostic && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Diagnostic Results</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-lg">
                  <div className="text-sm text-slate-400 font-medium">BDR</div>
                  <div className="text-2xl font-bold">{session.diagnostic.benchmarkSnapshot?.bdr?.toFixed(1) || 0}%</div>
                </div>
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-lg">
                  <div className="text-sm text-slate-400 font-medium">AAS</div>
                  <div className="text-2xl font-bold">{session.diagnostic.benchmarkSnapshot?.aas?.toFixed(1) || 0}%</div>
                </div>
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-lg">
                  <div className="text-sm text-slate-400 font-medium">Opportunities</div>
                  <div className="text-2xl font-bold">{session.diagnostic.opportunityReport?.total_opportunities || 0}</div>
                </div>
                <div className="p-4 bg-slate-900/60 border border-white/5 rounded-lg">
                  <div className="text-sm text-slate-400 font-medium">Semantic Nodes</div>
                  <div className="text-2xl font-bold">{session.diagnostic.semanticAudit?.questionCapitalNodes || 0}</div>
                </div>
              </div>
              
              {session.diagnostic.benchmarkSnapshot?.mentionQuality && (
                <div className="mb-6 p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Mention Quality (LLM Evaluated)</h4>
                  <div className="flex gap-4">
                    <div className="flex-1 bg-green-950/40 border border-green-500/20 p-2 rounded text-center">
                      <div className="text-xs text-green-400">Strong</div>
                      <div className="font-bold text-green-800">{session.diagnostic.benchmarkSnapshot.mentionQuality.strongRate.toFixed(1)}%</div>
                    </div>
                    <div className="flex-1 bg-slate-900/60 border border-white/5 p-2 rounded text-center">
                      <div className="text-xs text-slate-300">Neutral</div>
                      <div className="font-bold text-slate-200">{session.diagnostic.benchmarkSnapshot.mentionQuality.neutralRate.toFixed(1)}%</div>
                    </div>
                    <div className="flex-1 bg-red-950/40 border border-red-500/20 p-2 rounded text-center">
                      <div className="text-xs text-red-400">Negative</div>
                      <div className="font-bold text-red-800">{session.diagnostic.benchmarkSnapshot.mentionQuality.negativeRate.toFixed(1)}%</div>
                    </div>
                  </div>
                </div>
              )}
              
              <Button onClick={discoverTargets} disabled={loading}>
                {loading ? 'LLM Discovering Targets...' : 'Step 2: Discover Targets'}
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Discovered Target Questions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              {candidates.map((c: any, i: number) => (
                <div key={i} className={`p-4 border rounded-lg flex justify-between items-start ${c.niche_parent_question ? 'border-emerald-500/30 bg-emerald-950/10' : ''}`}>
                  <div className="flex-1">
                    <div className="font-medium text-slate-200">{c.question_text}</div>
                    {c.niche_parent_question && (
                      <div className="mt-1.5 text-xs text-emerald-400/80 flex items-center gap-1.5">
                        <span>↳</span>
                        <span className="text-slate-500">정규 질문:</span>
                        <span className="text-slate-400">{c.niche_parent_question}</span>
                      </div>
                    )}
                    <div className="flex gap-2 mt-2 flex-wrap">
                      {c.niche_parent_question && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-emerald-900/50 text-emerald-300 border border-emerald-500/30">
                          🎯 Niche
                        </span>
                      )}
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-950/40 text-blue-300 border border-blue-500/20">
                        {c.eeat_dimension}
                      </span>
                      {c.sources?.map((s: any, j: number) => (
                        <span key={j} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-900 text-slate-300 border border-white/5">
                          {s.type === 'niche_discovery' ? '니치 발굴' : s.type} (Score: {s.priority_score})
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="text-right ml-4 shrink-0">
                    <div className="text-sm font-medium text-slate-200">Priority: {c.composite_priority}</div>
                    <div className="text-xs text-slate-400">Est. BDR: +{c.estimated_bdr_delta?.toFixed(1) || 0}</div>
                    {c.niche_difficulty != null && (
                      <div className="text-xs mt-1">
                        <span className={`${c.niche_difficulty <= 30 ? 'text-emerald-400' : c.niche_difficulty <= 60 ? 'text-yellow-400' : 'text-red-400'}`}>
                          난이도: {c.niche_difficulty}
                        </span>
                        <span className="text-slate-500 ml-1">| 관련도: {c.niche_relevance}</span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {candidates.length === 0 && <p className="text-slate-400">No candidates found.</p>}
            </div>
            <Button onClick={generateBlueprints} disabled={loading || candidates.length === 0}>
              {loading ? 'LLM Generating Blueprints...' : 'Step 3: Generate Blueprints'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Content Blueprints</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              {blueprints.map((bp: any, i: number) => (
                <div key={i} className="p-4 border rounded-lg space-y-3">
                  <h4 className="font-bold text-lg">{bp.title_suggestion_ko}</h4>
                  
                  <div>
                    <div className="text-sm font-semibold mb-1">Headings</div>
                    <ul className="list-disc list-inside text-sm text-slate-300">
                      {bp.heading_structure.map((h: any, j: number) => (
                        <li key={j}>{h.level.toUpperCase()}: {h.text}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2 border-t">
                    <div>
                      <div className="text-sm font-semibold text-green-400 mb-1">Must Include</div>
                      <ul className="list-disc list-inside text-sm text-slate-300">
                        {bp.expected_layer.must_include.map((item: string, j: number) => <li key={j}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-red-400 mb-1">Caution</div>
                      <ul className="list-disc list-inside text-sm text-slate-300">
                        {bp.expected_layer.caution.map((item: string, j: number) => <li key={j}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <Button onClick={runSimulation} disabled={loading}>
              {loading ? 'Simulating Impact...' : 'Step 4: Run Impact Simulation'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step === 4 && simulation && (
        <Card>
          <CardHeader>
            <CardTitle>Simulation Results & Approval</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-slate-900/60 border border-cyan-500/20 rounded-lg text-slate-200">
              <div className="font-bold mb-1 text-cyan-400">Executive Summary</div>
              <p className="text-sm">{simulation.executiveSummary}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3">Projected Impact</h4>
                <div className="space-y-2">
                  <div className="flex justify-between p-2 border-b">
                    <span className="text-slate-400">Current BDR</span>
                    <span className="font-medium">{session.diagnostic?.benchmarkSnapshot?.bdr?.toFixed(1) || 0}%</span>
                  </div>
                  <div className="flex justify-between p-2 border-b bg-green-950/40 border border-green-500/20">
                    <span className="text-green-400 font-medium">Projected BDR</span>
                    <span className="text-green-400 font-bold">{simulation.projected.bdr.toFixed(1)}%</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-semibold mb-3">Scenarios</h4>
                <div className="space-y-2">
                  {simulation.scenarios.map((s: any, i: number) => (
                    <div key={i} className="flex justify-between p-2 border rounded-md text-sm">
                      <span className="truncate w-1/2">{s.name}</span>
                      <span className="text-green-600 font-medium">{s.predicted_bdr.toFixed(1)}%</span>
                      <span className="text-slate-400">{s.required_effort} Effort</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {approvalStatus ? (
              <div className={`p-4 rounded-lg font-bold text-center ${approvalStatus === 'Approved' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                Status: {approvalStatus}
                {approvalStatus === 'Approved' && <div className="text-sm font-normal mt-1">CQ automatically registered. Task scheduled.</div>}
              </div>
            ) : (
              <div className="flex gap-4 pt-4 border-t">
                <Button onClick={() => handleApproval(true)} disabled={loading} className="flex-1 bg-green-600 hover:bg-green-700">
                  {loading ? 'Processing...' : 'Approve & Execute (Admin)'}
                </Button>
                <Button onClick={() => handleApproval(false)} disabled={loading} variant="destructive" className="flex-1">
                  Reject
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
        </div>
      )}

      {activeTab === 'benchmark' && (
        <Card>
          <CardHeader>
            <CardTitle>Large Scale Benchmark (Background)</CardTitle>
            <CardDescription>25개 자치구 등 대규모 도메인의 측정을 백그라운드에서 안전하게 수행합니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex space-x-4">
              <select 
                value={selectedDomain} 
                onChange={(e) => setSelectedDomain(e.target.value)}
                className="border border-white/10 rounded-md px-3 py-2 text-sm bg-slate-900 text-white outline-none focus:border-cyan-500"
              >
                <option value="skincare">Skincare</option>
                <option value="seoul_district_ko">Seoul Districts (KO)</option>
                <option value="seoul_district_en">Seoul Districts (EN)</option>
                <option value="wedding_studio">Wedding Studio</option>
                <option value="kpop_idol_ko">K-pop Idols (KO)</option>
                <option value="kpop_idol_en">K-pop Idols (EN)</option>
              </select>
            </div>

            {!bgSessionId && (
              <Button onClick={startBackgroundBenchmark} className="w-full">Start Background Benchmark</Button>
            )}

            {bgSessionId && bgStatus && (
              <div className="p-4 border rounded-md bg-slate-900/60 border border-white/5 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="font-bold capitalize text-slate-200">Status: {bgStatus.status}</span>
                  <span className="text-slate-400 font-medium">{bgStatus.completed_queries} / {bgStatus.total_queries} Queries Completed</span>
                </div>
                
                <div className="w-full bg-slate-800 rounded-full h-2.5">
                  <div className="bg-cyan-500 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${Math.min(100, Math.max(0, (bgStatus.completed_queries / (bgStatus.total_queries || 1)) * 100))}%` }}></div>
                </div>

                <div className="flex space-x-2">
                  {bgStatus.status === 'running' && <Button onClick={pauseBackgroundBenchmark} variant="outline">Pause Measurement</Button>}
                  {bgStatus.status === 'paused' && <Button onClick={resumeBackgroundBenchmark}>Resume Measurement</Button>}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'settings' && (
        <SettingsPanel workspaceId={workspaceId} />
      )}

    </div>
  );
}
