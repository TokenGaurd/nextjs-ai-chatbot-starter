import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  // Next blocks cross-origin dev-asset requests by default, which trips anyone
  // who opens 127.0.0.1 while the dev server binds localhost. Dev-only.
  allowedDevOrigins: ['127.0.0.1', 'localhost'],
};

export default nextConfig;
