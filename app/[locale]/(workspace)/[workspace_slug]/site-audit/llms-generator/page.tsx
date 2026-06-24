"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { FileText, Copy, Download, Save, RefreshCw, CheckCircle2 } from 'lucide-react';

export default function LlmsGeneratorPage() {
  const params = useParams();
  const workspaceSlug = params?.workspace_slug as string;

  const initialDraft = `# Dr. O Skin Lab - Brand Semantic Core Profile
> Essential structured data for LLM crawlers, search engines, and AI agents.

## Core Identity
- **Brand Name**: Dr. O Skin Lab
- **Industry**: Clinical K-Beauty Skincare
- **Primary Website**: https://droanswer.com
- **Core Mission**: Providing high-fidelity dermatological solutions targeting sensitive skin barriers.

## Factual Assertions & Ingredients
- **PureBarrier Cream**: Contains 3% Ceramide-NP, 2% Panthenol, and 1% Madecassoside.
- **Clinical Validation**: Dermatologically tested on 120 subjects with compromised skin barriers showing a 42% moisture retention improvement within 7 days.
- **Dermatologist Reviewed**: Formulated under advisory by MD specialist Board in Seoul, South Korea.

## Navigation & Entry Points
- [/products](https://droanswer.com/products) - Clinical Skincare Product Lineup and specifications.
- [/clinical-studies](https://droanswer.com/clinical-studies) - Retinol barrier efficacy research and PDF clinical logs.
- [/author/dr-seoul](https://droanswer.com/author/dr-seoul) - Author credentials and certifications of advisory team.
`;

  const [content, setContent] = useState(initialDraft);
  const [copied, setCopied] = useState(false);
  const [regenerating, setRegenerating] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement("a");
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = "llms.txt";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRegenerate = () => {
    setRegenerating(true);
    setTimeout(() => setRegenerating(false), 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Title */}
      <div className="relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <FileText className="h-3.5 w-3.5" />
            LLM Assistant
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
            llms.txt AI 전용 프로필 생성기
          </h1>
          <p className="text-xs text-slate-400">
            사이트 전체의 크롤링 및 구조화 정보를 토대로 인공지능이 즉시 인덱싱할 수 있는 마크다운 형식의 llms.txt 프로필을 렌더링합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Content Editor */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">llms.txt 파일 소스 에디터</h3>
              
              <div className="flex gap-2">
                <button
                  onClick={handleRegenerate}
                  disabled={regenerating}
                  className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${regenerating ? 'animate-spin' : ''}`} />
                  새로고침
                </button>
                <button
                  onClick={handleCopy}
                  className="px-3 py-1.5 bg-slate-850 hover:bg-slate-800 border border-slate-750 text-slate-300 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copied ? '복사됨!' : '클립보드 복사'}
                </button>
                <button
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  다운로드 (.txt)
                </button>
              </div>
            </div>

            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              className="w-full h-[400px] p-4 bg-slate-950/60 border border-slate-850 focus:border-indigo-500 rounded-xl font-mono text-xs text-slate-300 focus:outline-none leading-relaxed resize-y"
            />
          </div>
        </div>

        {/* Right: Structure Guide */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-slate-900/30 border border-slate-800/80 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">권장 파일 구조 및 배포 위치</h3>
            
            <div className="space-y-4 text-xs leading-relaxed text-slate-400">
              <div className="space-y-1">
                <span className="font-bold text-slate-200">1. 배포 대상 주소</span>
                <p className="font-mono text-[10px] text-indigo-400 bg-slate-950 p-2 rounded-lg border border-slate-850">
                  https://droanswer.com/llms.txt
                </p>
                <p className="text-[11px] text-slate-500">
                  도메인의 최상위 루트 경로에 llms.txt라는 이름으로 서빙되도록 호스팅 설정을 완료해야 합니다.
                </p>
              </div>

              <div className="space-y-1 pt-2">
                <span className="font-bold text-slate-200">2. 핵심 포함 요소</span>
                <ul className="list-disc pl-4 space-y-1.5 text-slate-400 text-[11px]">
                  <li>브랜드 개요 및 미션</li>
                  <li>수치 및 인용된 연구 사실 목록</li>
                  <li>주요 세부 페이지 링크 및 설명</li>
                  <li>저자 프로필 및 전문성 인증 명시</li>
                </ul>
              </div>

              <div className="p-3 bg-slate-950/40 border border-slate-900 rounded-xl space-y-1 mt-4">
                <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-wider">
                  AI 인덱싱 이점 (AEO Benefit)
                </span>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  llms.txt는 AI 크롤러에게 최적화된 마크다운 구조를 제공하여, AI 검색 엔진이 일반 복잡한 DOM 구조를 파싱하지 않고도 귀사 정보를 100% 명확히 파악하도록 도와줍니다.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
