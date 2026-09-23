/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
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
