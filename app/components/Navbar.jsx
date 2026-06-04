"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  PiTote, 
  PiList, 
  PiX, 
  PiMapPin, 
  PiDeviceMobile, 
  PiNewspaper,
  PiCircleNotch
} from "react-icons/pi";
import { useCartStore, useLocationStore } from "@/app/lib/store";
import CartDrawer from "./ui/CartDrawer";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const { cart, isCartOpen, setCartOpen } = useCartStore();
  const { orderType, deliveryArea, exactLocation, setLocationModalOpen } = useLocationStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);
    
    const checkActiveOrder = async () => {
      try {
        const savedOrderIds = JSON.parse(localStorage.getItem("guestOrders") || "[]");
        if (savedOrderIds.length > 0) {
          const latestOrderId = savedOrderIds[0];
          const res = await fetch(`/api/orders/${latestOrderId}`);
          const result = await res.json();
          if (result.success && result.data) {
            const status = result.data.status?.toLowerCase();
            if (status !== 'delivered' && status !== 'cancelled' && status !== 'failed') {
              setActiveOrder(result.data);
            } else {
              setActiveOrder(null);
            }
          }
        }
      } catch (err) {
        console.error("Error checking active order:", err);
      }
    };
    
    checkActiveOrder();
    const interval = setInterval(checkActiveOrder, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  const totalItems = hasMounted
    ? cart.reduce((total, item) => total + item.quantity, 0)
    : 0;

  // Build location label
  const locationLabel = hasMounted
    ? orderType === "Pickup"
      ? "Pickup"
      : exactLocation
      ? `${exactLocation.address.split(',')[0]}` // Only show first part of full address
      : orderType === "Delivery" && deliveryArea
      ? `${deliveryArea}`
      : null
    : null;

  return (
    <>
      <header className="sticky top-0 z-40 w-full flex flex-col bg-white border-b border-zinc-100">
        
        {/* Active Order Banner */}
        {activeOrder && (
          <Link href="/guest-orders" className="bg-[#e63946] text-white py-2 sm:py-2.5 px-4 flex justify-center sm:justify-between items-center text-[10px] sm:text-xs font-bold uppercase tracking-widest hover:bg-[#d62828] transition-colors relative z-50">
            <span className="flex items-center gap-2">
              <PiCircleNotch className="w-3.5 h-3.5 sm:w-4 sm:h-4 animate-spin" />
              Order #{activeOrder.id.slice(0, 8)} is {activeOrder.status}
            </span>
            <span className="hidden sm:inline-block underline decoration-white/50 underline-offset-4">Track Order &rarr;</span>
          </Link>
        )}

        <nav className="w-full relative z-30">
          <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 h-20 lg:h-[100px] flex items-center justify-between gap-4">
            
            {/* LEFT SIDE: Logo & Info Boxes */}
            <div className="flex items-center gap-6 xl:gap-8">
              <Link href="/" className="shrink-0 flex items-center transition-all duration-200 active:scale-95">
                <Image 
                  src="/brandlogo.webp" 
                  alt="Pioneer Broast" 
                  width={200} 
                  height={80} 
                  className="w-auto h-12 sm:h-16 lg:h-[90px] object-contain"
                  priority
                />
              </Link>

              {/* Info Boxes (Hidden on mobile/tablet) */}
              <div className="hidden xl:flex items-center gap-4">
                {/* Location Box */}
                <button 
                  onClick={() => setLocationModalOpen(true)} 
                  className="flex items-center gap-3 px-4 py-2 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-all duration-200 active:scale-95 text-left"
                >
                  <PiMapPin className="text-[#D21716] w-7 h-7 shrink-0" weight="fill" />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-black leading-tight">Change Location</span>
                    <span className="text-[11px] text-zinc-500 max-w-[160px] truncate leading-tight">
                      {locationLabel || "Select your location"}
                    </span>
                  </div>
                </button>

                {/* Contact Box */}
                <a 
                  href="tel:021111666111" 
                  className="flex items-center gap-3 px-4 py-2 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-all duration-200 active:scale-95 text-left"
                >
                  <PiDeviceMobile className="text-[#D21716] w-7 h-7 shrink-0" weight="fill" />
                  <div className="flex flex-col">
                    <span className="text-[14px] font-black text-black leading-tight">Contact us</span>
                    <span className="text-[11px] text-zinc-500 leading-tight">021-111-666-111</span>
                  </div>
                </a>
              </div>
            </div>

            {/* RIGHT SIDE: Complaint, Cart, Menu */}
            <div className="flex items-center gap-4 sm:gap-6 shrink-0">
              
              {/* Complaint Box (Hidden on mobile/tablet) */}
              <Link 
                href="/contact" 
                className="hidden lg:flex items-center gap-3 px-4 py-2 bg-white border border-zinc-200 rounded-md hover:bg-zinc-50 transition-all duration-200 active:scale-95 text-right"
              >
                <div className="flex flex-col items-end">
                  <span className="text-[14px] font-black text-black leading-tight">Submit Your Complaint</span>
                  <span className="text-[10px] text-zinc-500 leading-tight">From Complaint to Care - Share With Us</span>
                </div>
                <PiNewspaper className="text-[#D21716] w-7 h-7 shrink-0" weight="fill" />
              </Link>

              {/* Cart Bucket */}
              <button 
                onClick={() => setCartOpen(true)} 
                className="relative flex items-center justify-center p-1 text-zinc-800 hover:text-[#D21716] transition-all duration-200 active:scale-95"
              >
                <PiTote className="w-9 h-9 sm:w-11 sm:h-11" weight="fill" />
                <span className="absolute bottom-0 left-0 bg-[#FFD700] text-black border border-white shadow-sm text-[11px] sm:text-[12px] font-black w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center translate-y-1 -translate-x-1">
                  {totalItems}
                </span>
              </button>

              {/* Hamburger Menu */}
              <button 
                onClick={() => setIsMobileMenuOpen(true)}
                className="flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 bg-[#ff7a7a] text-white rounded-md hover:bg-[#ff6161] transition-all duration-200 active:scale-95"
              >
                <PiList className="w-6 h-6 sm:w-7 sm:h-7" weight="bold" />
              </button>
              
            </div>
          </div>
        </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex w-[85%] max-w-[320px] flex-col overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-right duration-300 ml-auto">
            <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-zinc-100">
              <Image 
                src="/brandlogo.webp" 
                alt="Pioneer Broast" 
                width={140} 
                height={35} 
                className="w-auto h-8 object-contain"
              />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full p-2 bg-zinc-100 text-zinc-500 hover:text-black hover:bg-zinc-200 transition-all duration-200 active:scale-95"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <PiX className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            {/* Mobile Links */}
            <div className="px-5 py-6 flex flex-col gap-4">
              <Link href="/menu" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-bold uppercase tracking-wide border-b border-zinc-100 pb-4">Menu</Link>
              <Link href="/deals" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-bold uppercase tracking-wide border-b border-zinc-100 pb-4">Deals</Link>
              <Link href="/about" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-bold uppercase tracking-wide border-b border-zinc-100 pb-4">About Us</Link>
              <Link href="/contact" onClick={() => setIsMobileMenuOpen(false)} className="text-[16px] font-bold uppercase tracking-wide pb-4">Contact / Complaint</Link>
            </div>

          </div>
        </div>
      )}

      {/* Cart Drawer Mount */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
