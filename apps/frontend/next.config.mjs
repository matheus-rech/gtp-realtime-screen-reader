/** @type {import('next').NextConfig} */
const nextConfig = {
  // Server Actions are available by default in Next.js 14
  output: 'standalone',
  poweredByHeader: false,
  reactStrictMode: true,
  swcMinify: true
};

export default nextConfig;
