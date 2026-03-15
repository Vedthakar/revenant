"use client";

import React, { useState } from "react";
import { Search, MessageCircle } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
}

interface HeroSectionProps {
  backgroundImage: string;
  logoText?: string;
  navLinks?: NavLink[];
  avatarSrcList?: string[];
  userCount?: number;
  title?: string;
  description?: string;
  placeholder?: string;
  ctaText?: string;
  onSubmit?: (email: string) => void;
  footerVersion?: string;
}

export default function HeroSection({
  backgroundImage,
  logoText = "Brand",
  navLinks = [],
  avatarSrcList = [],
  userCount = 0,
  title = "",
  description = "",
  placeholder = "Enter email",
  ctaText = "Submit",
  onSubmit = () => {},
  footerVersion = "",
}: HeroSectionProps) {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    onSubmit(email);
    setEmail("");
  };

  return (
    <>
      <header className="absolute inset-x-0 top-0 p-6 md:p-8 z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="text-2xl font-bold tracking-wider" style={{ color: "var(--text-hex)" }}>{logoText}</div>
          <nav className="hidden md:flex space-x-8 text-sm">
            {navLinks.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="transition-colors"
                style={{ color: "rgba(255,255,255,0.7)", textDecoration: "none", fontSize: 12, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase" }}
              >
                {label}
              </a>
            ))}
          </nav>
          <div className="flex items-center space-x-3">
            <button type="button" aria-label="Search" style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.6)", cursor: "pointer", display: "flex" }}>
              <Search size={18} />
            </button>
            <button
              type="button"
              style={{ border: "1px solid rgba(255,255,255,0.4)", borderRadius: 999, padding: "8px 20px", fontSize: 11, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", background: "transparent", color: "#fff", cursor: "pointer", transition: "all 0.2s" }}
            >
              Join
            </button>
          </div>
        </div>
      </header>

      <main
        className="w-full bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url(${backgroundImage})` }}
      >
        <div className="container mx-auto h-screen flex items-center px-6 md:px-8">
          <div className="w-full md:w-1/2 lg:w-2/5">
            {avatarSrcList.length > 0 && (
              <div className="flex items-center mb-5">
                <div className="flex -space-x-2">
                  {avatarSrcList.map((src, idx) => (
                    <img
                      key={idx}
                      className="h-7 w-7 rounded-full"
                      src={src}
                      alt={`User ${idx + 1}`}
                      style={{ border: "2px solid rgba(255,255,255,0.2)" }}
                    />
                  ))}
                </div>
                <p className="ml-3 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
                  &lt;{userCount.toLocaleString()} users have joined
                </p>
              </div>
            )}

            <h1
              className="font-bold leading-tight mb-4"
              style={{ fontSize: "clamp(36px, 5vw, 64px)", color: "#ffffff", letterSpacing: "-0.03em" }}
            >
              {title}
            </h1>

            <p className="max-w-md mb-8" style={{ fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: 1.7 }}>
              {description}
            </p>

            <form
              className="flex w-full max-w-sm"
              onSubmit={handleSubmit}
              aria-label="Waitlist signup"
            >
              <label htmlFor="hero-email" className="sr-only">Email address</label>
              <input
                id="hero-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={placeholder}
                required
                style={{ flex: 1, padding: "12px 16px", borderRadius: "10px 0 0 10px", border: "none", outline: "none", background: "rgba(255,255,255,0.95)", color: "#0a0a0a", fontSize: 14 }}
              />
              <button
                type="submit"
                style={{ background: "#ffffff", color: "#0a0a0a", fontWeight: 700, padding: "12px 18px", borderRadius: "0 10px 10px 0", border: "none", cursor: "pointer", fontSize: 12, letterSpacing: "0.08em", textTransform: "uppercase", whiteSpace: "nowrap", transition: "all 0.2s" }}
              >
                {ctaText}
              </button>
            </form>
          </div>
        </div>
      </main>

      <footer className="absolute inset-x-0 bottom-0 p-6 md:p-8">
        <div className="container mx-auto flex justify-between items-center">
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", textTransform: "uppercase" }}>{footerVersion}</div>
          <button
            type="button"
            aria-label="Open chat"
            style={{ background: "rgba(255,255,255,0.1)", backdropFilter: "blur(8px)", borderRadius: "50%", width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center", border: "none", color: "rgba(255,255,255,0.7)", cursor: "pointer", transition: "all 0.2s" }}
          >
            <MessageCircle size={18} />
          </button>
        </div>
      </footer>
    </>
  );
}
