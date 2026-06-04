"use client";
import { useEffect, useState } from "react";
import { useCartStore } from "@/app/lib/store";
import { PiTote } from "react-icons/pi";
import { usePathname } from "next/navigation";

export default function FloatingCartWidget() {
  const { cart, setCartOpen, isCartOpen } = useCartStore();
  const [hasMounted, setHasMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);
  }, []);

  // Do not show on the checkout/cart page itself, admin, or if drawer is open
  if (!hasMounted || cart.length === 0 || isCartOpen || pathname === '/cart' || pathname.startsWith('/admin')) {
    return null;
  }

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const totalPrice = cart.reduce((acc, item) => {
    const price = item.discount_price && item.discount_price < item.price ? item.discount_price : item.price;
    return acc + (price * item.quantity);
  }, 0);

  return (
    <div className="fixed bottom-4 sm:bottom-0 left-0 right-0 px-4 sm:px-0 flex justify-center z-[45] animate-slide-up-fade">
      <button
        onClick={() => setCartOpen(true)}
        className="w-full sm:w-[360px] bg-[#D21716] text-white rounded-t-2xl p-4 shadow-[0_10px_40px_rgba(230,57,70,0.3)] flex items-center justify-between hover:bg-[#d62828] hover:-translate-y-1 hover:shadow-[0_15px_50px_rgba(230,57,70,0.4)] transition-all duration-300 active:scale-95 group"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-sm relative">
            {totalItems}
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20 group-hover:opacity-0 transition-opacity"></div>
          </div>
          <div className="text-left">
            <p className="text-[10px] uppercase tracking-widest font-semibold text-white/80 mb-0.5">Your Bucket</p>
            <p className="text-sm font-bold tracking-tight">View Order</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-lg font-bold tracking-tight">Rs. {totalPrice.toLocaleString()}</span>
          <div className="w-8 h-8 bg-white text-[#D21716] rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <PiTote className="w-4 h-4 font-bold" />
          </div>
        </div>
      </button>

      <style jsx>{`
        @keyframes slide-up-fade {
          0% { transform: translateY(40px) scale(0.9); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-slide-up-fade {
          animation: slide-up-fade 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </div>
  );
}
