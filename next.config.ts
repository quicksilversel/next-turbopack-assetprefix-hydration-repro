import type { NextConfig } from 'next'

/**
 * Serve _next/static from a cross-origin public CDN (jsDelivr) to reproduce the bug.
 * Set CDN_URL at build AND start, e.g.
 *   CDN_URL=https://cdn.jsdelivr.net/gh/<user>/<repo>@main
 * Leave CDN_URL unset to serve same-origin (the working control).
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  assetPrefix: process.env.CDN_URL ?? '',
  // Mirrors the affected production app. Does NOT fix the issue (included to show that).
  crossOrigin: 'anonymous',
}

export default nextConfig
