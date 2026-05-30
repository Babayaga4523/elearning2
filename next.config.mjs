/** @type {import('next').NextConfig} */
const nextConfig = {
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
          { key: "Strict-Transport-Security", value: "max-age=31536000; includeSubDomains" },
          // ── Content Security Policy ────────────────────────────────────────────
          // frame-src  : YouTube embeds in module viewers
          // child-src  : required by some browsers alongside frame-src
          // img-src    : allows data URIs (base64 thumbs) + external images
          // connect-src: WebSocket for HMR + standard HTTP
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline'",
              "style-src  'self' 'unsafe-inline'",
              "img-src    'self' data: blob: https:",
              "font-src   'self' data:",
              "connect-src 'self' ws: wss:",
              "frame-src  'self' https://www.youtube.com https://youtu.be",
              "child-src  'self' https://www.youtube.com",
            ].join("; "),
          }
        ],
      },
    ];
  },
};

export default nextConfig;
