"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { Loader2, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function InviteAcceptPage() {
  const params = useParams();
  const router = useRouter();
  const token = (params?.token as string) || "";
  const locale = (params?.locale as string) || "ko";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inviteInfo, setInviteInfo] = useState<any>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    checkInviteStatus();
  }, [token]);

  const checkInviteStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseClient();
      
      // 1. Check user login state
      const { data: { session } } = await supabase.auth.getSession();
      setIsLoggedIn(!!session);

      // 2. Fetch invitation status from DB (using public client since this is public, but let's query via RPC or direct)
      const { data: invite, error: inviteErr } = await supabase
        .from('workspace_invitations')
        .select('*, workspaces(name)')
        .eq('token', token)
        .eq('status', 'pending')
        .maybeSingle();

      if (inviteErr || !invite) {
        setError("유효하지 않거나 이미 완료된 초대 링크입니다.");
        return;
      }

      // Check expiry
      if (new Date(invite.expires_at) < new Date()) {
        setError("초대 링크의 유효 기간이 만료되었습니다. 관리자에게 재전송을 요청해 주세요.");
        return;
      }

      setInviteInfo(invite);

      // If user is already logged in, automatically accept and redirect
      if (session?.user) {
        await handleAccept(session.user.id, invite);
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (userId: string, invite: any) => {
    try {
      const supabase = getSupabaseClient();
      
      // Call server API or directly update membership
      // In production RLS policies prevent public client write, so we handle it on backend during login/signup redirects,
      // but if already logged in we can trigger a server action or call Supabase.
      // Let's call a simple api endpoint or local accept logic.
      // We can insert to memberships using supabase since RLS allows auth users, but membership creation role is owner/admin.
      // To bypass RLS safely, we can route through a server action or API route.
      // Let's invoke a fetch call to an invite accept api route we will create.
      const res = await fetch(`/api/invite/accept`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, userId })
      });

      const data = await res.json();
      if (data.success) {
        router.push(`/${locale}/${data.workspaceSlug}`);
      } else {
        setError(data.message || "초대 수락 중 오류가 발생했습니다.");
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400 mb-2" />
        <span className="text-sm text-slate-400">초대 링크 유효성 검사 중...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
        <div className="max-w-md w-full bg-slate-900 border border-white/5 p-8 rounded-3xl text-center space-y-4 shadow-2xl">
          <div className="inline-flex p-3 bg-red-500/10 rounded-full border border-red-500/20 text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white">초대 수락 실패</h3>
          <p className="text-slate-400 text-sm">{error}</p>
          <div className="pt-4">
            <Link href="/ko/login" className="px-5 py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold text-xs rounded-xl transition-all">
              로그인 화면으로 이동
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-slate-900 border border-white/5 p-8 rounded-3xl text-center space-y-6 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-cyan-400 to-indigo-500" />
        
        <div className="inline-flex p-3 bg-indigo-500/10 rounded-full border border-indigo-500/20 text-indigo-400">
          <ShieldCheck className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">워크스페이스 초대</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            귀하는 <span className="text-white font-bold">{inviteInfo?.workspaces?.name}</span> 워크스페이스에 <span className="text-cyan-400 font-mono font-semibold">{inviteInfo?.role}</span> 역할로 참여하도록 초대받으셨습니다.
          </p>
        </div>

        <div className="pt-4 space-y-3">
          <Link 
            href={`/ko/signup?invite_token=${token}`}
            className="w-full py-3 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-sm rounded-xl transition-all shadow-lg shadow-cyan-500/10 flex items-center justify-center gap-2"
          >
            새로운 계정으로 가입 및 참여 <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            href={`/ko/login?next=${encodeURIComponent(`/ko/invite/${token}`)}`}
            className="block text-xs text-slate-400 hover:text-white underline transition-colors"
          >
            기존 계정으로 로그인하기
          </Link>
        </div>
      </div>
    </div>
  );
}
