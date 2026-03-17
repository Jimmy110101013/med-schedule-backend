import type { NextConfig } from "next";

const isTauri = process.env.TAURI_ENV_PLATFORM !== undefined;

const nextConfig: NextConfig = {
  ...(isTauri ? { output: "export" } : {}),
  images: { unoptimized: true },
};

export default nextConfig;
