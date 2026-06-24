import React from 'react';
import { FileJson, CheckCircle2, XCircle, AlertTriangle, AlertCircle, Info, ChevronDown } from 'lucide-react';
import { SchemaQualityAuditResult } from '../../lib/surface/schema-quality-auditor';
import CriticalIssuesList from './CriticalIssuesList';

interface SchemaQualityPanelProps {
  schemaQuality: SchemaQualityAuditResult | null;
}

export default function SchemaQualityPanel({ schemaQuality }: SchemaQualityPanelProps) {
  if (!schemaQuality) {
    return (
      <div className="py-16 text-center text-slate-500 font-semibold border border-dashed border-slate-800 rounded-xl">
        <AlertCircle className="h-8 w-8 text-slate-600 mb-2 mx-auto animate-pulse" />
        구조화 시맨틱 감사 데이터가 존재하지 않습니다.
      </div>
    );
  }

  const getCompletenessColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 70) return 'text-indigo-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-rose-400';
  };

  const getCompletenessBg = (score: number) => {
    if (score >= 90) return 'bg-emerald-500/10 border-emerald-500/20';
    if (score >= 70) return 'bg-indigo-500/10 border-indigo-500/20';
    if (score >= 50) return 'bg-amber-500/10 border-amber-500/20';
    return 'bg-rose-500/10 border-rose-500/20';
  };

  // Compile list of schemas found for the listing
  const schemasList = [
    { name: 'Organization', data: schemaQuality.organizationSchema },
    { name: 'LocalBusiness', data: schemaQuality.localBusinessSchema },
    { name: 'FAQPage', data: schemaQuality.faqPageSchemas?.[0] || null, count: schemaQuality.faqPageSchemas?.length || 0 },
    { name: 'HowTo', data: schemaQuality.howToSchemas?.[0] || null, count: schemaQuality.howToSchemas?.length || 0 },
    { name: 'Product', data: schemaQuality.productSchemas?.[0] || null, count: schemaQuality.productSchemas?.length || 0 },
    { name: 'Article', data: schemaQuality.articleSchemas?.[0] || null, count: schemaQuality.articleSchemas?.length || 0 },
    { name: 'BreadcrumbList', data: schemaQuality.breadcrumbSchemas?.[0] || null, count: schemaQuality.breadcrumbSchemas?.length || 0 },
    { name: 'AggregateRating', data: schemaQuality.aggregateRatingSchemas?.[0] || null, count: schemaQuality.aggregateRatingSchemas?.length || 0 },
  ];

  return (
    <div className="space-y-8">
      {/* Top Header Card */}
      <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-md flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 flex-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <FileJson className="h-3.5 w-3.5" />
            Layer 2: Structured Semantics
          </div>
          <h2 className="text-xl font-black text-slate-200">구조화 시맨틱 (Schema & OG Metadata) 감사</h2>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            Schema.org 구조화 데이터 및 OpenGraph 태그가 올바르게 기입되어 있는지 점검합니다. 구조화된 지식은 AI의 명사 연동 완성도를 높입니다.
          </p>
        </div>
        <div className="relative shrink-0 flex items-center justify-center">
          <div className="w-28 h-28 rounded-full border-4 border-slate-800 flex flex-col items-center justify-center bg-slate-950 shadow-inner">
            <span className="text-2xl font-black bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
              {schemaQuality.schemaQualityScore}점
            </span>
            <span className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Schema Score</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Schema details & OpenGraph */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Schema Types List */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">주요 Schema.org 구성 점검</h3>
              <span className="text-[10px] text-slate-500 font-bold">구조화 커버리지: {schemaQuality.schemaCoverage}%</span>
            </div>

            <div className="space-y-3.5">
              {schemasList.map((schema, idx) => {
                const found = !!schema.data;
                const completeness = schema.data ? schema.data.completeness : 0;
                
                return (
                  <div
                    key={idx}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-950/40 border border-slate-850 rounded-xl hover:border-slate-800 transition-colors"
                  >
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-slate-300">
                        {schema.name}
                        {schema.count && schema.count > 1 ? ` (${schema.count}개)` : ''}
                      </span>
                      <span className="block text-[10px] text-slate-500">
                        {found ? '데이터 매핑 완료' : '미발견'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {found ? (
                        <>
                          <div className="text-right">
                            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded border ${getCompletenessBg(completeness)} ${getCompletenessColor(completeness)}`}>
                              완성도: {completeness}%
                            </span>
                          </div>
                          <div className="w-24 bg-slate-800/50 h-1.5 rounded-full overflow-hidden hidden sm:block">
                            <div
                              className="h-1.5 bg-indigo-500 rounded-full"
                              style={{ width: `${completeness}%` }}
                            />
                          </div>
                        </>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-600 bg-slate-900 border border-slate-800/40 px-2 py-0.5 rounded">
                          누락됨
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Organization & OpenGraph */}
        <div className="lg:col-span-1 space-y-6">
          {/* Org sameAs platform checks */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">조직 신뢰 데이터 (Organization)</h3>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">로고 이미지 등록</span>
                {schemaQuality.orgLogoPresent ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-slate-700" />
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">고객센터/연락처 등록</span>
                {schemaQuality.orgContactPresent ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                ) : (
                  <XCircle className="h-4 w-4 text-slate-700" />
                )}
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500">소셜 프로필 연동 (sameAs)</span>
                <span className="font-bold text-slate-300">{schemaQuality.orgSameAsProfiles.length}개 연동</span>
              </div>
            </div>

            {schemaQuality.orgSameAsProfiles.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-2">
                {schemaQuality.orgSameAsProfiles.map((p, pidx) => (
                  <span
                    key={pidx}
                    className="text-[9px] font-bold text-slate-400 bg-slate-800 px-2 py-0.5 rounded border border-slate-750"
                  >
                    {p.platform}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* OpenGraph Completeness */}
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">OpenGraph 메타 태그 완성도</h3>
              <span className="text-sm font-black text-indigo-400">
                {schemaQuality.ogCompleteness?.completenessScore}%
              </span>
            </div>

            <div className="space-y-3">
              {[
                { label: 'og:title (제목)', val: schemaQuality.ogCompleteness?.hasOgTitle },
                { label: 'og:description (요약)', val: schemaQuality.ogCompleteness?.hasOgDescription },
                { label: 'og:image (대표 이미지)', val: schemaQuality.ogCompleteness?.hasOgImage },
                { label: 'og:type (분류)', val: schemaQuality.ogCompleteness?.hasOgType },
                { label: 'og:url (정규 주소)', val: schemaQuality.ogCompleteness?.hasOgUrl },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between text-xs">
                  <span className="text-slate-500">{item.label}</span>
                  {item.val ? (
                    <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  ) : (
                    <XCircle className="h-4 w-4 text-rose-500/50" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Meta Tag Audit Table */}
      <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">메타 태그 품질 분석</h3>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 font-bold">
                <th className="py-2.5 px-4">페이지 URL</th>
                <th className="py-2.5 px-4">Title 태그 및 길이</th>
                <th className="py-2.5 px-4">Meta Description</th>
                <th className="py-2.5 px-4">정규화 상태</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/50 text-slate-400">
              {schemaQuality.metaTagAudit?.titleOptimization.map((item, idx) => {
                const desc = schemaQuality.metaTagAudit.descriptionQuality[idx] || { desc: '없음', score: 0 };
                const can = schemaQuality.metaTagAudit.canonicalStatus[idx] || { canonical: null, isSelfReferencing: false };
                
                return (
                  <tr key={idx} className="hover:bg-slate-800/10">
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-500 truncate max-w-[180px]">
                      {item.url}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-300">
                      {item.title}
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                        길이: {item.length}자 | 점수: {item.score}점
                      </span>
                    </td>
                    <td className="py-3 px-4 max-w-[240px] truncate">
                      {desc.desc || <span className="text-rose-500/60 font-bold">미입력</span>}
                      <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                        점수: {desc.score}점
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      {can.canonical ? (
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${can.isSelfReferencing ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                          {can.isSelfReferencing ? '자가 지정 정규화' : '지정됨'}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                          정규화 누락
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Issues list */}
      <CriticalIssuesList
        issues={schemaQuality.issues.map(i => ({ ...i, category: i.schemaType }))}
      />
    </div>
  );
}
