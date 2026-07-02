"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 bg-slate-900 text-slate-100 min-h-[400px]">
      <Loader2 className="w-10 h-10 text-cyan-400 animate-spin mb-4" />
      <p className="text-sm text-slate-400">TCO 개념 사전을 불러오는 중입니다...</p>
    </div>
  );
}
