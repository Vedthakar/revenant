import type { NextConfig } from "next";

const fastApiBaseUrl = process.env.FASTAPI_BASE_URL || "http://127.0.0.1:8000";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: "/api/auth/:path*",
        destination: `${fastApiBaseUrl}/api/auth/:path*`,
      },
      {
        source: "/api/integrations/:path*",
        destination: `${fastApiBaseUrl}/api/integrations/:path*`,
      },
      {
        source: "/api/webhooks/:path*",
        destination: `${fastApiBaseUrl}/api/webhooks/:path*`,
      },
      {
        source: "/api/dashboard/:path*",
        destination: `${fastApiBaseUrl}/api/dashboard/:path*`,
      },
      {
        source: "/api/admin/:path*",
        destination: `${fastApiBaseUrl}/api/admin/:path*`,
      },
    ];
  },
};

export default nextConfig;
