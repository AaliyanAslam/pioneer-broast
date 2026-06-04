import { supabase } from "@/app/lib/supabase";
import ProductCard from "@/app/components/ui/ProductCard";
import Navbar from "@/app/components/Navbar";
import { notFound } from "next/navigation";
import Link from "next/link";

export const revalidate = 0;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://pioneerbroaststore.vercel.app";

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();
  
  return {
    title: `${categoryName} | Pioneer Broast`,
    description: `Order the best and latest ${categoryName.toLowerCase()} in Karachi at Pioneer Broast. Enjoy premium quality, fast shipping, and Cash on Delivery.`,
    alternates: {
      canonical: `${SITE_URL}/category/${slug}`,
    },
    openGraph: {
      title: `${categoryName} | Pioneer Broast`,
      description: `Order the best and latest ${categoryName.toLowerCase()} in Karachi at Pioneer Broast.`,
      url: `${SITE_URL}/category/${slug}`,
      siteName: "Pioneer Broast",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${categoryName} | Pioneer Broast`,
      description: `Order the best and latest ${categoryName.toLowerCase()} in Karachi at Pioneer Broast.`,
    },
  };
}

export default async function CategoryPage({ params }) {
  const { slug } = await params;

  // Formatting slug to title case for display (e.g., 'smartwatches' -> 'Smartwatches')
  const categoryName = slug.charAt(0).toUpperCase() + slug.slice(1).toLowerCase();

  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .ilike("category", `%${slug}%`) // matches category names like 'Smartwatches', 'Earbuds', etc.
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching category products:", error);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <Navbar />
      
      <section className="py-16 px-6 sm:px-12 max-w-420 mx-auto min-h-[60vh]">
        <div className="mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></svg>
            Back to Store
          </Link>
        </div>
        <div className="mb-12 border-b border-zinc-100 pb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-black tracking-tight uppercase">
            {categoryName}
          </h1>
          <p className="text-zinc-500 mt-2 font-medium">
            Explore our premium collection of {categoryName.toLowerCase()}.
          </p>
        </div>

        {!products || products.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-zinc-200 rounded-3xl bg-zinc-50">
            <h3 className="text-lg font-bold text-black mb-2">No products found</h3>
            <p className="text-zinc-500">We currently don't have any active products in this category.</p>
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
