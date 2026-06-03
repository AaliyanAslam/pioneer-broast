"use client";
import { useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/app/lib/store";
import toast from "react-hot-toast";

export default function MenuItemCard({ item }) {
  // item corresponds to a row in 'menu_items'
  // schema: name, image_url, category, price, description, is_spicy, is_active
  const imageUrl = item.image_url || "https://via.placeholder.com/600";
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCartStore();

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    const success = addToCart(item);
    if (success) {
      toast.success(`${item.name} added to cart!`);
    }

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  return (
    <div className="group block bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-300 flex flex-col h-full relative">
      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-20 pointer-events-none">
        {item.is_spicy && (
          <span className="bg-[#e63946] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
            🌶️ Spicy
          </span>
        )}
      </div>

      {/* Image Block */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-50 border-b border-zinc-100 shrink-0">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          quality={80}
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />
      </div>

      {/* Content layout */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start gap-2 mb-1">
          <h3 className="text-base font-bold text-zinc-900 leading-tight">
            {item.name}
          </h3>
          <span className="text-base font-black text-[#e63946] shrink-0">
            Rs. {item.price}
          </span>
        </div>
        
        <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest mb-2">
          {item.category}
        </p>
        
        <p className="text-sm text-zinc-600 line-clamp-2 mb-4 flex-1">
          {item.description}
        </p>

        <button
          onClick={handleQuickAdd}
          disabled={isAdding}
          className="w-full bg-[#e63946]/10 text-[#e63946] border border-[#e63946]/20 font-bold text-sm uppercase tracking-widest py-3 rounded-xl transition-all duration-300 hover:bg-[#e63946] hover:text-white hover:border-[#e63946] active:scale-[0.98] flex items-center justify-center disabled:opacity-50"
        >
          {isAdding ? "Adding..." : "Add to Cart"}
        </button>
      </div>
    </div>
  );
}
