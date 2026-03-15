"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrainCircuit } from "lucide-react";
import { setAccessToken, AUTH_ENGINEER_KEY } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const name = email.split("@")[0];
    const mockUser = {
      id: 1,
      email,
      username: name,
      full_name: name.charAt(0).toUpperCase() + name.slice(1),
      bio: "",
      habit_score: 82,
      onboarding_complete: true,
      is_admin: true,
      created_at: new Date().toISOString(),
    };

    setAccessToken("rev_token_" + Date.now());
    if (typeof window !== "undefined") {
      window.localStorage.setItem(AUTH_ENGINEER_KEY, JSON.stringify(mockUser));
    }

    setTimeout(() => router.push("/dashboard"), 300);
  };

  return (
    <div className="rev-page" style={{ minHeight: "100vh", color: "white", position: "relative" }}>
      <div className="rev-noise" style={{ position: "absolute", inset: 0, pointerEvents: "none" }} />

      {/* Nav — matches homepage */}
      <header className="fixed top-0 left-0 z-50 flex w-full items-center border-b border-black/10 bg-white p-2 text-black md:top-4 md:left-1/2 md:w-[calc(100%-2rem)] md:max-w-[1240px] md:-translate-x-1/2 md:border md:px-2 md:py-[8px]">
        <nav className="flex w-full items-center justify-between gap-4">
          <Link href="/" className="flex items-center gap-3 px-2 font-ui-mono text-sm tracking-[-0.28px]">
            <span className="flex size-6 items-center justify-center bg-black text-white">
              <BrainCircuit size={14} />
            </span>
            <span className="font-medium uppercase">REVENANT</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link href="/signup" className="bg-black px-2 py-1.5 font-ui-mono text-sm tracking-[-0.28px] text-white transition-colors hover:bg-black/85">
              START PILOT
            </Link>
          </div>
        </nav>
      </header>

      {/* Login */}
      <main className="relative z-10 flex min-h-screen items-center justify-center px-6 pt-20">
        <div className="w-full max-w-[420px]">
          <div className="mb-8 flex items-center gap-2">
            <div className="size-[5.82px] bg-white" />
            <span className="font-ui-mono text-sm tracking-[-0.28px] text-white">OPERATOR LOGIN</span>
          </div>

          <h1 className="font-display text-4xl leading-[1.1] text-white md:text-5xl">
            Return to
            <br />
            Revenant control.
          </h1>
          <p className="mt-4 max-w-[380px] text-base leading-[1.4] text-white/50">
            Sign in to review engineer signals, inspect promoted memory, and open the founder mentor console.
          </p>

          <form className="mt-10 flex flex-col gap-5" onSubmit={handleSubmit}>
            <label className="flex flex-col gap-2">
              <span className="font-ui-mono text-xs tracking-[-0.28px] text-white/40">EMAIL</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="omar@trellis.com"
                required
                className="font-ui-mono"
                style={{
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                  color: "white",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="font-ui-mono text-xs tracking-[-0.28px] text-white/40">PASSWORD</span>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="font-ui-mono"
                style={{
                  padding: "12px 16px",
                  border: "1px solid rgba(255,255,255,0.1)",
                  background: "rgba(255,255,255,0.03)",
                  color: "white",
                  fontSize: 14,
                  outline: "none",
                }}
              />
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="font-ui-mono"
              style={{
                marginTop: 8,
                padding: "12px 24px",
                background: "white",
                color: "black",
                fontSize: 14,
                fontWeight: 500,
                letterSpacing: "-0.28px",
                border: "none",
                cursor: "pointer",
                textTransform: "uppercase",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? "LOGGING IN..." : "LOG IN"}
            </button>
          </form>

          <p className="mt-6 font-ui-mono text-sm text-white/30">
            No account?{" "}
            <Link href="/signup" className="text-[#ffb25d] transition-colors hover:text-[#ffb25d]/80">
              Create one
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}
