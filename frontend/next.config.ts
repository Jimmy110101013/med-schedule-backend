import { execSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;

function resolveVersion(): string {
  try {
    return execSync("git describe --tags --always --dirty", { stdio: ["ignore", "pipe", "ignore"] })
      .toString()
      .trim();
  } catch {
    try {
      const pkg = JSON.parse(readFileSync(join(process.cwd(), "package.json"), "utf8"));
      return `v${pkg.version}`;
    } catch {
      return "unknown";
    }
  }
}

const APP_VERSION = resolveVersion();

// Emit public/version.json so the deployed site exposes its current build.
try {
  const here = dirname(fileURLToPath(import.meta.url));
  const publicDir = join(here, "public");
  mkdirSync(publicDir, { recursive: true });
  writeFileSync(
    join(publicDir, "version.json"),
    JSON.stringify({ version: APP_VERSION, builtAt: new Date().toISOString() }) + "\n",
  );
} catch {
  // Non-fatal: dev fallback already covers the env var.
}

const nextConfig: NextConfig = {
  ...(isTauri ? { output: "export" } : {}),
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_APP_VERSION: APP_VERSION },
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
      {
        source: "/version.json",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0, must-revalidate" },
        ],
      },
    ];
  },
};

export default nextConfig;
