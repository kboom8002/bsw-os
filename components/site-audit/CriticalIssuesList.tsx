import React from 'react';
import { AlertCircle, AlertTriangle, Info, ArrowUpRight, HelpCircle } from 'lucide-react';

interface Issue {
  severity: 'critical' | 'warning' | 'info';
  category?: string;
  title?: string;
  description?: string;
  recommendation: string;
  affectedUrls?: string[];
  schemaType?: string;
  property?: string;
  sourceUrl?: string;
  message?: string;
}

interface CriticalIssuesListProps {
  issues: Issue[];
}

export default function CriticalIssuesList({ issues }: CriticalIssuesListProps) {
  const getIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-rose-400" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-amber-400" />;
      default:
        return <Info className="h-5 w-5 text-indigo-400" />;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-rose-500/10 text-rose-400 border border-rose-500/20 shadow-sm">
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 shadow-sm">
            Warning
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shadow-sm">
            Info
          </span>
        );
    }
  };

  const sortedIssues = [...issues].sort((a, b) => {
    const severityRank = { critical: 3, warning: 2, info: 1 };
    return severityRank[b.severity] - severityRank[a.severity];
  });

  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-sm font-bold text-slate-200">감지된 핵심 취약점 및 개선 권장사항</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            L1~L3 진단 레이어에서 자동 감지된 취약성을 중요도순으로 표시합니다.
          </p>
        </div>
        <span className="px-2.5 py-1 bg-slate-800 border border-slate-700 rounded-lg text-xs font-bold text-slate-400">
          총 {issues.length}건
        </span>
      </div>

      <div className="space-y-4 max-h-[480px] overflow-y-auto pr-1">
        {sortedIssues.map((issue, idx) => (
          <div
            key={idx}
            className="flex items-start gap-4 p-4.5 bg-slate-900/50 hover:bg-slate-900/80 border border-slate-800/60 rounded-xl transition-all duration-200"
          >
            <div className="shrink-0 mt-0.5">{getIcon(issue.severity)}</div>
            
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-slate-200">{issue.title || issue.message}</h4>
                {getSeverityBadge(issue.severity)}
                {issue.category && (
                  <span className="text-[9px] font-bold text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded uppercase">
                    {issue.category}
                  </span>
                )}
                {issue.schemaType && (
                  <span className="text-[9px] font-bold text-indigo-400 bg-indigo-950/20 border border-indigo-900/40 px-1.5 py-0.5 rounded uppercase">
                    {issue.schemaType}
                  </span>
                )}
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                {issue.description || issue.message}
              </p>

              <div className="p-3 bg-slate-950/40 border-l-2 border-indigo-500/50 rounded-r-lg space-y-1">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                  개선 권장사항 (Recommendation)
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed font-semibold">
                  {issue.recommendation}
                </p>
              </div>

              {(issue.affectedUrls && issue.affectedUrls.length > 0) && (
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                    영향을 받는 페이지 ({issue.affectedUrls.length})
                  </span>
                  <div className="flex flex-col gap-1 max-h-[80px] overflow-y-auto pr-1">
                    {issue.affectedUrls.map((url, uidx) => (
                      <a
                        key={uidx}
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[10px] text-slate-500 hover:text-indigo-400 truncate max-w-lg transition-colors font-mono"
                      >
                        {url}
                        <ArrowUpRight className="h-2.5 w-2.5 shrink-0" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {issue.sourceUrl && (
                <div className="flex items-center gap-1.5 text-[10px] text-slate-500">
                  <span className="font-semibold">발견 소스:</span>
                  <a href={issue.sourceUrl} target="_blank" rel="noreferrer" className="text-slate-400 hover:text-indigo-400 font-mono truncate max-w-sm">
                    {issue.sourceUrl}
                  </a>
                </div>
              )}
            </div>
          </div>
        ))}

        {issues.length === 0 && (
          <div className="py-12 text-center text-slate-500 font-semibold flex flex-col items-center justify-center gap-2 border border-dashed border-slate-800 rounded-xl">
            <HelpCircle className="h-8 w-8 text-slate-600 animate-pulse" />
            <span className="text-xs">현재 발견된 핵심 취약점이 없습니다. 사이트가 매우 양호합니다!</span>
          </div>
        )}
      </div>
    </div>
  );
}
