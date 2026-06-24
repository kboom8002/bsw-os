"use client";

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { Settings, Save, Link2, ShieldAlert, Cpu, Bell, Sliders } from 'lucide-react';

export default function AuditSettingsPage() {
  const params = useParams();
  const workspaceSlug = params?.workspace_slug as string;

  const [targetUrls, setTargetUrls] = useState<string[]>(['https://droanswer.com']);
  const [newUrl, setNewUrl] = useState('');
  const [crawlDepth, setCrawlDepth] = useState(20);
  const [selectedEngines, setSelectedEngines] = useState<string[]>(['chatgpt_search', 'gemini_grounding']);
  const [schedule, setSchedule] = useState('manual');
  const [competitors, setCompetitors] = useState<string[]>(['https://competitor-a.com', 'https://competitor-b.com']);
  const [newCompetitor, setNewCompetitor] = useState('');
  const [notifications, setNotifications] = useState({ email: true, slack: false });
  const [saved, setSaved] = useState(false);

  const handleAddUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (newUrl.trim() && !targetUrls.includes(newUrl.trim())) {
      setTargetUrls([...targetUrls, newUrl.trim()]);
      setNewUrl('');
    }
  };

  const handleRemoveUrl = (url: string) => {
    setTargetUrls(targetUrls.filter(u => u !== url));
  };

  const handleAddCompetitor = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCompetitor.trim() && !competitors.includes(newCompetitor.trim())) {
      setCompetitors([...competitors, newCompetitor.trim()]);
      setNewCompetitor('');
    }
  };

  const handleRemoveCompetitor = (comp: string) => {
    setCompetitors(competitors.filter(c => c !== comp));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      {/* Title */}
      <div className="relative bg-slate-900/40 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-violet-500/10 text-violet-400 border border-violet-500/20">
            <Settings className="h-3.5 w-3.5" />
            Workspace Settings
          </div>
          <h1 className="text-2xl font-black text-slate-100 tracking-tight leading-tight">
            AEO/GEO 서피스 감사 설정
          </h1>
          <p className="text-xs text-slate-400">
            지식 자산 크롤링 범위, 실측용 AI 검색엔진, 스케줄링 및 경쟁사 모니터링 대상을 관리합니다.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: General settings */}
        <div className="lg:col-span-2 space-y-8">
          {/* Target Domain Management */}
          <div className="bg-slate-900/30 border border-slate-800/85 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Link2 className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">감사 대상 도메인 관리</h3>
            </div>
            
            <form onSubmit={handleAddUrl} className="flex gap-2">
              <input
                type="text"
                placeholder="https://example.com"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button type="submit" className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                추가
              </button>
            </form>

            <div className="space-y-2 pt-2">
              {targetUrls.map((url, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-slate-950/40 border border-slate-900 rounded-xl">
                  <span className="text-xs font-mono text-slate-300">{url}</span>
                  <button
                    onClick={() => handleRemoveUrl(url)}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Crawler Settings */}
          <div className="bg-slate-900/30 border border-slate-800/85 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Sliders className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">크롤러 수집 깊이 설정</h3>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-slate-400">최대 수집 페이지 수</span>
                <span className="text-xs font-bold text-indigo-400">{crawlDepth} pages</span>
              </div>
              <input
                type="range"
                min={10}
                max={100}
                step={10}
                value={crawlDepth}
                onChange={e => setCrawlDepth(parseInt(e.target.value))}
                className="w-full accent-indigo-500 cursor-pointer"
              />
              <span className="block text-[10px] text-slate-500 leading-relaxed">
                크롤링 수집 범위가 넓어질수록 AI 앤서카드가 풍부하게 발굴되나, 진단 속도가 길어질 수 있습니다 (Free 등급 최대 20페이지 고정).
              </span>
            </div>
          </div>

          {/* AI Search Engines to probe */}
          <div className="bg-slate-900/30 border border-slate-800/85 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Cpu className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">실측 대상 인공지능 검색 엔진</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'chatgpt_search', label: 'ChatGPT Search' },
                { id: 'gemini_grounding', label: 'Gemini Grounding' },
                { id: 'perplexity', label: 'Perplexity Engine' }
              ].map(eng => {
                const checked = selectedEngines.includes(eng.id);
                return (
                  <label
                    key={eng.id}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border cursor-pointer select-none transition-colors ${
                      checked
                        ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-400'
                        : 'bg-slate-950/40 border-slate-850 text-slate-400 hover:border-slate-850'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => {
                        if (checked) {
                          setSelectedEngines(selectedEngines.filter(id => id !== eng.id));
                        } else {
                          setSelectedEngines([...selectedEngines, eng.id]);
                        }
                      }}
                      className="hidden"
                    />
                    <span className="text-xs font-bold">{eng.label}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: schedule and competitors */}
        <div className="lg:col-span-1 space-y-8">
          {/* Scheduling */}
          <div className="bg-slate-900/30 border border-slate-800/85 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">감사 스케줄링</h3>
            
            <div className="space-y-2">
              {[
                { id: 'manual', label: '수동 분석 전용' },
                { id: 'weekly', label: '주 1회 자동 진단' },
                { id: 'monthly', label: '월 1회 자동 진단' }
              ].map(sched => (
                <label
                  key={sched.id}
                  className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-colors ${
                    schedule === sched.id
                      ? 'bg-indigo-950/20 border-indigo-500/30 text-indigo-400'
                      : 'bg-slate-950/40 border-slate-850 text-slate-400'
                  }`}
                >
                  <span className="text-xs font-bold">{sched.label}</span>
                  <input
                    type="radio"
                    name="schedule"
                    checked={schedule === sched.id}
                    onChange={() => setSchedule(sched.id)}
                    className="accent-indigo-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Competitor monitoring */}
          <div className="bg-slate-900/30 border border-slate-800/85 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">경쟁사 모니터링 관리</h3>
            
            <form onSubmit={handleAddCompetitor} className="flex gap-2">
              <input
                type="text"
                placeholder="경쟁사 사이트 URL"
                value={newCompetitor}
                onChange={e => setNewCompetitor(e.target.value)}
                className="flex-1 px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs focus:outline-none focus:border-indigo-500 transition-colors"
              />
              <button type="submit" className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer">
                추가
              </button>
            </form>

            <div className="space-y-2 max-h-[150px] overflow-y-auto pr-1">
              {competitors.map((comp, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 bg-slate-950/40 border border-slate-900 rounded-xl">
                  <span className="text-[11px] font-mono text-slate-400">{comp}</span>
                  <button
                    onClick={() => handleRemoveCompetitor(comp)}
                    className="text-xs text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                  >
                    삭제
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-slate-900/30 border border-slate-800/85 rounded-2xl p-6 shadow-xl backdrop-blur-md space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4.5 w-4.5 text-indigo-400" />
              <h3 className="text-sm font-bold text-slate-200">경보 및 알림 설정</h3>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                <span className="text-slate-400">가시성 하락 시 이메일 경보</span>
                <input
                  type="checkbox"
                  checked={notifications.email}
                  onChange={() => setNotifications({ ...notifications, email: !notifications.email })}
                  className="accent-indigo-500 h-4 w-4"
                />
              </label>
              <label className="flex items-center justify-between text-xs cursor-pointer select-none">
                <span className="text-slate-400">Slack 채널로 분석 알림 전송</span>
                <input
                  type="checkbox"
                  checked={notifications.slack}
                  onChange={() => setNotifications({ ...notifications, slack: !notifications.slack })}
                  className="accent-indigo-500 h-4 w-4"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button floating */}
      <div className="flex justify-end pt-4">
        <button
          onClick={handleSave}
          className="px-6 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
        >
          <Save className="h-4 w-4" />
          {saved ? '설정 저장 완료!' : '변경 사항 저장'}
        </button>
      </div>
    </div>
  );
}
