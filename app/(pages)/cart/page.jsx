"use client";
import { useState, useEffect, useRef } from "react";
import gsap from "gsap";
import { useCartStore, useLocationStore } from "@/app/lib/store";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Image from "next/image";
import Link from "next/link";
import {
  PiCheckCircle,
  PiCheck,
  PiCircleNotch,
  PiListChecks,
  PiTruck,
  PiClock,
  PiShoppingCart,
  PiArrowLeft,
  PiTote,
  PiLockKey,
  PiTag,
  PiXCircle,
} from "react-icons/pi";
import AuthForm from "@/app/components/ui/AuthForm";
import { supabase } from "@/app/lib/supabase";
import Navbar from "@/app/components/Navbar";
import ProductCard from "@/app/components/ui/ProductCard";
import useSWR from "swr";
import { sendGAEvent } from "@next/third-parties/google";

export default function CheckoutPage() {
  const { cart, clearCart, appliedCoupon, setAppliedCoupon } = useCartStore();
  const { orderType, deliveryCity, deliveryArea } = useLocationStore();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // Auth & Mode States
  const [user, setUser] = useState(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isGuestMode, setIsGuestMode] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const stepContainerRef = useRef(null);
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);

  // GSAP Animation for Stepper
  useEffect(() => {
    if (stepContainerRef.current) {
      gsap.fromTo(
        stepContainerRef.current,
        { opacity: 0, x: checkoutStep === 1 ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" }
      );
    }
    
    // Animate the active step indicator to grab user attention
    const activeRef = checkoutStep === 1 ? step1Ref.current : step2Ref.current;
    if (activeRef) {
      gsap.fromTo(activeRef, 
        { scale: 0.7, opacity: 0.5 }, 
        { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" }
      );
    }
  }, [checkoutStep]);

  // Coupon States
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

  // Sync coupon code if already applied from drawer
  useEffect(() => {
    if (appliedCoupon) setCouponCode(appliedCoupon.code);
  }, [appliedCoupon]);

  const [customerInfo, setCustomerInfo] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [hasMounted, setHasMounted] = useState(false);

  useEffect(() => {
    setHasMounted(true);

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setCustomerInfo((prev) => ({
          ...prev,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "",
          email: session.user.email || "",
        }));
      }
      setCheckingAuth(false);
    };
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setCustomerInfo((prev) => ({
          ...prev,
          name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0] ||
            "",
          email: session.user.email || "",
        }));
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const { data: suggestions = [], isLoading: isLoadingSuggestions } = useSWR(
    "random-products",
    async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .limit(8);
      if (error) throw error;
      // Shuffle array for randomness and pick top 4
      return data.sort(() => 0.5 - Math.random()).slice(0, 4);
    },
    { revalidateOnFocus: false },
  );

  const subtotal = hasMounted
    ? cart.reduce((total, item) => {
        const price = item.discount_price || item.price;
        return total + price * item.quantity;
      }, 0)
    : 0;

  let deliveryCharges = orderType === "Delivery" && subtotal > 0 ? 150 : 0; // Flat 150 delivery charge
  let discountAmount = 0;

  if (appliedCoupon && subtotal > 0) {
    if (appliedCoupon.discount_type === "free_delivery") {
      deliveryCharges = 0;
    } else if (appliedCoupon.discount_type === "percentage") {
      discountAmount = Math.floor(
        subtotal * (appliedCoupon.discount_value / 100),
      );
    } else if (appliedCoupon.discount_type === "fixed") {
      discountAmount = appliedCoupon.discount_value;
      if (discountAmount > subtotal) discountAmount = subtotal;
    }
  }

  const total = subtotal + deliveryCharges - discountAmount;

  const handleChange = (e) => {
    setCustomerInfo({ ...customerInfo, [e.target.name]: e.target.value });
  };

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

  const handleNextStep = (e) => {
    e.preventDefault();
    const form = document.getElementById("checkout-form");
    if (form.checkValidity()) {
      setCheckoutStep(2);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      form.reportValidity();
    }
  };

  const handleCheckout = async (e) => {
    e.preventDefault();
    
    // Only proceed to checkout if we are on step 2
    if (checkoutStep !== 2) return;
    setLoading(true);

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: customerInfo.name,
          customer_phone: customerInfo.phone,
          customer_address: customerInfo.address,
          order_type: orderType,
          delivery_city: deliveryCity,
          delivery_area: deliveryArea,
          total_amount: total,
          items: cart,
          userId: user?.id || null,
        }),
      });

      const data = await res.json();

      if (data.success) {
        toast.success("Order confirmed successfully!");

        // Track Purchase event for GA4
        sendGAEvent("event", "purchase", {
          transaction_id: data.orderId,
          value: total,
          currency: "PKR",
          items: cart.map((item) => ({
            item_id: item.id,
            item_name: item.name,
            item_category: item.category || "General",
            price: item.discount_price || item.price,
            quantity: item.quantity,
          })),
        });

        // Agar user login nahi hai to uski order id localStorage mein save karo
        if (!user) {
          const guestOrders = JSON.parse(
            localStorage.getItem("guestOrders") || "[]",
          );
          localStorage.setItem(
            "guestOrders",
            JSON.stringify([data.orderId, ...guestOrders]),
          );
        }

        setOrderSuccess(true);
        clearCart();
      } else {
        toast.error(data.message || "Failed to place order.");
      }
    } catch (error) {
      toast.error(error.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <>
        <Navbar />
        <div className="min-h-dvh pt-24 sm:pt-32 pb-12 flex flex-col items-center justify-center text-center px-4 sm:p-8 bg-white sm:bg-zinc-50 text-black">
          <div className="bg-white p-6 sm:p-10 md:p-16 rounded-none sm:rounded-[2.5rem] shadow-none border-none sm:border border-zinc-100 max-w-2xl w-full flex flex-col items-center relative overflow-hidden animate-success-pop">
            <div className="relative w-20 h-20 sm:w-24 sm:h-24 bg-[#C0E212]/20 rounded-full flex items-center justify-center mb-6 sm:mb-8 mt-4 sm:mt-0 animate-success-icon">
            <PiCheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-[#9ab50e]" />
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black uppercase tracking-tighter mb-3 sm:mb-4 relative z-10 px-2">
            Order Confirmed!
          </h1>
          <p className="text-zinc-500 text-[13px] sm:text-base max-w-md mb-8 sm:mb-10 leading-relaxed relative z-10 px-2">
            Thank you for ordering at Pioneer Broast. We will contact you shortly to
            verify your {orderType === "Delivery" ? "delivery" : "pickup"} order.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto relative z-10">
            <Link
              href="/"
              className="w-full sm:w-auto bg-black text-white font-bold px-8 py-4 sm:py-3.5 rounded-full active:scale-[0.98] transition-all uppercase tracking-widest text-[13px] sm:text-sm shadow-xl shadow-black/10 flex items-center justify-center"
            >
              Continue Shopping
            </Link>
            {user ? (
              <Link
                href="/profile"
                className="w-full sm:w-auto bg-white border-2 border-zinc-200 text-black font-bold px-8 py-4 sm:py-3.5 rounded-full hover:border-black active:scale-[0.98] transition-all uppercase tracking-widest text-[13px] sm:text-sm flex items-center justify-center"
              >
                See Your Order
              </Link>
            ) : (
              <Link
                href="/guest-orders"
                className="w-full sm:w-auto bg-white border-2 border-zinc-200 text-black font-bold px-8 py-4 sm:py-3.5 rounded-full hover:border-black active:scale-[0.98] transition-all uppercase tracking-widest text-[13px] sm:text-sm flex items-center justify-center"
              >
                See Your Order
              </Link>
            )}
          </div>
        </div>
      </div>
      </>
    );
  }

  if (cart.length === 0) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-zinc-50 pb-20 border-t border-zinc-200">
          <div className="flex flex-col items-center justify-center pt-16 sm:pt-24 pb-12 sm:pb-16 px-4 text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-zinc-100 rounded-full flex items-center justify-center mb-5 sm:mb-6 border border-zinc-200 shadow-sm">
              <PiShoppingCart className="w-10 h-10 text-zinc-300" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-black uppercase tracking-tighter mb-3 sm:mb-4 text-black">
              Your cart is empty
            </h1>
            <p className="text-zinc-500 mb-6 sm:mb-8 max-w-md text-[13px] sm:text-base font-medium px-2 sm:px-4">
              Looks like you haven&apos;t added anything to your cart yet.
              Discover our latest collection of premium tech gear.
            </p>
            <Link
              href="/"
              className="bg-[#C0E212] text-black font-black uppercase tracking-widest px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-[#a6c40e] transition-all active:scale-95 shadow-md text-xs sm:text-base"
            >
              Start Shopping
            </Link>
          </div>

          {/* Product Suggestions */}
          <div className="max-w-420 mx-auto px-4 sm:px-12 mt-2 sm:mt-4">
            <div className="flex items-center justify-between mb-6 sm:mb-8 border-b border-zinc-200 pb-3 sm:pb-4">
              <h2 className="text-lg sm:text-xl font-black uppercase tracking-tighter text-black">
                You might also like
              </h2>
            </div>
            {isLoadingSuggestions ? (
              <div className="flex justify-center py-12">
                <PiCircleNotch className="w-8 h-8 animate-spin text-[#C0E212]" />
              </div>
            ) : suggestions.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6">
                {suggestions.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </>
    );
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <PiCircleNotch className="w-10 h-10 animate-spin text-[#C0E212]" />
      </div>
    );
  }

  // Auth Modal (Overlay)
  let authModal = null;
  if (!user && !isGuestMode) {
    if (showLoginForm) {
      authModal = (
        <div className="fixed inset-0 z-[100] bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="w-full max-w-md relative animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowLoginForm(false)}
              className="absolute -top-12 left-0 inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white/80 hover:text-white transition-colors"
            >
              <PiArrowLeft className="w-4 h-4" /> Back
            </button>
            <AuthForm onGuestCheckout={() => setIsGuestMode(true)} />
          </div>
        </div>
      );
    } else {
      authModal = (
        <div className="fixed inset-0 z-[100] bg-zinc-950/40 backdrop-blur-sm flex flex-col items-center justify-center p-4 sm:p-6">
          <div className="absolute top-6 left-4 sm:left-6">
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-white hover:text-zinc-200 transition-colors drop-shadow-md"
            >
              <PiArrowLeft className="w-4 h-4" /> Back to Store
            </Link>
          </div>

          <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 shadow-2xl flex flex-col items-center text-center animate-in zoom-in-95 duration-300">
            <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
              <PiTote className="w-8 h-8 text-black" />
            </div>

            <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-black mb-3">
              Almost There!
            </h1>
            <p className="text-[13px] sm:text-sm text-zinc-500 leading-relaxed mb-8 px-2">
              Continue as a guest for a fast checkout, or log in to track your
              orders easily.
            </p>

            <div className="w-full space-y-3">
              <button
                onClick={() => setIsGuestMode(true)}
                className="w-full bg-[#C0E212] text-black font-black uppercase tracking-widest py-4 rounded-xl active:scale-[0.98] transition-transform hover:bg-[#a6c40e] shadow-lg shadow-[#C0E212]/20 text-[13px] sm:text-sm"
              >
                Checkout as Guest
              </button>

              <button
                onClick={() => setShowLoginForm(true)}
                className="w-full bg-zinc-950 text-white font-bold uppercase tracking-widest py-4 rounded-xl active:scale-[0.98] transition-transform hover:bg-black text-[13px] sm:text-sm shadow-md"
              >
                Log in / Sign Up
              </button>
            </div>
          </div>
        </div>
      );
    }
  }

  return (
    <>
      {authModal}
      <div className={`min-h-screen overflow-x-hidden bg-white text-zinc-950 px-4 sm:px-6 lg:p-12 pb-48 lg:pb-12 pt-20 sm:pt-24 lg:pt-12 relative ${authModal ? 'h-screen overflow-hidden pointer-events-none blur-sm' : ''}`}>
      {/* Mobile / Desktop Absolute Back Button */}
      <div className="w-full max-w-420 mx-auto absolute top-4 sm:top-6 left-0 right-0 px-4 sm:px-6 lg:top-8 lg:px-8 flex justify-start z-10">
        {checkoutStep === 2 ? (
          <button
            type="button"
            onClick={() => setCheckoutStep(1)}
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors bg-zinc-50 lg:bg-transparent px-3 py-2 lg:p-0 rounded-lg lg:rounded-none"
          >
            <PiArrowLeft className="w-4 h-4" />
            Back to Details
          </button>
        ) : (
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-bold uppercase tracking-widest text-zinc-500 hover:text-black transition-colors bg-zinc-50 lg:bg-transparent px-3 py-2 lg:p-0 rounded-lg lg:rounded-none"
          >
            <PiArrowLeft className="w-4 h-4" />
            Back to Store
          </Link>
        )}
      </div>

      {/* Stepper Header */}
      <div className="w-full max-w-[280px] sm:max-w-sm mx-auto mb-6 sm:mb-14 mt-4 flex items-center justify-between relative px-2 sm:px-4">
        {/* Background Line */}
        <div className="absolute top-5 sm:top-6 left-16 right-16 sm:left-20 sm:right-20 h-[3px] bg-zinc-200 z-0 rounded-full overflow-hidden">
          {checkoutStep === 1 && (
            <div className="absolute top-0 left-0 w-1/2 h-full opacity-50 bg-linear-to-r from-transparent via-[#3b82f6] to-transparent" 
                 style={{ animation: 'slideGradient 1.5s linear infinite' }}
            />
          )}
        </div>
        {/* Active Line */}
        <div 
          className="absolute top-5 sm:top-6 left-16 right-16 sm:left-20 sm:right-20 h-[3px] bg-[#10b981] z-0 transition-all duration-700 ease-in-out rounded-full overflow-hidden origin-left" 
          style={{ transform: checkoutStep === 2 ? 'scaleX(1)' : 'scaleX(0)' }}
        >
          {checkoutStep === 2 && (
            <div className="absolute top-0 left-0 w-[40%] h-full opacity-80 bg-linear-to-r from-transparent via-white to-transparent rounded-full" 
                 style={{ animation: 'slideGradient 1.5s ease-in-out infinite' }}
            />
          )}
        </div>
        <style>{`
          @keyframes slideGradient {
            0% { transform: translateX(-200%); }
            100% { transform: translateX(300%); }
          }
        `}</style>
        
        {/* Step 1 */}
        <div 
          onClick={() => { if (checkoutStep === 2) setCheckoutStep(1); }}
          className={`flex flex-col items-center gap-2.5 bg-white group relative z-10 ${checkoutStep === 2 ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
        >
          <div ref={step1Ref} className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-500 ${checkoutStep === 1 ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] ring-4 ring-[#3b82f6]/20' : checkoutStep > 1 ? 'bg-[#10b981] text-white ring-4 ring-[#10b981]/20' : 'bg-white text-zinc-300 border-2 border-zinc-200'}`}>
            {checkoutStep > 1 ? <PiCheck className="w-5 h-5 sm:w-6 sm:h-6" /> : <PiTruck className="w-5 h-5 sm:w-6 sm:h-6" />}
            {checkoutStep === 1 && (
              <div className="absolute inset-0 rounded-full border-2 border-[#3b82f6] animate-ping opacity-30" style={{ animationDuration: '2s' }}></div>
            )}
          </div>
          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors duration-500 mt-1 whitespace-nowrap ${checkoutStep === 1 ? 'text-[#3b82f6]' : checkoutStep > 1 ? 'text-[#10b981]' : 'text-zinc-400'}`}>Delivery</span>
        </div>
        
        {/* Step 2 */}
        <div className="flex flex-col items-center gap-2.5 bg-white relative z-10">
          <div ref={step2Ref} className={`relative flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full transition-all duration-500 ${checkoutStep === 2 ? 'bg-[#3b82f6] text-white shadow-[0_0_15px_rgba(59,130,246,0.4)] ring-4 ring-[#3b82f6]/20' : 'bg-white text-zinc-400 border-2 border-zinc-200'}`}>
            <PiListChecks className="w-5 h-5 sm:w-6 sm:h-6" />
            {checkoutStep === 2 && (
              <div className="absolute inset-0 rounded-full border-2 border-[#3b82f6] animate-ping opacity-30" style={{ animationDuration: '2s' }}></div>
            )}
          </div>
          <span className={`text-[10px] sm:text-[11px] font-bold uppercase tracking-widest transition-colors duration-500 mt-1 whitespace-nowrap ${checkoutStep === 2 ? 'text-[#3b82f6]' : 'text-zinc-400'}`}>Review</span>
        </div>
      </div>

      <div ref={stepContainerRef} className="max-w-420 mx-auto grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-12 mt-2 sm:mt-0">
        {/* Left: Checkout Form */}
        <div className="order-2 lg:order-1">
          <div className="flex items-center justify-between mb-4 sm:mb-6 leading-none">
            <h1 className="text-xl sm:text-2xl font-bold uppercase tracking-tight text-black px-1 sm:px-0">
              {orderType === "Delivery" ? "Delivery Details" : "Pickup Details"}
            </h1>
            {/* Auth Badge */}
            <span
              className={`px-3 py-1 rounded-full text-[9px] sm:text-[10px] font-bold uppercase tracking-widest ${user ? "bg-[#C0E212] text-black" : "bg-zinc-100 text-zinc-500"}`}
            >
              {user ? "Logged In" : "Guest Checkout"}
            </span>
          </div>

          <form
            id="checkout-form"
            onSubmit={handleCheckout}
            className="space-y-4 sm:space-y-5 bg-transparent sm:bg-zinc-50 p-0 sm:p-6 sm:pb-6 rounded-none sm:rounded-xl border-none sm:border border-zinc-200 sm:shadow-sm"
          >
            <div className={`${checkoutStep === 2 && 'hidden'}`}>
              <div className="space-y-2.5 sm:space-y-4">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5 ml-1">
                    Full Name
                  </label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={customerInfo.name}
                    onChange={handleChange}
                    className="w-full bg-slate-100 border-none rounded-xl px-3 py-2.5 sm:px-3.5 sm:py-3 text-[13px] sm:text-sm text-black focus:outline-none focus:ring-1 focus:ring-black transition-colors shadow-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5 ml-1">
                    Phone Number or Whatsapp
                  </label>
                  <input
                    required
                    type="tel"
                    name="phone"
                    value={customerInfo.phone}
                    onChange={handleChange}
                    className="w-full bg-slate-100 border-none rounded-xl px-3 py-2.5 sm:px-3.5 sm:py-3 text-[13px] sm:text-sm text-black focus:outline-none focus:ring-1 focus:ring-black transition-colors shadow-sm"
                    placeholder="03XX-XXXXXXX"
                  />
                </div>

                {orderType === "Delivery" && (
                  <>
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5 ml-1">
                        Complete Delivery Address
                      </label>
                      <textarea
                        required
                        rows="4"
                        name="address"
                        value={customerInfo.address}
                        onChange={handleChange}
                        className="w-full bg-slate-100 border-none rounded-xl px-3 py-2.5 sm:px-3.5 sm:py-3 text-[13px] sm:text-sm text-black focus:outline-none focus:ring-1 focus:ring-black transition-colors resize-none shadow-sm leading-relaxed"
                        placeholder="House no, Street, Area..."
                      />
                    </div>

                    <div className="flex gap-3">
                      <div className="flex-1">
                        <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5 ml-1">
                          City
                        </label>
                        <input
                          readOnly
                          value={deliveryCity || "Karachi"}
                          className="w-full bg-slate-200 border-none rounded-xl px-3 py-2.5 sm:px-3.5 sm:py-3 text-[13px] sm:text-sm text-zinc-600 focus:outline-none cursor-not-allowed shadow-sm"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="block text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-500 mb-0.5 ml-1">
                          Area
                        </label>
                        <input
                          readOnly
                          value={deliveryArea || ""}
                          className="w-full bg-slate-200 border-none rounded-xl px-3 py-2.5 sm:px-3.5 sm:py-3 text-[13px] sm:text-sm text-zinc-600 focus:outline-none cursor-not-allowed shadow-sm"
                        />
                      </div>
                    </div>
                  </>
                )}
              </div>

              <button
                type="button"
                onClick={handleNextStep}
                className="hidden lg:flex w-full bg-black text-white font-semibold uppercase tracking-widest py-3.5 sm:py-4 rounded-xl sm:rounded-full active:scale-[0.98] transition-all hover:bg-zinc-800 text-[12px] sm:text-sm mt-5 sm:mt-6 shadow-md shadow-black/10 hover:shadow-lg items-center justify-center gap-2"
              >
                Next: Review Order <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>

            {/* Step 2 Form view (Readonly summary of details) */}
            <div className={`${checkoutStep === 1 ? 'hidden' : 'block'} space-y-3 sm:space-y-4`}>
              <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 sm:p-5 mt-4 sm:mt-0">
                <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-zinc-200 pb-2 sm:pb-3">
                  <h3 className="font-semibold text-[11px] sm:text-xs text-black uppercase tracking-wider">Contact Info</h3>
                  {checkoutStep === 2 && (
                    <button type="button" onClick={() => setCheckoutStep(1)} className="text-[10px] sm:text-[11px] font-semibold underline text-zinc-500 uppercase tracking-wider hover:text-black">Edit</button>
                  )}
                </div>
                <p className="text-[12px] sm:text-sm text-zinc-700 font-medium mb-0.5">{customerInfo.name || "—"}</p>
                <p className="text-[12px] sm:text-sm text-zinc-700 font-medium">{customerInfo.phone || "—"}</p>
              </div>

              {orderType === "Delivery" && (
                <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 sm:p-5">
                  <div className="flex items-center justify-between mb-2 sm:mb-3 border-b border-zinc-200 pb-2 sm:pb-3">
                    <h3 className="font-semibold text-[11px] sm:text-xs text-black uppercase tracking-wider">Delivery Address</h3>
                    {checkoutStep === 2 && (
                      <button type="button" onClick={() => setCheckoutStep(1)} className="text-[10px] sm:text-[11px] font-semibold underline text-zinc-500 uppercase tracking-wider hover:text-black">Edit</button>
                    )}
                  </div>
                  <p className="text-[12px] sm:text-sm text-zinc-700 font-medium mb-0.5 line-clamp-2">{customerInfo.address || "—"}</p>
                  <p className="text-[12px] sm:text-sm text-zinc-700 font-medium">{deliveryCity}, {deliveryArea}</p>
                </div>
              )}

            <div className={`${checkoutStep === 1 ? 'hidden' : 'flex'} bg-zinc-50 sm:bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-zinc-200 items-center gap-3 mt-3 sm:mt-4`}>
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-white sm:bg-zinc-100 rounded-full flex items-center justify-center shrink-0 border border-zinc-100 sm:border-none shadow-sm sm:shadow-none">
                <PiTruck className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
              </div>
              <div>
                <p className="font-semibold text-[12px] sm:text-sm text-black uppercase tracking-wide">
                  Cash on Delivery
                </p>
                <p className="text-zinc-500 text-[10px] sm:text-[11px] mt-0.5">
                  Pay when you receive your order.
                </p>
              </div>
            </div>

            </div>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className={`order-1 lg:order-2 bg-transparent sm:bg-zinc-50 p-0 sm:p-8 rounded-none sm:rounded-xl border-none sm:border border-zinc-200 h-fit lg:sticky lg:top-24 sm:shadow-sm mb-4 sm:mb-0 ${checkoutStep === 1 && 'hidden lg:block'}`}>
          <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tight mb-3 sm:mb-6 text-black">
            Order Summary
          </h2>
          <div className="space-y-3 sm:space-y-4 mb-4 sm:mb-6 max-h-[40vh] lg:max-h-none overflow-y-auto pr-2 custom-scrollbar">
            {cart.map((item) => (
              <div
                key={item.cartItemId || item.id}
                className="flex gap-3 sm:gap-4 items-center border-b border-zinc-200 pb-3 sm:pb-4"
              >
                <Link
                  href={`/product/${item.slug}`}
                  className="relative w-12 h-12 sm:w-16 sm:h-16 rounded overflow-hidden bg-white border border-zinc-200 shrink-0 block transition-transform hover:scale-105"
                >
                  <Image
                    src={item.image_url || "https://via.placeholder.com/100"}
                    alt={item.name}
                    fill
                    className="object-cover"
                  />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link href={`/product/${item.slug}`}>
                    <h3 className="text-[12px] sm:text-sm font-semibold text-black line-clamp-2 sm:line-clamp-1 hover:underline cursor-pointer leading-snug">
                      {item.name}
                    </h3>
                  </Link>
                  {item.specialInstructions && (
                    <p className="text-[9px] sm:text-[11px] font-semibold text-zinc-500 mt-0.5">
                      Note: {item.specialInstructions}
                    </p>
                  )}
                  <p className="text-zinc-500 text-[11px] sm:text-sm mt-0.5 font-medium">
                    Qty: {item.quantity}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-2">
                  <p className="font-semibold text-[13px] sm:text-base text-black">
                    Rs. {(item.discount_price || item.price) * item.quantity}
                  </p>
                </div>
              </div>
            ))}
          </div>

            {/* Coupon Input Area */}
            <div className="mb-5 pt-3 sm:mb-6 sm:pt-4 border-t border-zinc-200">
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
                  placeholder="Have a coupon code?"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  className="flex-1 bg-zinc-50 sm:bg-white border border-zinc-200 rounded-xl p-3 sm:p-3 text-[12px] sm:text-sm uppercase focus:outline-none focus:border-black focus:ring-1 focus:ring-black transition-colors shadow-sm"
                />
                <button
                  onClick={handleApplyCoupon}
                  disabled={couponLoading || !couponCode}
                  className="bg-black text-white px-5 sm:px-6 py-3 rounded-xl text-[11px] sm:text-sm font-semibold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[80px] sm:min-w-[90px] shadow-sm"
                >
                  {couponLoading ? (
                    <PiCircleNotch className="w-4 h-4 animate-spin" />
                  ) : (
                    "Apply"
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="space-y-2 sm:space-y-3 text-xs sm:text-sm text-zinc-600 font-medium">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>Rs. {subtotal}</span>
            </div>
            <div className="flex justify-between items-center">
              <span>Delivery</span>
              {appliedCoupon &&
              appliedCoupon.discount_type === "free_delivery" ? (
                <span className="flex items-center gap-2">
                <span className="line-through text-zinc-400">Rs. 150</span>
                  <span className="text-green-600 font-bold uppercase text-[10px] bg-green-100 px-2 py-0.5 rounded-full">
                    Free
                  </span>
                </span>
              ) : (
                <span>Rs. {deliveryCharges}</span>
              )}
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-[#9ab50e] font-bold">
                <span>Discount ({appliedCoupon.code})</span>
                <span>- Rs. {discountAmount}</span>
              </div>
            )}
            <div className="hidden lg:flex justify-between text-base sm:text-xl font-bold text-black pt-3 border-t border-zinc-200">
              <span className="uppercase tracking-wider">Total</span>
              <span>Rs. {total}</span>
            </div>

            {/* Desktop Place Order Button */}
            {checkoutStep === 2 && (
              <div className="hidden lg:block mt-6">
                <button
                  type="submit"
                  form="checkout-form"
                  disabled={loading}
                  className="w-full bg-[#C0E212] text-black font-semibold uppercase tracking-widest py-4 rounded-full active:scale-[0.98] transition-all hover:bg-[#a6c40e] disabled:opacity-50 flex justify-center items-center text-sm shadow-md border border-[#9ab50e]/30 shadow-[#C0E212]/10 hover:shadow-lg hover:shadow-[#C0E212]/20 gap-2"
                >
                  {loading ? (
                    <PiCircleNotch className="w-5 h-5 animate-spin" />
                  ) : (
                    <><PiLockKey className="w-5 h-5" /> Place Order</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky Bottom Action Bar for Mobile (App-like) */}
      <div className="fixed bottom-0 left-0 w-full bg-white/85 backdrop-blur-2xl border-t border-zinc-200 p-3 pb-5 shadow-[0_-20px_40px_rgba(0,0,0,0.06)] z-50 lg:hidden flex-col gap-2.5 rounded-t-3xl flex">
        <div className="flex justify-between items-center px-2">
          <span className="font-semibold text-zinc-500 uppercase tracking-wider text-[10px]">
            Total to pay
          </span>
          <span className="font-black text-xl text-black">
            Rs. {total.toLocaleString()}
          </span>
        </div>
        {checkoutStep === 1 ? (
          <button
            type="button"
            onClick={handleNextStep}
            className="w-full bg-black text-white font-semibold uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all hover:bg-zinc-800 text-[13px] shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
          >
            Next: Review Order <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
          </button>
        ) : (
          <button
            type="submit"
            form="checkout-form"
            disabled={loading}
            className="w-full bg-[#C0E212] text-black font-semibold uppercase tracking-widest py-3.5 rounded-xl active:scale-[0.98] transition-all hover:bg-[#a6c40e] disabled:opacity-50 flex justify-center items-center text-[13px] shadow-md border border-[#9ab50e]/30 hover:shadow-lg gap-1.5"
          >
            {loading ? (
              <PiCircleNotch className="w-5 h-5 animate-spin" />
            ) : (
              <><PiLockKey className="w-4 h-4" /> Place Order</>
            )}
          </button>
        )}
      </div>
    </div>
    </>
  );
}
