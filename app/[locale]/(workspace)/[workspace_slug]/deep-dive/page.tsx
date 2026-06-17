'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
// Native HTML replacements for Card and Button
const Card = ({ children, className = '' }: any) => <div className={`border rounded-xl bg-white shadow-sm overflow-hidden ${className}`}>{children}</div>;
const CardHeader = ({ children, className = '' }: any) => <div className={`px-6 py-4 border-b ${className}`}>{children}</div>;
const CardTitle = ({ children, className = '' }: any) => <h3 className={`text-lg font-bold ${className}`}>{children}</h3>;
const CardDescription = ({ children, className = '' }: any) => <p className={`text-sm text-slate-500 mt-1 ${className}`}>{children}</p>;
const CardContent = ({ children, className = '' }: any) => <div className={`p-6 ${className}`}>{children}</div>;
const Button = ({ children, onClick, disabled, variant = 'default', className = '', size = 'default' }: any) => {
  const base = "inline-flex items-center justify-center font-medium rounded-md transition-colors disabled:opacity-50 disabled:pointer-events-none";
  const variants: Record<string, string> = {
    default: "bg-slate-900 text-white hover:bg-slate-800",
    outline: "border border-slate-200 hover:bg-slate-100",
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
  const workspaceId = params.workspace_slug as string;
  const [step, setStep] = useState(0);
  const [session, setSession] = useState<any>(null);
  const [candidates, setCandidates] = useState<any[]>([]);
  const [blueprints, setBlueprints] = useState<any[]>([]);
  const [simulation, setSimulation] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const startDiagnosis = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deep-dive/diagnose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: workspaceId, brand_slug: 'drjart', domain_slug: 'skincare' })
      });
      const data = await res.json();
      setSession(data);
      setStep(1);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const discoverTargets = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/deep-dive/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ session_id: session.session_id, workspace_id: workspaceId, brand_slug: 'drjart' })
      });
      const data = await res.json();
      setCandidates(data.candidates);
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
        body: JSON.stringify({ session_id: session.session_id, workspace_id: workspaceId, accepted_question_ids: acceptedIds })
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
        body: JSON.stringify({ session_id: session.session_id })
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

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Client Deep Dive</h1>
          <p className="text-muted-foreground mt-2">풀사이클 브랜드 진단 및 에셋 전략 수립 (월구독형)</p>
        </div>
        <div className="text-sm bg-blue-100 text-blue-800 px-3 py-1 rounded-full font-medium">
          2차 승인 프로세스 활성화
        </div>
      </div>

      {step === 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Phase 1. 진단 시작</CardTitle>
            <CardDescription>현재 브랜드의 D-MRI, E-E-A-T Gap, Truth Readiness를 스캔합니다.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={startDiagnosis} disabled={loading}>
              {loading ? '스캔 중...' : '브랜드 스캔 시작'}
            </Button>
          </CardContent>
        </Card>
      )}

      {step >= 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Phase 1. 진단 결과</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="text-sm text-slate-500">D-MRI 점수</div>
                <div className="text-2xl font-bold">{session?.diagnostic?.dmri?.value || 'N/A'} / 100</div>
              </div>
              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="text-sm text-slate-500">Benchmark Rank</div>
                <div className="text-2xl font-bold">#{session?.diagnostic?.benchmarkSnapshot?.rank || 'N/A'}</div>
              </div>
              <div className="p-4 border rounded-lg bg-slate-50">
                <div className="text-sm text-slate-500">Truth Claims</div>
                <div className="text-2xl font-bold">{session?.diagnostic?.truthAudit?.operationalClaims?.approved || '0'} 승인됨</div>
              </div>
            </div>
            {step === 1 && (
              <Button onClick={discoverTargets} disabled={loading} variant="default">
                {loading ? '탐색 중...' : 'Phase 2. 타겟 QIS 발굴'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step >= 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Phase 2. 타겟 QIS 후보 (관리자 승인 대기)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4">
              {candidates.map((c, i) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-lg bg-white shadow-sm">
                  <div>
                    <div className="font-semibold text-lg">{c.question_text}</div>
                    <div className="text-sm text-slate-500 mt-1">우선순위 점수: {c.composite_priority} | 기대 AEPI: +{c.estimated_aepi_impact}</div>
                  </div>
                  <div className="flex space-x-2">
                    <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded">승인 대기</span>
                  </div>
                </div>
              ))}
            </div>
            {step === 2 && (
              <Button onClick={generateBlueprints} disabled={loading} variant="default">
                {loading ? '생성 중...' : 'Phase 3. 콘텐츠 블루프린트 생성 (승인 가정)'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step >= 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Phase 3. 콘텐츠 블루프린트 설계도</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6 mb-4">
              {blueprints.map((bp, i) => (
                <div key={i} className="p-4 border rounded-lg bg-slate-50">
                  <h3 className="font-bold text-lg mb-2">{bp.title_suggestion_ko}</h3>
                  <div className="text-sm mb-2"><span className="font-medium">Type:</span> {bp.content_type}</div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="font-medium mb-1">Must Include</div>
                      <ul className="list-disc pl-5 text-sm text-slate-600">
                        {bp.expected_layer?.must_include?.map((item: string, j: number) => <li key={j}>{item}</li>)}
                      </ul>
                    </div>
                    <div>
                      <div className="font-medium mb-1 text-red-600">Must Not Do</div>
                      <ul className="list-disc pl-5 text-sm text-red-500">
                        {bp.expected_layer?.must_not_do?.map((item: string, j: number) => <li key={j}>{item}</li>)}
                      </ul>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {step === 3 && (
              <Button onClick={runSimulation} disabled={loading} variant="default">
                {loading ? '시뮬레이션 중...' : 'Phase 4. ROI 및 효과 예측 시뮬레이션'}
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      {step >= 4 && simulation && (
        <Card className="border-emerald-200">
          <CardHeader className="bg-emerald-50">
            <CardTitle className="text-emerald-800">Phase 4. 실행 효과 예측 (시뮬레이터)</CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-8 mb-6">
              <div>
                <h3 className="font-medium text-slate-500 mb-2">현재 지표</h3>
                <div className="text-3xl font-bold">AEPI: {simulation.current?.aepi?.toFixed(1)}</div>
                <div className="text-lg text-slate-600 mt-1">BDR: {simulation.current?.bdr?.toFixed(1)}%</div>
              </div>
              <div>
                <h3 className="font-medium text-emerald-600 mb-2">예상 지표 (Full Package 실행 시)</h3>
                <div className="text-3xl font-bold text-emerald-700">AEPI: {simulation.projected?.aepi?.toFixed(1)}</div>
                <div className="text-lg text-emerald-600 mt-1">BDR: {simulation.projected?.bdr?.toFixed(1)}%</div>
              </div>
            </div>
            
            <h3 className="font-bold text-lg mb-3">투자 결정 시나리오</h3>
            <div className="space-y-3">
              {simulation.scenarios?.map((sc: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 border rounded-lg bg-white">
                  <div>
                    <div className="font-semibold">{sc.name}</div>
                    <div className="text-sm text-slate-500">예상 소요 기간: {sc.estimated_weeks}주</div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald-600">+ AEPI {sc.total_aepi_delta?.toFixed(1)}</div>
                    <div className="font-bold text-blue-600">+ BDR {sc.total_bdr_delta?.toFixed(1)}%</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-8 flex justify-end">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-700">전략 실행 승인 및 에셋 제작 시작</Button>
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
}
