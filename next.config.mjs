/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    // اسمح بصور المدرّس من أي مصدر تستضيفه لاحقاً (CDN / Supabase / Vercel Blob)
    remotePatterns: [{ protocol: "https", hostname: "**" }],
  },
};

export default nextConfig;
