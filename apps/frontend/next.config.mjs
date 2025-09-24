/** @type {import('next').NextConfig} */
const nextConfig = {
  // Vercel handles output automatically - don't override unless needed
  output: process.env.STATIC_EXPORT === 'true' ? 'export' : undefined,
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true,
  
  // Image optimization for static export
  images: {
    unoptimized: process.env.STATIC_EXPORT === 'true'
  },

  // Remove trailing slash for better Vercel compatibility
  trailingSlash: false,

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
