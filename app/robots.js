const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kovatechstore.vercel.app";

export default function robots() {
  return {
    rules: [
      {
        // Allow all well-behaved crawlers to index everything except admin
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/admin/"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
