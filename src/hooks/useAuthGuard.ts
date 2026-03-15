"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";

import { apiFetch, clearAccessToken, getAccessToken } from "@/lib/api";
import type { EngineerSummary } from "@/types/symbiote";

interface UseAuthGuardOptions {
  requireAdmin?: boolean;
}

export function useAuthGuard(options: UseAuthGuardOptions = {}) {
  const { requireAdmin = false } = options;
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<EngineerSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const token = getAccessToken();
    const next = encodeURIComponent(pathname || "/dashboard");

    if (!token) {
      router.replace(`/login?next=${next}`);
      return;
    }

    apiFetch<EngineerSummary>("/api/auth/me")
      .then((engineer) => {
        if (!active) {
          return;
        }
        if (requireAdmin && !engineer.is_admin) {
          router.replace("/dashboard");
          return;
        }
        setUser(engineer);
        setLoading(false);
      })
      .catch(() => {
        clearAccessToken();
        if (active) {
          router.replace(`/login?next=${next}`);
        }
      });

    return () => {
      active = false;
    };
  }, [pathname, requireAdmin, router]);

  return { user, loading };
}
