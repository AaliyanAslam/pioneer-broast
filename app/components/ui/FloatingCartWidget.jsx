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
    <div className="fixed bottom-0 left-0 right-0 px-0 sm:px-0 flex justify-center z-45 animate-slide-up-fade">
      <button
        onClick={() => setCartOpen(true)}
        className="w-full sm:w-[360px] bg-[#ff1900] text-white rounded-t-3xl sm:rounded-t-2xl p-3.5 sm:p-4 shadow-[0_10px_40px_rgba(230,57,70,0.3)] flex items-center justify-between hover:bg-[#cc1400] hover:shadow-[0_15px_50px_rgba(230,57,70,0.4)] transition-all duration-300 active:scale-95 group"
      >
        <div className="flex items-center gap-2.5 sm:gap-3 px-1 sm:px-0">
          <div className="w-8 h-8 sm:w-8 sm:h-8 bg-white/20 rounded-full flex items-center justify-center font-bold text-[13px] sm:text-sm relative shrink-0">
            {totalItems}
            <div className="absolute inset-0 bg-white rounded-full animate-ping opacity-20 group-hover:opacity-0 transition-opacity"></div>
          </div>
          <div className="text-left">
            <p className="text-[9px] sm:text-[10px] uppercase tracking-widest font-semibold text-white/80 mb-0.5 leading-none">Your Bucket</p>
            <p className="text-[13px] sm:text-sm font-bold tracking-tight leading-none">View Order</p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 sm:gap-3 px-1 sm:px-0">
          <span className="text-base sm:text-lg font-bold tracking-tight">Rs. {totalPrice.toLocaleString()}</span>
          <div className="w-8 h-8 sm:w-8 sm:h-8 bg-white text-[#ff1900] rounded-full flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform shrink-0">
            <PiTote className="w-4 h-4 sm:w-4 sm:h-4 font-bold" />
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
