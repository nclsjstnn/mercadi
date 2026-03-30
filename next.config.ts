import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async redirects() {
    return [
      {
        // Short URL: mercadi.cl/t/booty → mercadi.cl/store/booty
        source: "/t/:slug",
        destination: "/store/:slug",
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
