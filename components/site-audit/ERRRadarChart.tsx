"use client";

import React from "react";

interface ERRRadarChartProps {
  errFactoid: number;
  errProcedural: number;
  errComparative: number;
  errAuthority: number;
  errSchema: number;
  errTopical: number;
  errGeo: number;
}

export default function ERRRadarChart({
  errFactoid,
  errProcedural,
  errComparative,
  errAuthority,
  errSchema,
  errTopical,
  errGeo
}: ERRRadarChartProps) {
  const dimensions = [
    { label: "사실형 (Factoid)", value: errFactoid },
    { label: "절차형 (Procedural)", value: errProcedural },
    { label: "비교형 (Comparative)", value: errComparative },
    { label: "권위성 (Authority)", value: errAuthority },
    { label: "구조화 (Schema)", value: errSchema },
    { label: "주제성 (Topical)", value: errTopical },
    { label: "지역성 (Geo)", value: errGeo }
  ];

  const size = 320;
  const center = size / 2;
  const radius = size * 0.35;
  const totalAxes = dimensions.length;

  // Helper to get coordinates on axis
  const getCoordinates = (index: number, val: number) => {
    const angle = (index * 2 * Math.PI) / totalAxes - Math.PI / 2;
    const x = center + radius * (val / 100) * Math.cos(angle);
    const y = center + radius * (val / 100) * Math.sin(angle);
    return { x, y };
  };

  // Generate grid lines (circles/polygons at 20, 40, 60, 80, 100)
  const gridLevels = [20, 40, 60, 80, 100];
  const gridPaths = gridLevels.map(level => {
    const points = [];
    for (let i = 0; i < totalAxes; i++) {
      const { x, y } = getCoordinates(i, level);
      points.push(`${x},${y}`);
    }
    return points.join(" ");
  });

  // Calculate coordinates for actual data points
  const dataPoints = dimensions.map((d, i) => getCoordinates(i, d.value));
  const dataPathString = dataPoints.map(p => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex flex-col items-center bg-slate-900/30 border border-slate-800 rounded-2xl p-6 backdrop-blur-md">
      <h3 className="text-sm font-bold text-slate-300 mb-6 w-full text-left flex items-center gap-2">
        <span className="h-2 w-2 rounded-full bg-violet-400" />
        7-차원 엔티티 반영률 (ERR Radar)
      </h3>

      <div className="relative w-full max-w-[320px] aspect-square flex items-center justify-center">
        <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
          {/* Grid lines */}
          {gridLevels.map((level, idx) => (
            <polygon
              key={level}
              points={gridPaths[idx]}
              fill="none"
              stroke="#1e293b"
              strokeWidth="1"
              strokeDasharray={level === 100 ? "0" : "3,3"}
            />
          ))}

          {/* Grid Level Text */}
          {gridLevels.map((level) => {
            const { x, y } = getCoordinates(0, level);
            return (
              <text
                key={level}
                x={x + 5}
                y={y + 12}
                fill="#475569"
                fontSize="8"
                fontWeight="semibold"
              >
                {level}%
              </text>
            );
          })}

          {/* Spokes/Axes */}
          {dimensions.map((_, i) => {
            const outerPoint = getCoordinates(i, 100);
            return (
              <line
                key={i}
                x1={center}
                y1={center}
                x2={outerPoint.x}
                y2={outerPoint.y}
                stroke="#334155"
                strokeWidth="1"
              />
            );
          })}

          {/* Labels */}
          {dimensions.map((d, i) => {
            const labelPos = getCoordinates(i, 118);
            const anchor = i === 0 ? "middle" : i < totalAxes / 2 ? "start" : "end";
            const dy = i === 0 ? -2 : i === 3 || i === 4 ? 10 : 3;

            return (
              <g key={i}>
                <text
                  x={labelPos.x}
                  y={labelPos.y + dy}
                  fill="#94a3b8"
                  fontSize="9"
                  fontWeight="bold"
                  textAnchor={anchor}
                >
                  {d.label.split(" ")[0]}
                </text>
                <text
                  x={labelPos.x}
                  y={labelPos.y + dy + 10}
                  fill="#64748b"
                  fontSize="8"
                  fontWeight="bold"
                  textAnchor={anchor}
                >
                  {d.value}%
                </text>
              </g>
            );
          })}

          {/* Filled Data Polygon */}
          <polygon
            points={dataPathString}
            fill="url(#radar-grad)"
            stroke="#818cf8"
            strokeWidth="2.5"
            strokeLinejoin="round"
          />

          {/* Data Points */}
          {dataPoints.map((pt, i) => (
            <circle
              key={i}
              cx={pt.x}
              cy={pt.y}
              r="4.5"
              fill="#818cf8"
              stroke="#0f172a"
              strokeWidth="1.5"
              className="hover:scale-150 transition-all cursor-pointer"
            />
          ))}

          {/* Defs for gradient */}
          <defs>
            <linearGradient id="radar-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#6366f1" stopOpacity="0.45" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.15" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Legend / Metrics List */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-2.5 w-full mt-6 border-t border-slate-800/60 pt-4">
        {dimensions.map((d, idx) => (
          <div key={idx} className="flex justify-between items-center text-xs">
            <span className="text-slate-400 font-semibold">{d.label}</span>
            <span className="text-slate-200 font-black">{d.value}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
