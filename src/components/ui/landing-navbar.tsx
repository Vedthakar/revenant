"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Zap, BookOpen, BarChart2, LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

const navItems: NavItem[] = [
  { name: "Features", url: "#features", icon: Zap },
  { name: "How It Works", url: "#system", icon: BookOpen },
  { name: "Impact", url: "#impact", icon: BarChart2 },
];

export function LandingNavBar() {
  const [activeTab, setActiveTab] = useState(navItems[0].name);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 sm:px-10 h-16"
      style={{
        background: "rgba(13,9,4,0.80)",
        borderBottom: "1px solid rgba(232,224,208,0.07)",
        backdropFilter: "blur(20px)",
        WebkitBackdropFilter: "blur(20px)",
      }}
    >
      {/* Brand */}
      <Link href="/" className="flex items-center gap-2 shrink-0">
        <div className="relative w-8 h-8 rounded-lg overflow-hidden">
          <Image src="/logo.png" alt="Revenant" fill sizes="32px" className="object-contain" />
        </div>
        <span className="text-[#e8e0d0] font-semibold text-base tracking-tight">Revenant</span>
      </Link>

      {/* Tubelight pill — centered absolutely */}
      <div className="absolute left-1/2 -translate-x-1/2 hidden sm:block">
        <div
          className="flex items-center gap-1 py-1 px-1 rounded-full"
          style={{
            background: "rgba(26,17,7,0.72)",
            border: "1px solid rgba(232,224,208,0.10)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            boxShadow: "0 8px 32px rgba(0,0,0,0.40), 0 1px 0 rgba(232,224,208,0.04) inset",
          }}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.name;

            return (
              <Link
                key={item.name}
                href={item.url}
                onClick={() => setActiveTab(item.name)}
                className={cn(
                  "relative cursor-pointer text-xs font-semibold px-5 py-2 rounded-full transition-colors duration-200",
                  isActive ? "text-[#e8e0d0]" : "text-[#8a7255] hover:text-[#c4ae8a]",
                )}
              >
                <span className="tracking-wide">{item.name}</span>

                {isActive && (
                  <motion.div
                    layoutId="tubelight"
                    className="absolute inset-0 w-full rounded-full -z-10"
                    style={{ background: "rgba(83,52,21,0.55)" }}
                    initial={false}
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  >
                    <div
                      className="absolute -top-[6px] left-1/2 -translate-x-1/2 w-8 h-[3px] rounded-t-full"
                      style={{ background: "#d97708" }}
                    >
                      <div
                        className="absolute rounded-full blur-md"
                        style={{
                          width: "48px", height: "20px",
                          background: "rgba(217,119,8,0.28)",
                          top: "-8px", left: "-8px",
                        }}
                      />
                      <div
                        className="absolute rounded-full blur-sm"
                        style={{
                          width: "32px", height: "14px",
                          background: "rgba(217,119,8,0.22)",
                          top: "-4px", left: "0",
                        }}
                      />
                      <div
                        className="absolute rounded-full blur-sm"
                        style={{
                          width: "16px", height: "10px",
                          background: "rgba(240,160,48,0.30)",
                          top: "-2px", left: "8px",
                        }}
                      />
                    </div>
                  </motion.div>
                )}
              </Link>
            );
          })}
        </div>
      </div>

      {/* Auth actions */}
      <div className="flex items-center gap-3 shrink-0">
        <Link
          href="/login"
          className="text-[#8a7255] hover:text-[#c4ae8a] text-sm font-medium transition-colors duration-200"
        >
          Sign in
        </Link>
        <Link
          href="/signup"
          className="text-sm font-semibold px-4 py-1.5 rounded-full transition-colors duration-200"
          style={{
            background: "rgba(217,119,8,0.15)",
            border: "1px solid rgba(217,119,8,0.35)",
            color: "#f0a030",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(217,119,8,0.25)";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = "rgba(217,119,8,0.15)";
          }}
        >
          Sign Up
        </Link>
      </div>
    </header>
  );
}
