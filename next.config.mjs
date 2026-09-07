/** @type {import('next').NextConfig} */
const isMobileBuild = process.env.BUILD_TARGET === "capacitor";

const nextConfig = {
  reactStrictMode: true,
  ...(isMobileBuild ? { output: "export" } : {}),
  images: {
    unoptimized: isMobileBuild
  }
};

export default nextConfig;
