"use client";
import { useState, useEffect } from "react";
import { useCartStore } from "@/app/lib/store";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function FloatingCartWidget() {
  const { cart, isCartOpen, setCartOpen } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Do not show on cart page, admin pages, or if cart drawer is open
  if (cart.length === 0 || isCartOpen || pathname === "/cart" || pathname.startsWith("/admin")) return null;

  const totalQuantity = cart.reduce((total, item) => total + item.quantity, 0);
  const subtotal = cart.reduce(
    (total, item) => total + (item.discount_price || item.price) * item.quantity,
    0
  );
  
  // Just show the first item image for preview
  const firstItem = cart[0];

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:bottom-6 sm:left-auto sm:right-6 sm:w-[380px] z-45 animate-in slide-in-from-bottom-10 fade-in duration-300 lg:hidden">
      <div 
        onClick={() => setCartOpen(true)}
        className="bg-black/85 backdrop-blur-xl text-white p-2 pr-3 sm:p-2 sm:pr-4 rounded-full shadow-[0_10px_40px_rgba(0,0,0,0.3)] flex items-center justify-between cursor-pointer border border-white/10 transition-transform active:scale-[0.98]"
      >
        <div className="flex items-center gap-3">
          <div className="relative w-10 h-10 sm:w-11 sm:h-11 bg-white rounded-full overflow-hidden shrink-0 border border-zinc-200 shadow-inner">
            {firstItem?.images?.[0] ? (
              <Image 
                src={firstItem.images[0]} 
                alt="Cart Item" 
                fill 
                className="object-contain p-1.5"
              />
            ) : (
              <div className="w-full h-full bg-zinc-800" />
            )}
            {totalQuantity > 1 && (
              <div className="absolute -top-1 -right-1 bg-[#C0E212] text-black text-[9px] font-bold w-4 h-4 flex items-center justify-center rounded-full border border-black z-10 shadow-sm">
                +{totalQuantity - 1}
              </div>
            )}
          </div>
          <div className="flex flex-col justify-center">
            <span className="text-[10px] sm:text-[11px] font-medium text-zinc-400">
              {totalQuantity} {totalQuantity === 1 ? "Item" : "Items"}
            </span>
            <span className="text-[13px] sm:text-[14px] font-bold text-white tracking-wide">
              Rs. {subtotal.toLocaleString()}
            </span>
          </div>
        </div>

        {/* Shake animation button */}
        <Link 
          href="/cart"
          onClick={(e) => {
            e.stopPropagation();
            setCartOpen(false);
          }}
          className="bg-[#C0E212] text-black px-5 py-2.5 sm:px-6 sm:py-2.5 rounded-full text-[11px] sm:text-[12px] font-bold uppercase tracking-wider animate-shake hover:bg-[#a6c40e] transition-colors shadow-lg shadow-[#C0E212]/20 shrink-0 ml-2"
        >
          Checkout
        </Link>
      </div>
    </div>
  );
}
