/** @type {import('next').NextConfig} */
const nextConfig = {
  // PostHog API calls use trailing slashes; don't redirect them through the proxy.
  skipTrailingSlashRedirect: true,
  async rewrites() {
    return [
      // PostHog reverse proxy so analytics aren't dropped by ad blockers
      { source: '/ingest/static/:path*', destination: 'https://us-assets.i.posthog.com/static/:path*' },
      { source: '/ingest/array/:path*', destination: 'https://us-assets.i.posthog.com/array/:path*' },
      { source: '/ingest/:path*', destination: 'https://us.i.posthog.com/:path*' },
      // "Tough One Tonight" — static, self-contained data viz built in the mariners project
      { source: '/tough-one', destination: '/tough-one.html' },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
        pathname: '**',
      },
    ],
  },
};

export default nextConfig;
