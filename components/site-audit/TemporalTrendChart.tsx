import React from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TemporalTrend } from '../../lib/benchmark/temporal-tracker';
import { TrendingUp, Activity } from 'lucide-react';

interface Props {
  trends: TemporalTrend[];
}

export default function TemporalTrendChart({ trends }: Props) {
  if (!trends || trends.length === 0) {
    return (
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center text-slate-400">
        <Activity className="h-8 w-8 mx-auto mb-3 opacity-50" />
        <p className="text-sm font-semibold">시계열 데이터가 없습니다.</p>
        <p className="text-xs mt-1">과거 감사 기록이 누적되면 트렌드 차트가 활성화됩니다.</p>
      </div>
    );
  }

  // 데이터 포맷팅
  const data = trends.map(t => {
    const d = new Date(t.measured_at);
    return {
      name: `${d.getMonth() + 1}/${d.getDate()}`,
      AEPI: parseFloat(t.aepi_score.toFixed(1)),
      Factoid: parseFloat(t.err_factoid.toFixed(1)),
      Procedural: parseFloat(t.err_procedural.toFixed(1))
    };
  });

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 shadow-xl">
      <div className="flex items-center gap-2 mb-6">
        <div className="p-1.5 bg-indigo-500/10 rounded-lg">
          <TrendingUp className="h-4 w-4 text-indigo-400" />
        </div>
        <h3 className="font-bold text-slate-100 text-sm">AEPI 및 주요 ERR 추세선 (최근 90일)</h3>
      </div>
      
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 20, bottom: 5, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', fontSize: '12px' }}
              itemStyle={{ fontWeight: 'bold' }}
            />
            <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
            <Line type="monotone" dataKey="AEPI" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="Factoid" stroke="#0ea5e9" strokeWidth={2} dot={{ r: 3 }} />
            <Line type="monotone" dataKey="Procedural" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 p-4 bg-indigo-500/10 border border-indigo-500/20 rounded-xl">
        <h4 className="text-xs font-bold text-indigo-300 mb-1">인사이트</h4>
        <p className="text-xs text-indigo-100/70 leading-relaxed">
          과거 3개월 동안 <strong>AEPI 점수가 지속적으로 상승</strong>하고 있습니다. 특히 제품 스펙 및 성분과 관련된 <strong>Factoid 엔티티의 AI 노출율</strong>이 크게 개선되었습니다. 지속적인 AEO/GEO 최적화를 통해 남은 Gap을 최소화하세요.
        </p>
      </div>
    </div>
  );
}
