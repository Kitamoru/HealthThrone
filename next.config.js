// Исправленный next.config.js
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', '') || '',
      'supabase.co'
    ],
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
              "img-src 'self' data: https://*.supabase.co; " + 
              "connect-src 'self' https://api.telegram.org https://*.supabase.co; " +
              "frame-ancestors 'self' https://*.telegram.org;"
          }
        ]
      }
    ];
  },

// Проверяем наличие анализатора только при необходимости
if (process.env.ANALYZE) {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
}
