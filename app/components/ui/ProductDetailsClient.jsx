"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  PiCaretRight,
  PiCaretLeft,
  PiTruck,
  PiShieldCheck,
  PiPlus,
  PiMinus,
  PiTote,
  PiArrowLeft,
  PiInfo,
} from "react-icons/pi";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/app/lib/store";
import { gsap } from "gsap";
import toast from "react-hot-toast";
import ProductCard from "@/app/components/ui/ProductCard";
import { AVAILABLE_COLORS } from "@/app/lib/colors";
import { sendGAEvent } from "@next/third-parties/google";

export default function ProductDetailsClient({ product, recommendedProducts = [] }) {
  const { addToCart } = useCartStore();
  
  // Safe Fallback for empty products
  const getParsedImages = (imgData) => {
    if (!imgData) return ["https://via.placeholder.com/600"];
    if (Array.isArray(imgData)) return imgData;
    try {
      const parsed = JSON.parse(imgData);
      return Array.isArray(parsed) ? parsed : [imgData];
    } catch (e) {
      return [imgData];
    }
  };

  const getParsedColors = (colorData) => {
    if (!colorData) return [];
    if (Array.isArray(colorData)) return colorData;
    try {
      const parsed = JSON.parse(colorData);
      return Array.isArray(parsed) ? parsed : [colorData];
    } catch {
      if (typeof colorData === "string") {
        return colorData.split(",").map((c) => c.trim()).filter(Boolean);
      }
      return [];
    }
  };

  const images = getParsedImages(product?.images);
  const colors = getParsedColors(product?.colors);

  const [selectedImg, setSelectedImg] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState(colors.length > 0 ? colors[0] : "");
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [showStickyBar, setShowStickyBar] = useState(false);
  const [isAdded, setIsAdded] = useState(false);
  const router = useRouter();

  // Refs for micro-animations
  const mainImageRef = useRef(null);
  const qtyRef = useRef(null);
  const addToBagBtnRef = useRef(null);

  // Refs for mobile swipe
  const touchStartX = useRef(null);
  const touchEndX = useRef(null);

  useEffect(() => {
    // Initial color setup if data arrives late
    if (colors.length > 0 && !selectedColor) {
      setSelectedColor(colors[0]);
    }
  }, [colors, selectedColor]);

  useEffect(() => {
    const handleScroll = () => {
      // Show sticky bar when scrolled past the main product info (approx 400px)
      if (window.scrollY > 400) {
        setShowStickyBar(true);
      } else {
        setShowStickyBar(false);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Track 'ViewContent' (Meta) and 'view_item' (GA4) on product load
  useEffect(() => {
    if (!product) return;
    const price = product.discount_price || product.price || 0;

    // GA4 Tracking
    sendGAEvent('event', 'view_item', {
      currency: 'PKR',
      value: price,
      items: [{
        item_id: product.id,
        item_name: product.name,
        item_category: product.category,
        price: price
      }]
    });
  }, [product?.id]);

  // --- GSAP ANIMATION HANDLERS ---
  const handleImageMouseMove = (e) => {
    // Only apply zoom effect on desktop (screens >= 1024px)
    if (typeof window !== 'undefined' && window.innerWidth < 1024) return;

    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;

    gsap.to(mainImageRef.current, {
      scale: 1.5,
      transformOrigin: `${x}% ${y}%`,
      duration: 0.4,
      ease: "power2.out",
    });
  };

  const handleImageMouseLeave = () => {
    gsap.to(mainImageRef.current, {
      scale: 1,
      transformOrigin: "center center",
      duration: 0.6,
      ease: "power3.out",
    });
  };

  const nextImage = (e) => {
    if (e) e.stopPropagation();
    setSelectedImg((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    gsap.fromTo(mainImageRef.current, { opacity: 0.6 }, { opacity: 1, duration: 0.3 });
  };

  const prevImage = (e) => {
    if (e) e.stopPropagation();
    setSelectedImg((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    gsap.fromTo(mainImageRef.current, { opacity: 0.6 }, { opacity: 1, duration: 0.3 });
  };

  // --- MOBILE SWIPE HANDLERS ---
  const handleTouchStart = (e) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (touchStartX.current === null || touchEndX.current === null) return;
    const distance = touchStartX.current - touchEndX.current;
    
    // threshold of 50px for a swipe
    if (distance > 50) {
      nextImage(); // Swiped left -> next
    } else if (distance < -50) {
      prevImage(); // Swiped right -> prev
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  const animateQtyCounter = (direction) => {
    const yMove = direction === "up" ? -10 : 10;
    
    gsap.fromTo(qtyRef.current, 
      { opacity: 0, y: yMove },
      { opacity: 1, y: 0, duration: 0.25, ease: "back.out(1.7)" }
    );
  };

  const handleIncrement = () => {
    if (quantity >= product.stock) {
      toast.error(`Only ${product.stock} items available!`);
      return;
    }
    setQuantity((prev) => prev + 1);
    animateQtyCounter("up");
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity((prev) => prev - 1);
      animateQtyCounter("down");
    }
  };

  const handleAddToBagAnimation = () => {
    if (isAdded) {
      router.push("/cart");
      return;
    }

    const success = addToCart({ 
      ...product, 
      quantity: Number(quantity), 
      chosenColor: selectedColor,
    });
    
    if (success) {
      const price = product?.discount_price || product?.price || 0;
      const totalValue = price * quantity;

      // GA4 Tracking
      sendGAEvent('event', 'add_to_cart', {
        currency: 'PKR',
        value: totalValue,
        items: [{
          item_id: product?.id,
          item_name: product?.name,
          item_category: product?.category,
          price: price,
          quantity: quantity
        }]
      });

      const tl = gsap.timeline();
      tl.to(addToBagBtnRef.current, { scale: 0.96, duration: 0.1, ease: "power1.out" })
        .to(addToBagBtnRef.current, { scale: 1, duration: 0.4, ease: "elastic.out(1, 0.5)" });
      setIsAdded(true);
      toast.success(`${quantity}x ${product.name} added to cart!`);
    }
  };

  const displayPrice = product?.discount_price || product?.price;

  return (
    <div className="bg-white text-zinc-950 selection:bg-zinc-100">

      <main className="max-w-6xl mx-auto px-5 sm:px-6 py-5 md:py-8 lg:py-12">
        <div className="mb-4 md:mb-6">
          <Link href="/" className="inline-flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors">
            <PiArrowLeft className="w-3.5 h-3.5 md:w-4 md:h-4" /> Back to Store
          </Link>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-10 lg:gap-12">
          
          {/* LEFT INTERACTIVE MEDIA VIEWER CONTAINER */}
          <div className="lg:col-span-7 space-y-4">
            <div 
              className="aspect-square bg-zinc-50 rounded-xl overflow-hidden border border-zinc-100 relative shadow-sm cursor-zoom-in touch-pan-y"
              onMouseMove={handleImageMouseMove}
              onMouseLeave={handleImageMouseLeave}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
            >
              <div ref={mainImageRef} className="w-full h-full will-change-transform">
                <Image 
                  src={images[selectedImg]} 
                  alt={product?.name} 
                  fill
                  sizes="(max-width: 1024px) 100vw, 58vw"
                  quality={100}
                  priority
                  className="object-cover object-center" 
                />
              </div>
              {product?.discount_price && product?.discount_price < product?.price && (
                <div className="absolute top-4 left-4 pointer-events-none">
                  <span className="bg-zinc-900 text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider">Sale</span>
                </div>
              )}

              {images.length > 1 && (
                <>
                  <button
                    onClick={prevImage}
                    onMouseMove={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => { e.stopPropagation(); handleImageMouseLeave(); }}
                    className="hidden md:flex absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-zinc-900 p-2 rounded-full shadow-md transition-all active:scale-95 items-center justify-center z-10 cursor-pointer"
                  >
                    <PiCaretLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={nextImage}
                    onMouseMove={(e) => e.stopPropagation()}
                    onMouseEnter={(e) => { e.stopPropagation(); handleImageMouseLeave(); }}
                    className="hidden md:flex absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 hover:bg-white text-zinc-900 p-2 rounded-full shadow-md transition-all active:scale-95 items-center justify-center z-10 cursor-pointer"
                  >
                    <PiCaretRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2.5 sm:gap-3 overflow-x-auto py-2 no-scrollbar">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedImg(idx);
                      gsap.fromTo(mainImageRef.current, { opacity: 0.6 }, { opacity: 1, duration: 0.3 });
                    }}
                    className={`relative w-14 sm:w-16 aspect-square rounded-lg overflow-hidden border transition-all active:scale-90 active:opacity-50 ${
                      selectedImg === idx ? "border-2 border-zinc-950 scale-[0.98]" : "border-zinc-200 opacity-60 hover:opacity-100 hover:scale-[0.98]"
                    }`}
                  >
                    <Image src={img} fill sizes="(max-width: 640px) 56px, 64px" quality={90} className="object-cover" alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT PRODUCT ATTRIBUTE PANEL */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div className="space-y-6 md:space-y-8">
              <div>
                <p className="text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.15em] text-zinc-400 mb-1.5 sm:mb-2">{product?.category || "General"}</p>
                <h1 className="text-[28px] sm:text-4xl md:text-5xl lg:text-4xl font-extrabold tracking-tight text-zinc-900 uppercase leading-[1.1]">{product?.name}</h1>
                
                <div className="flex items-end gap-2.5 sm:gap-3 mt-3 sm:mt-4">
                  <span className="text-[28px] sm:text-4xl font-black text-zinc-900 tracking-tighter">Rs. {displayPrice?.toLocaleString()}</span>
                  {product?.discount_price && product?.discount_price < product?.price && (
                    <span className="text-zinc-500 line-through text-sm sm:text-base font-semibold mb-1 sm:mb-1.5">Rs. {product?.price?.toLocaleString()}</span>
                  )}
                </div>
              </div>

              {product?.short_des && (
                <p className="text-zinc-500 text-sm sm:text-[15px] leading-relaxed font-medium">{product.short_des}</p>
              )}

              {/* FINISH SWATCHES */}
              {colors.length > 0 && (
                <div className="space-y-3 border-t border-zinc-100 pt-5">
                  <span className="text-[11px] font-bold uppercase text-zinc-400 tracking-wider">Finish Variant: <strong className="text-zinc-950 font-semibold normal-case">{selectedColor}</strong></span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                    {colors.map((color) => {
                      const hex = AVAILABLE_COLORS.find(c => c.name.toLowerCase() === color.toLowerCase())?.hex || "#000000";
                      return (
                        <button
                          key={color}
                          onClick={() => setSelectedColor(color)}
                          className={`flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] font-semibold transition-all duration-200 active:scale-95 active:bg-zinc-200 justify-center w-full ${
                            selectedColor === color ? "bg-zinc-900 text-white shadow-md ring-2 ring-zinc-900 ring-offset-2" : "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 shadow-sm"
                          }`}
                        >
                          <span className="w-4 h-4 rounded-full border border-zinc-300 shadow-sm shrink-0" style={{ backgroundColor: hex }}></span>
                          <span className="truncate">{color}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* QUANTITY AND CHECKOUT TRIGGER */}
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border border-zinc-100 rounded-xl p-3 sm:p-4 bg-zinc-50/50 shadow-sm">
                  <span className="text-xs font-bold uppercase tracking-widest text-zinc-500">Quantity</span>
                  <div className="flex items-center gap-4 sm:gap-5">
                    <button 
                      onClick={handleDecrement} 
                      className="hover:text-zinc-600 hover:bg-zinc-200/60 active:bg-zinc-300 rounded-lg transition-all p-2.5 active:scale-90"
                    >
                      <PiMinus className="w-4 h-4" strokeWidth={4} />
                    </button>
                    <span ref={qtyRef} className="text-base font-black w-6 text-center select-none tabular-nums text-black">
                      {quantity}
                    </span>
                    <button 
                      onClick={handleIncrement} 
                      className="hover:text-zinc-600 hover:bg-zinc-200/60 active:bg-zinc-300 rounded-lg transition-all p-2.5 active:scale-90"
                    >
                      <PiPlus className="w-4 h-4" strokeWidth={4} />
                    </button>
                  </div>
                </div>

                <button
                  ref={addToBagBtnRef}
                  onClick={handleAddToBagAnimation}
                  disabled={product?.stock <= 0}
                  className={`w-full text-xs font-bold py-4 rounded-xl active:rounded-3xl active:scale-95 transition-all flex items-center justify-center gap-2 tracking-widest uppercase shadow-lg will-change-transform ${isAdded ? 'bg-[#C0E212] text-black hover:bg-[#a6c40e] shadow-[#C0E212]/20' : 'bg-zinc-950 text-white hover:bg-zinc-800 shadow-zinc-900/20'} disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isAdded ? (
                    <>Proceed to Checkout <PiCaretRight className="w-4 h-4 font-bold" strokeWidth={4} /></>
                  ) : (
                    <><PiTote className="w-4 h-4" strokeWidth={3} /> Add To Bag — Rs. {(displayPrice * quantity).toLocaleString()}</>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-[10px] text-zinc-400 uppercase font-medium">
                  <div className={`w-1.5 h-1.5 rounded-full ${product?.stock > 0 ? "bg-emerald-500" : "bg-red-500"}`} />
                  {product?.stock > 0 ? `In Stock (${product?.stock})` : "Out of Stock"}
                </div>
              </div>
            </div>

            {/* LOGISTICS */}
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-2 gap-4 border-t border-zinc-100 pt-6">
                <div className="flex items-start gap-3">
                  <PiTruck className="w-4 h-4 mt-0.5 text-zinc-400" />
                  <div>
                    <h4 className="text-[12px] font-bold">Shipping</h4>
                    <p className="text-[11px] text-zinc-500">Standard Delivery across Pakistan</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PiShieldCheck className="w-4 h-4 mt-0.5 text-zinc-400" />
                  <div>
                    <h4 className="text-[12px] font-bold">Warranty</h4>
                    <p className="text-[11px] text-zinc-500">100% Quality Guaranteed</p>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* FULL WIDTH LONG DESCRIPTION & HIGHLIGHTS */}
        {(product?.description || (product?.highlights && product.highlights.length > 0)) && (
          <div className="mt-12 md:mt-24 border-t border-zinc-100 pt-8 md:pt-16">
            <div className={`overflow-hidden transition-all duration-300 relative ${!isDescExpanded ? "max-h-64 md:max-h-none" : "max-h-[3000px]"}`}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16">
                
                {/* Left Side: Description */}
                {product?.description && (
                  <div>
                    <h3 className="text-sm md:text-base font-bold uppercase tracking-widest text-zinc-900 mb-6">
                      Product Details
                    </h3>
                    <p className="text-zinc-600 text-sm md:text-[15px] leading-relaxed whitespace-pre-line">
                      {product.description}
                    </p>
                  </div>
                )}

                {/* Right Side: Highlights */}
                {product?.highlights && product.highlights.length > 0 && (
                  <div>
                    <h3 className="text-sm md:text-base font-bold uppercase text-black tracking-widest mb-4 md:mb-6">
                      Key Highlights
                    </h3>
                    <ul className="space-y-3 sm:space-y-4 bg-[#C0E212]/5 rounded-2xl p-5 sm:p-6 md:p-8 border border-[#C0E212]/20">
                      {product.highlights.map((highlight, idx) => (
                        <li key={idx} className="text-[13px] sm:text-sm md:text-[15px] text-zinc-800 flex items-start gap-2.5 sm:gap-3">
                          <span className="text-[#535742] mt-0.5 sm:mt-1 shrink-0 font-bold">
                            <PiShieldCheck className="w-4 h-4 sm:w-5 sm:h-5" />
                          </span>
                          <span className="leading-relaxed font-medium">{highlight}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
              </div>

              {/* Mobile Fade Out Gradient */}
              {!isDescExpanded && (
                <div className="md:hidden absolute bottom-0 left-0 right-0 h-28 bg-linear-to-t from-white to-transparent pointer-events-none" />
              )}
            </div>

            <button 
              onClick={() => setIsDescExpanded(!isDescExpanded)}
              className="md:hidden mt-5 w-full py-3.5 text-[11px] font-bold uppercase tracking-widest text-zinc-900 border-2 border-zinc-100 rounded-xl flex items-center justify-center gap-2 hover:bg-zinc-50 active:bg-zinc-200 active:border-zinc-300 active:scale-95 transition-all"
            >
              {isDescExpanded ? "Read Less" : "Read More"}
              <PiCaretRight className={`w-4 h-4 transition-transform duration-300 ${isDescExpanded ? "-rotate-90" : "rotate-90"}`} />
            </button>
          </div>
        )}

        {/* RECOMMENDED PRODUCTS SECTION */}
        {recommendedProducts.length > 0 && (
          <div className="mt-24 border-t border-zinc-100 pt-16">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 uppercase">
                You May Also Like
              </h2>
              <Link href="/" className="text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 transition-colors">
                View All
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
              {recommendedProducts.map((recProduct) => (
                <ProductCard key={recProduct.id} product={recProduct} />
              ))}
            </div>
          </div>
        )}
      </main>

      {/* STICKY BOTTOM BAR (Appears on Scroll) */}
      <div 
        className={`fixed bottom-3 sm:bottom-5 left-1/2 -translate-x-1/2 w-[92%] max-w-[500px] bg-white border border-zinc-200/80 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.15)] rounded-2xl p-2.5 sm:p-3 flex items-center justify-between z-30 transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
          showStickyBar ? "translate-y-0 opacity-100 scale-100" : "translate-y-24 opacity-0 scale-95 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3 sm:gap-4 overflow-hidden pl-1">
          <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 border border-zinc-100 bg-zinc-50">
             <Image src={images[selectedImg]} alt={product?.name} fill className="object-cover" sizes="48px" />
          </div>
          <div className="flex flex-col min-w-0">
             <span className="text-[11px] sm:text-[13px] font-bold text-black truncate">{product?.name}</span>
             <span className="text-[10px] sm:text-[11px] font-semibold text-zinc-500 truncate">
               Rs. {(displayPrice * quantity).toLocaleString()} • Qty: {quantity} {selectedColor && `• ${selectedColor}`}
             </span>
          </div>
        </div>
        
        <button
          onClick={handleAddToBagAnimation}
          disabled={product?.stock <= 0}
          className={`shrink-0 text-[11px] sm:text-xs font-bold px-4 py-2.5 sm:py-3 rounded-xl active:scale-95 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-md ml-2 ${isAdded ? 'bg-[#C0E212] text-black hover:bg-[#a6c40e] shadow-[#C0E212]/20' : 'bg-zinc-950 text-white hover:bg-zinc-800'}`}
        >
          {isAdded ? (
            <>
              <span className="hidden sm:inline">Checkout</span>
              <span className="sm:hidden">Checkout</span>
              <PiCaretRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 font-bold" strokeWidth={4} /> 
            </>
          ) : (
            <>
              <PiTote className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">Add To Bag</span>
              <span className="sm:hidden">Add</span>
            </>
          )}
        </button>
      </div>

    </div>
  );
}
