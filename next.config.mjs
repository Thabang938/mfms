/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: true, // enable Turbopack
  },
  webpack: (config) => {
    config.resolve.alias['@'] = path.resolve('./');
    return config;
  },
};

export default nextConfig;
