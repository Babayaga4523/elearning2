/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  
  // Suppress hydration warnings caused by browser extensions
  reactStrictMode: true,
  
  webpack: (config, { isServer }) => {
    if (!isServer) {
      // Suppress hydration warnings in development
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },

  async headers() {
    return [
      {
        // Apply to every route
        source: "/(.*)",
        headers: [
          // Prevent embedding in iframes — anti-clickjacking
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Prevent MIME type sniffing
          { key: "X-Content-Type-Options", value: "nosniff" },
          // Strict referrer — hides full URL when navigating to external sites
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // Disable browser features not needed by this app
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
          },
          // Disable DNS prefetch for privacy
          { key: "X-DNS-Prefetch-Control", value: "off" },
          // Force HTTPS for 1 year (enable only when on HTTPS in production)
          // { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
        ],
      },
    ];
  },
};

export default nextConfig;
