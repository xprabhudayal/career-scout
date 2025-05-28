/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Don't resolve 'fs' module on the client to prevent this error
      config.resolve.fallback = {
        fs: false,
        net: false,
        tls: false,
        path: false,
        child_process: false,
        crypto: false
      };
    }
    return config;
  },
  // External packages that should be transpiled for client-side
  transpilePackages: ['@vapi-ai/web'],
  // For modules that should be bundled by the server
  serverExternalPackages: ['@nodelib/fs.scandir']
};

export default nextConfig;
