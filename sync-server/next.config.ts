import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: '..',
  },
  allowedDevOrigins: ['*'],
};

export default nextConfig;
