/** @type {import('next').NextConfig} */
const nextConfig = process.env.VERCEL === '1'
  ? {}
  : { output: 'standalone', distDir: 'dist' };
export default nextConfig;
