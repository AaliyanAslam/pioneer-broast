/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "uxbjiufquhotspsuwnkg.supabase.co", // Aapka Supabase domain
        port: "",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com", // Placeholder images
        port: "",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com", // Unsplash images permission add kardi
        port: "",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
