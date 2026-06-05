import { supabase } from "@/app/lib/supabase";
import MenuItemCard from "@/app/components/ui/MenuItemCard";
import Image from "next/image";
import Link from "next/link";
import Navbar from "./components/Navbar";
import HeroCarousel from "./components/ui/HeroCarousel";
import QuickFilters from "./components/ui/QuickFilters";

// Ye page har dafa fresh data fetch karega
export const revalidate = 0;

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pioneerbroaststore.vercel.app";

export default async function HomePage() {
  const { data: menuItems, error } = await supabase
    .from("menu_items")
    .select("*")
    .eq("is_available", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching menu_items:", error);
  }

  // Group items by category
  const groupedItems = (menuItems || []).reduce((acc, item) => {
    const cat = item.category || "Other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  const categories = Object.keys(groupedItems).sort();

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": `${SITE_URL}/#website`,
        url: SITE_URL,
        name: "Pioneer Broast",
        description: "Premium Fast Food & Broast in Karachi",
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
        name: "Pioneer Broast",
        url: SITE_URL,
        logo: {
          "@type": "ImageObject",
          url: `${SITE_URL}/brandlogo.webp`,
        },
        description:
          "Leading tech store in Pakistan for smartwatches, earbuds, and premium accessories.",
      },
    ],
  };

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />

      {/* Premium Hero Carousel */}
      <HeroCarousel />

      {/* Quick Category Filters */}
      <QuickFilters />

      {/* Menu Sections */}
      <div className="py-10 sm:py-24 px-4 sm:px-12 max-w-420 mx-auto space-y-16">
        {!menuItems || menuItems.length === 0 ? (
          <div className="text-center py-20 text-zinc-500 border border-dashed border-zinc-300 rounded-2xl bg-zinc-50">
            <p className="text-lg font-medium">
              No menu items found. Please add them from the admin panel.
            </p>
          </div>
        ) : (
          categories.map((category) => (
            <section
              key={category}
              id={category.toLowerCase().replace(/\s+/g, "-")}
            >
              <div className="flex items-center justify-between mb-6 sm:mb-10">
                <h2 className="text-2xl sm:text-3xl font-black text-black tracking-tight uppercase">
                  {category}
                </h2>
                <div className="h-px bg-zinc-200 flex-1 ml-6"></div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {groupedItems[category].map((item) => (
                  <MenuItemCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </main>
  );
}
