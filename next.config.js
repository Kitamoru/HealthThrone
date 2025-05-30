const nextConfig = {
  reactStrictMode: true,
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
            key: 'Content-Security-Policy',
            value: 
              "default-src 'self'; " +
              "script-src 'self' 'unsafe-inline' https://telegram.org; " +
              "style-src 'self' 'unsafe-inline'; " +
              "img-src 'self' data:; " + 
              "connect-src 'self' https://api.telegram.org; " +
              "frame-ancestors 'self' https://*.telegram.org;"
          }
        ]
      }
    ];
  }
};

module.exports = nextConfig;
