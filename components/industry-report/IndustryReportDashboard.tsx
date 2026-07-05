'use client';

import { useState, useMemo } from 'react';
import type { IndustryReportData, BrandRankingRow } from '../../lib/industry-report/report-data-builder';
import type { PositionMatrixEntry } from '../../lib/industry-report/competitive-position-matrix';
import { getQuadrantLabel, getQuadrantPrescription } from '../../lib/industry-report/competitive-position-matrix';

// ═══════════════════════════════════════════════════════════════
// Props
// ═══════════════════════════════════════════════════════════════

interface Props {
  reports: { industryKey: string; reportId: string; data: IndustryReportData }[];
}

// ═══════════════════════════════════════════════════════════════
// 색상·스타일 상수
// ═══════════════════════════════════════════════════════════════

const QUADRANT_STYLES = {
  ai_leader: { bg: 'bg-emerald-900/30', border: 'border-emerald-500/40', badge: 'bg-emerald-500/20 text-emerald-300', dot: '🟢' },
  competitive_warrior: { bg: 'bg-amber-900/30', border: 'border-amber-500/40', badge: 'bg-amber-500/20 text-amber-300', dot: '🟡' },
  steady_defender: { bg: 'bg-blue-900/30', border: 'border-blue-500/40', badge: 'bg-blue-500/20 text-blue-300', dot: '🔵' },
  vulnerable: { bg: 'bg-red-900/30', border: 'border-red-500/40', badge: 'bg-red-500/20 text-red-300', dot: '🔴' },
};

const AEPI_COLORS = ['#6366f1', '#8b5cf6', '#a855f7', '#ec4899', '#f43f5e', '#f97316', '#22c55e'];

// ═══════════════════════════════════════════════════════════════
// 서브 컴포넌트: Score Bar
// ═══════════════════════════════════════════════════════════════

function ScoreBar({ value, color = '#6366f1', maxWidth = 100 }: { value: number; color?: string; maxWidth?: number }) {
  const pct = Math.min(100, Math.max(0, value));
  return (
    <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-700"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 서브 컴포넌트: Stat Card
// ═══════════════════════════════════════════════════════════════

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div className="bg-white/5 rounded-xl border border-white/10 p-4 flex flex-col gap-1">
      <p className="text-xs text-slate-400 font-medium">{label}</p>
      <p className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toFixed(1) : value}</p>
      {sub && <p className="text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 서브 컴포넌트: AIPR Ranking Table
// ═══════════════════════════════════════════════════════════════

function RankingTable({ rankings }: { rankings: BrandRankingRow[] }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/10">
            <th className="text-left py-2 px-3 text-slate-400 font-medium">순위</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">브랜드</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">BAIR</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">BSF</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">OCR</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">BDR</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">CWR</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">Top3</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">Top5</th>
            <th className="text-right py-2 px-3 text-slate-400 font-medium">Fresh</th>
            <th className="text-left py-2 px-3 text-slate-400 font-medium">포지션</th>
          </tr>
        </thead>
        <tbody>
          {rankings.map((row) => {
            const quadStyle = row.quadrant ? QUADRANT_STYLES[row.quadrant] : null;
            return (
              <tr key={row.brandSlug} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold text-white">{row.rank}</span>
                    {row.rankChange !== 0 && (
                      <span className={`text-xs font-semibold ${row.rankChange > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {row.rankChangeLabel}
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3 px-3">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{row.brand}</span>
                    {row.isEstimated && (
                      <span className="text-[10px] text-amber-400 border border-amber-400/30 rounded px-1">추정</span>
                    )}
                  </div>
                  <div className="mt-1 w-28">
                    <ScoreBar value={row.bairScore} color="#6366f1" />
                  </div>
                </td>
                <td className="py-3 px-3 text-right font-mono text-indigo-300 font-bold">{row.bairScore.toFixed(1)}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-300">{row.bsf.toFixed(1)}</td>
                <td className="py-3 px-3 text-right font-mono text-slate-300">{row.ocr.toFixed(1)}</td>
                <td className="py-3 px-3 text-right font-mono text-blue-300">{row.bdr?.toFixed(1) ?? '─'}</td>
                <td className="py-3 px-3 text-right font-mono text-purple-300">{row.cwr?.toFixed(1) ?? '─'}</td>
                <td className="py-3 px-3 text-right font-mono text-cyan-300">{row.top3?.toFixed(1) ?? '─'}</td>
                <td className="py-3 px-3 text-right font-mono text-teal-300">{row.top5?.toFixed(1) ?? '─'}</td>
                <td className="py-3 px-3 text-right">
                  <span className={`font-mono ${(row.freshness ?? 0) >= 70 ? 'text-emerald-300' : (row.freshness ?? 0) >= 40 ? 'text-amber-300' : 'text-red-300'}`}>
                    {row.freshness?.toFixed(1) ?? '─'}
                  </span>
                </td>
                <td className="py-3 px-3">
                  {quadStyle && (
                    <span className={`text-xs px-2 py-0.5 rounded-full ${quadStyle.badge}`}>
                      {quadStyle.dot}
                    </span>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 서브 컴포넌트: Position Matrix (4사분면 시각화)
// ═══════════════════════════════════════════════════════════════

function PositionMatrixChart({ data }: { data: IndustryReportData['positionMatrix'] }) {
  const quadrantOrder: Array<keyof typeof QUADRANT_STYLES> = ['ai_leader', 'competitive_warrior', 'steady_defender', 'vulnerable'];

  return (
    <div className="space-y-3">
      <p className="text-xs text-slate-400">
        기준선: BDR 평균 <span className="text-white font-mono">{data.bdrThreshold}%</span> / CWR 평균 <span className="text-white font-mono">{data.cwrThreshold}%</span>
      </p>
      <div className="grid grid-cols-2 gap-3">
        {quadrantOrder.map((q) => {
          const style = QUADRANT_STYLES[q];
          const entries = data.byQuadrant[q];
          const prescription = getQuadrantPrescription(q);
          return (
            <div key={q} className={`rounded-xl border p-3 ${style.bg} ${style.border}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm">{style.dot}</span>
                <span className="text-xs font-semibold text-white">{getQuadrantLabel(q).split(' ')[0]} {getQuadrantLabel(q).split(' ')[1]}</span>
              </div>
              {entries.length === 0 ? (
                <p className="text-xs text-slate-500">─</p>
              ) : (
                <div className="space-y-1">
                  {entries.map((e: PositionMatrixEntry) => (
                    <div key={e.brandSlug} className="flex items-center justify-between">
                      <span className="text-xs text-white font-medium">{e.brand}</span>
                      <span className="text-xs font-mono text-slate-400">{e.bairScore.toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              )}
              <p className="text-[10px] text-slate-500 mt-2 leading-relaxed">{prescription.priority}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 서브 컴포넌트: AEPI Radar (텍스트 기반 바 차트)
// ═══════════════════════════════════════════════════════════════

function AepiRadarChart({ data }: { data: IndustryReportData['radar'] }) {
  return (
    <div className="space-y-2">
      {data.dimensionLabels.map((label, i) => {
        const avgVal = data.industryAvg[i] ?? 0;
        const topVal = data.topBrands[0]?.values[i] ?? 0;
        return (
          <div key={label} className="space-y-0.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">{label}</span>
              <div className="flex items-center gap-2">
                <span className="text-slate-400 font-mono">{avgVal.toFixed(0)}</span>
                {data.topBrands[0] && (
                  <span className="text-indigo-300 font-mono">{topVal.toFixed(0)}</span>
                )}
              </div>
            </div>
            <div className="flex gap-1 h-2">
              <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-slate-500/60 transition-all duration-700"
                  style={{ width: `${avgVal}%` }}
                />
              </div>
              {data.topBrands[0] && (
                <div className="flex-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-500/70 transition-all duration-700"
                    style={{ width: `${topVal}%` }}
                  />
                </div>
              )}
            </div>
          </div>
        );
      })}
      {data.topBrands[0] && (
        <div className="flex items-center gap-3 pt-1">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-slate-500/60" />
            <span className="text-[10px] text-slate-500">업종 평균</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-indigo-500/70" />
            <span className="text-[10px] text-slate-500">{data.topBrands[0].brand}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// 메인 컴포넌트: IndustryReportDashboard
// ═══════════════════════════════════════════════════════════════

export default function IndustryReportDashboard({ reports }: Props) {
  const [activeIdx, setActiveIdx] = useState(0);
  const [activeTab, setActiveTab] = useState<'ranking' | 'matrix' | 'aepi' | 'trend'>('ranking');
  const [isExporting, setIsExporting] = useState(false);

  const current = reports[activeIdx];

  async function handleExport(format: 'markdown' | 'json') {
    if (!current) return;
    setIsExporting(true);
    try {
      const res = await fetch('/api/industry-report/export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId: current.reportId, format }),
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.headers.get('content-disposition')?.match(/filename="(.+?)"/)?.[1] ?? 'report';
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error(e);
    } finally {
      setIsExporting(false);
    }
  }

  if (reports.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-5xl">📊</div>
          <p className="text-slate-400 text-lg">아직 발행된 리포트가 없습니다.</p>
          <p className="text-slate-500 text-sm">
            API를 통해 첫 번째 업종 리포트를 생성해보세요.
          </p>
          <div className="mt-4 font-mono text-xs text-slate-600 bg-slate-900 rounded-lg p-4 text-left">
            POST /api/industry-report/generate<br />
            {'{ subIndustryKey: "skincare", brands: [...] }'}
          </div>
        </div>
      </div>
    );
  }

  const { data, reportId } = current;
  const { summary, rankings, positionMatrix, radar, timeSeries, snapshot } = data;

  const tabs: Array<{ key: typeof activeTab; label: string }> = [
    { key: 'ranking', label: 'AI Power Ranking' },
    { key: 'matrix', label: '전략 포지션' },
    { key: 'aepi', label: 'AEPI 레이더' },
    { key: 'trend', label: '추이 분석' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white">
      {/* ── Top Navigation ── */}
      <div className="border-b border-white/10 bg-slate-950/60 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm">📊</div>
            <div>
              <h1 className="text-sm font-bold text-white">AEO/GEO 업종 경쟁 리포트</h1>
              <p className="text-[10px] text-slate-500">BSW-OS AI Visibility Intelligence</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleExport('markdown')}
              disabled={isExporting}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 transition-colors disabled:opacity-50"
            >
              {isExporting ? '처리중...' : '↓ MD'}
            </button>
            <button
              onClick={() => handleExport('json')}
              disabled={isExporting}
              className="text-xs px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/15 text-slate-300 transition-colors disabled:opacity-50"
            >
              ↓ JSON
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
        {/* ── Industry Selector ── */}
        {reports.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {reports.map((r, i) => (
              <button
                key={r.reportId}
                onClick={() => { setActiveIdx(i); setActiveTab('ranking'); }}
                className={`shrink-0 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  i === activeIdx
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'bg-white/5 text-slate-400 hover:bg-white/10'
                }`}
              >
                {r.industryKey}
              </button>
            ))}
          </div>
        )}

        {/* ── Report Header ── */}
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold">{snapshot.report_title}</h2>
            <span className={`text-xs px-2 py-0.5 rounded-full ${
              snapshot.status === 'published' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
            }`}>
              {snapshot.status === 'published' ? '발행됨' : '초안'}
            </span>
          </div>
          <p className="text-xs text-slate-400">
            측정 엔진: {snapshot.engines_used.join(' · ')} &nbsp;·&nbsp;
            프로브: {snapshot.total_probes}건 &nbsp;·&nbsp;
            응답: {snapshot.total_responses}건 &nbsp;·&nbsp;
            {snapshot.probe_set_hash && <span>Hash: <code className="font-mono text-slate-500">{snapshot.probe_set_hash}</code></span>}
          </p>
        </div>

        {/* ── KPI Summary Cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="업종 IRI (준비도)" value={summary.industryIRI ?? '─'} sub="AI 추천 확률" />
          <StatCard label="업종 OPP (선점기회)" value={summary.industryOPP ?? '─'} sub="미점유 AI 쿼리" />
          <StatCard label="BAIR 업종 평균" value={summary.industryAvgBAIR ?? '─'} sub="AI 가시성 종합" />
          <StatCard label="1위 브랜드" value={summary.topBrand} sub={`BAIR ${summary.topBrandBAIR.toFixed(1)}`} />
        </div>

        {/* ── IRI Progress Bar ── */}
        <div className="bg-white/5 rounded-xl border border-white/10 p-4 space-y-3">
          <div className="flex justify-between text-xs text-slate-400">
            <span>IRI — 업종 AI 준비도</span>
            <span className="font-mono text-white">{(summary.industryIRI ?? 0).toFixed(1)}%</span>
          </div>
          <div className="h-3 bg-white/5 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000"
              style={{ width: `${summary.industryIRI ?? 0}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-slate-500">
            <span>← 콘텐츠 기회 많음 (OPP {(summary.industryOPP ?? 0).toFixed(0)}%)</span>
            <span>경쟁 과열 →</span>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="border-b border-white/10 flex gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2.5 text-sm font-medium transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? 'border-indigo-500 text-indigo-300'
                  : 'border-transparent text-slate-400 hover:text-slate-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="bg-white/3 rounded-2xl border border-white/10 p-5">
          {activeTab === 'ranking' && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-slate-300">Brand AI Power Ranking (AIPR)</h3>
              <RankingTable rankings={rankings} />
              <p className="text-[10px] text-slate-500 pt-2">
                BAIR = 0.35·BSF + 0.25·AAS + 0.20·OCR + 0.10·SWEL + 0.10·MQ &nbsp;·&nbsp;
                ⚠ 추정 = 표본 5건 미만
              </p>
            </div>
          )}

          {activeTab === 'matrix' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">Strategic Position Matrix (BDR × CWR)</h3>
              <PositionMatrixChart data={positionMatrix} />
            </div>
          )}

          {activeTab === 'aepi' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">AEPI 7차원 레이더 (업종 평균 vs 1위 브랜드)</h3>
              <AepiRadarChart data={radar} />
            </div>
          )}

          {activeTab === 'trend' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-slate-300">BAIR 추이 분석</h3>
              {timeSeries && timeSeries.periods.length >= 2 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-2 px-3 text-slate-400">브랜드</th>
                        {timeSeries.periods.map((p) => (
                          <th key={p} className="text-right py-2 px-3 text-slate-400">{p}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {timeSeries.brands.slice(0, 10).map((b) => (
                        <tr key={b.brandSlug} className="border-b border-white/5">
                          <td className="py-2 px-3 font-medium text-white">{b.brand}</td>
                          {b.bairHistory.map((v, i) => (
                            <td key={i} className="py-2 px-3 text-right font-mono text-slate-300">
                              {v !== null ? v.toFixed(1) : '─'}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-2xl mb-2">📈</p>
                  <p className="text-sm">시계열 데이터는 2개 이상의 기간이 축적된 후 표시됩니다.</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── 처방 섹션 ── */}
        <div className="bg-white/3 rounded-2xl border border-white/10 p-5 space-y-4">
          <h3 className="text-sm font-semibold text-slate-300">전략 처방 (Strategy Prescriptions)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {(['ai_leader', 'competitive_warrior', 'steady_defender', 'vulnerable'] as const).map((q) => {
              const entries = positionMatrix.byQuadrant[q];
              if (entries.length === 0) return null;
              const style = QUADRANT_STYLES[q];
              const prescription = getQuadrantPrescription(q);
              return (
                <div key={q} className={`rounded-xl border p-4 space-y-2 ${style.bg} ${style.border}`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-white">
                      {style.dot} {entries.map((e: PositionMatrixEntry) => e.brand).join(', ')}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${style.badge}`}>{prescription.priority}</span>
                  </div>
                  <p className="text-xs text-slate-300">{prescription.action}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Footer ── */}
        <div className="border-t border-white/10 pt-4 text-center">
          <p className="text-[10px] text-slate-600">
            © BSW-OS AI Visibility Intelligence &nbsp;·&nbsp;
            Probe Hash: <code className="font-mono">{snapshot.probe_set_hash ?? 'N/A'}</code> &nbsp;·&nbsp;
            ⚠ Proxy 측정 기반 — 실제 AI 검색 결과와 차이 있을 수 있음
          </p>
        </div>
      </div>
    </div>
  );
}
