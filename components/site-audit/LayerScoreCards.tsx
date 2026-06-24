import React from 'react';
import { Layers, FileJson, FileText, CheckCircle } from 'lucide-react';

interface LayerScoreCardsProps {
  techScore: number;
  schemaScore: number;
  contentScore: number;
  reflectionScore: number;
}

export default function LayerScoreCards({
  techScore,
  schemaScore,
  contentScore,
  reflectionScore
}: LayerScoreCardsProps) {
  const getGrade = (score: number) => {
    if (score >= 90) return { label: 'Optimal', color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30' };
    if (score >= 70) return { label: 'Good', color: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/30' };
    if (score >= 50) return { label: 'Moderate', color: 'text-amber-400 bg-amber-500/10 border-amber-500/30' };
    return { label: 'Poor', color: 'text-rose-400 bg-rose-500/10 border-rose-500/30' };
  };

  const layers = [
    {
      title: 'L1: 기술 인프라',
      subtitle: 'AI Crawler Accessibility',
      score: techScore,
      icon: Layers,
      color: 'from-violet-500 to-indigo-600',
      description: 'robots.txt 정책, SSL/HTTPS 보안, TTFB 속도, 사이트맵 갱신성'
    },
    {
      title: 'L2: 구조화 시맨틱',
      subtitle: 'Schema & OG Completeness',
      score: schemaScore,
      icon: FileJson,
      color: 'from-fuchsia-500 to-pink-600',
      description: 'Organization, Product, FAQ, Article 스키마 구조 및 OG 완성도'
    },
    {
      title: 'L3: 콘텐츠 시맨틱',
      subtitle: 'E-E-A-T & Answer-First',
      score: contentScore,
      icon: FileText,
      color: 'from-cyan-500 to-blue-600',
      description: 'E-E-A-T 4축 신호, 첫 문장 두괄식, 토픽 클러스터 내부링크 깊이'
    },
    {
      title: 'L4: AI 반영 검증',
      subtitle: 'Engine Reflection Rate',
      score: reflectionScore,
      icon: CheckCircle,
      color: 'from-emerald-500 to-teal-600',
      description: 'ChatGPT·Gemini 실측 가시성 지수(AEPI) 및 경쟁사 대체 노출률'
    }
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {layers.map((layer, idx) => {
        const grade = getGrade(layer.score);
        const Icon = layer.icon;
        
        return (
          <div
            key={idx}
            className="group relative bg-slate-900/40 hover:bg-slate-900/60 border border-slate-800/80 hover:border-slate-700/80 rounded-2xl p-5 transition-all duration-300 shadow-xl backdrop-blur-xl flex flex-col justify-between overflow-hidden"
          >
            {/* Background highlight glow on hover */}
            <div className="absolute -right-16 -top-16 w-32 h-32 rounded-full bg-indigo-500/5 group-hover:bg-indigo-500/10 blur-2xl transition-all duration-500" />
            
            <div>
              <div className="flex items-start justify-between mb-4">
                <div className={`p-2.5 bg-gradient-to-tr ${layer.color} rounded-xl shadow-lg`}>
                  <Icon className="h-5 w-5 text-white" />
                </div>
                <div className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${grade.color}`}>
                  {grade.label}
                </div>
              </div>
              
              <div className="space-y-0.5">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">
                  {layer.subtitle}
                </span>
                <h3 className="text-sm font-bold text-slate-200 group-hover:text-slate-100 transition-colors">
                  {layer.title}
                </h3>
              </div>
              
              <p className="text-[11px] text-slate-400 leading-relaxed mt-2.5">
                {layer.description}
              </p>
            </div>
            
            <div className="mt-5 space-y-2">
              <div className="flex items-baseline justify-between">
                <span className="text-slate-500 text-[10px] font-semibold">진단 점수</span>
                <span className="text-2xl font-black text-slate-100 group-hover:scale-105 transition-transform duration-300">
                  {layer.score}%
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className={`h-1.5 rounded-full bg-gradient-to-r ${layer.color}`}
                  style={{ width: `${layer.score}%` }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
