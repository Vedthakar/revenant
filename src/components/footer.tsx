"use client";

import Link from "next/link";
import { motion } from "framer-motion";

const ease = [0.22, 1, 0.36, 1] as const;

const footerLinks = [
  { href: "/features", label: "Product" },
  { href: "/tech-stack", label: "Architecture" },
  { href: "/integrations", label: "Integrations" },
  { href: "/login", label: "Login" },
];

export function Footer() {
  return (
    <motion.footer
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.6, ease }}
      className="w-full border-t-2 border-foreground px-6 py-8 lg:px-12"
    >
      <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-mono font-bold uppercase tracking-[0.15em] text-foreground">
            REVENANT
          </span>
          <span className="text-[10px] font-mono tracking-widest text-muted-foreground">
            {"(C) 2026 Revenant. Engineering memory that outlives its engineers."}
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {footerLinks.map((link, index) => (
            <motion.div
              key={link.href}
              initial={{ opacity: 0, y: 6 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 + index * 0.06, duration: 0.4, ease }}
            >
              <Link
                href={link.href}
                className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground transition-colors duration-200 hover:text-foreground"
              >
                {link.label}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.footer>
  );
}
