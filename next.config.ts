import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow larger file uploads for OCR document scanning
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
};

export default nextConfig;

