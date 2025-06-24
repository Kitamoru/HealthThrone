const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      ...(process.env.NEXT_PUBLIC_SUPABASE_URL 
        ? [process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '')] 
        : []
      ),
      'supabase.co'
    ].filter(Boolean), // Фильтруем пустые значения
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
  }
}; // Фикс: добавили закрывающую фигурную скобку для nextConfig

// Проверяем наличие анализатора
if (process.env.ANALYZE) {
  const withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
  module.exports = withBundleAnalyzer(nextConfig);
} else {
  module.exports = nextConfig;
}
