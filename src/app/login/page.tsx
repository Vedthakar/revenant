"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import Navbar from "@/components/Navbar";
import { apiFetch, setAccessToken, storeEngineerSnapshot } from "@/lib/api";
import type { LoginResponse } from "@/types/symbiote";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nextPath, setNextPath] = useState("/dashboard");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setNextPath(params.get("next") || "/dashboard");
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const login = await apiFetch<LoginResponse>("/api/auth/login", {
        method: "POST",
        auth: false,
        json: { email, password },
      });
      setAccessToken(login.access_token);
      storeEngineerSnapshot(login);
      router.push(nextPath);
    } catch (caughtError) {
      setError(caughtError instanceof Error ? caughtError.message : "Unable to log in");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="page-shell min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-96px)] max-w-5xl items-center justify-center px-6 py-16">
        <section className="glass grid w-full max-w-4xl gap-8 rounded-[32px] p-8 md:grid-cols-[1fr_0.9fr] md:p-12">
          <div>
            <span className="tag">Engineer login</span>
            <h1 className="mt-6 text-5xl font-semibold leading-tight">Return to your habit dashboard.</h1>
            <p className="mt-6 max-w-lg text-base leading-8 text-[var(--text-muted)]">
              Sign in to review your latest score, inspect promoted techniques, and manage the integrations feeding the AI Symbiote brain.
            </p>
          </div>

          <form className="grid gap-5 rounded-[28px] border border-[var(--border)] bg-[rgba(255,255,255,0.02)] p-7" onSubmit={handleSubmit}>
            <label className="grid gap-2 text-sm text-[var(--text-muted)]">
              Email
              <input className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[var(--text)] outline-none" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@company.com" required />
            </label>
            <label className="grid gap-2 text-sm text-[var(--text-muted)]">
              Password
              <input className="rounded-2xl border border-[var(--border)] bg-[rgba(255,255,255,0.03)] px-4 py-3 text-[var(--text)] outline-none" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Your password" required />
            </label>

            {error ? <p className="rounded-2xl border border-red-500/40 bg-red-500/10 px-4 py-3 text-sm text-red-300">{error}</p> : null}

            <button type="submit" className="btn-primary justify-center" disabled={submitting}>
              {submitting ? "Logging in..." : "Log in"}
            </button>

            <p className="text-sm text-[var(--text-muted)]">
              No account yet? <Link href="/signup" className="text-[var(--gold)]">Create one</Link>
            </p>
          </form>
        </section>
      </main>
    </div>
  );
}
