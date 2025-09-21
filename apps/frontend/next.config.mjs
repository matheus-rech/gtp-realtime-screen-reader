/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are available by default in Next.js 14
  output: process.env.NODE_ENV === 'production' && process.env.STATIC_EXPORT === 'true' ? 'export' : 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization for static export
  images: {
    unoptimized: process.env.STATIC_EXPORT === 'true'
  },

  // Trailing slash for consistent routing
  trailingSlash: true,

  // Environment variables
  env: {
    NEXT_PUBLIC_BACKEND_URL: process.env.NEXT_PUBLIC_BACKEND_URL
  },

  // Webpack configuration for better performance
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
      };
    }
    return config;
  },
};

export default nextConfig;
