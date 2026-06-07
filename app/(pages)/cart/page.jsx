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
  PiTote as PiShoppingCart,
  PiArrowLeft,
  PiTote,
  PiLockKey,
  PiTag,
  PiXCircle,
} from "react-icons/pi";

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
  const [checkoutStep, setCheckoutStep] = useState(1);
  const stepContainerRef = useRef(null);
  const step1Ref = useRef(null);
  const step2Ref = useRef(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("step") === "2") {
        setCheckoutStep(2);
      }
    }
  }, []);

  // GSAP Animation for Stepper
  useEffect(() => {
    if (stepContainerRef.current) {
      gsap.fromTo(
        stepContainerRef.current,
        { opacity: 0, x: checkoutStep === 1 ? -20 : 20 },
        { opacity: 1, x: 0, duration: 0.5, ease: "power3.out" },
      );
    }

    // Animate the active step indicator to grab user attention
    const activeRef = checkoutStep === 1 ? step1Ref.current : step2Ref.current;
    if (activeRef) {
      gsap.fromTo(
        activeRef,
        { scale: 0.7, opacity: 0.5 },
        { scale: 1, opacity: 1, duration: 0.6, ease: "elastic.out(1, 0.5)" },
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
    const savedInfo = localStorage.getItem("customerInfo");
    if (savedInfo) {
      try {
        const parsed = JSON.parse(savedInfo);
        setCustomerInfo({
          name: parsed.name || "",
          phone: parsed.phone || "",
          address: parsed.address || "",
          email: "", // Keep email empty if it's not saved
        });
      } catch (err) {
        console.error("Error parsing saved customer info", err);
      }
    }
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
    if (e) e.preventDefault();

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

        // Save order id to local storage for order tracking
        const guestOrders = JSON.parse(
          localStorage.getItem("guestOrders") || "[]",
        );
        localStorage.setItem(
          "guestOrders",
          JSON.stringify([data.orderId, ...guestOrders]),
        );

        // Save customer details for future orders
        localStorage.setItem(
          "customerInfo",
          JSON.stringify({
            name: customerInfo.name,
            phone: customerInfo.phone,
            address: customerInfo.address,
          }),
        );

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
              Thank you for ordering at Pioneer Broast. We will contact you
              shortly to verify your{" "}
              {orderType === "Delivery" ? "delivery" : "pickup"} order.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 w-full sm:w-auto relative z-10">
              <Link
                href="/"
                className="w-full sm:w-auto bg-black text-white font-bold px-8 py-4 sm:py-3.5 rounded-full active:scale-[0.98] transition-all uppercase tracking-widest text-[13px] sm:text-sm shadow-xl shadow-black/10 flex items-center justify-center"
              >
                Continue Ordering
              </Link>
              <Link
                href="/my-orders"
                className="w-full sm:w-auto bg-white border-2 border-zinc-200 text-black font-bold px-8 py-4 sm:py-3.5 rounded-full hover:border-black active:scale-[0.98] transition-all uppercase tracking-widest text-[13px] sm:text-sm flex items-center justify-center"
              >
                See Your Order
              </Link>
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
              Your bucket is empty
            </h1>
            <p className="text-zinc-500 mb-6 sm:mb-8 max-w-md text-[13px] sm:text-base font-medium px-2 sm:px-4">
              Looks like you haven&apos;t added anything to your bucket yet.
              Discover our latest collection of premium tech gear.
            </p>
            <Link
              href="/"
              className="bg-[#C0E212] text-black font-black uppercase tracking-widest px-6 py-3.5 sm:px-8 sm:py-4 rounded-xl hover:bg-[#a6c40e] transition-all active:scale-95 shadow-md text-xs sm:text-base"
            >
              Start Ordering
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

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#f8f9fa] text-zinc-900 pb-36 sm:pb-32 lg:pb-24 pt-20 lg:pt-24 relative selection:bg-[#C0E212] selection:text-black font-sans">
        {/* Header / Back Button */}
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-5 sm:mb-8 lg:mb-10 flex items-center justify-between z-10 relative">
          {checkoutStep === 2 ? (
            <button
              type="button"
              onClick={() => setCheckoutStep(1)}
              className="group inline-flex items-center gap-2 text-[13px] sm:text-sm font-medium uppercase tracking-widest text-zinc-500 hover:text-black transition-colors bg-white lg:bg-transparent px-3.5 sm:px-4 py-2 sm:py-2.5 lg:p-0 rounded-xl lg:rounded-none shadow-sm lg:shadow-none border border-zinc-200 lg:border-transparent"
            >
              <PiArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Details
            </button>
          ) : (
            <Link
              href="/"
              className="group inline-flex items-center gap-2 text-[13px] sm:text-sm font-medium uppercase tracking-widest text-zinc-500 hover:text-black transition-colors bg-white lg:bg-transparent px-3.5 sm:px-4 py-2 sm:py-2.5 lg:p-0 rounded-xl lg:rounded-none shadow-sm lg:shadow-none border border-zinc-200 lg:border-transparent"
            >
              <PiArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 group-hover:-translate-x-1 transition-transform" />
              Back to Store
            </Link>
          )}
        </div>

        <div
          ref={stepContainerRef}
          className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-16"
        >
          {/* Left: Checkout Form (7 columns) */}
          <div className="order-2 lg:order-1 lg:col-span-7 flex flex-col">
            <div className="mb-5 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold uppercase tracking-tighter text-black mb-1.5 sm:mb-2">
                Checkout
              </h1>
              <p className="text-zinc-500 text-[13px] sm:text-sm font-medium">
                {checkoutStep === 1 ? "Please enter your delivery details below." : "Review your order details."}
              </p>
            </div>

            {/* Premium Stepper inline */}
            <div className="flex items-center gap-2 sm:gap-4 mb-6 sm:mb-10 w-full overflow-hidden">
              <div className={`flex items-center gap-1.5 sm:gap-3 shrink-0 ${checkoutStep >= 1 ? "opacity-100" : "opacity-50"}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-[10px] sm:text-sm shrink-0 ${checkoutStep === 1 ? "bg-black text-white" : "bg-[#10b981] text-white"}`}>
                  {checkoutStep > 1 ? <PiCheck className="w-3.5 h-3.5 sm:w-5 sm:h-5" /> : "1"}
                </div>
                <span className={`font-semibold uppercase tracking-widest text-[9px] sm:text-xs whitespace-nowrap ${checkoutStep === 1 ? "text-black" : "text-[#10b981]"}`}>Details</span>
              </div>
              <div className={`h-[2px] flex-1 bg-zinc-200 relative overflow-hidden min-w-[30px] sm:min-w-[40px] rounded-full`}>
                <div className={`absolute top-0 left-0 h-full bg-[#10b981] transition-all duration-700 ${checkoutStep === 2 ? "w-full" : "w-0"}`} />
              </div>
              <div className={`flex items-center gap-1.5 sm:gap-3 shrink-0 ${checkoutStep === 2 ? "opacity-100" : "opacity-40"}`}>
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center font-semibold text-[10px] sm:text-sm shrink-0 ${checkoutStep === 2 ? "bg-black text-white" : "bg-zinc-200 text-zinc-500"}`}>
                  2
                </div>
                <span className={`font-semibold uppercase tracking-widest text-[9px] sm:text-xs whitespace-nowrap ${checkoutStep === 2 ? "text-black" : "text-zinc-500"}`}>Review</span>
              </div>
            </div>

            <form
              id="checkout-form"
              onSubmit={handleCheckout}
              className="bg-white p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-200/60 shadow-xl shadow-zinc-200/20 relative overflow-hidden"
            >
              {/* Form Content */}
              <div className={`${checkoutStep === 2 && "hidden"}`}>
                <div className="space-y-4 sm:space-y-6">
                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                      Full Name
                    </label>
                    <input
                      required
                      type="text"
                      name="name"
                      value={customerInfo.name}
                      onChange={handleChange}
                      className="w-full bg-[#f4f5f7] border border-transparent hover:border-zinc-300 rounded-sm px-3.5 sm:px-4 py-3 sm:py-3.5 text-[13px] sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium"
                      placeholder="e.g. John Doe"
                    />
                  </div>

                  <div className="space-y-1 sm:space-y-1.5">
                    <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                      Phone / WhatsApp
                    </label>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={customerInfo.phone}
                      onChange={handleChange}
                      className="w-full bg-[#f4f5f7] border border-transparent hover:border-zinc-300 rounded-sm px-3.5 sm:px-4 py-3 sm:py-3.5 text-[13px] sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium"
                      placeholder="03XX-XXXXXXX"
                    />
                  </div>

                  {orderType === "Delivery" && (
                    <>
                      <div className="space-y-1 sm:space-y-1.5">
                        <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                         Complete Delivery Address
                        </label>
                        <textarea
                          required
                          rows="3"
                          name="address"
                          value={customerInfo.address}
                          onChange={handleChange}
                          className="w-full bg-[#f4f5f7] border border-transparent hover:border-zinc-300 rounded-sm px-3.5 sm:px-4 py-3 sm:py-3.5 text-[13px] sm:text-sm text-black focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium resize-none leading-relaxed"
                          placeholder="House, Street, Area details..."
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-3 sm:gap-4">
                        <div className="space-y-1 sm:space-y-1.5">
                          <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                            City
                          </label>
                          <input
                            readOnly
                            value={deliveryCity || "Karachi"}
                            className="w-full bg-zinc-100 border border-transparent rounded-sm px-3.5 sm:px-4 py-3 sm:py-3.5 text-[13px] sm:text-sm text-zinc-500 focus:outline-none cursor-not-allowed font-medium"
                          />
                        </div>
                        <div className="space-y-1 sm:space-y-1.5">
                          <label className="block text-[10px] sm:text-xs font-semibold uppercase tracking-widest text-zinc-500 ml-1">
                            Area
                          </label>
                          <input
                            readOnly
                            value={deliveryArea || ""}
                            className="w-full bg-zinc-100 border border-transparent rounded-sm px-3.5 sm:px-4 py-3 sm:py-3.5 text-[13px] sm:text-sm text-zinc-500 focus:outline-none cursor-not-allowed font-medium"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <button
                  type="button"
                  onClick={handleNextStep}
                  className="w-full bg-black text-white font-semibold uppercase tracking-widest py-3.5 sm:py-4 rounded-xl sm:rounded-2xl active:scale-[0.98] transition-all hover:bg-zinc-800 text-[13px] sm:text-sm mt-6 sm:mt-8 shadow-xl shadow-black/10 flex items-center justify-center gap-2 group"
                >
                  Continue to Review
                  <PiArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>

              {/* Step 2 Form view (Review) */}
              <div
                className={`${checkoutStep === 1 ? "hidden" : "block"} space-y-3 sm:space-y-5 animate-in fade-in slide-in-from-bottom-4 duration-500`}
              >
                <div className="group relative bg-[#f4f5f7] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-transparent hover:border-zinc-300 transition-colors">
                  <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                    <h3 className="font-semibold text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest">
                      Contact Info
                    </h3>
                    <button
                      type="button"
                      onClick={() => setCheckoutStep(1)}
                      className="text-[10px] sm:text-[11px] font-semibold text-black uppercase tracking-widest hover:underline shrink-0 pl-4"
                    >
                      Edit
                    </button>
                  </div>
                  <p className="text-[13px] sm:text-base text-black font-medium mb-0.5 sm:mb-1">
                    {customerInfo.name || "—"}
                  </p>
                  <p className="text-[13px] sm:text-sm text-zinc-600 font-medium">
                    {customerInfo.phone || "—"}
                  </p>
                </div>

                {orderType === "Delivery" && (
                  <div className="group relative bg-[#f4f5f7] rounded-xl sm:rounded-2xl p-4 sm:p-5 border border-transparent hover:border-zinc-300 transition-colors">
                    <div className="flex items-center justify-between mb-1.5 sm:mb-3">
                      <h3 className="font-semibold text-[10px] sm:text-xs text-zinc-500 uppercase tracking-widest">
                        Delivery Address
                      </h3>
                      <button
                        type="button"
                        onClick={() => setCheckoutStep(1)}
                        className="text-[10px] sm:text-[11px] font-semibold text-black uppercase tracking-widest hover:underline shrink-0 pl-4"
                      >
                        Edit
                      </button>
                    </div>
                    <p className="text-[13px] sm:text-sm text-black font-medium leading-relaxed mb-0.5 sm:mb-1">
                      {customerInfo.address || "—"}
                    </p>
                    <p className="text-[13px] sm:text-sm text-zinc-600 font-medium">
                      {deliveryCity}, {deliveryArea}
                    </p>
                  </div>
                )}

                <div className="bg-[#f0f9ff] border border-[#bae6fd] p-3.5 sm:p-5 rounded-xl sm:rounded-2xl flex items-center gap-3 sm:gap-4 mt-2">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm text-[#0ea5e9]">
                    <PiTruck className="w-5 h-5 sm:w-6 sm:h-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-[13px] sm:text-sm text-[#0369a1] uppercase tracking-wider mb-0.5">
                      Cash on Delivery
                    </p>
                    <p className="text-[#0ea5e9] text-[10px] sm:text-xs font-medium leading-tight">
                      Pay via cash when you receive your order.
                    </p>
                  </div>
                </div>
              </div>
            </form>
          </div>

          {/* Right: Order Summary (5 columns) */}
          <div
            className={`order-1 lg:order-2 lg:col-span-5 h-fit lg:sticky lg:top-28 ${checkoutStep === 1 ? "hidden lg:block" : ""}`}
          >
            <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-zinc-200/60 shadow-xl shadow-zinc-200/20">
              <h2 className="text-lg sm:text-xl font-bold uppercase tracking-tighter mb-4 sm:mb-6 text-black flex items-center gap-2">
                <PiShoppingCart className="w-5 h-5 sm:w-6 sm:h-6" /> Order Summary
              </h2>
              
              <div className="space-y-4 mb-5 sm:mb-6 max-h-[35vh] sm:max-h-[45vh] overflow-y-auto pr-1.5 sm:pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div
                    key={item.cartItemId || item.id}
                    className="flex gap-3 sm:gap-4 items-start group"
                  >
                    <div className="relative w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl overflow-hidden bg-[#f8f9fa] shrink-0 border border-zinc-100 group-hover:border-zinc-300 transition-colors">
                      <Image
                        src={item.image_url || "https://via.placeholder.com/100"}
                        alt={item.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-0 right-0 bg-black text-white w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center rounded-bl-lg font-semibold text-[9px] sm:text-[10px]">
                        {item.quantity}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 pt-0.5 sm:pt-1">
                      <h3 className="text-[13px] sm:text-sm font-semibold text-black line-clamp-2 leading-snug">
                        {item.name}
                      </h3>
                      {item.specialInstructions && (
                        <p className="text-[9px] sm:text-[10px] font-medium text-zinc-500 mt-1 line-clamp-1 bg-zinc-100 inline-block px-1.5 sm:px-2 py-0.5 rounded-full">
                          Note: {item.specialInstructions}
                        </p>
                      )}
                      
                      <div className="mt-1 sm:mt-2 flex items-center justify-between">
                        {item.discount_price && item.discount_price < item.price ? (
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-[13px] sm:text-sm text-[#e63946]">
                              Rs. {item.discount_price * item.quantity}
                            </p>
                            <p className="text-[10px] sm:text-[11px] lg:text-xs text-zinc-400 line-through font-medium">
                              Rs. {item.price * item.quantity}
                            </p>
                          </div>
                        ) : (
                          <p className="font-semibold text-[13px] sm:text-sm text-black">
                            Rs. {item.price * item.quantity}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Coupon Area */}
              <div className="mb-4 sm:mb-6 pt-4 sm:pt-6 border-t border-zinc-100">
                <h3 className="text-[10px] sm:text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-2 sm:mb-3">
                  Promo Code
                </h3>
                {appliedCoupon ? (
                  <div className="flex justify-between items-center bg-[#fcf8f2] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[#f0e6d6]">
                    <div className="flex items-center gap-2 sm:gap-3">
                      <div className="text-[#d4b383] bg-white shadow-sm p-1.5 sm:p-2 rounded-lg sm:rounded-xl border border-[#f0e6d6] shrink-0">
                        <PiTag className="w-4 h-4 sm:w-5 sm:h-5" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-[13px] sm:text-sm font-semibold text-black truncate">
                          {appliedCoupon.discount_type === "free_delivery"
                            ? "Free Delivery Applied!"
                            : `Rs. ${discountAmount.toLocaleString()} Saved!`}
                        </p>
                        <p className="text-[9px] sm:text-[10px] lg:text-xs text-zinc-500 font-medium mt-0.5 truncate">
                          Code: <span className="uppercase text-black font-semibold">{appliedCoupon.code}</span>
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleRemoveCoupon}
                      className="text-zinc-400 hover:text-red-500 transition-colors p-1.5 sm:p-2 bg-white rounded-full shadow-sm shrink-0 ml-2"
                      title="Remove Coupon"
                    >
                      <PiXCircle className="w-4 h-4 sm:w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Have a promo code?"
                      value={couponCode}
                      onChange={(e) =>
                        setCouponCode(e.target.value.toUpperCase())
                      }
                      className="flex-1 min-w-[100px] bg-[#f4f5f7] border border-transparent rounded-xl sm:rounded-2xl p-2.5 sm:p-3.5 text-[12px] sm:text-[13px] lg:text-sm uppercase focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all font-medium placeholder:normal-case"
                    />
                    <button
                      onClick={handleApplyCoupon}
                      disabled={couponLoading || !couponCode}
                      className="bg-black text-white px-4 sm:px-6 py-2.5 sm:py-3.5 rounded-xl sm:rounded-2xl text-[12px] sm:text-[13px] lg:text-sm font-semibold uppercase tracking-widest hover:bg-zinc-800 disabled:opacity-50 transition-colors flex items-center justify-center min-w-[70px] sm:min-w-[100px] shadow-lg shadow-black/10 shrink-0"
                    >
                      {couponLoading ? (
                        <PiCircleNotch className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </div>
                )}
              </div>

              {/* Totals */}
              <div className="space-y-2 sm:space-y-3 pt-4 sm:pt-6 border-t border-zinc-100">
                <div className="flex justify-between text-[12px] sm:text-[13px] lg:text-sm text-zinc-600 font-medium">
                  <span>Subtotal</span>
                  <span className="text-black font-medium">Rs. {subtotal}</span>
                </div>
                <div className="flex justify-between text-[12px] sm:text-[13px] lg:text-sm text-zinc-600 font-medium items-center">
                  <span>Delivery Fee</span>
                  {appliedCoupon &&
                  appliedCoupon.discount_type === "free_delivery" ? (
                    <span className="flex items-center gap-1.5 sm:gap-2">
                      <span className="line-through text-zinc-400 text-[10px] sm:text-[11px] lg:text-xs">Rs. 150</span>
                      <span className="text-green-600 font-semibold uppercase text-[8px] sm:text-[9px] lg:text-[10px] bg-green-100 px-1.5 sm:px-2 lg:px-2.5 py-0.5 sm:py-1 rounded-full">
                        Free
                      </span>
                    </span>
                  ) : (
                    <span className="text-black font-medium">Rs. {deliveryCharges}</span>
                  )}
                </div>
                {discountAmount > 0 && (
                  <div className="flex justify-between text-[12px] sm:text-[13px] lg:text-sm text-[#9ab50e] font-semibold">
                    <span>Discount</span>
                    <span>- Rs. {discountAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-base sm:text-lg lg:text-xl xl:text-2xl font-bold text-black pt-3 sm:pt-4 mt-1.5 sm:mt-2 border-t border-zinc-200">
                  <span className="uppercase tracking-tight">Total</span>
                  <span>Rs. {total}</span>
                </div>

                {/* Desktop Place Order Button */}
                {checkoutStep === 2 && (
                  <div className="hidden lg:block pt-4 sm:pt-6">
                    <button
                      type="submit"
                      form="checkout-form"
                      disabled={loading}
                      className="w-full bg-[#C0E212] text-black font-bold uppercase tracking-widest py-3.5 sm:py-4 rounded-xl sm:rounded-2xl active:scale-[0.98] transition-all hover:bg-[#a6c40e] disabled:opacity-50 flex justify-center items-center text-[13px] sm:text-sm shadow-xl shadow-[#C0E212]/20 hover:shadow-2xl hover:shadow-[#C0E212]/30 gap-2 border border-[#9ab50e]/30 group"
                    >
                      {loading ? (
                        <PiCircleNotch className="w-5 h-5 animate-spin" />
                      ) : (
                        <>
                          Confirm Order <PiLockKey className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
                        </>
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Action Bar */}
        <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-zinc-200 p-3 sm:p-4 pb-5 sm:pb-6 shadow-[0_-20px_40px_rgba(0,0,0,0.08)] z-50 lg:hidden flex flex-col gap-2.5 sm:gap-3 rounded-t-3xl sm:rounded-t-[2rem]">
          <div className="flex justify-between items-center px-1 sm:px-2">
            <span className="font-semibold text-zinc-500 uppercase tracking-widest text-[10px] sm:text-xs">
              Total to pay
            </span>
            <span className="font-bold text-lg sm:text-xl text-black">
              Rs. {total.toLocaleString()}
            </span>
          </div>
          {checkoutStep === 1 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="w-full bg-black text-white font-semibold uppercase tracking-widest py-3 sm:py-4 rounded-xl sm:rounded-2xl active:scale-[0.98] transition-all text-[12px] sm:text-[13px] lg:text-sm shadow-xl flex items-center justify-center gap-1.5 sm:gap-2 group shrink-0"
            >
              Continue to Review
              <PiArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 rotate-180 group-hover:translate-x-1 transition-transform" />
            </button>
          ) : (
            <button
              type="submit"
              form="checkout-form"
              disabled={loading}
              className="w-full bg-[#C0E212] text-black font-bold uppercase tracking-widest py-3 sm:py-4 rounded-xl sm:rounded-2xl active:scale-[0.98] transition-all disabled:opacity-50 flex justify-center items-center text-[12px] sm:text-[13px] lg:text-sm shadow-xl shadow-[#C0E212]/20 gap-1.5 sm:gap-2 border border-[#9ab50e]/30 shrink-0"
            >
              {loading ? (
                <PiCircleNotch className="w-4 h-4 sm:w-5 sm:h-5 animate-spin" />
              ) : (
                <>
                  <PiLockKey className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Confirm Order
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
