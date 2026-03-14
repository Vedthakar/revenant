"use client";

import { useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import { useAuthGuard } from "@/hooks/useAuthGuard";
import { apiFetch } from "@/lib/api";
import type { TeamMemberItem } from "@/types/symbiote";
import { UserPlus, Check, Send } from "lucide-react";

export default function TeamPage() {
  const { user, loading } = useAuthGuard();
  const [members, setMembers] = useState<TeamMemberItem[]>([]);
  const [fetching, setFetching] = useState(true);
  const [invitingId, setInvitingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadMembers = async () => {
    setFetching(true);
    try {
      const data = await apiFetch<TeamMemberItem[]>("/api/integrations/slack/members");
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to load team members");
    } finally {
      setFetching(false);
    }
  };

  useEffect(() => {
    if (user) {
      void loadMembers();
    }
  }, [user]);

  const sendInvite = async (slackId: string) => {
    setInvitingId(slackId);
    setError(null);
    try {
      await apiFetch("/api/integrations/slack/invite", {
        method: "POST",
        json: { slack_user_id: slackId },
      });
      void loadMembers();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send invitation");
    } finally {
      setInvitingId(null);
    }
  };

  return (
    <div className="page-shell min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="mx-auto max-w-7xl px-6 py-14" style={{ paddingTop: "120px" }}>
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div>
            <span className="tag tag-gold">Team sync</span>
            <h1 className="mt-5 text-5xl font-semibold leading-tight">Your Slack team members.</h1>
            <p className="mt-5 max-w-3xl text-base leading-8 text-[var(--text-muted)]">
              This list is synced live from Slack via Nango. Invite your teammates to join you on MySaas.com.
            </p>
          </div>
          <div className="rounded-[24px] border border-[var(--border-gold)] bg-[rgba(217,119,6,0.08)] px-5 py-4 text-sm leading-7 text-[var(--text)] md:max-w-sm">
            Nango helps us keep your team list synchronized automatically whenever members join or change in Slack.
          </div>
        </div>

        {error && (
          <p className="mt-8 rounded-[20px] border border-red-500/40 bg-red-500/10 px-5 py-4 text-sm text-red-300">
            {error}
          </p>
        )}

        <section className="mt-10 glass rounded-[28px] overflow-hidden" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid var(--border)" }}>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Member</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Email</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Status</th>
                  <th className="px-8 py-6 text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)] text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {(loading || fetching) && members.length === 0 ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i} className="animate-pulse border-b border-[var(--border)]">
                      <td className="px-8 py-6"><div className="h-4 w-32 bg-[rgba(255,255,255,0.05)] rounded" /></td>
                      <td className="px-8 py-6"><div className="h-4 w-48 bg-[rgba(255,255,255,0.05)] rounded" /></td>
                      <td className="px-8 py-6"><div className="h-4 w-16 bg-[rgba(255,255,255,0.05)] rounded" /></td>
                      <td className="px-8 py-6"><div className="h-4 w-12 bg-[rgba(255,255,255,0.05)] rounded ml-auto" /></td>
                    </tr>
                  ))
                ) : members.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-8 py-12 text-center text-[var(--text-muted)]">
                      {fetching ? "Syncing members..." : "No members synced yet. Connect Slack in the Integrations page to see your team."}
                    </td>
                  </tr>
                ) : (
                  members.map((member) => (
                    <tr key={member.id} className="border-b border-[var(--border)] hover:bg-[rgba(255,255,255,0.02)] transition-colors">
                      <td className="px-8 py-6 font-medium">{member.name}</td>
                      <td className="px-8 py-6 text-[var(--text-muted)]">{member.email || "N/A"}</td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                          member.status === 'invited' 
                          ? 'border-[var(--border-gold)] bg-[rgba(217,119,6,0.08)] text-[var(--gold)]' 
                          : 'border-[var(--border)] bg-[rgba(255,255,255,0.03)] text-[var(--text-muted)]'
                        }`}>
                          {member.status === 'invited' && <Send className="h-3 w-3" />}
                          {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <button
                          type="button"
                          onClick={() => void sendInvite(member.slack_id)}
                          disabled={invitingId === member.slack_id || member.status === "invited"}
                          className={`btn-primary px-4 py-2 text-xs gap-2 inline-flex items-center ${
                            member.status === "invited" ? "opacity-50 cursor-not-allowed" : ""
                          }`}
                          style={{ minWidth: "100px", justifyContent: "center" }}
                        >
                          {invitingId === member.slack_id ? (
                            "Sending..."
                          ) : member.status === "invited" ? (
                            <>Invited <Check className="h-3.5 w-3.5" /></>
                          ) : (
                            <>Invite <UserPlus className="h-3.5 w-3.5" /></>
                          )}
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
