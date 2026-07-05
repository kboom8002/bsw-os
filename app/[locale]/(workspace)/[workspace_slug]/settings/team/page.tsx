"use client";

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useTranslation } from "@/lib/i18n/context";
import { 
  Users, UserPlus, ShieldAlert, Trash2, XCircle, 
  Loader2, CheckCircle2, Clipboard, ShieldCheck
} from "lucide-react";
import { 
  getTeamMembers, 
  getWorkspaceInvitations, 
  inviteTeamMember, 
  revokeInvitation, 
  removeTeamMember, 
  updateMemberRole 
} from "@/app/actions/settings";
import { WORKSPACE_ROLES } from "@/lib/schema";

export default function TeamSettingsPage() {
  const params = useParams();
  const workspaceSlug = (params?.workspace_slug as string) || "";
  const { locale, t } = useTranslation();

  const [wsId, setWsId] = useState("");
  const [loading, setLoading] = useState(true);
  const [inviting, setInviting] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  
  const [members, setMembers] = useState<any[]>([]);
  const [invitations, setInvitations] = useState<any[]>([]);
  
  // Invitation Form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("brand_strategist");
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkspaceAndTeam();
  }, [workspaceSlug]);

  const loadWorkspaceAndTeam = async () => {
    setLoading(true);
    setError(null);
    try {
      const { resolveWorkspaceSlug } = await import("@/app/actions/workspace");
      const resolvedId = await resolveWorkspaceSlug(workspaceSlug);

      if (!resolvedId) {
        setError("워크스페이스 ID를 찾을 수 없습니다.");
        return;
      }

      setWsId(resolvedId);
      await refreshTeamData(resolvedId);
    } catch (err: any) {
      setError(err.message || "팀 데이터를 불러오는 중 오류 발생");
    } finally {
      setLoading(false);
    }
  };

  const refreshTeamData = async (resolvedId: string) => {
    const activeWsId = resolvedId || wsId;
    const [memberList, inviteList] = await Promise.all([
      getTeamMembers(activeWsId),
      getWorkspaceInvitations(activeWsId)
    ]);
    setMembers(memberList);
    setInvitations(inviteList);
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setInviting(true);
    setError(null);
    setSuccess(null);
    setGeneratedLink(null);

    try {
      const res = await inviteTeamMember(wsId, inviteEmail.trim(), inviteRole as any);
      if (res.success && res.inviteLink) {
        setGeneratedLink(res.inviteLink);
        setInviteEmail("");
        setSuccess("초대장이 생성되었습니다. 아래 링크를 복사하여 전달하세요.");
        await refreshTeamData(wsId);
      } else {
        setError(res.error || "초대 실패");
      }
    } catch (err: any) {
      setError(err.message || "오류가 발생했습니다.");
    } finally {
      setInviting(false);
    }
  };

  const handleRevokeInvite = async (id: string) => {
    setActionLoading(id);
    try {
      const res = await revokeInvitation(wsId, id);
      if (res.success) {
        setSuccess("초대를 취소했습니다.");
        await refreshTeamData(wsId);
      } else {
        setError(res.error || "초대 취소 실패");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveMember = async (id: string) => {
    if (!confirm("정말로 이 멤버를 워크스페이스에서 제거하시겠습니까?")) return;
    setActionLoading(id);
    try {
      const res = await removeTeamMember(wsId, id);
      if (res.success) {
        setSuccess("멤버를 제거했습니다.");
        await refreshTeamData(wsId);
      } else {
        setError(res.error || "멤버 제거 실패");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRoleChange = async (id: string, newRole: string) => {
    setActionLoading(id);
    try {
      const res = await updateMemberRole(wsId, id, newRole as any);
      if (res.success) {
        setSuccess("멤버 역할을 변경했습니다.");
        await refreshTeamData(wsId);
      } else {
        setError(res.error || "역할 변경 실패");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const copyToClipboard = () => {
    if (generatedLink) {
      navigator.clipboard.writeText(generatedLink);
      alert("초대 링크가 클립보드에 복사되었습니다!");
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 md:p-8 space-y-8 font-sans max-w-4xl w-full mx-auto text-slate-100 bg-slate-900">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-wider uppercase mb-1">
            Access Control & Members
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">
            Team Management
          </h1>
          <p className="text-slate-400 text-sm">
            워크스페이스에 팀원을 초대하고 10단계 RBAC 역할을 할당합니다.
          </p>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-400">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20 text-xs text-green-400 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <span>{success}</span>
        </div>
      )}

      {/* 초대 복사 UI */}
      {generatedLink && (
        <div className="p-5 rounded-2xl border border-cyan-500/30 bg-cyan-950/20 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 bottom-0 left-0 w-1 bg-cyan-500" />
          <div className="space-y-1">
            <h4 className="text-sm font-bold text-cyan-400">팀원 가입 링크 생성 완료</h4>
            <p className="text-slate-400 text-[11px]">이 링크는 7일간 유효합니다. 가입 시 자동으로 이 워크스페이스에 편입됩니다.</p>
          </div>
          <div className="flex bg-slate-950 border border-white/10 rounded-xl overflow-hidden flex-1 md:max-w-md items-center">
            <span className="text-xs text-slate-500 font-mono pl-3 truncate flex-1">{generatedLink}</span>
            <button 
              onClick={copyToClipboard}
              className="p-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-colors"
              title="Copy link"
            >
              <Clipboard className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
        {/* 초대 양식 */}
        <div className="md:col-span-1 bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <UserPlus className="w-4.5 h-4.5 text-cyan-400" />
            신규 팀원 초대
          </h3>
          <form onSubmit={handleInvite} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">이메일 주소</label>
              <input 
                type="email" 
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@brand.com"
                required
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl focus:ring-1 focus:ring-cyan-500 outline-none text-white"
              />
            </div>

            <div>
              <label className="block text-[10px] font-semibold text-slate-400 mb-1">역할 할당</label>
              <select 
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-950 border border-white/10 rounded-xl outline-none text-white focus:ring-1 focus:ring-cyan-500"
              >
                {WORKSPACE_ROLES.map(r => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>

            <button 
              type="submit" 
              disabled={inviting}
              className="w-full py-2 bg-gradient-to-r from-cyan-400 to-blue-500 hover:from-cyan-300 hover:to-blue-400 text-slate-950 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {inviting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <>초대장 생성</>}
            </button>
          </form>
        </div>

        {/* 현재 멤버 및 초대 대기 목록 */}
        <div className="md:col-span-2 space-y-6">
          {/* Members Table */}
          <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Users className="w-4.5 h-4.5 text-indigo-400" />
              참여 중인 팀 멤버 ({members.length})
            </h3>
            
            <div className="divide-y divide-white/5">
              {members.map(m => (
                <div key={m.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                  <div>
                    <div className="text-xs font-semibold text-white font-mono">{m.user_id}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      가입일: {new Date(m.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <select 
                      value={m.role}
                      disabled={actionLoading === m.id}
                      onChange={(e) => handleRoleChange(m.id, e.target.value)}
                      className="px-2 py-1 bg-slate-950 border border-white/10 rounded-lg text-xs outline-none text-slate-300 focus:ring-1 focus:ring-indigo-500"
                    >
                      {WORKSPACE_ROLES.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>

                    <button 
                      onClick={() => handleRemoveMember(m.id)}
                      disabled={actionLoading === m.id}
                      className="p-1.5 hover:bg-white/5 hover:text-red-400 text-slate-500 rounded-lg transition-all"
                      title="Remove member"
                    >
                      {actionLoading === m.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <div className="bg-slate-950/40 p-6 rounded-2xl border border-white/5 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldCheck className="w-4.5 h-4.5 text-cyan-400" />
                승인 대기 중인 초대 ({invitations.length})
              </h3>

              <div className="divide-y divide-white/5">
                {invitations.map(inv => (
                  <div key={inv.id} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div>
                      <div className="text-xs font-semibold text-white">{inv.invitee_email}</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">
                        역할: <span className="font-mono text-cyan-400">{inv.role}</span> | 만료: {new Date(inv.expires_at).toLocaleDateString()}
                      </div>
                    </div>

                    <button 
                      onClick={() => handleRevokeInvite(inv.id)}
                      disabled={actionLoading === inv.id}
                      className="p-1.5 hover:bg-white/5 hover:text-red-400 text-slate-500 rounded-lg transition-all"
                      title="Cancel invitation"
                    >
                      {actionLoading === inv.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
