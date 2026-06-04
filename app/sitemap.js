import { supabase } from "@/app/lib/supabase";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pioneerbroaststore.vercel.app";

// Force dynamic generation — sitemap must reflect live product list
export const dynamic = "force-dynamic";

export default async function sitemap() {
  // ── Static routes ─────────────────────────────────────────────────────────
  const staticRoutes = [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/cart`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE_URL}/category/earbuds`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/category/smartwatches`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/category/accessories`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
  ];

  // ── Dynamic product routes ─────────────────────────────────────────────────
  let productRoutes = [];

  try {
    const { data: products, error } = await supabase
      .from("products")
      .select("slug, updated_at, created_at")
      // .eq("is_active", true) // Removed strict is_active filter just in case some products don't have this field explicitly set
      .order("created_at", { ascending: false });

    if (error) {
      console.error("[sitemap.js] Supabase query error:", error);
    }

    if (!error && products) {
      productRoutes = products
        .filter((product) => product.slug) // Only include products with a valid slug
        .map((product) => {
          let dateStr = product.updated_at || product.created_at;
          let lastMod = dateStr ? new Date(dateStr) : new Date();
          // Fallback if date is invalid
          if (isNaN(lastMod.getTime())) {
            lastMod = new Date();
          }

          return {
            url: `${SITE_URL}/product/${product.slug}`,
            lastModified: lastMod,
            changeFrequency: "weekly",
            priority: 0.8,
          };
        });
    }
  } catch (err) {
    // Non-fatal: if DB is unreachable, return static routes only.
    // Google will re-crawl the sitemap on the next request.
    console.error("[sitemap.js] Failed to fetch products:", err);
  }

  return [...staticRoutes, ...productRoutes];
}
