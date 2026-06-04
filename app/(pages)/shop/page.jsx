import { supabase } from "@/app/lib/supabase";
import Navbar from "@/app/components/Navbar";
import ShopClient from "@/app/components/ui/ShopClient";

export const revalidate = 0;

export const metadata = {
  title: "Shop All Premium Gear | Pioneer Broast",
  description: "Browse our entire collection of premium smartwatches, earbuds, and accessories.",
};

export default async function ShopPage() {
  const { data: products, error } = await supabase
    .from("products")
    .select("*")
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching products:", error);
  }

  return (
    <main className="min-h-screen bg-white text-zinc-950">
      <Navbar />
      <ShopClient initialProducts={products || []} />
    </main>
  );
}
