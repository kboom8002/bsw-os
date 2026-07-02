/**
 * lib/industry-report/export-report.ts
 *
 * 리포트 데이터 → 발표용 Markdown 변환기.
 * BSW_INDUSTRY_AEO_GEO_COMPETITIVE_REPORT_GUIDE.md의
 * "분기 업종 심층 리포트 표준 템플릿"을 그대로 구현합니다.
 */

import type { IndustryReportData, BrandRankingRow } from './report-data-builder';
import type { PositionMatrixEntry } from './competitive-position-matrix';
import { getQuadrantLabel, getQuadrantPrescription } from './competitive-position-matrix';

// ═══════════════════════════════════════════════════════════════
// Markdown 내보내기
// ═══════════════════════════════════════════════════════════════

/**
 * IndustryReportData → 발표용 Markdown 문자열 변환
 *
 * 생성 구조:
 *   1. Executive Summary
 *   2. Industry AEO Landscape (IRI, OPP)
 *   3. Brand AI Power Ranking (AIPR Table)
 *   4. Entity Presence Deep-Dive (AEPI 7차원)
 *   5. Strategic Position Matrix (4사분면)
 *   6. Trend & Outlook
 *   7. Appendix: Methodology
 */
export function exportToMarkdown(report: IndustryReportData): string {
  const { snapshot, summary, rankings, positionMatrix, radar, timeSeries } = report;
  const { report_title, sub_industry_key, report_period, engines_used } = snapshot;

  const lines: string[] = [];

  // ────────────────────────────────────────────────────────────
  // Header
  // ────────────────────────────────────────────────────────────
  lines.push(`# ${report_title}`);
  lines.push('');
  lines.push(`> **발행:** BSW-OS AI Visibility Intelligence  `);
  lines.push(`> **업종:** ${sub_industry_key}  `);
  lines.push(`> **기간:** ${report_period}  `);
  lines.push(`> **측정 엔진:** ${engines_used.join(' · ')}  `);
  lines.push(`> **참여 브랜드:** ${summary.totalBrands}개  `);
  lines.push(`> **총 프로브:** ${summary.totalProbes}건 / 총 응답: ${summary.totalResponses}건`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ────────────────────────────────────────────────────────────
  // 1. Executive Summary
  // ────────────────────────────────────────────────────────────
  lines.push('## 1. Executive Summary');
  lines.push('');
  lines.push(`**AI 가시성 1위 브랜드:** ${summary.topBrand} (BAIR ${summary.topBrandBAIR.toFixed(1)})`);
  lines.push('');

  if (summary.biggestRiser) {
    lines.push(`📈 **최대 상승:** ${summary.biggestRiser.brand} (+${summary.biggestRiser.change}위)`);
  }
  if (summary.biggestFaller) {
    lines.push(`📉 **최대 하락:** ${summary.biggestFaller.brand} (${summary.biggestFaller.change}위)`);
  }
  lines.push('');

  lines.push('### 업종 레벨 집계');
  lines.push('');
  lines.push('| 지표 | 값 | 의미 |');
  lines.push('|------|-----|------|');
  lines.push(`| **IRI (업종 준비도)** | ${fmt(summary.industryIRI)}% | AI가 이 업종에서 브랜드를 적극 추천하는 비율 |`);
  lines.push(`| **OPP (선점 기회)** | ${fmt(summary.industryOPP)}% | 아직 특정 브랜드가 없는 "빈 영역" |`);
  lines.push(`| **BAIR 업종 평균** | ${fmt(summary.industryAvgBAIR)} | AI 가시성 종합 평균 |`);
  lines.push(`| **AEPI 업종 평균** | ${fmt(summary.industryAvgAEPI)} | 엔티티 반영도 평균 |`);
  lines.push('');

  // 3줄 인사이트
  lines.push('### 핵심 인사이트');
  lines.push('');
  const iriVal = summary.industryIRI ?? 0;
  const oppVal = summary.industryOPP ?? 100;
  if (iriVal >= 70) {
    lines.push(`1. **경쟁 과열 업종:** AI가 이 업종에서 브랜드를 ${iriVal.toFixed(0)}% 확률로 추천 → 상위 브랜드 선점 매우 중요`);
  } else if (iriVal >= 40) {
    lines.push(`1. **성장 업종:** AI 추천 비율 ${iriVal.toFixed(0)}% — 선도 브랜드와 후발 브랜드 격차가 벌어지는 단계`);
  } else {
    lines.push(`1. **블루오션 업종:** AI 추천 비율 ${iriVal.toFixed(0)}% — 선점 기회(OPP ${oppVal.toFixed(0)}%) 매우 큼`);
  }
  lines.push(`2. **상위 브랜드:** ${summary.topBrand}이 BAIR ${summary.topBrandBAIR.toFixed(1)}로 업종 평균(${fmt(summary.industryAvgBAIR)}) 대비 우위`);
  lines.push(`3. **개선 우선순위:** AEPI(${fmt(summary.industryAvgAEPI)})가 BAIR(${fmt(summary.industryAvgBAIR)})보다 ${(summary.industryAvgBAIR ?? 0) > (summary.industryAvgAEPI ?? 0) ? '낮음 → 엔티티 반영도 구축 우선' : '높음 → 콘텐츠 가시성 강화 우선'}`);
  lines.push('');
  lines.push('---');
  lines.push('');

  // ────────────────────────────────────────────────────────────
  // 2. Industry AEO Landscape
  // ────────────────────────────────────────────────────────────
  lines.push('## 2. Industry AEO Landscape');
  lines.push('');
  lines.push('### AI 검색 업종 환경');
  lines.push('');
  lines.push('```');
  const iriBar = buildBar(iriVal, 50);
  const oppBar = buildBar(oppVal, 50);
  lines.push(`  IRI (업종 준비도):  ${iriBar} ${iriVal.toFixed(1)}%`);
  lines.push(`  OPP (선점 기회):   ${oppBar} ${oppVal.toFixed(1)}%`);
  lines.push('```');
  lines.push('');

  if (iriVal + oppVal < 98) {
    lines.push('> ℹ️ IRI + OPP ≠ 100: 일부 질문에서 비-브랜드 답변(정보성)이 제공된 경우 발생할 수 있습니다.');
    lines.push('');
  }
  lines.push('---');
  lines.push('');

  // ────────────────────────────────────────────────────────────
  // 3. Brand AI Power Ranking (AIPR)
  // ────────────────────────────────────────────────────────────
  lines.push('## 3. Brand AI Power Ranking (AIPR)');
  lines.push('');
  lines.push('| 순위 | 변동 | 브랜드 | BAIR | BSF | AAS | OCR | BDR | CWR | 비고 |');
  lines.push('|------|------|--------|------|-----|-----|-----|-----|-----|------|');

  for (const r of rankings) {
    const rankStr = `${r.rank}`;
    const changeStr = r.rankChangeLabel;
    const bairStr = r.bairScore.toFixed(1);
    const bsfStr = r.bsf.toFixed(1);
    const aasStr = r.aas_w.toFixed(1);
    const ocrStr = r.ocr.toFixed(1);
    const bdrStr = r.bdr !== null ? r.bdr.toFixed(1) : '─';
    const cwrStr = r.cwr !== null ? r.cwr.toFixed(1) : '─';
    const note = r.isEstimated ? '⚠ 추정' : '';

    lines.push(`| ${rankStr} | ${changeStr} | **${r.brand}** | ${bairStr} | ${bsfStr} | ${aasStr} | ${ocrStr} | ${bdrStr} | ${cwrStr} | ${note} |`);
  }

  lines.push('');
  lines.push('> **BSF** = Brand Share of Voice · **AAS** = Weighted Answer Sentiment · **OCR** = Observed Citation Rate  ');
  lines.push('> **BDR** = Brand Defense Rate · **CWR** = Competitive Win Rate · ⚠ 추정 = 표본 < 5건');
  lines.push('');
  lines.push('---');
  lines.push('');

  // ────────────────────────────────────────────────────────────
  // 4. Entity Presence Deep-Dive (AEPI)
  // ────────────────────────────────────────────────────────────
  lines.push('## 4. Entity Presence Deep-Dive (AEPI)');
  lines.push('');
  lines.push('### 7차원 업종 평균');
  lines.push('');
  lines.push('| 차원 | 업종 평균 | 1위 브랜드 |');
  lines.push('|------|----------|-----------|');

  const topBrandRadar = radar.topBrands[0];
  for (let i = 0; i < radar.dimensions.length; i++) {
    const dimLabel = radar.dimensionLabels[i];
    const avgVal = radar.industryAvg[i]?.toFixed(1) ?? '─';
    const topVal = topBrandRadar?.values[i]?.toFixed(1) ?? '─';
    const comparison = topBrandRadar
      ? Number(topVal) > Number(avgVal) ? '▲' : Number(topVal) < Number(avgVal) ? '▽' : '─'
      : '─';
    lines.push(`| **${dimLabel}** | ${avgVal} | ${topVal} ${comparison} |`);
  }

  lines.push('');
  if (topBrandRadar) {
    lines.push(`> **1위:** ${topBrandRadar.brand} (BAIR ${topBrandRadar.bairScore.toFixed(1)})`);
  }
  lines.push('');
  lines.push('---');
  lines.push('');

  // ────────────────────────────────────────────────────────────
  // 5. Strategic Position Matrix (4사분면)
  // ────────────────────────────────────────────────────────────
  lines.push('## 5. Strategic Position Matrix');
  lines.push('');
  lines.push(`> **기준선:** BDR 평균 ${positionMatrix.bdrThreshold}% / CWR 평균 ${positionMatrix.cwrThreshold}%`);
  lines.push('');

  const quadrantOrder: Array<[string, string]> = [
    ['ai_leader', '🟢 AI Leader'],
    ['competitive_warrior', '🟡 Competitive Warrior'],
    ['steady_defender', '🔵 Steady Defender'],
    ['vulnerable', '🔴 Vulnerable'],
  ];

  for (const [key, label] of quadrantOrder) {
    const entries = positionMatrix.byQuadrant[key as keyof typeof positionMatrix.byQuadrant];
    const prescription = getQuadrantPrescription(key as any);
    lines.push(`### ${label} — ${prescription.priority}`);
    lines.push('');
    if (entries.length === 0) {
      lines.push('해당 브랜드 없음');
    } else {
      lines.push(`**브랜드:** ${entries.map((e: PositionMatrixEntry) => e.brand).join(', ')}`);
      lines.push('');
      lines.push(`**전략:** ${prescription.action}`);
    }
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // ────────────────────────────────────────────────────────────
  // 6. Trend & Outlook
  // ────────────────────────────────────────────────────────────
  lines.push('## 6. Trend & Outlook');
  lines.push('');

  if (timeSeries && timeSeries.periods.length >= 2) {
    lines.push('### BAIR 시계열 추이');
    lines.push('');
    lines.push(`| 브랜드 | ${timeSeries.periods.join(' | ')} |`);
    lines.push(`|--------|${timeSeries.periods.map(() => '------').join('|')}|`);
    for (const brand of timeSeries.brands.slice(0, 5)) {
      const vals = brand.bairHistory.map((v) => (v !== null ? v.toFixed(1) : '─'));
      lines.push(`| ${brand.brand} | ${vals.join(' | ')} |`);
    }
    lines.push('');
  } else {
    lines.push('> 시계열 데이터는 2개 이상의 기간 데이터가 축적된 후 표시됩니다.');
    lines.push('');
  }

  lines.push('---');
  lines.push('');

  // ────────────────────────────────────────────────────────────
  // 7. Appendix: Methodology
  // ────────────────────────────────────────────────────────────
  lines.push('## Appendix: Methodology');
  lines.push('');
  lines.push('### 측정 방법론 요약');
  lines.push('');
  lines.push('| 항목 | 내용 |');
  lines.push('|------|------|');
  lines.push(`| **측정 엔진** | ${engines_used.join(', ')} |`);
  lines.push(`| **총 프로브** | ${snapshot.total_probes}건 |`);
  lines.push(`| **총 응답** | ${snapshot.total_responses}건 |`);
  lines.push(`| **Probe Set Hash** | \`${snapshot.probe_set_hash ?? 'N/A'}\` |`);
  lines.push(`| **Fair Probe** | 모든 브랜드에 동일 유형·동일 횟수 L7 적용, L2 round-robin |`);
  lines.push(`| **편향 방지** | A vs B / B vs A 양방향 비교 |`);
  lines.push(`| **BAIR 공식** | 0.35·BSF + 0.25·AAS + 0.20·OCR + 0.10·SWEL + 0.10·MQ |`);
  lines.push('');
  lines.push('> ⚠ **Proxy Caveat:** 본 리포트는 설계된 프로브 세트 기반의 대리(Proxy) 측정입니다.');
  lines.push('> 실제 사용자 자연어 질의 패턴, AI 모델 실시간 업데이트, 개인화 요소에 의해 실제 가시성과 차이가 발생할 수 있습니다.');
  lines.push('');
  lines.push('---');
  lines.push('');
  lines.push(`*© BSW-OS AI Visibility Intelligence — ${new Date().toISOString().slice(0, 10)}*`);

  return lines.join('\n');
}

// ═══════════════════════════════════════════════════════════════
// JSON 내보내기
// ═══════════════════════════════════════════════════════════════

/** IndustryReportData → JSON 문자열 */
export function exportToJson(report: IndustryReportData): string {
  return JSON.stringify(report, null, 2);
}

// ═══════════════════════════════════════════════════════════════
// 유틸리티
// ═══════════════════════════════════════════════════════════════

function fmt(val: number | null | undefined): string {
  if (val === null || val === undefined) return '─';
  return val.toFixed(1);
}

function buildBar(value: number, maxWidth: number = 40): string {
  const filled = Math.round((value / 100) * maxWidth);
  return '█'.repeat(filled) + '░'.repeat(maxWidth - filled);
}
