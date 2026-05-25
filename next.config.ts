import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  // Webpack bundling compile-time security scrubbing configuration
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // In client-side bundle, intercept and scrub SUPABASE_SERVICE_ROLE_KEY or service keys
      const webpack = require('webpack');
      config.plugins.push(
        new webpack.DefinePlugin({
          'process.env.SUPABASE_SERVICE_ROLE_KEY': JSON.stringify('SCRUBBED_FOR_CLIENT_SECURITY'),
          'process.env.SUPABASE_ADMIN_KEY': JSON.stringify('SCRUBBED_FOR_CLIENT_SECURITY'),
        })
      );
    }
    return config;
  },
};

export default nextConfig;

