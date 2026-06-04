"use client";
import { useState, useEffect, useRef } from "react";
import { useCartStore, useLocationStore } from "@/app/lib/store";
import { PiX, PiPlus, PiMinus, PiTrash, PiTote, PiTruck, PiCircleNotch, PiTag, PiXCircle, PiArrowRight, PiArrowLeft, PiPencilSimple } from "react-icons/pi";
import Image from "next/image";
import Link from "next/link";
import { gsap } from "gsap";
import useSWR from "swr";
import { supabase } from "@/app/lib/supabase";
import ProductCard from "@/app/components/ui/ProductCard";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// Removed getColorCode helper as it is no longer needed

export default function CartDrawer({ isOpen, onClose }) {
  const { cart, removeFromCart, updateQuantity, appliedCoupon, setAppliedCoupon, updateInstructions } = useCartStore();
  const { exactLocation, deliveryArea, deliveryCity, orderType } = useLocationStore();
  const router = useRouter();
  
  const defaultArea = exactLocation ? exactLocation.address : (deliveryArea || "Not selected");
  
  const [isEditing, setIsEditing] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    // Load saved customer info if available
    const savedInfo = localStorage.getItem("customerInfo");
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        if (parsed.name) setCustomerName(parsed.name);
        if (parsed.phone) setCustomerPhone(parsed.phone);
        if (parsed.address) setCustomerAddress(parsed.address);
      } catch (err) {
        console.error("Error parsing saved customer info", err);
      }
    }
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
      return data.sort(() => 0.5 - Math.random()).slice(0, 4);
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
  let deliveryCharges = subtotal > 0 ? 100 : 0;
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

  const handlePlaceOrder = async () => {
    if (!customerName || !customerPhone || !customerAddress) {
      toast.error("Please fill in your Name, Phone, and Address first!");
      setIsEditing(true);
      return;
    }
    
    setIsSubmitting(true);
    try {
      // Save customer details for checkout page
      localStorage.setItem("customerInfo", JSON.stringify({
        name: customerName,
        phone: customerPhone,
        address: customerAddress
      }));
      
      onClose();
      router.push("/cart?step=2");
    } catch (err) {
      console.error(err);
      toast.error("Failed to proceed to checkout. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
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
      <div className="fixed top-0 right-0 h-full w-full sm:w-[380px] bg-[#f8f9fa] z-50 shadow-[0_0_40px_rgba(0,0,0,0.1)] flex flex-col transform transition-transform duration-300 border-l border-zinc-200 overscroll-none">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 pb-4 relative z-10 bg-white shadow-sm">
          <h2 className="text-[20px] sm:text-[22px] font-medium text-zinc-900 tracking-tight">
            Your Cart
          </h2>
          <button
            onClick={onClose}
            className="p-1 text-white bg-[#e63946] hover:bg-red-600 transition-colors rounded-full"
          >
            <PiX className="w-5 h-5 sm:w-6 sm:h-6" weight="bold" />
          </button>
        </div>

        {/* Cart Items & Scrollable Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto custom-scrollbar overscroll-none bg-white">
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
            </div>
          ) : (
            <div className="space-y-4 pb-6">
              {/* Items List */}
              <div className="space-y-2 px-4 sm:px-6">
                {cart.map((item) => {
                  const uniqueId = item.cartItemId || item.id;
                  return (
                    <div
                      key={uniqueId}
                      ref={(el) => (itemRefs.current[uniqueId] = el)}
                      onTouchStart={(e) => handleTouchStart(e, uniqueId)}
                      onTouchEnd={(e) => handleTouchEnd(e, uniqueId)}
                      className="flex items-center justify-between py-4 border-b border-zinc-100 relative overflow-hidden bg-white"
                    >
                      <div className="flex gap-4 items-center flex-1 pr-4">
                         <div className="w-[60px] h-[60px] sm:w-[70px] sm:h-[70px] bg-[#e63946] shrink-0 flex items-center justify-center rounded-xl relative overflow-hidden pointer-events-none">
                           <Image src={item.image_url || "https://via.placeholder.com/150"} fill className="object-cover" alt={item.name} />
                         </div>
                         <div className="flex flex-col">
                           <h3 className="text-[13px] sm:text-[14px] uppercase text-zinc-900 leading-snug truncate max-w-[140px]">{item.name}</h3>
                           <p className="text-[14px] font-bold text-zinc-900 mt-1">Rs. {item.discount_price || item.price}</p>
                         </div>
                      </div>
                      
                      <div className="flex items-center border border-[#e63946] rounded-full bg-white px-2 py-1 min-w-[80px] justify-between shrink-0">
                        <button onClick={() => handleQtyChange(uniqueId, item.quantity, "decrease")} className="text-[#e63946] p-1">
                          <PiMinus className="w-3 h-3" weight="bold" />
                        </button>
                        <span className="text-[14px] font-medium text-[#e63946]">
                          {item.quantity}
                        </span>
                        <button onClick={() => handleQtyChange(uniqueId, item.quantity, "increase")} className="text-[#e63946] p-1">
                          <PiPlus className="w-3 h-3" weight="bold" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Add More Items Button */}
              <div className="px-4 sm:px-6">
                <button onClick={onClose} className="flex items-center gap-2 text-zinc-500 hover:text-black font-medium text-[15px] transition-colors mt-2">
                  <PiPlus className="w-4 h-4" /> Add more items
                </button>
              </div>

              {/* Quick Order Section */}
              <div className="px-4 sm:px-6">
                <div className="mt-6 bg-[#e63946] rounded-xl pt-4 pb-1.5 px-1.5 relative">
                  <h3 className="text-white text-center text-[13px] font-bold mb-4">Place a quick order using the Info Below</h3>
                  
                  <div className="bg-white rounded-lg p-3 sm:p-4 relative pt-5">
                     <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex bg-white rounded-full shadow-sm p-1 border border-zinc-100 whitespace-nowrap">
                       <button className="bg-[#e63946] text-white px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wide">CASH</button>
                       <button className="text-zinc-400 px-4 py-1.5 rounded-full text-[10px] font-bold tracking-wide cursor-not-allowed" title="Online Payment Currently Disabled">ONLINE PAYMENT</button>
                     </div>
                     
                     {isEditing ? (
                       <div className="mt-2 space-y-2">
                         <div>
                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Name</label>
                           <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="w-full border border-zinc-200 rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#e63946]" placeholder="Your Full Name" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Phone</label>
                           <input type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} className="w-full border border-zinc-200 rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#e63946]" placeholder="03XX-XXXXXXX" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-zinc-500 uppercase">House/Street Address</label>
                           <input type="text" value={customerAddress} onChange={(e) => setCustomerAddress(e.target.value)} className="w-full border border-zinc-200 rounded px-2 py-1.5 text-[12px] focus:outline-none focus:border-[#e63946]" placeholder="House 123, Street 4" />
                         </div>
                         <div>
                           <label className="text-[10px] font-bold text-zinc-500 uppercase">Area (From Location)</label>
                           <input type="text" value={defaultArea} disabled className="w-full border border-zinc-200 rounded px-2 py-1.5 text-[12px] bg-zinc-50 text-zinc-500 cursor-not-allowed" />
                         </div>
                         <div className="flex justify-end pt-2">
                           <button onClick={() => setIsEditing(false)} className="bg-black text-white px-4 py-1.5 rounded-lg text-[12px] font-bold">Save Details</button>
                         </div>
                       </div>
                     ) : (
                       <div className="flex justify-between items-start mt-2">
                         <div className="text-[12px] space-y-1 w-[60%]">
                           <p className="truncate"><span className="font-bold text-black">Name:</span> <span className="text-zinc-500">{customerName || "Not set"}</span></p>
                           <p className="truncate"><span className="font-bold text-black">Phone#:</span> <span className="text-zinc-500">{customerPhone || "Not set"}</span></p>
                           <p className="truncate"><span className="font-bold text-black">Address:</span> <span className="text-zinc-500">{customerAddress ? `${customerAddress}, ${defaultArea}` : "Not set"}</span></p>
                         </div>
                         <div className="w-[40%] flex flex-col items-end justify-between h-[60px]">
                           <button onClick={() => setIsEditing(true)} className="text-[#0ea5e9] flex items-center gap-1 text-[12px] font-medium">
                             Edit <PiPencilSimple className="w-4 h-4" />
                           </button>
                           <button 
                             onClick={handlePlaceOrder}
                             disabled={isSubmitting}
                             className="bg-[#ffc107] text-black font-medium px-4 py-1.5 rounded-lg text-[12px] mt-2 w-full text-center hover:bg-[#e0a800] transition-colors whitespace-nowrap shadow-sm disabled:opacity-50"
                           >
                             {isSubmitting ? "Placing..." : "Place Order"}
                           </button>
                         </div>
                       </div>
                     )}
                  </div>
                </div>
              </div>

              {/* Suggestions / Carousel */}
              <div className="mt-8 border-t border-zinc-100 pt-6 px-4 sm:px-6">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="text-[15px] font-bold text-zinc-900">Popular with your order</h3>
                  <div className="flex gap-2">
                    <button className="w-7 h-7 border border-black rounded flex items-center justify-center hover:bg-zinc-100 transition-colors">
                      <PiArrowLeft className="w-4 h-4 text-black" weight="bold" />
                    </button>
                    <button className="w-7 h-7 border border-black rounded flex items-center justify-center hover:bg-zinc-100 transition-colors">
                      <PiArrowRight className="w-4 h-4 text-black" weight="bold" />
                    </button>
                  </div>
                </div>
                <p className="text-[12px] text-zinc-500 mb-4">Customers often buy these together</p>
                
                {isLoadingSuggestions ? (
                  <div className="flex justify-center py-8">
                    <PiCircleNotch className="w-6 h-6 animate-spin text-[#e63946]" />
                  </div>
                ) : (
                  <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    {suggestions.map((item) => (
                      <div key={item.id} className="min-w-[120px] max-w-[120px] flex-shrink-0 cursor-pointer" onClick={onClose}>
                         <div className="w-full h-[120px] bg-[#e63946] rounded-xl relative overflow-hidden flex items-center justify-center p-2">
                           <Image src={item.image_url || "https://via.placeholder.com/150"} fill className="object-contain drop-shadow-lg" alt={item.name} />
                           <button className="absolute bottom-2 right-2 bg-white rounded-full p-1.5 shadow-md text-[#e63946] hover:scale-110 transition-transform">
                             <PiPlus className="w-4 h-4" weight="bold" />
                           </button>
                         </div>
                         <div className="mt-2">
                           <p className="text-[13px] font-bold text-black">Rs. {item.discount_price || item.price}</p>
                           <p className="text-[11px] text-zinc-500 truncate uppercase">{item.name}</p>
                         </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer / Summary */}
        {cart.length > 0 && (
          <div className="p-4 sm:p-6 bg-white border-t border-zinc-100 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] z-20 pb-6 sm:pb-6">
            
            <div className="space-y-2 mb-4">
              <div className="flex justify-between items-center text-[14px] text-zinc-700">
                <span>Total</span>
                <span className="text-zinc-900">Rs. {subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[14px] text-zinc-700">
                <span>Delivery Fee</span>
                {appliedCoupon && appliedCoupon.discount_type === "free_delivery" ? (
                  <span className="flex items-center gap-2">
                    <span className="line-through text-zinc-400">Rs. 100</span>
                    <span className="text-green-600 font-bold uppercase text-[10px] bg-green-100 px-2 py-0.5 rounded-full">Free</span>
                  </span>
                ) : (
                  <span className="text-zinc-900">Rs. {deliveryCharges}</span>
                )}
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between items-center text-[14px] text-[#9ab50e] font-bold">
                  <span>Discount</span>
                  <span>- Rs. {discountAmount.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between items-center text-[15px] font-medium text-zinc-900 pt-2 border-t border-zinc-100 mt-2">
                <span>Grand Total</span>
                <span>Rs. {(subtotal + deliveryCharges - discountAmount).toLocaleString()}</span>
              </div>
            </div>

            <Link
              href="/cart"
              onClick={onClose}
              className="w-full bg-[#e63946] text-white text-[16px] font-bold tracking-wide py-4 rounded-xl active:scale-[0.98] transition-transform shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 relative"
            >
              Checkout
              <div className="absolute right-4 bg-white text-[#e63946] rounded-full p-0.5">
                <PiArrowRight className="w-4 h-4" weight="bold" />
              </div>
            </Link>
          </div>
        )}
      </div>
    </>
  );
}

