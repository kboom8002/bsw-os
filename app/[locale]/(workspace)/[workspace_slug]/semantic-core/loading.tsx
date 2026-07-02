"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function SemanticCoreLoading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3 text-slate-400">
      <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      <span className="text-sm font-semibold">시맨틱 코어 자산을 불러오는 중...</span>
    </div>
  );
}
