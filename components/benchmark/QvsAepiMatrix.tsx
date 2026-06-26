"use client";

/**
 * components/benchmark/QvsAepiMatrix.tsx
 * QVS × AEPI 전략 매트릭스 — 2D 산점도 (4-Quadrant)
 * X축: AEPI (브랜드 성능) / Y축: QVS (질문 가치)
 */

import React, { useState, useMemo } from "react";
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine, Cell,
} from "recharts";
import { Target, AlertTriangle, Shield, Sparkles, Eye } from "lucide-react";
import type { QvsAepiMatrixItem } from "../../lib/benchmark/qis-benchmark-bridge";

interface Props {
  items: QvsAepiMatrixItem[];
}

const QUADRANT_META = {
  threat:   { label: "🔴 위협 (집중투자)", desc: "고가치인데 약한 영역", color: "#ef4444", bgClass: "bg-red-500/10 border-red-500/30 text-red-400" },
  core:     { label: "💎 핵심 (방어+확장)", desc: "고가치이고 강한 영역", color: "#6366f1", bgClass: "bg-indigo-500/10 border-indigo-500/30 text-indigo-400" },
  ignore:   { label: "⚪ 모니터링", desc: "저가치이고 약한 영역", color: "#6b7280", bgClass: "bg-slate-500/10 border-slate-500/30 text-slate-400" },
  maintain: { label: "🟢 유지 (효율화)", desc: "저가치이고 강한 영역", color: "#10b981", bgClass: "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" },
};

const URGENCY_COLORS = {
  critical: "#ef4444",
  medium: "#f59e0b",
  low: "#6b7280",
};

function CustomDot(props: { cx?: number; cy?: number; payload?: QvsAepiMatrixItem }) {
  const { cx = 0, cy = 0, payload } = props;
  if (!payload) return null;
  const color = URGENCY_COLORS[payload.urgency] ?? "#6b7280";
  const r = payload.urgency === 'critical' ? 7 : payload.urgency === 'medium' ? 5.5 : 4;
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={color} fillOpacity={0.7} stroke={color} strokeWidth={1.5} />
      {payload.urgency === 'critical' && (
        <circle cx={cx} cy={cy} r={r + 3} fill="none" stroke={color} strokeWidth={1} strokeDasharray="3 2" opacity={0.5} />
      )}
    </g>
  );
}

export function QvsAepiMatrix({ items }: Props) {
  const [selectedItem, setSelectedItem] = useState<QvsAepiMatrixItem | null>(null);

  const quadrantCounts = useMemo(() => {
    const counts = { threat: 0, core: 0, ignore: 0, maintain: 0 };
    for (const item of items) counts[item.quadrant]++;
    return counts;
  }, [items]);

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 gap-3 bg-slate-800/30 rounded-xl border border-slate-700/50">
        <Target className="w-8 h-8 text-indigo-400/40" />
        <div className="text-sm text-slate-400">QVS × AEPI 데이터 준비 중</div>
        <div className="text-xs text-slate-500">벤치마크 감사 후 자동 생성됩니다</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">

      {/* 사분면 요약 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {(Object.entries(QUADRANT_META) as [keyof typeof QUADRANT_META, typeof QUADRANT_META[keyof typeof QUADRANT_META]][]).map(([key, meta]) => (
          <div key={key} className={`rounded-lg border px-3 py-2 ${meta.bgClass}`}>
            <div className="text-lg font-black">{quadrantCounts[key]}</div>
            <div className="text-[11px] font-semibold">{meta.label}</div>
            <div className="text-[9px] opacity-70">{meta.desc}</div>
          </div>
        ))}
      </div>

      {/* 산점도 */}
      <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-xs font-bold text-slate-300">QVS × AEPI 전략 매트릭스</h4>
          <div className="flex gap-3 text-[10px] text-slate-500">
            {[
              { color: URGENCY_COLORS.critical, label: "긴급(≤3일)" },
              { color: URGENCY_COLORS.medium, label: "주의(≤7일)" },
              { color: URGENCY_COLORS.low, label: "일반" },
            ].map(l => (
              <span key={l.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full" style={{ background: l.color }} />{l.label}
              </span>
            ))}
          </div>
        </div>

        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart margin={{ top: 10, right: 20, bottom: 30, left: 10 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
            <XAxis
              type="number"
              dataKey="aepi"
              name="AEPI"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              label={{ value: "AEPI (브랜드 성능) →", position: "bottom", offset: 12, fontSize: 11, fill: "#71717a" }}
            />
            <YAxis
              type="number"
              dataKey="qvs"
              name="QVS"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: "#a1a1aa" }}
              label={{ value: "QVS (질문 가치) →", angle: -90, position: "insideLeft", offset: 5, fontSize: 11, fill: "#71717a" }}
            />
            {/* 사분면 구분선 */}
            <ReferenceLine x={50} stroke="#3f3f46" strokeDasharray="4 2" />
            <ReferenceLine y={50} stroke="#3f3f46" strokeDasharray="4 2" />
            <Tooltip
              contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 11 }}
              formatter={(val: unknown) => [typeof val === 'number' ? val.toFixed(0) : String(val), ""]}
              labelFormatter={() => ""}
              content={({ payload }) => {
                if (!payload || payload.length === 0) return null;
                const item = payload[0]?.payload as QvsAepiMatrixItem;
                if (!item) return null;
                return (
                  <div className="bg-zinc-900 border border-zinc-700 rounded-lg p-3 text-xs max-w-[250px] shadow-xl">
                    <div className="font-bold text-zinc-200 mb-1">{item.label}</div>
                    <div className="grid grid-cols-2 gap-1 text-zinc-400">
                      <span>AEPI:</span><span className="text-zinc-200 font-mono">{item.aepi}</span>
                      <span>QVS:</span><span className="text-amber-400 font-mono">{item.qvs}</span>
                      <span>AI 커버리지:</span><span>{item.aiCoverage}</span>
                      <span>경쟁:</span><span>{(item.competition * 100).toFixed(0)}%</span>
                      {item.firstMoverDays && <><span>선점 잔여:</span><span>{item.firstMoverDays}일</span></>}
                    </div>
                  </div>
                );
              }}
            />
            <Scatter data={items} shape={<CustomDot />} onClick={(data: { payload?: QvsAepiMatrixItem }) => {
              if (data?.payload) setSelectedItem(data.payload);
            }}>
              {items.map((item, i) => (
                <Cell key={i} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      {/* 선택된 아이템 상세 */}
      {selectedItem && (
        <div className="bg-slate-800/50 border border-indigo-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-bold text-slate-200">{selectedItem.label}</h4>
            <button
              onClick={() => setSelectedItem(null)}
              className="text-xs text-slate-500 hover:text-slate-300 cursor-pointer"
            >닫기</button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div>
              <span className="text-slate-500 block">사분면</span>
              <span className="font-bold">{QUADRANT_META[selectedItem.quadrant]?.label}</span>
            </div>
            <div>
              <span className="text-slate-500 block">AEPI / QVS</span>
              <span className="font-bold font-mono">{selectedItem.aepi} / {selectedItem.qvs}</span>
            </div>
            <div>
              <span className="text-slate-500 block">AI 커버리지</span>
              <span className="font-bold">{selectedItem.aiCoverage}</span>
            </div>
            <div>
              <span className="text-slate-500 block">선점 잔여일</span>
              <span className="font-bold">{selectedItem.firstMoverDays ?? '-'}일</span>
            </div>
          </div>
          {selectedItem.quadrant === 'threat' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-400">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
              <span>이 영역은 <strong>높은 비즈니스 가치</strong>를 갖고 있지만 브랜드 커버리지가 부족합니다. 즉시 콘텐츠 생산을 권장합니다.</span>
            </div>
          )}
          {selectedItem.quadrant === 'core' && (
            <div className="flex items-center gap-2 mt-2 px-3 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-lg text-xs text-indigo-400">
              <Shield className="w-3.5 h-3.5 shrink-0" />
              <span>핵심 영역입니다. 기존 콘텐츠를 <strong>정기 업데이트</strong>하고 경쟁사 변화를 모니터링하세요.</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
