import type { NextConfig } from 'next'
import { withPostHogConfig } from '@posthog/nextjs-config'

const nextConfig: NextConfig = {
  /* config options here */
  async headers() {
    return [
      {
        source: '/manifest.json',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: '*',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'X-Requested-With, content-type, Authorization',
          },
        ],
      },
    ]
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    localPatterns: [
      {
        pathname: '/api/og/**',
      },
    ],
  },
}

const POSTHOG_PERSONAL_API_KEY = process.env.POSTHOG_PERSONAL_API_KEY
const POSTHOG_PROJECT_ID = process.env.POSTHOG_PROJECT_ID

const finalConfig =
  POSTHOG_PERSONAL_API_KEY && POSTHOG_PROJECT_ID
    ? withPostHogConfig(nextConfig, {
        personalApiKey: POSTHOG_PERSONAL_API_KEY,
        envId: POSTHOG_PROJECT_ID,
        host: 'https://us.posthog.com',
        sourcemaps: { enabled: true, deleteAfterUpload: true },
      })
    : nextConfig

export default finalConfig
