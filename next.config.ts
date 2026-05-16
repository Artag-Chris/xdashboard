import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.80.22", "*.local"],
  async rewrites() {
    const gateway = process.env.API_GATEWAY_URL ?? "http://localhost:3000";
    return [
      {
        source: "/api/:path*",
        destination: `${gateway}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
