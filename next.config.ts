import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  redirects: async () => [
    {
      source: '/(twitter|x)',
      destination: 'https://x.com/grailsmarket',
      permanent: true,
    },
    {
      source: '/github',
      destination: 'https://github.com/grailsmarket',
      permanent: true,
    },
    {
      source: '/(chat|discord)',
      destination: 'https://discord.com/invite/ZUyG3mSXFD',
      permanent: true,
    },
  ],
}

export default nextConfig
