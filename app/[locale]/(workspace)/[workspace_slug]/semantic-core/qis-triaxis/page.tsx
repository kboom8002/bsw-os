"use client";

import React, { useState } from "react";
import { RefreshCw, Activity, MapPin, Sparkles, GitBranch, Clock, CheckCircle2, AlertCircle } from "lucide-react";

interface PredictionRow {
  id: string;
  target_axis: 'industry' | 'place' | 'vortex' | 'cross';
  question_text: string;
  confidence: number;
  created_at: string;
  feedback_received: boolean;
}

interface AxisStat {
  label: string;
  labelKo: string;
  icon: React.ComponentType<{ className?: string }>;
  pushed: number;
  feedbacks: number;
  color: string;
}

export default function QISTriaxisPage() {
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [accuracy] = useState(72);
  const [predictions] = useState<PredictionRow[]>([
    { id: '1', target_axis: 'industry', question_text: '스킨케어 브랜드에서 가장 많이 사용하는 성분은?', confidence: 0.89, created_at: new Date().toISOString(), feedback_received: true },
    { id: '2', target_axis: 'place', question_text: '강남역 근처 피부과 추천', confidence: 0.76, created_at: new Date().toISOString(), feedback_received: false },
    { id: '3', target_axis: 'vortex', question_text: '여름철 자외선 차단제 트렌드', confidence: 0.92, created_at: new Date().toISOString(), feedback_received: true },
    { id: '4', target_axis: 'cross', question_text: '서울 강남 피부과에서 추천하는 여름 스킨케어 루틴', confidence: 0.68, created_at: new Date().toISOString(), feedback_received: false },
    { id: '5', target_axis: 'industry', question_text: '클리닉 마케팅에 효과적인 콘텐츠 유형', confidence: 0.81, created_at: new Date().toISOString(), feedback_received: true },
  ]);

  const axisStats: AxisStat[] = [
    { label: 'Industry', labelKo: '업종', icon: Activity, pushed: 142, feedbacks: 38, color: 'from-violet-500 to-indigo-500' },
    { label: 'Place', labelKo: '지역', icon: MapPin, pushed: 89, feedbacks: 21, color: 'from-cyan-500 to-blue-500' },
    { label: 'Vortex', labelKo: '테마', icon: Sparkles, pushed: 67, feedbacks: 15, color: 'from-amber-500 to-orange-500' },
    { label: 'Cross-Axis', labelKo: '교차축', icon: GitBranch, pushed: 34, feedbacks: 8, color: 'from-emerald-500 to-teal-500' },
  ];

  const handleSync = async () => {
    setSyncing(true);
    try {
      await fetch('/api/cron/qis-sync', { method: 'POST' });
      setLastSync(new Date().toISOString());
    } catch (err) {
      console.error('Sync failed:', err);
    } finally {
      setSyncing(false);
    }
  };

  const axisColor = (axis: string) => {
    switch (axis) {
      case 'industry': return 'text-violet-400 bg-violet-500/10 border-violet-500/20';
      case 'place': return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
      case 'vortex': return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
      case 'cross': return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
      default: return 'text-slate-400 bg-slate-500/10 border-slate-500/20';
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight">
              <span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">
                QIS 3축 실시간 현황
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">업종 · 지역 · 테마 축 예측 질문 동기화 대시보드</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="px-4 py-2.5 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-lg shadow-indigo-500/20"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${syncing ? 'animate-spin' : ''}`} />
              🔄 수동 동기화
            </button>
            <button className="px-4 py-2.5 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer">
              📋 상세 로그
            </button>
          </div>
        </div>

        {/* 4 Stat Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {axisStats.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label} className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl bg-gradient-to-br ${stat.color} shadow-lg`}>
                    <Icon className="h-4 w-4 text-white" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-mono uppercase">{stat.label}</p>
                    <p className="text-sm font-bold text-slate-200">{stat.labelKo}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Pushed</p>
                    <p className="text-xl font-black text-slate-100">{stat.pushed}</p>
                  </div>
                  <div className="bg-slate-950/60 rounded-xl p-3 border border-slate-800">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase mb-1">Feedbacks</p>
                    <p className="text-xl font-black text-emerald-400">{stat.feedbacks}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Recent Sync + Accuracy Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* Recent Sync */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="h-4 w-4 text-slate-500" />
              <h3 className="text-sm font-bold text-slate-300">최근 동기화</h3>
            </div>
            <p className="text-sm text-slate-400">
              {lastSync
                ? new Date(lastSync).toLocaleString('ko-KR', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                : '아직 동기화 기록이 없습니다'
              }
            </p>
          </div>

          {/* Prediction Accuracy */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-300">예측 정확도</h3>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="w-full bg-slate-800 rounded-full h-3">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-teal-400 h-3 rounded-full transition-all duration-1000"
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
              <span className="text-lg font-black text-emerald-400">{accuracy}%</span>
            </div>
          </div>
        </div>

        {/* Predictions Table */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl backdrop-blur-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800">
            <h3 className="text-sm font-bold text-slate-200">최근 예측 질문</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-800">
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">축</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">예측 질문</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">신뢰도</th>
                  <th className="px-6 py-3 text-left text-[10px] font-bold text-slate-500 uppercase tracking-wider">피드백</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {predictions.map((pred) => (
                  <tr key={pred.id} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-3">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${axisColor(pred.target_axis)}`}>
                        {pred.target_axis}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-sm text-slate-300 max-w-md truncate">{pred.question_text}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-slate-800 rounded-full h-1.5">
                          <div
                            className={`h-1.5 rounded-full ${pred.confidence >= 0.8 ? 'bg-emerald-500' : pred.confidence >= 0.6 ? 'bg-amber-500' : 'bg-red-500'}`}
                            style={{ width: `${pred.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono text-slate-400">{(pred.confidence * 100).toFixed(0)}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {pred.feedback_received ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-slate-600" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
