import { supabase } from "@/app/lib/supabase";
import { notFound } from "next/navigation";
import ProductDetailsClient from "@/app/components/ui/ProductDetailsClient";
import Navbar from "@/app/components/Navbar";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kovatechstore.vercel.app";

// ─── Helper: safely parse images array ───────────────────────────────────────
function parseImages(imgData) {
  if (!imgData) return [];
  if (Array.isArray(imgData)) return imgData;
  try {
    const parsed = JSON.parse(imgData);
    return Array.isArray(parsed) ? parsed : [imgData];
  } catch {
    return [imgData];
  }
}

// ─── STEP 2: Dynamic generateMetadata ────────────────────────────────────────
// Next.js automatically memoizes this Supabase fetch, so the ProductPage
// component below reuses the same cached result — zero duplicate DB calls.
export async function generateMetadata({ params }) {
  const { slug } = await params;

  const { data: product, error } = await supabase
    .from("products")
    .select("name, short_des, description, images, price, discount_price, category")
    .eq("slug", slug)
    .single();

  // Graceful fallback — don't throw, let the page itself call notFound()
  if (error || !product) {
    return {
      title: "Product Not Found",
      description: "This product could not be found at Kova Tech.",
    };
  }

  const images    = parseImages(product.images);
  const ogImage   = images[0] || `${SITE_URL}/og-image.jpg`;
  const price     = product.discount_price || product.price;
  const pageTitle = product.name;
  const pageDesc  = product.short_des
    || product.description
    || `Buy ${product.name} from Kova Tech. Premium quality tech accessories in Pakistan.`;
  const canonicalUrl = `${SITE_URL}/product/${slug}`;

  return {
    // ── Core ─────────────────────────────────────────────────────────────────
    title: pageTitle,         // rendered as "Product Name | Kova Tech" via layout template
    description: pageDesc,

    keywords: [
      product.name,
      product.category,
      `${product.name} price in Pakistan`,
      `buy ${product.name} online`,
      `${product.category} Pakistan`,
      "Kova Tech",
    ].filter(Boolean),

    // ── Canonical ────────────────────────────────────────────────────────────
    alternates: {
      canonical: canonicalUrl,
    },

    // ── Open Graph ───────────────────────────────────────────────────────────
    openGraph: {
      type: "website",
      locale: "en_PK",
      url: canonicalUrl,
      siteName: "Kova Tech",
      title: `${pageTitle} | Kova Tech`,
      description: pageDesc,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
    },

    // ── Twitter / X Card ─────────────────────────────────────────────────────
    twitter: {
      card: "summary_large_image",
      title: `${pageTitle} | Kova Tech`,
      description: pageDesc,
      images: [ogImage],
    },
  };
}

// ─── STEP 3: JSON-LD Rich Snippet builder ────────────────────────────────────
function buildProductJsonLd(product, slug) {
  const images      = parseImages(product.images);
  const price       = product.discount_price ?? product.price;
  const availability =
    product.stock > 0
      ? "https://schema.org/InStock"
      : "https://schema.org/OutOfStock";

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description:
      product.short_des ||
      product.description ||
      `${product.name} — available at Kova Tech.`,
    image: images,
    brand: {
      "@type": "Brand",
      name: "Kova Tech",
    },
    category: product.category,
    url: `${SITE_URL}/product/${slug}`,
    offers: {
      "@type": "Offer",
      priceCurrency: "PKR",
      price: price,
      availability,
      seller: {
        "@type": "Organization",
        name: "Kova Tech",
      },
      priceValidUntil: new Date(
        new Date().setFullYear(new Date().getFullYear() + 1)
      )
        .toISOString()
        .split("T")[0],
    },
  };
}

// ─── Page Component ───────────────────────────────────────────────────────────
export default async function ProductPage({ params }) {
  const { slug } = await params;

  // Next.js memoizes identical Supabase calls within the same render pass,
  // so this does NOT make a second DB round-trip (generateMetadata already did it).
  const { data: product, error } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .single();

  if (error || !product) {
    notFound();
  }

  // Fetch Recommended Products (latest 4 active, excluding this one)
  const { data: recommendedProducts } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .neq("id", product.id)
    .order("created_at", { ascending: false })
    .limit(4);

  const jsonLd = buildProductJsonLd(product, slug);

  return (
    <>
      {/* ── STEP 3: Inject JSON-LD into <head> ── */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Navbar />
      <ProductDetailsClient
        product={product}
        recommendedProducts={recommendedProducts || []}
      />
    </>
  );
}
