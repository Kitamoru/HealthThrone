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
  // Добавлено для поддержки частиц
  transpilePackages: ['react-tsparticles', 'tsparticles', 'tsparticles-engine'],
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer/'),
      // Добавлено для частиц
      fs: false,
      path: false,
      os: false,
    };
    
    return config;
  }
};

// Проверяем наличие анализатора только при необходимости
if (process.env.ANALYZE) {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
}
