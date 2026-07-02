"use client";

import React, { startTransition } from "react";
import { AlertCircle, RotateCcw } from "lucide-react";

export default function SemanticCoreError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto p-6 text-center space-y-4">
      <div className="p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-500">
        <AlertCircle className="h-8 w-8" />
      </div>
      
      <div className="space-y-2">
        <h2 className="text-lg font-bold text-white">시맨틱 코어 처리 중 오류 발생</h2>
        <p className="text-xs text-slate-500 leading-relaxed">
          {error.message || "시맨틱 자산 데이터를 로드하는 중 알 수 없는 에러가 발생했습니다."}
        </p>
      </div>

      <button
        onClick={() => startTransition(() => reset())}
        className="px-4 py-2 text-xs font-bold rounded-xl bg-slate-800 hover:bg-slate-700 text-white border border-white/10 flex items-center gap-1.5 transition-all"
      >
        <RotateCcw className="w-3.5 h-3.5" /> 다시 시도
      </button>
    </div>
  );
}
