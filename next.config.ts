import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
  transpilePackages: ["pdfjs-dist"],
};

export default nextConfig;

initOpenNextCloudflareForDev();
