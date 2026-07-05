"use client";

import { useState } from "react";
import { signup } from "../../actions/auth";
import { useSearchParams } from "next/navigation";
import { ShieldCheck, ArrowRight, Layers, UserPlus } from "lucide-react";
import Link from "next/link";

export default function SignupPage() {
  const searchParams = useSearchParams();
  const inviteToken = searchParams?.get("invite_token") || "";
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError(null);
    if (inviteToken) {
      formData.append("invite_token", inviteToken);
    }
    
    const result = await signup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else {
      setSuccess(true);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <div className="p-3 bg-gradient-to-tr from-violet-500 to-indigo-600 rounded-xl shadow-lg shadow-indigo-500/20">
            <UserPlus className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          BSW-OS 회원가입
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          AEO 및 AI 검색 최적화를 위한 브랜드 의미 관리 플랫폼
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-slate-900/80 backdrop-blur-md py-8 px-4 shadow-2xl sm:rounded-2xl sm:px-10 border border-slate-800">
          {success ? (
            <div className="space-y-4 text-center">
              <div className="inline-flex p-3 bg-green-500/10 rounded-full border border-green-500/20 text-green-400">
                <ShieldCheck className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-bold text-white">가입 신청 완료</h3>
              <p className="text-slate-400 text-sm">
                이메일 주소로 인증 링크가 발송되었습니다. 인증을 완료한 후 로그인해 주세요.
              </p>
              <div className="pt-4">
                <Link
                  href="/ko/login"
                  className="w-full inline-flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  로그인 화면으로 이동
                </Link>
              </div>
            </div>
          ) : (
            <form className="space-y-6" action={handleSubmit}>
              <div>
                <label htmlFor="full_name" className="block text-sm font-medium text-slate-300">
                  이름 / 담당자명
                </label>
                <div className="mt-1">
                  <input
                    id="full_name"
                    name="full_name"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  이메일 주소
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  비밀번호
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-slate-700 rounded-lg shadow-sm bg-slate-950 text-white placeholder-slate-500 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm transition-colors"
                  />
                </div>
              </div>

              {error && (
                <div className="text-red-400 text-sm font-medium flex items-center gap-1.5 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                  <ShieldCheck className="h-4 w-4" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "가입 처리 중..." : "회원가입 완료"}
                </button>
              </div>

              <div className="text-center mt-4">
                <span className="text-xs text-slate-400">이미 계정이 있으신가요? </span>
                <Link href="/ko/login" className="text-xs font-semibold text-indigo-400 hover:underline">
                  로그인하기
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
