import type { NextConfig } from 'next'

/**
 * assetPrefix is read from CDN_URL.
 *
 * The bug: `next build` WITHOUT CDN_URL (empty assetPrefix), then run the server
 * WITH a cross-origin CDN_URL (assetPrefix set at runtime). Under Turbopack the
 * page never hydrates. Under webpack it hydrates. Building WITH CDN_URL (baked)
 * also hydrates.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.CDN_URL ?? '',
}

export default nextConfig
