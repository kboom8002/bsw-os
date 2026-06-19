"use client";

import React, { useState } from "react";
import { Activity, ShieldAlert, Zap, BookOpen, AlertTriangle } from "lucide-react";
import { ParametricPersonaSnapshot } from "../../lib/persona/parametric-persona-snapshot";

interface PersonaFidelityPanelProps {
  snapshot: ParametricPersonaSnapshot;
}

export default function PersonaFidelityPanel({ snapshot }: PersonaFidelityPanelProps) {
  const [viewMode, setViewMode] = useState<'overall' | 'floor_risk' | 'spec'>('overall');

  if (!snapshot.fidelity_simulation) {
    return (
      <div className="border border-slate-800 rounded-2xl bg-slate-900/20 backdrop-blur-xl p-8 text-center text-slate-500 text-sm">
        Tier 3 심화 시뮬레이션 결과가 없습니다.
      </div>
    );
  }

  const { baseline_result, conditioned_result, delta_score, persona_spec_yaml } = snapshot.fidelity_simulation;
  const { floor_risk, dimensions } = conditioned_result;

  const getGradeColor = (grade: string) => {
    switch (grade) {
      case 'FLAWLESS': return 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20';
      case 'FAITHFUL': return 'text-blue-400 bg-blue-400/10 border-blue-400/20';
      case 'PARTIAL': return 'text-yellow-400 bg-yellow-400/10 border-yellow-400/20';
      case 'SHALLOW': return 'text-orange-400 bg-orange-400/10 border-orange-400/20';
      case 'BROKEN': return 'text-rose-400 bg-rose-400/10 border-rose-400/20';
      default: return 'text-slate-400 bg-slate-400/10 border-slate-400/20';
    }
  };

  const getRiskColor = (grade: string) => {
    switch (grade) {
      case 'SAFE': return 'text-emerald-400';
      case 'CAUTION': return 'text-yellow-400';
      case 'VULNERABLE': return 'text-orange-400';
      case 'CRITICAL': return 'text-rose-500';
      default: return 'text-slate-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation */}
      <div className="flex gap-2 border-b border-slate-800 pb-4">
        <button
          onClick={() => setViewMode('overall')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            viewMode === 'overall' ? 'bg-indigo-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          8D Fidelity 분석
        </button>
        <button
          onClick={() => setViewMode('floor_risk')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            viewMode === 'floor_risk' ? 'bg-rose-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          Floor Risk (적대적 방어)
        </button>
        <button
          onClick={() => setViewMode('spec')}
          className={`px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2 ${
            viewMode === 'spec' ? 'bg-blue-600 text-white' : 'bg-slate-800/50 text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          PersonaSpec OS YAML
        </button>
      </div>

      {viewMode === 'overall' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Summary Score Card */}
          <div className="border border-slate-800 rounded-2xl bg-slate-900/40 p-6 flex flex-col items-center justify-center relative overflow-hidden">
            <div className="absolute top-4 left-4 text-xs font-bold text-slate-400 tracking-wider">REPRODUCTION FIDELITY</div>
            <div className="text-center mt-6">
              <div className="text-6xl font-black text-white mb-2">{conditioned_result.overall_score}</div>
              <div className={`text-xs font-bold px-3 py-1 rounded-full border inline-block ${getGradeColor(conditioned_result.grade)}`}>
                {conditioned_result.grade}
              </div>
            </div>
            
            <div className="mt-8 w-full px-4">
              <div className="flex justify-between items-center text-xs mb-2">
                <span className="text-slate-400 font-bold">Baseline Score (Spec 없이)</span>
                <span className="text-slate-300">{baseline_result.overall_score}</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-slate-500 h-full" style={{ width: `${baseline_result.overall_score}%` }}></div>
              </div>
              
              <div className="flex justify-between items-center text-xs mt-4 mb-2">
                <span className="text-indigo-400 font-bold">Conditioned (Spec 적용)</span>
                <span className="text-indigo-300">
                  {conditioned_result.overall_score} 
                  <span className="text-emerald-400 ml-1">(+{delta_score})</span>
                </span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div className="bg-indigo-500 h-full" style={{ width: `${conditioned_result.overall_score}%` }}></div>
              </div>
            </div>
          </div>

          {/* Dimension Details */}
          <div className="lg:col-span-2 border border-slate-800 rounded-2xl bg-slate-900/20 p-6">
            <h3 className="text-sm font-bold text-slate-300 flex items-center gap-2 mb-6">
              <Zap className="w-4 h-4 text-yellow-400" />
              8D 차원별 성능 분석 (Conditioned)
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
              {[
                { key: 'D1_Persona_Fidelity', label: 'D1. 정체성 일치도', val: dimensions.D1_Persona_Fidelity },
                { key: 'D2_Vibe_Alignment', label: 'D2. 정동 톤 매칭', val: dimensions.D2_Vibe_Alignment },
                { key: 'D3_Mode_Switch', label: 'D3. 상황 모드 전환', val: dimensions.D3_Mode_Switch },
                { key: 'D4_Evidence_Discipline', label: 'D4. 근거 기반/환각 억제', val: dimensions.D4_Evidence_Discipline },
                { key: 'D5_Boundary_Compliance', label: 'D5. 금기/경계 준수', val: dimensions.D5_Boundary_Compliance },
                { key: 'D6_Floor_Risk', label: 'D6. 최저점 방어 (리스크 억제)', val: dimensions.D6_Floor_Risk },
                { key: 'D8_Language_DNA', label: 'D8. 문체/어휘 (Language DNA)', val: dimensions.D8_Language_DNA },
              ].map((dim, i) => (
                <div key={i} className="space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-300 font-bold">{dim.label}</span>
                    <span className="text-slate-400">{dim.val} / 100</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${dim.val >= 80 ? 'bg-emerald-500' : dim.val >= 60 ? 'bg-yellow-500' : 'bg-rose-500'}`} 
                      style={{ width: `${dim.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-6 p-4 rounded-lg bg-indigo-950/20 border border-indigo-500/20 text-xs text-indigo-200">
              <span className="font-bold block mb-1">💡 Delta Analysis Insight</span>
              PersonaSpec 런타임 적용 시 기존 대비 <strong>{delta_score}점</strong>의 재현 충실도 향상이 있었습니다. 
              {delta_score > 15 ? ' 이는 사양서가 프롬프트 제어에 매우 효과적으로 작용하고 있음을 뜻합니다.' : ' 효과가 미미하므로 사양서의 구체성을 보강해야 할 수 있습니다.'}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'floor_risk' && (
        <div className="space-y-6">
          <div className="border border-slate-800 rounded-2xl bg-slate-900/20 p-6 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-rose-400" />
                적대적 프로빙 및 Floor Risk 평가
              </h3>
              <p className="text-xs text-slate-400 mt-1">16개 시나리오 중 최악의 응답(리스크 스코어 하위) 분석</p>
            </div>
            <div className="text-right">
              <div className={`text-2xl font-black ${getRiskColor(floor_risk.grade)}`}>{floor_risk.grade}</div>
              <div className="text-xs text-slate-500 font-bold">Risk Ratio: {(floor_risk.score * 100).toFixed(0)}%</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {floor_risk.worst_responses.map((wr, i) => (
              <div key={i} className="border border-rose-900/30 rounded-xl bg-rose-950/10 p-5 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-rose-500/50"></div>
                <div className="flex justify-between items-start mb-3">
                  <span className="text-xs font-black text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded">
                    Risk Score: {wr.risk_score} / 100
                  </span>
                  {wr.attack_type && (
                    <span className="text-[10px] font-bold text-orange-400 bg-orange-950/30 px-2 py-0.5 rounded border border-orange-900/50">
                      {wr.attack_type}
                    </span>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">User Probe (Scenario)</span>
                    <div className="text-xs text-slate-300 bg-slate-900/50 p-2.5 rounded-lg border border-slate-800">
                      {wr.scenario_text}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] text-rose-400/80 font-bold uppercase tracking-wider block mb-1">Actor Response (Worst)</span>
                    <div className="text-xs text-slate-200 bg-rose-900/20 p-2.5 rounded-lg border border-rose-900/30 whitespace-pre-wrap leading-relaxed">
                      {wr.response}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            
            {floor_risk.worst_responses.length === 0 && (
              <div className="col-span-2 text-center p-8 text-emerald-400 text-sm border border-emerald-900/50 rounded-xl bg-emerald-950/10">
                치명적인 리스크(Score &lt; 30)가 발견되지 않았습니다. 브랜드 방어가 견고합니다.
              </div>
            )}
          </div>
        </div>
      )}

      {viewMode === 'spec' && (
        <div className="border border-slate-800 rounded-2xl bg-[#0d1117] p-6">
          <h3 className="text-sm font-bold text-slate-300 mb-4 flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-blue-400" />
            생성된 PersonaSpec OS YAML
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            V2.0 인지 분석 결과를 바탕으로 자동 생성된 기계-판독 가능 브랜드 인격 사양서입니다.
          </p>
          <pre className="text-[11px] text-slate-300 overflow-x-auto whitespace-pre-wrap font-mono leading-relaxed">
            {persona_spec_yaml}
          </pre>
        </div>
      )}
    </div>
  );
}
