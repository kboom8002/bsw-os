import React from 'react';
import {
  Globe, Shield, Cpu, RefreshCw, AlertCircle, FileText, CheckCircle2, XCircle
} from 'lucide-react';
import { TechInfraAuditResult } from '../../lib/surface/tech-infra-auditor';
import RobotsBotMatrix from './RobotsBotMatrix';
import CriticalIssuesList from './CriticalIssuesList';

interface TechInfraPanelProps {
  techInfra: TechInfraAuditResult | null;
}

export default function TechInfraPanel({ techInfra }: TechInfraPanelProps) {
  if (!techInfra) {
    return (
      <div className="py-16 text-center text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
        <AlertCircle className="h-8 w-8 text-slate-600 mb-2 mx-auto animate-pulse" />
        기술 인프라 감사 데이터가 존재하지 않습니다.
      </div>
    );
  }

  const getTtfbColor = (grade: string) => {
    if (grade === 'fast') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (grade === 'moderate') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Cpu className="h-3.5 w-3.5" />
            Layer 1: Technical Infrastructure
          </div>
          <h2 className="text-xl font-black text-slate-200">기술 인프라 (AI Crawler Accessibility) 감사</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            AI 검색엔진 크롤러가 웹사이트에 접근하여 정보를 안정적으로 수집할 수 있는지 robots.txt, SSL, 응답속도, 사이트맵을 진단합니다.
          </p>
        </div>
        <div className="relative shrink-0 flex items-center justify-center">
          {/* Circular progress or big status */}
          <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950 shadow-inner">
            <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {techInfra.techInfraScore}점
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Tech Score</span>
          </div>
        </div>
      </div>

      {/* 3-Col Security, Performance, Rendering cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* SSL HTTPS */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">보안 프로토콜 (HTTPS)</span>
            <Shield className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            {techInfra.httpsEnabled ? (
              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
            ) : (
              <XCircle className="h-5 w-5 text-rose-400" />
            )}
            <span className="text-lg font-black text-slate-200">
              {techInfra.httpsEnabled ? 'HTTPS 적용됨' : 'HTTP (보안 미적용)'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {techInfra.sslCertExpiryDays > 0
              ? `SSL 인증서 만료일이 ${techInfra.sslCertExpiryDays}일 남았습니다.`
              : 'SSL 인증서가 무효하거나 만료되었습니다.'}
          </p>
        </div>

        {/* TTFB Speed */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">서버 반응 속도 (TTFB)</span>
            <Globe className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-200">
              {techInfra.ttfbMs > 0 ? `${Math.round(techInfra.ttfbMs)}ms` : '측정 실패'}
            </span>
            {techInfra.ttfbMs > 0 && (
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${getTtfbColor(techInfra.ttfbGrade)}`}>
                {techInfra.ttfbGrade.toUpperCase()}
              </span>
            )}
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            첫 바이트 수신 속도(TTFB)가 빠를수록 AI 봇이 페이지 제한 시간 내에 확실하게 파싱을 마칠 수 있습니다.
          </p>
        </div>

        {/* Rendering Mode */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-5 shadow-xl backdrop-blur-md space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400">서버 렌더링 방식 (Rendering)</span>
            <RefreshCw className="h-4.5 w-4.5 text-indigo-400" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-lg font-black text-slate-200">
              {techInfra.renderingMode === 'ssr' ? 'SSR (서버 렌더링)' : techInfra.renderingMode === 'csr' ? 'CSR (클라이언트 렌더링)' : 'Hybrid'}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            {techInfra.spaDetected
              ? 'SPA 감지됨: 헤드리스 크롤러(Jina Reader)를 통해 가상 렌더링하여 데이터 획득을 완료했습니다.'
              : '정적 소스 파싱(SSR)을 통해 빠른 크롤링 및 인덱싱이 가능합니다.'}
          </p>
        </div>
      </div>

      {/* Robots matrix */}
      <RobotsBotMatrix policies={techInfra.robotsBotMatrix} />

      {/* Sitemap & llms.txt section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Sitemap */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sitemap.xml 상태 점검</h4>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
              <span className="text-[10px] text-slate-500 block">사이트맵 URL 감지 수</span>
              <span className="text-lg font-black text-slate-300">{techInfra.sitemapUrlCount}개</span>
            </div>
            <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-800/40">
              <span className="text-[10px] text-slate-500 block">콘텐츠 90일 내 갱신율</span>
              <span className="text-lg font-black text-slate-300">{techInfra.sitemapFreshnessScore}%</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            주기적으로 업데이트되는 sitemap.xml을 robots.txt에 명시하면 AI 크롤러가 신속하게 변경사항을 반영할 수 있습니다.
          </p>
        </div>

        {/* llms.txt */}
        <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">/llms.txt 파일 유무</h4>
            {techInfra.llmsTxtExists ? (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Found
              </span>
            ) : (
              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
                Not Found
              </span>
            )}
          </div>

          {techInfra.llmsTxtExists && techInfra.llmsTxtContent ? (
            <div className="bg-slate-950/60 p-3 rounded-xl border border-slate-800/60 font-mono text-[10px] text-slate-400 max-h-[100px] overflow-y-auto leading-relaxed">
              {techInfra.llmsTxtContent}
            </div>
          ) : (
            <div className="bg-slate-950/20 border border-dashed border-slate-800 p-4 rounded-xl text-center text-[11px] text-slate-500">
              /llms.txt 파일이 등록되지 않았습니다. 이 파일은 AI가 사이트 정보를 요약하는 데 큰 도움을 줍니다.
            </div>
          )}
          <p className="text-[11px] text-slate-500 leading-relaxed">
            llms.txt는 LLM 검색 엔진이 귀사 브랜드의 핵심을 파악할 수 있도록 마크다운으로 구성하는 전용 파일 표준입니다.
          </p>
        </div>
      </div>

      {/* Canonical status check */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
        <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">주소 정규화 (Canonical Tags)</h4>
        
        <div className="flex items-center gap-6">
          <div className="shrink-0 flex items-center justify-center bg-slate-950 border border-slate-800 rounded-xl p-4">
            <div className="text-center">
              <span className="text-2xl font-black text-slate-200">{techInfra.canonicalConsistency}%</span>
              <span className="text-[9px] text-slate-500 block uppercase mt-0.5">일관성 비율</span>
            </div>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            모든 페이지가 올바른 canonical 태그를 보유하고 있어야 중복 검색 결과 노출을 차단하고, AI 검색엔진의 크롤링 버짓(Crawl Budget)을 핵심 페이지만으로 정확하게 유도할 수 있습니다.
          </p>
        </div>
      </div>

      {/* Tech Infra Issues List */}
      <CriticalIssuesList
        issues={techInfra.issues.map(i => ({ ...i, layer: 'L1: 기술 인프라' }))}
      />
    </div>
  );
}
