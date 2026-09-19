import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep demo/seed.json readable from the App Router on Vercel.
  outputFileTracingIncludes: {
    "/": ["./demo/seed.json"],
    "/api/**": ["./demo/seed.json"],
  },
  agentRules: false,
};

export default nextConfig;
