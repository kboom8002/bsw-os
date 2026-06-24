import React from 'react';
import { ShieldCheck, ShieldAlert, Bot } from 'lucide-react';
import { RobotsBotPolicy } from '../../lib/surface/website-crawler';

interface RobotsBotMatrixProps {
  policies: RobotsBotPolicy[];
}

export default function RobotsBotMatrix({ policies }: RobotsBotMatrixProps) {
  const botsMetadata: Record<string, { desc: string; engine: string }> = {
    'OAI-SearchBot': { desc: 'ChatGPT Search 실시간 검색 크롤러', engine: 'ChatGPT Search' },
    'GPTBot': { desc: 'OpenAI 언어모델 학습용 크롤러', engine: 'OpenAI Models' },
    'Google-Extended': { desc: 'Google Gemini 실시간 검색 및 학습 방지용', engine: 'Gemini Grounding' },
    'PerplexityBot': { desc: 'Perplexity AI 실시간 실측 답변용 크롤러', engine: 'Perplexity' },
    'Anthropic-AI': { desc: 'Claude 실시간 및 학습 데이터 수집용', engine: 'Claude' },
    'Bingbot': { desc: 'Microsoft Bing 및 Copilot 실시간 크롤러', engine: 'Copilot / Bing' },
    '*': { desc: '기본 웹 크롤러 정책 (지정되지 않은 모든 봇)', engine: 'All Search Engines' }
  };

  const getStatusBadge = (allowed: boolean) => {
    if (allowed) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <ShieldCheck className="h-3 w-3" />
          접근 허용 (Allow)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
        <ShieldAlert className="h-3 w-3" />
        접근 차단 (Block)
      </span>
    );
  };

  return (
    <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="p-2 bg-indigo-500/10 border border-indigo-500/25 rounded-lg text-indigo-400">
          <Bot className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-200">AI 검색엔진 크롤러 접근 허용 매트릭스</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            robots.txt에 선언된 User-Agent 규칙을 분석하여 AI 봇의 접근성을 나타냅니다.
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-slate-800 text-slate-500 font-bold">
              <th className="py-3 px-4">크롤러 봇 (User-Agent)</th>
              <th className="py-3 px-4">대상 AI 서비스</th>
              <th className="py-3 px-4">허용 상태</th>
              <th className="py-3 px-4">제한 경로 (Disallowed)</th>
              <th className="py-3 px-4">동작 지연 (Crawl-Delay)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60">
            {policies.map((p, idx) => {
              const meta = botsMetadata[p.botName] || { desc: '기타 AI 수집기', engine: 'AI Agent' };
              return (
                <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-300">
                    {p.botName}
                    <span className="block text-[10px] text-slate-500 font-normal mt-0.5">
                      {meta.desc}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-slate-400 font-semibold">{meta.engine}</td>
                  <td className="py-3.5 px-4">{getStatusBadge(p.allowed)}</td>
                  <td className="py-3.5 px-4 text-slate-500 font-mono">
                    {p.disallowPaths && p.disallowPaths.length > 0
                      ? p.disallowPaths.join(', ')
                      : '없음'}
                  </td>
                  <td className="py-3.5 px-4 text-slate-500">
                    {p.crawlDelay ? `${p.crawlDelay}초` : '기본값'}
                  </td>
                </tr>
              );
            })}
            {policies.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold">
                  robots.txt 정책 분석이 비어 있거나 사이트 차단 규칙을 찾지 못했습니다.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
