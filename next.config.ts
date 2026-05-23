import type { NextConfig } from 'next'
import { API_BASE_URL } from './app/api/client/apiConfig'
import { proxyAllowedHosts } from './app/api/proxy-image/allowedHosts'

const imageHosts = new Set<string>(proxyAllowedHosts())
try {
  imageHosts.add(new URL(API_BASE_URL).hostname.toLowerCase())
} catch {
  /* ignore invalid API_BASE_URL at build time */
}

const nextConfig: NextConfig = {
  images: {
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [384, 640, 828, 1080],
    imageSizes: [128, 256, 384, 512],
    remotePatterns: [...imageHosts].map((hostname) => ({
      protocol: 'https' as const,
      hostname,
      pathname: '/**'
    }))
  }
}

export default nextConfig
