"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { PiCircleNotch, PiPackage, PiArrowLeft, PiShieldCheck, PiCaretDown } from "react-icons/pi";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";

const STATUS_CONFIG = {
  pending:    { label: "Pending",    bg: "bg-amber-500" },
  processing: { label: "Processing", bg: "bg-blue-500" },
  delivered:  { label: "Delivered",  bg: "bg-green-500" },
  failed:     { label: "Failed",     bg: "bg-red-500" },
  cancelled:  { label: "Cancelled",  bg: "bg-zinc-400" },
};

const StatusBadge = ({ status }) => {
  const s      = status?.toLowerCase() || "pending";
  const config = STATUS_CONFIG[s] || STATUS_CONFIG["pending"];
  return (
    <span
      className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border border-zinc-200 text-zinc-700 bg-white shadow-sm"
    >
      <span className={`w-2 h-2 rounded-full ${config.bg}`} />
      {config.label}
    </span>
  );
};

export default function GuestOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  useEffect(() => {
    const fetchGuestOrders = async () => {
      const savedOrderIds = JSON.parse(
        localStorage.getItem("guestOrders") || "[]"
      );

      if (savedOrderIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        const orderPromises = savedOrderIds.map((id) =>
          fetch(`/api/orders/${id}`).then((res) => res.json())
        );

        const results = await Promise.all(orderPromises);

        const validOrders = results
          .filter((res) => res.success && res.data)
          .map((res) => res.data);

        setOrders(validOrders);
      } catch (error) {
        console.error("Error fetching your orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchGuestOrders();
  }, []);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 border-t border-zinc-200">
          <PiCircleNotch className="w-10 h-10 animate-spin text-[#C0E212]" />
        </div>
      </>
    );
  }

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return (
      d.toLocaleDateString("en-US", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      }) +
      " at " +
      d.toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
      })
    );
  };

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 text-black border-t border-zinc-200 p-6 md:p-12">
        <div className="max-w-420 mx-auto">
          <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <Link
                href="/"
                className="text-zinc-500 hover:text-black transition-colors flex items-center gap-2 mb-4 text-xs font-bold uppercase tracking-widest"
              >
                <PiArrowLeft className="w-4 h-4" /> Back to Store
              </Link>
              <h1 className="text-3xl font-bold uppercase tracking-tighter">Your Orders</h1>
              <p className="text-zinc-500 text-sm mt-1">Track and manage your recent orders.</p>
            </div>
            {orders.length > 0 && (
              <span className="inline-flex bg-white border border-zinc-200 text-zinc-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-sm w-fit">
                {orders.length} order{orders.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
            {orders.length === 0 ? (
              <div className="p-16 text-center">
                <PiPackage className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                <h2 className="text-xl font-bold mb-2">No active orders found</h2>
                <p className="text-zinc-500 text-sm font-medium mb-6">
                  It looks like you haven't placed any orders on this device recently.
                </p>
                <Link
                  href="/"
                  className="inline-block bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Start Shopping
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-zinc-100">
                {orders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const metaItem = order.items?.find(item => item.isMetadata);
                  const realItems = order.items?.filter(item => !item.isMetadata) || [];

                  return (
                    <div key={order.id} className="hover:bg-zinc-50/50 transition-colors group">
                      <div
                        className="p-6 cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2 flex-wrap">
                            <span className="font-bold text-sm uppercase text-black">
                              Order #{order.id.slice(0, 8)}
                            </span>
                            <StatusBadge status={order.status} />
                          </div>
                          <p className="text-xs text-zinc-500 font-medium flex items-center gap-2">
                            <PiShieldCheck className="w-3.5 h-3.5" />
                            {formatDate(order.created_at)}
                          </p>
                        </div>
                        <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto">
                          <div className="text-left sm:text-right">
                            <p className="text-[10px] text-zinc-400 uppercase font-bold tracking-widest mb-0.5">Order Total</p>
                            <p className="font-bold text-lg text-black">Rs. {order.total_amount.toLocaleString()}</p>
                          </div>
                          <div className="w-8 h-8 flex items-center justify-center bg-white border border-zinc-200 rounded-full group-hover:bg-zinc-100 transition-colors shrink-0 text-zinc-500 shadow-sm">
                            <PiCaretDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                          </div>
                        </div>
                      </div>

                      {/* Smooth Dropdown for Expanded Details */}
                      <div 
                        className={`grid transition-all duration-300 ease-in-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                      >
                        <div className="overflow-hidden">
                          <div className="px-6 pb-6">
                            <div className="bg-zinc-50 border border-zinc-100 rounded-2xl p-5 mb-5 mt-2">
                              
                              {/* ROW 1: Customer Info & Payment Method */}
                              <div className="flex flex-col sm:flex-row gap-6 mb-6">
                                <div className="flex-1">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Shipping Information</h4>
                                  <p className="text-sm font-bold text-black mb-1">{order.customer_name}</p>
                                  <p className="text-sm text-zinc-600 font-medium">{order.customer_address || "No address provided"}</p>
                                  <p className="text-sm text-zinc-600 font-medium">
                                    {order.delivery_area ? `${order.delivery_area}, ` : ""}{order.delivery_city || "Karachi"}, PK
                                  </p>
                                  <p className="text-sm text-zinc-600 font-medium mt-1">{order.customer_phone}</p>
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Payment Method</h4>
                                  <span className="text-xs font-bold uppercase tracking-widest bg-zinc-200/50 text-black px-3 py-1.5 rounded-md inline-block">
                                    {order.payment_method || "CASH ON DELIVERY"}
                                  </span>
                                </div>
                              </div>

                              <hr className="border-zinc-200 mb-6" />

                              {/* ROW 2: Purchased Items */}
                              <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                                Purchased Items
                              </h4>
                              <div className="flex flex-col gap-3 mb-6">
                                {realItems.map((item, idx) => (
                                  <div key={idx} className="flex items-center justify-between bg-white border border-zinc-200 p-3 sm:p-4 rounded-2xl shadow-sm w-full">
                                    <div className="flex items-center gap-4 flex-1 min-w-0">
                                      <div className="relative w-16 h-16 bg-zinc-50 rounded-xl overflow-hidden shrink-0 border border-zinc-100">
                                        <Image
                                          src={item.image_url || "https://via.placeholder.com/100"}
                                          alt={item.name || "Product image"}
                                          fill
                                          sizes="64px"
                                          quality={90}
                                          className="object-cover"
                                        />
                                      </div>
                                      <div className="flex flex-col justify-center min-w-0 pr-4">
                                        <Link
                                          href={`/product/${item.slug}`}
                                          className="text-sm font-bold text-black hover:underline truncate"
                                        >
                                          {item.name}
                                        </Link>
                                        {item.specialInstructions && (
                                          <p className="text-[10px] text-[#e63946] font-bold uppercase tracking-widest mt-0.5 truncate">
                                            Note: {item.specialInstructions}
                                          </p>
                                        )}
                                      </div>
                                    </div>
                                    
                                    <div className="text-center px-2 sm:px-6 w-20 sm:w-24 shrink-0">
                                      <p className="text-xs font-medium text-zinc-500">
                                        Qty: <span className="font-bold text-black">{item.quantity}</span>
                                      </p>
                                    </div>
                                    
                                    <div className="text-right w-24 sm:w-32 shrink-0">
                                      <span className="font-bold text-black text-sm">Rs. {(item.discount_price || item.price) * item.quantity}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>

                              <hr className="border-zinc-200 mb-6" />

                              {/* ROW 3: Order Summary */}
                              <div className="flex justify-end">
                                <div className="w-full max-w-[280px]">
                                  <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-4 text-right">Order Summary</h4>
                                  <div className="space-y-2.5 text-sm">
                                    <div className="flex justify-between text-zinc-600">
                                      <span>Subtotal</span>
                                      <span className="font-medium text-black">Rs. {order.total_amount - (order.order_type === 'Delivery' ? 150 : 0)}</span>
                                    </div>
                                    <div className="flex justify-between text-zinc-600">
                                      <span>Delivery Fee</span>
                                      <span className="font-medium text-black">Rs. {order.order_type === 'Delivery' ? 150 : 0}</span>
                                    </div>
                                    <div className="flex justify-between font-bold text-black border-t border-zinc-200 pt-3 mt-3 text-base">
                                      <span>Total Amount</span>
                                      <span className="text-[#e63946]">Rs. {order.total_amount}</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
