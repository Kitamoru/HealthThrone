
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ['framer-motion']
  },
  images: {
    domains: [],
    unoptimized: true
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'ALLOWALL'
          }
        ]
      }
    ];
  },
  allowedDevOrigins: ['replit.dev', 'replit.co']
};

module.exports = nextConfig;
