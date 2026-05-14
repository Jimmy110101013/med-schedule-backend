"use client";

import { useEffect, useRef } from "react";
import { toast } from "sonner";

const POLL_MS = 5 * 60 * 1000;
const VERSION_URL = "/version.json";

async function fetchRemoteVersion(): Promise<string | null> {
  try {
    const res = await fetch(`${VERSION_URL}?t=${Date.now()}`, { cache: "no-store" });
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}

export function VersionWatcher() {
  const baselineRef = useRef<string | null>(null);
  const notifiedRef = useRef(false);

  useEffect(() => {
    const current = process.env.NEXT_PUBLIC_APP_VERSION ?? null;
    if (!current) return;
    baselineRef.current = current;

    let cancelled = false;

    const check = async () => {
      if (cancelled || notifiedRef.current) return;
      const remote = await fetchRemoteVersion();
      if (!remote || remote === baselineRef.current) return;
      notifiedRef.current = true;
      toast("新版本可用", {
        description: `${baselineRef.current} → ${remote}`,
        duration: Infinity,
        action: {
          label: "重新整理",
          onClick: () => window.location.reload(),
        },
      });
    };

    void check();
    const interval = window.setInterval(check, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") void check();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, []);

  return null;
}
