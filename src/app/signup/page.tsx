"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { apiFetch, setAccessToken, storeEngineerSnapshot } from "@/lib/api";
import type { EngineerSummary, LoginResponse } from "@/types/symbiote";

export default function SignupPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [nextPath, setNextPath] = useState("/integrations");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/integrations");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      await apiFetch<EngineerSummary>("/api/auth/signup", {
        method: "POST",
        auth: false,
        json: {
          email,
          username,
          password,
          full_name: fullName,
        },
      });

      const login = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        auth: false,
        json: { email, password },
      });

      setAccessToken(login.access_token);
      storeEngineerSnapshot(login);
      router.push(nextPath);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to create your account");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-6xl items-center px-6 py-16">
        <div className="grid w-full gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="glass rounded-[32px] p-8 md:p-12">
            <span className="tag tag-gold">Engineer onboarding</span>
            <h1 className="mt-6 text-5xl font-semibold leading-tight">Create your AI Symbiote profile.</h1>
            <p className="mt-6 max-w-xl text-base leading-8 text-[var(--text-muted)]">
              Connect your engineering activity, build a living memory of your habits, and start with a dashboard that shows what is helping you ship better.
            </p>
            <div className="mt-10 grid gap-4 md:grid-cols-3">
              {[
                ["GitHub telemetry", "Batch scoring from commits, reviews, and issue activity."],
                ["Nango connect", "User OAuth lives in the integrations flow, not in fragile custom code."],
                ["Moorcheh memory", "Personal history and promoted best moments stay queryable over time."],
              ].map(([title, copy]) => (
                <div key={title} className="rounded-[22px] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-5">
                  <p className="text-sm font-semibold text-[var(--text)]">{title}</p>
                  <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">{copy}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="card rounded-[32px] p-8 md:p-10">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[var(--text-muted)]">Sign up</p>
            <form className="mt-6 grid gap-5" onSubmit={handleSubmit}>
              <label className="grid gap-2 text-sm text-[var(--text-muted)]">
                Full name
                <input className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[var(--text)] outline-none" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Ada Lovelace" />
              </label>
              <label className="grid gap-2 text-sm text-[var(--text-muted)]">
                Email
                <input className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[var(--text)] outline-none" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
              </label>
              <label className="grid gap-2 text-sm text-[var(--text-muted)]">
                Username
                <input className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[var(--text)] outline-none" value={username} onChange={(event) => setUsername(event.target.value)} placeholder="ada" required />
              </label>
              <label className="grid gap-2 text-sm text-[var(--text-muted)]">
                Password
                <input className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[var(--text)] outline-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 8 characters" required />
              </label>

              {error ? <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}

              <button type="submit" className="btn-primary mt-2 justify-center" disabled={submitting}>
                {submitting ? "Creating account..." : "Create account"}
              </button>
            </form>

            <p className="mt-6 text-sm text-[var(--text-muted)]">
              Already onboarded? <Link href="/login" className="text-[var(--gold)]">Log in</Link>
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
