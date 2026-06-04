"use client";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/app/lib/store";
import { PiX, PiPlus, PiMinus, PiTrash, PiTote, PiTruck, PiCircleNotch, PiTag, PiXCircle } from "react-icons/pi";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import useSWR from "swr";
import { supabase } from "@/app/lib/supabase";
import ProductCard from "@/app/components/ui/ProductCard";
import toast from "react-hot-toast";

// Removed getColorCode helper as it is no longer needed

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQuantity, appliedCoupon, setAppliedCoupon, updateInstructions } = useCartStore();
  const [hasMounted, setHasMounted] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const itemRefs = useRef({});
  const touchStartX = useRef({});

  // Sync if opened
  useEffect(() => {
    if (isOpen && appliedCoupon) {
      setCouponCode(appliedCoupon.code);
    }
  }, [isOpen, appliedCoupon]);

  useEffect(() => {
    setHasMounted(true);
  }, []);

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useSWR(
    "cart-drawer-suggestions",
    async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(6);
      if (error) throw error;
      return data.sort(() => 0.5 - Math.random()).slice(0, 2);
    },
    { revalidateOnFocus: false }
  );

  // Prevent background scrolling when cart is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const subtotal = hasMounted
    ? cart.reduce((total, item) => {
        const price = item.discount_price || item.price;
        return total + price * item.quantity;
      }, 0)
    : 0;

  // Delivery & Discount logic
  let deliveryCharges = subtotal > 0 ? 180 : 0;
  let discountAmount = 0;

  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discount_type === "free_delivery") {
      deliveryCharges = 0;
    } else if (appliedCoupon.discount_type === "percentage") {
      discountAmount = Math.floor(subtotal * (appliedCoupon.discount_value / 100));
    } else if (appliedCoupon.discount_type === "fixed") {
      discountAmount = appliedCoupon.discount_value;
      if (discountAmount > subtotal) discountAmount = subtotal;
    }
  }

  const handleApplyCoupon = async (e) => {
    e.preventDefault();
    if (!couponCode) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(data.data);
        toast.success("Coupon applied successfully!");
      } else {
        toast.error(data.message || "Invalid coupon");
        setAppliedCoupon(null);
      }
    } catch (error) {
      toast.error("Error verifying coupon");
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const handleRemoveItem = (id) => {
    const el = itemRefs.current[id];
    if (el) {
      gsap.to(el, {
        x: -50,
        opacity: 0,
        backgroundColor: "#fef2f2", // reddish tint (red-50)
        duration: 0.3,
        ease: "power2.out",
        onComplete: () => {
          gsap.to(el, {
            height: 0,
            paddingTop: 0,
            paddingBottom: 0,
            borderBottomWidth: 0,
            duration: 0.2,
            ease: "power2.inOut",
            onComplete: () => removeFromCart(id)
          });
        }
      });
    } else {
      removeFromCart(id);
    }
  };

  const handleQtyChange = (id, currentQty, action) => {
    if (action === "decrease" && currentQty <= 1) {
      handleRemoveItem(id);
    } else {
      updateQuantity(id, action);
    }
  };

  // Touch Swipe to Delete Logic
  const handleTouchStart = (e, id) => {
    touchStartX.current[id] = e.touches[0].clientX;
  };

  const handleTouchEnd = (e, id) => {
    if (!touchStartX.current[id]) return;
    const endX = e.changedTouches[0].clientX;
    const distance = touchStartX.current[id] - endX;
    
    // If swiped left by more than 50px, remove item
    if (distance > 50) {
      handleRemoveItem(id);
    }
    touchStartX.current[id] = null;
  };

  if (!isOpen || !hasMounted) return null;

  return (
    <>
      {/* Background Overlay */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity touch-none"
        onClick={onClose}
      />

      {/* Drawer Panel */}
      <div className="fixed top-0 right-0 h-full w-full sm:w-[360px] bg-white z-50 shadow-[0_0_40px_rgba(0,0,0,0.1)] flex flex-col transform transition-transform duration-300 border-l border-zinc-200 overscroll-none">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-zinc-100 relative z-10 bg-white">
          <h2 className="text-[20px] sm:text-[22px] font-black text-zinc-900 tracking-tight uppercase">
            Your Cart
          </h2>
          <button
            onClick={onClose}
            className="p-2 -mr-2 text-zinc-400 hover:text-black transition-colors bg-zinc-50 hover:bg-zinc-100 rounded-full"
          >
            <PiX className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        </div>



        {/* Cart Items */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto px-4 sm:px-6 custom-scrollbar overscroll-none">
          {cart.length === 0 ? (
            <div className="flex flex-col h-full overflow-y-auto pb-6 custom-scrollbar">
              <div className="flex flex-col items-center justify-center py-16 text-center px-4">
                <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                  <PiTote className="w-10 h-10 text-zinc-300" />
                </div>
                <h3 className="text-xl font-bold text-black mb-2 tracking-tight">Your cart is empty</h3>
                <p className="text-sm text-zinc-500 mb-6 max-w-[250px] leading-relaxed">
                  Looks like you haven't added anything to your cart yet.
                </p>
                <Link
                  href="/"
                  onClick={onClose}
                  className="bg-[#C0E212] text-black font-bold px-8 py-3.5 rounded-xl hover:bg-[#a6c40e] transition-all active:scale-95 text-[13px] shadow-sm uppercase tracking-widest"
                >
                  Shop Now
                </Link>
              </div>

              {/* Suggestions */}
              <div className="mt-auto pt-6 border-t border-zinc-100">
                <h4 className="text-[12px] font-bold text-black uppercase tracking-widest mb-4 px-2">
                  You might also like
                </h4>
                {isLoadingSuggestions ? (
                  <div className="flex justify-center py-8">
                    <PiCircleNotch className="w-6 h-6 animate-spin text-[#C0E212]" />
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {suggestions.map((product) => (
                      <div onClick={onClose} key={product.id}>
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-1">
              {cart.map((item) => {
                const uniqueId = item.cartItemId || item.id;
                return (
                  <div
                    key={uniqueId}
                    ref={(el) => (itemRefs.current[uniqueId] = el)}
                    onTouchStart={(e) => handleTouchStart(e, uniqueId)}
                    onTouchEnd={(e) => handleTouchEnd(e, uniqueId)}
                    className="flex gap-3 sm:gap-4 py-4 sm:py-6 border-b border-zinc-100 relative overflow-hidden bg-white"
                  >
                    {/* Image Box */}
                    <div className="w-[75px] h-[75px] sm:w-[85px] sm:h-[85px] bg-zinc-50 shrink-0 flex items-center justify-center p-1.5 sm:p-2 rounded-md relative overflow-hidden pointer-events-none">
                      <Image
                        src={item.image_url || "https://via.placeholder.com/150"}
                        alt={item.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                    
                    {/* Content */}
                    <div className="flex flex-col justify-between flex-1">
                      <div>
                        <div className="flex justify-between items-start">
                          <Link href={`/product/${item.slug}`} onClick={onClose}>
                            <h3 className="text-[13px] sm:text-[14px] font-bold text-zinc-900 pr-6 leading-snug hover:underline cursor-pointer">
                              {item.name}
                            </h3>
                          </Link>
                          <button
                            onClick={() => handleRemoveItem(uniqueId)}
                            className="absolute top-6 right-0 p-1.5 rounded-lg text-zinc-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            title="Remove Item"
                          >
                            <PiTrash className="w-5 h-5" />
                          </button>
                        </div>
                        <div className="mt-2">
                          <input
                            type="text"
                            placeholder="Special Instructions (e.g. Extra mayo)"
                            value={item.specialInstructions || ""}
                            onChange={(e) => updateInstructions(uniqueId, e.target.value)}
                            className="w-full text-[11px] sm:text-xs text-zinc-600 bg-zinc-50 border border-zinc-200 rounded p-1.5 focus:outline-none focus:border-[#e63946] focus:ring-1 focus:ring-[#e63946] transition-colors"
                          />
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center mt-4">
                        {/* Quantity Selector */}
                        <div className="flex items-center border border-zinc-200 rounded-md bg-white">
                          <button 
                            onClick={() => handleQtyChange(uniqueId, item.quantity, "decrease")}
                            className="px-3 py-1.5 text-zinc-500 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                          >
                            <PiMinus className="w-3.5 h-3.5" />
                          </button>
                          <span className="text-[13px] font-bold text-zinc-900 w-5 text-center tabular-nums">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => handleQtyChange(uniqueId, item.quantity, "increase")}
                            className="px-3 py-1.5 text-zinc-500 hover:bg-zinc-50 active:bg-zinc-100 transition-colors"
                          >
                            <PiPlus className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Price */}
                        <div className="text-right pointer-events-none">
                          {item.discount_price && item.discount_price < item.price ? (
                            <>
                              <p className="text-[11px] font-medium text-zinc-500 line-through">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                              <p className="text-[15px] font-black text-zinc-900">Rs. {(item.discount_price * item.quantity).toLocaleString()}</p>
                            </>
                          ) : (
                            <p className="text-[15px] font-black text-zinc-900">Rs. {(item.price * item.quantity).toLocaleString()}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-6 bg-white border-t border-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-20 pb-6 sm:pb-6">
            {/* Coupon Input Area */}
            <div className="mb-4">
              <h3 className="text-[13px] font-bold text-zinc-900 mb-2.5">Promo Code</h3>
              {appliedCoupon ? (
                <div className="flex justify-between items-center bg-[#fcfcfc] rounded-xl p-3 border border-zinc-100/60 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-[#d4b383] bg-[#fcf8f2] p-1.5 rounded-lg border border-[#f0e6d6]">
                      <PiTag className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[13px] font-bold text-zinc-900">
                        {appliedCoupon.discount_type === "free_delivery" ? "YAY! Free Delivery" : `YAY! You saved Rs. ${discountAmount.toLocaleString()}`}
                      </p>
                      <p className="text-[11px] text-zinc-500 mt-0.5">
                        {appliedCoupon.code} Applied
                      </p>
                    </div>
                  </div>
                  <button onClick={handleRemoveCoupon} className="text-zinc-400 hover:text-red-500 transition-colors p-1" title="Remove Coupon">
                    <PiXCircle className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    placeholder="Coupon code" 
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    className="flex-1 bg-zinc-50 sm:bg-white border border-zinc-200 rounded-xl p-3 sm:p-2.5 text-[13px] sm:text-xs uppercase focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors"
                  />
                  <button 
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCode}
                    className="bg-black text-white px-4 py-3 sm:py-2 rounded-xl text-[11px] sm:text-xs font-bold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[75px] shadow-sm"
                  >
                    {couponLoading ? <PiCircleNotch className="w-4 h-4 animate-spin" /> : "Apply"}
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 mb-6">
              <div className="flex justify-between items-center text-[13px] text-zinc-600">
                <span>Subtotal</span>
                <span className="font-medium text-zinc-900">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[13px] text-zinc-600">
                <span>Delivery Fee</span>
                {appliedCoupon && appliedCoupon.discount_type === "free_delivery" ? (
                  <span className="flex items-center gap-2">
                    <span className="line-through text-zinc-400">Rs. 180</span>
                    <span className="text-green-600 font-bold uppercase text-[10px] bg-green-100 px-2 py-0.5 rounded-full">Free</span>
                  </span>
                ) : (
                  <span className="font-medium text-zinc-900">Rs. {deliveryCharges}</span>
                )}
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-[#9ab50e] font-bold text-[13px]">
                  <span>Discount</span>
                  <span>- Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-3 border-t border-zinc-100 mt-3">
                <span className="text-base font-bold text-zinc-900">Total</span>
                <span className="text-lg font-black text-zinc-900">Rs. {(subtotal + deliveryCharges - discountAmount).toLocaleString()}</span>
              </div>
            </div>

            <Link
              href="/cart"
              onClick={onClose}
              className="block w-full text-center bg-[#C0E212] text-black text-[15px] font-black uppercase tracking-widest py-4 sm:py-4 rounded-xl active:scale-[0.98] transition-transform shadow-lg shadow-[#C0E212]/20"
            >
              Checkout
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
