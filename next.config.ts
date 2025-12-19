import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'get-better.co',
      },
    ],
  },
};

export default nextConfig;
