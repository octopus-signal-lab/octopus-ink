import path from "node:path";
import type { NextConfig } from "next";

const dev = process.env.NODE_ENV !== "production";
const tauriBuild = process.env.TAURI_BUILD === "1";

/* Defense-in-depth headers. The Markdown XSS vector is already neutralised by
   DOMPurify; this CSP is a second layer. Dev needs 'unsafe-eval' + ws for HMR.
   Note: a static export ignores these — set them at the host in that case. */
const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "style-src 'self' 'unsafe-inline'",
  `script-src 'self' 'unsafe-inline'${dev ? " 'unsafe-eval'" : ""}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  `connect-src 'self'${dev ? " ws:" : ""}`,
  "form-action 'self'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: csp },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "X-Frame-Options", value: "DENY" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), interest-cohort=()",
  },
];

const nextConfig: NextConfig = {
  ...(tauriBuild
    ? {
        output: "export" as const,
      }
    : {}),
  // Keep file tracing scoped to this app only (it lives in a shared ecosystem root).
  outputFileTracingRoot: path.join(__dirname),
  ...(tauriBuild
    ? {}
    : {
        async headers() {
          return [{ source: "/:path*", headers: securityHeaders }];
        },
      }),
};

export default nextConfig;
