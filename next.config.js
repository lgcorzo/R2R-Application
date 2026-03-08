const config = {
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  output: 'standalone',
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
      };
    }
    return config;
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'github.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

// Temporarily disable Sentry integration to fix build issues
// TODO: Re-enable Sentry once auth token issues are resolved
module.exports = config;

// Commented out Sentry configuration until auth issues are resolved
/*
const { withSentryConfig } = require('@sentry/nextjs');

module.exports = withSentryConfig(config, {
  org: 'evgeny-pl',
  project: 'r2r-dashboard',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
  telemetry: false,
  widenClientFileUpload: true,
  reactComponentAnnotation: {
    enabled: true,
  },
  tunnelRoute: '/monitoring',
  disableLogger: true,
  automaticVercelMonitors: true,
  errorHandler: (err, invokeErr, compilation) => {
    console.warn('Sentry error during build (non-fatal):', err.message);
    return false;
  },
  disableServerWebpackPlugin: true,
  disableClientWebpackPlugin: true,
});
*/
