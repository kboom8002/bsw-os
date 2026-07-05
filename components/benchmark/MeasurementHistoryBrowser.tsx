"use client";
/**
 * components/benchmark/MeasurementHistoryBrowser.tsx
 * 날짜-시간 기준 측정 이력 조회 패널.
 * 사이드 패널 형태로 BenchmarkDashboard 내에 렌더링됩니다.
 */

import React, { useState, useTransition } from "react";
import {
  Clock, ChevronRight, X, BarChart3, RefreshCw,
  Calendar, Pencil, Check, Trash2, AlertTriangle
} from "lucide-react";
import type { MeasurementRun } from "../../app/actions/benchmark-history-types";
import { updateMeasurementRunLabel, deleteMeasurementRun } from "../../app/actions/benchmark-history";

interface MeasurementHistoryBrowserProps {
  runs: MeasurementRun[];
  activeRunId: string | null; // null = latest live data
  onSelectRun: (run: MeasurementRun | null) => void;
  onClose: () => void;
  currentDomainSlug: string;
}

function formatDate(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function formatTime(isoString: string): string {
  const d = new Date(isoString);
  return d.toLocaleTimeString('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function groupRunsByDate(runs: MeasurementRun[]): Record<string, MeasurementRun[]> {
  const groups: Record<string, MeasurementRun[]> = {};
  for (const run of runs) {
    const dateKey = formatDate(run.measured_at);
    if (!groups[dateKey]) groups[dateKey] = [];
    groups[dateKey].push(run);
  }
  return groups;
}

interface RunRowProps {
  run: MeasurementRun;
  isActive: boolean;
  onSelect: () => void;
  onLabelUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
}

function RunRow({ run, isActive, onSelect, onLabelUpdate, onDelete }: RunRowProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [labelValue, setLabelValue] = useState(run.run_label ?? '');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const handleSaveLabel = () => {
    startTransition(async () => {
      await updateMeasurementRunLabel(run.id, labelValue);
      onLabelUpdate(run.id, labelValue);
      setIsEditing(false);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      await deleteMeasurementRun(run.id);
      onDelete(run.id);
      setShowDeleteConfirm(false);
    });
  };

  return (
    <div
      className={`group relative rounded-lg border transition-all duration-150 ${
        isActive
          ? 'bg-indigo-500/10 border-indigo-500/30'
          : 'bg-slate-900/30 border-slate-800 hover:border-slate-700 hover:bg-slate-800/30'
      }`}
    >
      <button
        onClick={onSelect}
        className="w-full flex items-start gap-3 p-3 text-left"
      >
        {/* Time indicator */}
        <div className="flex-shrink-0 mt-0.5">
          <div className={`text-sm font-black ${isActive ? 'text-indigo-400' : 'text-slate-300'}`}>
            {formatTime(run.measured_at)}
          </div>
          <div className="flex items-center gap-1 mt-0.5">
            <div className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-indigo-400' : 'bg-slate-600'}`} />
            <span className="text-[10px] text-slate-500">{run.engine}</span>
          </div>
        </div>

        {/* Stats */}
        <div className="flex-1 min-w-0">
          {isEditing ? (
            <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={labelValue}
                onChange={(e) => setLabelValue(e.target.value)}
                placeholder="측정 이름 (선택)"
                className="flex-1 bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-xs text-slate-200 focus:outline-none focus:border-indigo-500/50"
                autoFocus
                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveLabel(); if (e.key === 'Escape') setIsEditing(false); }}
              />
              <button onClick={handleSaveLabel} disabled={isPending} className="text-emerald-400 hover:text-emerald-300">
                <Check className="h-3.5 w-3.5" />
              </button>
              <button onClick={() => setIsEditing(false)} className="text-slate-500 hover:text-slate-300">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <div className={`text-xs font-semibold truncate ${isActive ? 'text-indigo-300' : 'text-slate-300'}`}>
              {run.run_label || run.domain_name}
            </div>
          )}
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-slate-500">{run.brand_count}개 브랜드</span>
            <span className="text-[10px] text-slate-600">•</span>
            <span className="text-[10px] text-slate-500">{run.question_count}Q</span>
          </div>
        </div>

        {/* Active indicator */}
        {isActive && (
          <ChevronRight className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-1" />
        )}
      </button>

      {/* Action buttons (on hover) */}
      {!isEditing && !showDeleteConfirm && (
        <div className="absolute top-2 right-2 hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setIsEditing(true); }}
            className="p-1 rounded text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-all"
            title="이름 편집"
          >
            <Pencil className="h-3 w-3" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true); }}
            className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
            title="삭제"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-slate-950/90 rounded-lg backdrop-blur-sm">
          <AlertTriangle className="h-4 w-4 text-rose-400" />
          <span className="text-xs text-slate-300">삭제하시겠습니까?</span>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            disabled={isPending}
            className="px-2 py-0.5 rounded text-xs font-bold bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 border border-rose-500/30 transition-all"
          >
            삭제
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false); }}
            className="px-2 py-0.5 rounded text-xs font-bold bg-slate-800 text-slate-400 hover:bg-slate-700 transition-all"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );
}

export default function MeasurementHistoryBrowser({
  runs,
  activeRunId,
  onSelectRun,
  onClose,
  currentDomainSlug,
}: MeasurementHistoryBrowserProps) {
  const [localRuns, setLocalRuns] = useState<MeasurementRun[]>(runs);

  const domainRuns = localRuns.filter((r) => r.domain_slug === currentDomainSlug);
  const groupedRuns = groupRunsByDate(domainRuns);
  const dateKeys = Object.keys(groupedRuns);

  const handleLabelUpdate = (id: string, label: string) => {
    setLocalRuns((prev) => prev.map((r) => (r.id === id ? { ...r, run_label: label } : r)));
  };

  const handleDelete = (id: string) => {
    setLocalRuns((prev) => prev.filter((r) => r.id !== id));
    if (activeRunId === id) onSelectRun(null);
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border-l border-slate-800 w-72 flex-shrink-0">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-indigo-400" />
          <span className="text-sm font-bold text-slate-200">측정 이력</span>
          {domainRuns.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-800 text-slate-400">
              {domainRuns.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded text-slate-500 hover:text-white hover:bg-slate-800 transition-all"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Latest data option */}
      <div className="px-3 pt-3">
        <button
          onClick={() => onSelectRun(null)}
          className={`w-full flex items-center gap-2.5 p-2.5 rounded-lg border text-left transition-all ${
            activeRunId === null
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : 'bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200'
          }`}
        >
          <RefreshCw className={`h-4 w-4 flex-shrink-0 ${activeRunId === null ? 'text-emerald-400' : 'text-slate-500'}`} />
          <div>
            <div className="text-xs font-bold">최신 데이터 (Live)</div>
            <div className="text-[10px] text-slate-500 mt-0.5">DB에서 가장 최근 측정값</div>
          </div>
          {activeRunId === null && <ChevronRight className="h-4 w-4 ml-auto" />}
        </button>
      </div>

      {/* History list */}
      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {dateKeys.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <BarChart3 className="h-8 w-8 text-slate-700 mb-3" />
            <p className="text-xs text-slate-500">측정 이력이 없습니다.</p>
            <p className="text-[10px] text-slate-600 mt-1">
              측정을 실행하면 이력이 저장됩니다.
            </p>
          </div>
        ) : (
          dateKeys.map((dateKey) => (
            <div key={dateKey}>
              {/* Date header */}
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-3 w-3 text-slate-600" />
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {dateKey}
                </span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>

              {/* Runs for this date */}
              <div className="space-y-1.5">
                {groupedRuns[dateKey].map((run) => (
                  <RunRow
                    key={run.id}
                    run={run}
                    isActive={activeRunId === run.id}
                    onSelect={() => onSelectRun(run)}
                    onLabelUpdate={handleLabelUpdate}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Footer hint */}
      <div className="px-4 py-3 border-t border-slate-800">
        <p className="text-[10px] text-slate-600 leading-relaxed text-center">
          이름 편집 또는 삭제는 행에 마우스를 올려 버튼을 클릭하세요
        </p>
      </div>
    </div>
  );
}
