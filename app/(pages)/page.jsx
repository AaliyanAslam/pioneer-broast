import { supabase } from "@/app/lib/supabase";
import ProductCard from "@/app/components/ui/ProductCard";

// Ye page har dafa fresh data fetch karega
export const revalidate = 0; 

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kovatechstore.vercel.app";

export default async function HomePage() {
  // Database se sirf active products fetch karein
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
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
        publisher: {
          "@id": `${SITE_URL}/#organization`
        },
        potentialAction: {
          "@type": "SearchAction",
          target: {
            "@type": "EntryPoint",
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`
          },
          "query-input": "required name=search_term_string"
        }
      },
      {
        "@type": "Organization",
        "@id": `${SITE_URL}/#organization`,
        name: "Kova Tech",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/brandlogo.webp`
        },
        sameAs: [
          "https://www.facebook.com/kovatech",
          "https://www.instagram.com/kovatech"
        ]
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <main className="min-h-screen bg-black text-zinc-50">
      
      {/* Minimalist Hero Section */}
      <section className="py-24 px-6 sm:px-12 max-w-420 mx-auto text-center border-b border-zinc-900">
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-white">
          Next-Gen <span className="text-transparent bg-clip-text bg-linear-to-r from-zinc-400 to-zinc-100">Gear.</span>
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mx-auto mb-10">
          Upgrade your lifestyle with our premium selection of smartwatches, earbuds, and essential tech accessories. Delivered fast across Pakistan.
        </p>
      </section>

      {/* Product Grid Section */}
      <section className="py-16 px-6 sm:px-12 max-w-420 mx-auto">
        <div className="flex items-center justify-between mb-10">
          <h2 className="text-2xl font-bold text-white tracking-tight">New Arrivals</h2>
        </div>

        {/* Agar products nahi hain toh message show karein */}
        {!products || products.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
            <p>No products found. Admin panel se add karein.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
    </>
  );
}