"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch, clearAccessToken, getAccessToken } from "@/lib/api";
import type { EngineerSummary } from "@/types/symbiote";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [engineer, setEngineer] = useState<EngineerSummary | null>(null);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      return;
    }

    apiFetch<EngineerSummary>("/api/auth/me")
      .then((me) => setEngineer(me))
      .catch(() => {
        clearAccessToken();
        setEngineer(null);
      });
  }, [pathname]);

  const navLinks = engineer
    ? [
        { href: "/dashboard", label: "Dashboard" },
        { href: "/integrations", label: "Integrations" },
        ...(engineer.is_admin ? [{ href: "/admin", label: "Admin" }] : []),
        { href: "/app", label: "Anna Console" },
      ]
    : [
        { href: "/features", label: "Features" },
        { href: "/tech-stack", label: "Tech Stack" },
        { href: "/login", label: "Login" },
      ];

  const primaryHref = engineer ? "/dashboard" : "/signup";
  const primaryLabel = engineer ? "Symbiote" : "Engineer Sign Up";

  const handleLogout = () => {
    clearAccessToken();
    setEngineer(null);
    router.push("/login");
  };

  return (
    <header
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        backdropFilter: "blur(24px)",
        WebkitBackdropFilter: "blur(24px)",
        background: "rgba(12,9,5,0.85)",
      }}
    >
      <div
        style={{
          maxWidth: 1280,
          margin: "0 auto",
          padding: "0 24px",
          minHeight: 76,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 24,
          flexWrap: "wrap",
        }}
      >
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <div style={{ position: "relative", width: 48, height: 48, flexShrink: 0 }}>
            <Image src="/logo.png" alt="Revenant" fill style={{ objectFit: "contain" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <span
              style={{
                color: "#e8e0d0",
                fontWeight: 800,
                fontSize: 12,
                letterSpacing: "0.3em",
                textTransform: "uppercase",
              }}
            >
              REVENANT
            </span>
            <span style={{ color: "#6b6456", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase" }}>
              AI Symbiote
            </span>
          </div>
        </Link>

        <nav style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                style={{
                  padding: "8px 16px",
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: "0.12em",
                  textTransform: "uppercase",
                  textDecoration: "none",
                  transition: "all 0.2s",
                  color: active ? "#d97706" : "#6b6456",
                  background: active ? "rgba(217,119,6,0.08)" : "transparent",
                }}
              >
                {link.label}
              </Link>
            );
          })}

          <Link
            href={primaryHref}
            style={{
              marginLeft: 8,
              padding: "10px 22px",
              borderRadius: 999,
              background: "#d97706",
              color: "#0c0905",
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              textDecoration: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 16px rgba(217,119,6,0.3)",
              transition: "all 0.2s",
            }}
          >
            {primaryLabel}
          </Link>

          {engineer ? (
            <button
              type="button"
              onClick={handleLogout}
              style={{
                padding: "10px 18px",
                borderRadius: 999,
                border: "1px solid rgba(255,255,255,0.08)",
                background: "transparent",
                color: "#e8e0d0",
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Logout
            </button>
          ) : null}
        </nav>
      </div>
    </header>
  );
}
