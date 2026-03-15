"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
      className={className}
      style={{
        width: 36,
        height: 36,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 10,
        border: "1px solid var(--border-hex)",
        background: "transparent",
        color: "var(--muted-hex)",
        cursor: "pointer",
        transition: "all 0.2s",
        flexShrink: 0,
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-hi-hex)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--text-hex)";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLButtonElement).style.borderColor = "var(--border-hex)";
        (e.currentTarget as HTMLButtonElement).style.color = "var(--muted-hex)";
      }}
    >
      {theme === "dark"
        ? <Sun size={14} strokeWidth={2} />
        : <Moon size={14} strokeWidth={2} />
      }
    </button>
  );
}
