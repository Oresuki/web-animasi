import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";
const repo = "web-animasi";
const basePath = isProd ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  trailingSlash: true,
  images: { unoptimized: true },
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
};

export default nextConfig;