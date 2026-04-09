import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // Allow HMR/fonts when the app is opened via http://127.0.0.1 (not only localhost)
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
