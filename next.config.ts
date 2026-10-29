import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";

// Content-Security-Policy without nonces (Next's "Without Nonces" guide): a per-request nonce would make every page render
// per request, and this site is prerendered. So scripts are 'self' plus 'unsafe-inline' (Next's own inline scripts, the
// language chooser's InlineScript) and only the third-party hosts the site really loads: Razorpay Checkout, and the optional
// Google Analytics / Meta pixel (after cookie consent).
const csp = (directives: Record<string, string>) => Object.entries(directives).map(([k, v]) => (v ? `${k} ${v}` : k)).join("; ");
const analytics = "https://www.googletagmanager.com https://*.google-analytics.com https://*.analytics.google.com https://www.facebook.com https://connect.facebook.net";
const sitePolicy = csp({
  "default-src": "'self'",
  "script-src": `'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""} https://checkout.razorpay.com https://cdn.razorpay.com https://www.googletagmanager.com https://connect.facebook.net`,
  "style-src": "'self' 'unsafe-inline'",
  "img-src": "'self' data: blob: https://*.google-analytics.com https://www.googletagmanager.com https://www.facebook.com",
  "font-src": "'self' data:",
  "media-src": "'self' blob:",
  "connect-src": `'self' https://api.razorpay.com https://lumberjack.razorpay.com ${analytics}`,
  "frame-src": "https://api.razorpay.com https://checkout.razorpay.com https://iframe.mediadelivery.net",
  "object-src": "'none'",
  "base-uri": "'self'",
  "form-action": "'self'",
  "frame-ancestors": "'none'",
});
// The Payload admin is a separate app with its own inline scripts and styles and no third parties: same-origin only.
const adminPolicy = csp({
  "default-src": "'self'",
  "script-src": `'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "style-src": "'self' 'unsafe-inline'",
  "img-src": "'self' data: blob: https://www.gravatar.com", // Payload shows the signed-in person's Gravatar
  "font-src": "'self' data:",
  "media-src": "'self' blob:",
  "connect-src": "'self'",
  "object-src": "'none'",
  "base-uri": "'self'",
  "form-action": "'self'",
  "frame-ancestors": "'none'",
});

// Baseline security headers for every response.
const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), browsing-topics=()" },
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
];

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  poweredByHeader: false,
  // Review photos (up to 4 MB, checked again on the server) travel in a server action; the default limit is 1 MB.
  experimental: { serverActions: { bodySizeLimit: "5mb" } },
  images: { formats: ["image/avif", "image/webp"] },
  // Internal collections are hidden from the admin's client config for everyone, so opening their address by hand crashed
  // the page (React #419). Send those addresses to Today instead.
  async redirects() {
    return [{ source: "/admin/collections/:slug(review-photos|lesson-progress|otp-codes)/:path*", destination: "/admin", permanent: false }];
  },
  async headers() {
    // Later rules win for the same header, so /admin gets its own policy.
    return [
      { source: "/:path*", headers: [...securityHeaders, { key: "Content-Security-Policy", value: sitePolicy }] },
      { source: "/admin/:path*", headers: [{ key: "Content-Security-Policy", value: adminPolicy }] },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default withPayload(nextConfig);
