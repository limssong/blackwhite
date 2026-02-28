/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/blackwhite' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/blackwhite/' : '',
  images: { unoptimized: true },
};

export default nextConfig;
