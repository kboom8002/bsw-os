"use client";

import React, { useEffect } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("TCO Concepts Page Error:", error);
  }, [error]);

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 text-slate-100 min-h-[400px]">
      <div className="p-4 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 mb-4">
        <AlertTriangle className="w-12 h-12" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">TCO 개념 사전을 불러오지 못했습니다</h2>
      <p className="text-sm text-slate-400 text-center max-w-md mb-6">
        {error.message || "데이터를 불러오는 중 예기치 않은 오류가 발생했습니다. 데이터베이스 마이그레이션 및 권한 설정을 확인해 주세요."}
      </p>
      <button
        onClick={() => reset()}
        className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-xl text-sm font-semibold text-white transition-all"
      >
        <RotateCcw className="w-4 h-4" />
        다시 시도
      </button>
    </div>
  );
}
