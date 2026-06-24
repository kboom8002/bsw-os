import React, { useState } from 'react';
import {
  FileText, Clock, HelpCircle, CheckCircle2, XCircle, ArrowUpRight, Link2, Image, ExternalLink
} from 'lucide-react';
import { ContentSemanticResult } from '../../lib/surface/content-semantic-analyzer';
import EEATQuadChart from './EEATQuadChart';
import CriticalIssuesList from './CriticalIssuesList';

interface ContentSemanticPanelProps {
  contentSemantic: ContentSemanticResult | null;
}

export default function ContentSemanticPanel({ contentSemantic }: ContentSemanticPanelProps) {
  const [activeSubTab, setActiveSubTab] = useState<'text' | 'freshness' | 'topology' | 'multimedia' | 'outbound'>('text');

  if (!contentSemantic) {
    return (
      <div className="py-16 text-center text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
        <HelpCircle className="h-8 w-8 text-slate-600 mb-2 mx-auto animate-pulse" />
        콘텐츠 시맨틱 분석 데이터가 존재하지 않습니다.
      </div>
    );
  }

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-indigo-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <FileText className="h-3.5 w-3.5" />
            Layer 3: Content Semantics
          </div>
          <h2 className="text-xl font-black text-slate-200">콘텐츠 시맨틱 (E-E-A-T & Answer-First) 감사</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            AI 검색엔진이 소비자의 핵심 질문에 답을 추출해 갈 수 있도록 서술 방식(Answer-First), 신선도, 토픽 클러스터, 그리고 멀티모달 자산을 감사하고 점수를 매깁니다.
          </p>
        </div>
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950 shadow-inner">
            <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {contentSemantic.contentSemanticScore}점
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Semantic Score</span>
          </div>
        </div>
      </div>

      {/* Grid: E-E-A-T & SubTabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn">
        {/* Left: E-E-A-T Quad Score */}
        <div className="lg:col-span-1">
          <EEATQuadChart score={contentSemantic.eeat} />
        </div>

        {/* Right: SubTabs Navigation & Panels */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
            {/* SubTabs */}
            <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3 mb-5">
              {[
                { id: 'text', label: 'Answer-First 문체' },
                { id: 'freshness', label: '콘텐츠 신선도' },
                { id: 'topology', label: '내부 링크 토폴로지' },
                { id: 'multimedia', label: '멀티모달 자산' },
                { id: 'outbound', label: '인용/출처망' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSubTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    activeSubTab === tab.id
                      ? 'bg-slate-800 text-indigo-400 border border-indigo-500/30'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* SubTab Contents */}
            <div className="space-y-4 min-h-[300px]">
              {/* 1. Answer First */}
              {activeSubTab === 'text' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">페이지별 두괄식 서술 (Answer-First) 검증</h4>
                    <span className="text-[10px] text-slate-500">평균: {contentSemantic.answerFirstScores.length > 0 ? Math.round(contentSemantic.answerFirstScores.reduce((sum, item) => sum + item.directAnswerScore, 0) / contentSemantic.answerFirstScores.length) : 0}점</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-800 text-slate-500 font-bold">
                          <th className="py-2 px-2">페이지 URL</th>
                          <th className="py-2 px-2">첫 문장 단어 수</th>
                          <th className="py-2 px-2">첫 100자 답변 포함</th>
                          <th className="py-2 px-2">제목 질문형 포함</th>
                          <th className="py-2 px-2 text-right">점수</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-800/40 text-slate-400">
                        {contentSemantic.answerFirstScores.map((item, idx) => (
                          <tr key={idx} className="hover:bg-slate-800/10">
                            <td className="py-2.5 px-2 font-mono text-[10px] text-slate-500 max-w-[140px] truncate">
                              {item.pageUrl}
                            </td>
                            <td className="py-2.5 px-2 font-semibold">
                              {item.firstSentenceLength}단어
                              <span className="block text-[9px] text-slate-600 font-normal">
                                {item.firstSentenceLength <= 15 ? '✅ 15단어 이하 권장 준수' : '❌ 15단어 이하 초과'}
                              </span>
                            </td>
                            <td className="py-2.5 px-2">
                              {item.first100WordsContainAnswer ? (
                                <span className="text-emerald-400">네 (~은/는 이다)</span>
                              ) : (
                                <span className="text-rose-500/50">아니오</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2">
                              {item.questionInHeading ? (
                                <span className="text-emerald-400">네 (? 포함)</span>
                              ) : (
                                <span className="text-slate-600">아니오</span>
                              )}
                            </td>
                            <td className={`py-2.5 px-2 text-right font-bold ${getScoreColor(item.directAnswerScore)}`}>
                              {item.directAnswerScore}점
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 2. Freshness */}
              {activeSubTab === 'freshness' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">콘텐츠 신선도 (Freshness) 진단</h4>
                    <span className="text-lg font-black text-indigo-400">
                      {contentSemantic.freshnessAnalysis.freshnessScore}점
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 block">평균 콘텐츠 나이</span>
                      <span className="text-lg font-black text-slate-300">
                        {contentSemantic.freshnessAnalysis.averageAgeDays}일
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 block">90일 내 갱신된 비율</span>
                      <span className="text-lg font-black text-slate-300">
                        {contentSemantic.freshnessAnalysis.freshContentRatio}%
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 pt-2">
                    {contentSemantic.freshnessAnalysis.newestPage && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">최근 업데이트 페이지:</span>
                        <span className="font-mono text-emerald-400 text-[10px]">
                          {contentSemantic.freshnessAnalysis.newestPage.url.substring(0, 40)}... ({contentSemantic.freshnessAnalysis.newestPage.ageDays}일 전)
                        </span>
                      </div>
                    )}
                    {contentSemantic.freshnessAnalysis.stalestPage && (
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-500">가장 업데이트 안된 페이지:</span>
                        <span className="font-mono text-rose-400 text-[10px]">
                          {contentSemantic.freshnessAnalysis.stalestPage.url.substring(0, 40)}... ({contentSemantic.freshnessAnalysis.stalestPage.ageDays}일 전)
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Topology */}
              {activeSubTab === 'topology' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">내부 링크 구조 (Internal Link Topology)</h4>
                    <span className="text-lg font-black text-indigo-400">
                      {contentSemantic.internalLinkTopology.topologyScore}점
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 block">발견된 내부 링크 수</span>
                      <span className="text-lg font-black text-slate-300">
                        {contentSemantic.internalLinkTopology.totalInternalLinks}개
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 block">페이지당 평균 링크</span>
                      <span className="text-lg font-black text-slate-300">
                        {contentSemantic.internalLinkTopology.averageLinksPerPage}개
                      </span>
                    </div>
                  </div>

                  {/* Orphan / Hub pages list */}
                  <div className="space-y-3 pt-2">
                    <div className="text-xs space-y-1">
                      <span className="font-bold text-slate-400">주요 허브 페이지 (Inbound Links 상위):</span>
                      <div className="flex flex-col gap-1 pl-2">
                        {contentSemantic.internalLinkTopology.hubPages.slice(0, 2).map((hub, hidx) => (
                          <div key={hidx} className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                            <span>{hub.url.substring(0, 40)}...</span>
                            <span className="font-bold text-indigo-400">{hub.inboundCount}회 인바운드</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {contentSemantic.internalLinkTopology.orphanPages.length > 0 && (
                      <div className="text-xs space-y-1">
                        <span className="font-bold text-rose-400">고아 페이지 (Inbound 0회):</span>
                        <div className="flex flex-col gap-1 pl-2 font-mono text-[9px] text-rose-500/70">
                          {contentSemantic.internalLinkTopology.orphanPages.slice(0, 3).map((url, oidx) => (
                            <span key={oidx}>{url}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 4. Multimedia */}
              {activeSubTab === 'multimedia' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">멀티모달 이미지 & 비디오 감사</h4>
                    <span className="text-lg font-black text-indigo-400">
                      {contentSemantic.multimediaAudit.multimediaScore}점
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] text-slate-500 block">이미지 Alt 작성률</span>
                        <span className="text-[9px] font-bold text-indigo-400">Alt질: {contentSemantic.multimediaAudit.altTextQualityScore}%</span>
                      </div>
                      <span className="text-lg font-black text-slate-300">
                        {contentSemantic.multimediaAudit.imagesWithAlt} / {contentSemantic.multimediaAudit.totalImages}
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-4 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 block">임베디드 비디오 수</span>
                      <span className="text-lg font-black text-slate-300">
                        {contentSemantic.multimediaAudit.videoCount}개 ({contentSemantic.multimediaAudit.hasEmbeddedVideo ? '감지됨' : '미감지'})
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Outbound Network */}
              {activeSubTab === 'outbound' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold text-slate-300">외부 출처망 및 백링크 인용 네트워크</h4>
                    <span className="text-lg font-black text-indigo-400">
                      {contentSemantic.citationNetwork.citationQualityScore}점
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 block">총 외부 링크 수</span>
                      <span className="text-base font-black text-slate-300">
                        {contentSemantic.citationNetwork.totalOutboundLinks}개
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 block">권위 도메인 비율</span>
                      <span className="text-base font-black text-slate-300">
                        {contentSemantic.citationNetwork.authorityDomainRatio}%
                      </span>
                    </div>
                    <div className="bg-slate-950/40 p-3.5 rounded-xl border border-slate-850">
                      <span className="text-[10px] text-slate-500 block">Nofollow 비율</span>
                      <span className="text-base font-black text-slate-300">
                        {contentSemantic.citationNetwork.nofollowRatio}%
                      </span>
                    </div>
                  </div>

                  {contentSemantic.citationNetwork.topCitedDomains.length > 0 && (
                    <div className="space-y-1.5 text-xs pt-1">
                      <span className="font-bold text-slate-400">가장 자주 인용된 외부 도메인:</span>
                      <div className="flex flex-col gap-1 pl-2">
                        {contentSemantic.citationNetwork.topCitedDomains.slice(0, 3).map((dom, domidx) => (
                          <div key={domidx} className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                            <span className="flex items-center gap-1">
                              {dom.domain}
                              {dom.isAuthority && (
                                <span className="px-1 py-0.2 rounded text-[7px] font-bold bg-indigo-500/10 text-indigo-400 uppercase">
                                  Gov/Edu
                                </span>
                              )}
                            </span>
                            <span>{dom.count}회 링크</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Content Semantic Issues List */}
      <CriticalIssuesList
        issues={contentSemantic.issues.map(i => ({ ...i, layer: 'L3: 콘텐츠 시맨틱' }))}
      />
    </div>
  );
}
