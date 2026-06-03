import { supabase } from "@/app/lib/supabase";
import ProductCard from "@/app/components/ui/ProductCard";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import HeroCarousel from "./components/ui/HeroCarousel";
import QuickFilters from "./components/ui/QuickFilters";

// Ye page har dafa fresh data fetch karega
export const revalidate = 0; 

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kovatechstore.vercel.app";

export default async function HomePage() {
  // Database se sirf active products fetch karein (ya sabhi agar is_active nahi hai)
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Kova Tech",
        description: "Premium Tech Accessories in Pakistan",
        potentialAction: [
          {
            "@type": "SearchAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
            },
            "query-input": "required name=search_term_string",
          },
        ],
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Kova Tech",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/logo.webp`,
        },
        description: "Leading tech store in Pakistan for smartwatches, earbuds, and premium accessories.",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar/>
      
      {/* Premium Hero Carousel */}
      <HeroCarousel />

      {/* Quick Category Filters */}
      <QuickFilters />

      {/* Featured Products Section */}
      <section id="featured" className="py-10 sm:py-24 px-4 sm:px-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-black tracking-tight">Featured Products</h2>
        </div>

        {/* Agar products nahi hain toh message show karein */}
        {!products || products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-300 rounded-2xl bg-zinc-50">
            <p className="text-lg font-medium">No products found. Admin panel se add karein.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-8">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

    </main>
  );
}