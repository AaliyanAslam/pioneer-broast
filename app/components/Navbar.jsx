"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { PiShoppingCart, PiUser, PiSignIn, PiList, PiX } from "react-icons/pi";
import { useCartStore } from "@/app/lib/store";
import CartDrawer from "./ui/CartDrawer";
import SearchBar from "./ui/SearchBar";
import { usePathname } from "next/navigation";
import { supabase } from "@/app/lib/supabase";
import Tooltip from "./ui/Tooltip";

export default function Navbar() {
  const { cart, isCartOpen, setCartOpen } = useCartStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [user, setUser] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setHasMounted(true);

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const totalItems = hasMounted
    ? cart.reduce((total, item) => total + item.quantity, 0)
    : 0;

  const NAV_LINKS = [
    { name: "Earbuds", href: "/category/earbuds" },
    { name: "Smartwatches", href: "/category/smartwatches" },
    { name: "Accessories", href: "/category/accessories" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full flex flex-col">
        {/* Announcement Bar */}
        <div className="w-full bg-[#C0E212] text-black px-4 py-2 text-center text-[10px] sm:text-[11px] font-bold tracking-widest uppercase flex items-center justify-center gap-2">
          <span>
            Free Delivery on orders above Rs. 3,000 - OR Use Coupon Code: <strong className="font-black bg-black text-[#C0E212] px-2 py-0.5 rounded-md ml-1 tracking-widest">FREED-180</strong>
          </span>
        </div>

        <nav className="w-full bg-white/90 backdrop-blur-xl border-b border-zinc-100 shadow-sm relative z-30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 lg:h-18 flex items-center justify-between">
          {/* Left: Mobile Menu Toggle & Brand Logo */}
          <div className="flex-1 flex items-center justify-start gap-3">
            <button 
              className="lg:hidden p-1.5 -ml-1.5 text-zinc-600 hover:text-black active:scale-95 transition-all"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <PiList className="w-6 h-6" />
            </button>
            <Link
              href="/"
              title="Go to Home"
              className="shrink-0 transition-transform active:scale-95"
            >
              <Image
                src="/logo.webp"
                alt="Kova Tech"
                width={250}
                height={40}
                className="h-8 sm:h-10 w-auto object-contain"
                priority
              />
            </Link>
          </div>

          {/* Center: Desktop Navigation Links */}
          <div className="hidden lg:flex items-center justify-center gap-6 xl:gap-8 shrink-0">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                title={`Go to ${link.name}`}
                className={`text-[13px] font-bold uppercase tracking-widest transition-all duration-300 hover:text-black ${
                  pathname === link.href
                    ? "text-black border-b-2 border-[#C0E212] pb-1"
                    : "text-zinc-500 hover:border-b-2 hover:border-zinc-300 pb-1"
                }`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right: Search & Action Icons */}
          <div className="flex-1 flex items-center justify-end gap-2 sm:gap-4">
            {/* Desktop Search Bar */}
            <div className="hidden lg:block w-[240px] xl:w-[280px] relative z-20">
              <SearchBar />
            </div>

            {/* Action Icons */}
            <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
              {user ? (
                <Tooltip text="View Profile" position="bottom">
                  <Link
                    href="/profile"
                    className="relative flex p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-full transition-all active:scale-95"
                  >
                    <PiUser className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>
                </Tooltip>
              ) : (
                <Tooltip text="Sign in" position="bottom">
                  <Link
                    href="/cart"
                    className="relative flex p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-full transition-all active:scale-95"
                  >
                    <PiSignIn className="w-5 h-5 sm:w-6 sm:h-6" />
                  </Link>
                </Tooltip>
              )}

              <Tooltip text="View Cart" position="bottom">
                <button
                  onClick={() => setCartOpen(true)}
                  className="relative flex p-2 text-zinc-600 hover:text-black hover:bg-zinc-100 rounded-full transition-all active:scale-95"
                >
                  <PiShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" />
                  {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-[#C0E212] text-black shadow-sm text-[10px] font-black w-4 h-4 sm:w-4.5 sm:h-4.5 rounded-full flex items-center justify-center translate-x-1 sm:-translate-y-1">
                      {totalItems}
                    </span>
                  )}
                </button>
              </Tooltip>
            </div>
          </div>
        </div>

        {/* Mobile Search Bar Only */}
        <div className="block lg:hidden px-4 py-3 bg-white/90 backdrop-blur-xl relative z-20 border-t border-zinc-100/50">
          <SearchBar />
        </div>

        {/* Neon Gradient Line */}
        <div className="absolute bottom-0 left-0 w-full h-[2px] bg-linear-to-r from-transparent via-[#C0E212] to-transparent opacity-80 z-10" />
      </nav>
      </header>

      {/* Mobile Menu Drawer */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setIsMobileMenuOpen(false)}
          />
          <div className="relative flex w-[85%] max-w-[320px] flex-col overflow-y-auto bg-white shadow-2xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between px-5 pt-6 pb-5 border-b border-zinc-100">
              <Image src="/logo.webp" alt="Kova Tech" width={150} height={30} className="h-7 w-auto" />
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full p-2 bg-zinc-100 text-zinc-500 hover:text-black hover:bg-zinc-200 transition-colors"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <span className="sr-only">Close menu</span>
                <PiX className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>

            <div className="px-5 py-8 space-y-6">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.name}
                  href={link.href}
                  className="block text-[15px] font-bold uppercase tracking-widest text-zinc-800 hover:text-[#C0E212] transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </Link>
              ))}
            </div>
            
            <div className="mt-auto p-5 border-t border-zinc-100 bg-zinc-50">
              {user ? (
                <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-900 bg-white p-4 rounded-xl shadow-sm border border-zinc-200">
                  <PiUser className="w-5 h-5 text-[#C0E212]" /> My Account
                </Link>
              ) : (
                <Link href="/cart" onClick={() => setIsMobileMenuOpen(false)} className="flex items-center gap-3 text-sm font-bold uppercase tracking-widest text-zinc-900 bg-white p-4 rounded-xl shadow-sm border border-zinc-200">
                  <PiSignIn className="w-5 h-5 text-[#C0E212]" /> Sign In / Register
                </Link>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Drawer Mount */}
      <CartDrawer isOpen={isCartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
