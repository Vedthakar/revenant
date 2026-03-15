"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  url: string;
  icon: LucideIcon;
}

interface NavBarProps {
  items: NavItem[];
  className?: string;
}

export function NavBar({ items, className }: NavBarProps) {
  const [activeTab, setActiveTab] = useState(items[0].name);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div
      className={cn(
        "fixed bottom-0 sm:bottom-auto sm:top-[88px] left-1/2 -translate-x-1/2 z-50",
        "mb-6 sm:mb-0",
        className,
      )}
    >
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
        {items.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.name;

          return (
            <Link
              key={item.name}
              href={item.url}
              onClick={() => setActiveTab(item.name)}
              className={cn(
                "relative cursor-pointer text-xs font-semibold px-5 py-2 rounded-full transition-colors duration-200",
                isActive
                  ? "text-[#e8e0d0]"
                  : "text-[#8a7255] hover:text-[#c4ae8a]",
              )}
            >
              <span className="hidden md:inline tracking-wide">{item.name}</span>
              <span className="md:hidden">
                <Icon size={16} strokeWidth={2} />
              </span>

              {isActive && (
                <motion.div
                  layoutId="tubelight"
                  className="absolute inset-0 w-full rounded-full -z-10"
                  style={{ background: "rgba(83,52,21,0.55)" }}
                  initial={false}
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                >
                  {/* Ochre lamp bar + glow */}
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
  );
}
