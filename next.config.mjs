/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    // This allows the build to succeed even with eslint warnings
    ignoreDuringBuilds: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  webpack: (config) => {
    config.resolve.alias.canvas = false;
    return config;
  },
};

export default nextConfig;
