"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import { FaWhatsapp } from "react-icons/fa";
import {
  PiCircleNotch, PiCaretDown, PiCaretUp, PiMapPin, PiCalendar, PiCaretLeft, PiCaretRight, PiArrowsClockwise, PiPhone,
  PiCheckCircle, PiClock, PiTruck, PiPackage, PiXCircle, PiMagnifyingGlass, PiEye, PiFunnel
} from "react-icons/pi";
import toast from "react-hot-toast";
import { gsap } from "gsap";
import fetcher from "@/app/lib/fetcher";

const AdminCountdownTimer = ({ createdAt, status, estimatedTime }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (status !== "pending" && status !== "processing") return;

    const calculateTimeLeft = () => {
      const match = String(estimatedTime || "45").match(/\d+/);
      const minutesToAdd = match ? parseInt(match[0]) : 45;

      const orderTime = new Date(createdAt).getTime();
      const targetTime = orderTime + minutesToAdd * 60 * 1000;
      const now = new Date().getTime();
      const diff = targetTime - now;

      if (diff <= 0) return { minutes: 0, seconds: 0 };

      return {
        minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((diff % (1000 * 60)) / 1000),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const timerId = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timerId);
  }, [createdAt, status, estimatedTime]);

  if (status !== "pending" && status !== "processing") return null;
  if (!timeLeft) return null;

  return (
    <div className="mt-4 bg-[#1e1e24] text-white rounded-lg p-3 flex flex-col items-center justify-center w-full shadow-inner border border-zinc-800">
      <p className="text-zinc-400 text-[9px] font-semibold uppercase tracking-widest mb-1.5 text-center">
        Customer sees this countdown
      </p>
      <div className="flex items-center justify-center gap-4">
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black tabular-nums tracking-tight">
            {timeLeft.minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-zinc-500 text-[8px] uppercase font-bold tracking-widest mt-0.5">
            Mins
          </span>
        </div>
        <div className="w-px h-6 bg-zinc-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-2xl font-black tabular-nums tracking-tight">
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-zinc-500 text-[8px] uppercase font-bold tracking-widest mt-0.5">
            Secs
          </span>
        </div>
      </div>
    </div>
  );
};

const NewOrderBadge = ({ createdAt }) => {
  const [isNew, setIsNew] = useState(false);

  useEffect(() => {
    const checkNew = () => {
      setIsNew(Date.now() - new Date(createdAt).getTime() < 5 * 60 * 1000);
    };
    checkNew();
    const interval = setInterval(checkNew, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [createdAt]);

  if (!isNew) return null;

  return (
    <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-[10px] font-bold border border-green-200 shadow-sm">
      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
      New Order
    </span>
  );
};

const ExpandedRow = ({ order, onStatusChange }) => {
  const contentRef = React.useRef(null);

  const [time, setTime] = useState(order.estimated_time || "");
  const [savingTime, setSavingTime] = useState(false);

  React.useEffect(() => {
    gsap.fromTo(
      contentRef.current,
      { height: 0, opacity: 0 },
      { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out" }
    );
  }, []);

  const saveEstimatedTime = async () => {
    setSavingTime(true);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estimated_time: time }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Estimated time updated!");
        order.estimated_time = time; // locally update for instant feedback
      } else {
        toast.error(data.message || "Failed to update time");
      }
    } catch (e) {
      toast.error("Error saving time");
    } finally {
      setSavingTime(false);
    }
  };

  const isDelivery = order.order_type === 'Delivery';
  const realItems = order.items?.filter(item => !item.isMetadata) || [];
  const discountItem = order.items?.find(item => item.isMetadata && item.type === "discount");
  const discountAmount = discountItem ? discountItem.discount_amount : 0;
  const subtotal = order.total_amount - (isDelivery ? 150 : 0) + discountAmount;

  const addressStr = order.customer_address || "";
  const landmarkMatch = addressStr.match(/\(Landmark: (.*?)\)/);
  const riderNoteMatch = addressStr.match(/\| Note for Rider: (.*?)$/);
  
  const rawAddress = addressStr
    .replace(/\(Landmark: .*?\)/, "")
    .replace(/\| Note for Rider: .*$/, "")
    .trim();
  
  const landmark = landmarkMatch ? landmarkMatch[1] : null;
  const riderNote = riderNoteMatch ? riderNoteMatch[1] : null;

  return (
    <tr className="bg-zinc-50/50 border-t-0">
      <td colSpan="7" className="p-0 border-b-2 border-zinc-200 shadow-inner">
        <div ref={contentRef} className="overflow-hidden">
          <div className="p-4 sm:p-6 bg-zinc-50 border-t border-zinc-200/50">
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr_1fr] gap-5 items-start">
              
              {/* COLUMN 1: Fulfillment Details */}
              <div className="space-y-4">
                <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-1.5">
                    <PiMapPin className="w-4 h-4" /> Fulfillment Details
                  </h4>
                  
                  <div className="bg-green-50 text-green-700 border border-green-200 font-bold text-center py-2 rounded-lg text-xs tracking-wide uppercase mb-4">
                    Cash on Delivery
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Customer</p>
                      <p className="text-[15px] font-bold text-black">{order.customer_name}</p>
                      <p className="text-sm font-medium text-zinc-600 flex items-center gap-1.5 mt-1">
                        <PiPhone className="w-4 h-4 text-zinc-400" /> {order.customer_phone}
                      </p>
                    </div>
                    
                    <div className="pt-3 border-t border-zinc-100">
                      <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-1">Delivery Address</p>
                      <p className="text-sm font-semibold text-zinc-800 leading-snug">
                        {rawAddress}, {order.delivery_area || order.delivery_city}
                      </p>
                      
                      {landmark && (
                        <div className="mt-2.5">
                          <p className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold mb-0.5">Near Landmark</p>
                          <p className="text-[13px] font-medium text-zinc-600">{landmark}</p>
                        </div>
                      )}
                      
                      {riderNote && (
                        <div className="mt-3 bg-amber-50/80 p-3 rounded-lg border border-amber-200/60">
                          <p className="text-[10px] text-amber-600 uppercase tracking-widest font-bold mb-1.5 flex items-center gap-1.5">
                            <PiClock className="w-3.5 h-3.5" /> Note for Rider
                          </p>
                          <p className="text-sm text-amber-900 font-semibold leading-snug">{riderNote}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                    <PiClock className="w-4 h-4" /> Estimated Time
                  </h4>
                  <div className="flex items-center gap-2 mb-3">
                    <input 
                      type="text" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="e.g. 45 mins" 
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-2 text-sm text-black font-semibold focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                    <button 
                      onClick={saveEstimatedTime}
                      disabled={savingTime}
                      className="bg-zinc-100 border border-zinc-200 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                    >
                      {savingTime ? <PiCircleNotch className="w-4 h-4 animate-spin mx-auto" /> : "Save"}
                    </button>
                  </div>
                  <AdminCountdownTimer 
                    createdAt={order.created_at} 
                    status={order.status} 
                    estimatedTime={order.estimated_time} 
                  />
                </div>
              </div>
              
              {/* COLUMN 2: Purchased Items */}
              <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-sm">
                <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-1.5">
                  <PiPackage className="w-4 h-4" /> Purchased Items
                </h4>
                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                  {realItems.length > 0 ? (
                    realItems.map((item, i) => {
                      const activePrice = item.discount_price || item.price;
                      return (
                        <div key={i} className="flex gap-3 border-b border-zinc-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                          {item.image_url && (
                            <div className="w-14 h-14 rounded-lg bg-zinc-50 border border-zinc-200 shrink-0 overflow-hidden">
                              <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                            </div>
                          )}
                          <div className="flex-1 flex flex-col justify-center">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-bold text-black leading-tight">{item.name}</p>
                                <p className="text-[12px] font-medium text-zinc-500 mt-1">
                                  {item.category && <span className="uppercase text-[9px] font-bold bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded-sm mr-1.5">{item.category}</span>}
                                  {item.quantity} x Rs. {activePrice}
                                </p>
                              </div>
                              <p className="text-[15px] font-black text-black">
                                Rs. {activePrice * item.quantity}
                              </p>
                            </div>
                            {item.specialInstructions && (
                              <div className="mt-2 bg-amber-50 text-amber-700 text-xs p-2 rounded border border-amber-100/50 font-medium">
                                Note: {item.specialInstructions}
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })
                  ) : (
                    <p className="text-sm text-zinc-500 font-medium">No items recorded.</p>
                  )}
                </div>
              </div>

              {/* COLUMN 3: Order Summary & Actions */}
              <div className="space-y-4">
                <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-sm">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-4 flex items-center gap-1.5">
                    Order Summary
                  </h4>
                  <div className="space-y-2.5 text-[13px] font-medium">
                    <div className="flex justify-between items-center text-zinc-600">
                      <span>Subtotal</span>
                      <span className="text-zinc-900 font-bold">Rs. {subtotal}</span>
                    </div>
                    {discountItem && (
                      <div className="flex justify-between items-center text-[#ff1900] font-bold bg-red-50 px-2 py-1 -mx-2 rounded">
                        <span>Discount ({discountItem.code})</span>
                        <span>- Rs. {discountAmount}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-zinc-600">
                      <span>Delivery Fee</span>
                      <span className="text-zinc-900 font-bold">Rs. {isDelivery ? 150 : 0}</span>
                    </div>
                    <div className="pt-3 mt-3 border-t border-zinc-100 flex justify-between items-center">
                      <span className="text-sm font-black text-black uppercase tracking-wide">Total Amount</span>
                      <span className="text-lg font-black text-[#ff1900]">Rs. {order.total_amount}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl p-4 sm:p-5 shadow-sm flex flex-col gap-3">
                   <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-1 flex items-center gap-1.5">
                    Actions
                   </h4>
                   {order.status !== 'cancelled' && (
                     <div className="flex gap-2">
                       <button 
                         onClick={() => onStatusChange(order.id, 'processing')}
                         className="flex-1 bg-black text-white py-3 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-md active:scale-95"
                       >
                         <PiCheckCircle className="w-5 h-5" /> Accept Order
                       </button>
                     </div>
                   )}
                   {order.status !== 'cancelled' ? (
                     <div className="flex flex-col gap-2 p-3.5 bg-red-50 rounded-lg border border-red-100 mt-2">
                       <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest">Decline Order</p>
                       <div className="flex flex-col gap-2">
                         <select 
                           id={`cancel-reason-${order.id}`}
                           className="w-full bg-white border border-red-200 text-sm font-medium text-red-900 rounded-md px-3 py-2 outline-none focus:ring-1 focus:ring-red-400"
                           defaultValue=""
                         >
                           <option value="" disabled>Select Reason...</option>
                           <option value="Out of delivery area">Out of delivery area</option>
                           <option value="Items out of stock">Items out of stock</option>
                           <option value="Store is closed">Store is closed</option>
                           <option value="Fake / Invalid order">Fake / Invalid order</option>
                           <option value="Customer requested cancellation">Customer requested cancellation</option>
                         </select>
                         <button 
                           onClick={() => {
                             const reason = document.getElementById(`cancel-reason-${order.id}`).value;
                             if (!reason) {
                               toast.error("Please select a cancellation reason");
                               return;
                             }
                             onStatusChange(order.id, 'cancelled', reason);
                           }}
                           className="bg-red-600 text-white w-full py-2 rounded-md font-bold hover:bg-red-700 transition-colors shadow-sm active:scale-95"
                         >
                           Confirm Decline
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="p-4 bg-zinc-50 rounded-lg border border-zinc-200 text-center">
                       <p className="text-sm font-black text-zinc-600">Order Cancelled</p>
                       {order.cancel_reason && (
                         <p className="text-xs font-semibold text-zinc-500 mt-1">{order.cancel_reason}</p>
                       )}
                     </div>
                   )}
                </div>

                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = `*New Order - Pioneer Broast*\nOrder ID: ${order.id}\nCustomer: ${order.customer_name}\nPhone: ${order.customer_phone}\nAddress: ${rawAddress}, ${order.delivery_area || order.delivery_city || "Karachi"}${landmark ? `\nLandmark: ${landmark}` : ""}${riderNote ? `\nNote for Rider: ${riderNote}` : ""}\n\n*Items:*\n${realItems.map(item => `- ${item.quantity}x ${item.name} (Rs. ${(item.discount_price || item.price) * item.quantity})`).join('\n')}${discountItem ? `\n- Discount (${discountItem.code}): -Rs. ${discountAmount}` : ""}\n\n*Total Amount:* Rs. ${order.total_amount}`;
                      navigator.clipboard.writeText(text).then(() => toast.success("Copied!")).catch(() => toast.error("Failed"));
                    }}
                    className="flex-1 bg-white border border-zinc-200 text-zinc-700 font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-zinc-50 transition-all text-xs shadow-sm active:scale-95"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                    Copy Text
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      const text = `*New Order - Pioneer Broast*\nOrder ID: ${order.id}\nCustomer: ${order.customer_name}\nPhone: ${order.customer_phone}\nAddress: ${rawAddress}, ${order.delivery_area || order.delivery_city || "Karachi"}${landmark ? `\nLandmark: ${landmark}` : ""}${riderNote ? `\nNote for Rider: ${riderNote}` : ""}\n\n*Items:*\n${realItems.map(item => `- ${item.quantity}x ${item.name} (Rs. ${(item.discount_price || item.price) * item.quantity})`).join('\n')}${discountItem ? `\n- Discount (${discountItem.code}): -Rs. ${discountAmount}` : ""}\n\n*Total Amount:* Rs. ${order.total_amount}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex-1 bg-[#25D366] text-white font-bold py-2.5 rounded-lg flex items-center justify-center gap-1.5 hover:bg-[#128C7E] transition-all text-xs shadow-sm active:scale-95"
                  >
                    <FaWhatsapp className="w-4 h-4" />
                    WhatsApp
                  </button>
                </div>
              </div>

            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};


// ─── Constants ───────────────────────────────────────────────────────────────
const ORDER_STATUSES = ["pending", "processing", "delivered", "failed", "cancelled"];

const STATUS_STYLES = {
  pending:    "bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100",
  processing: "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100",
  delivered:  "bg-green-50 text-green-600 border-green-200 hover:bg-green-100",
  failed:     "bg-red-50 text-red-600 border-red-200 hover:bg-red-100",
  cancelled:  "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100",
};

const formatDateTime = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleString("en-US", {
    weekday: "short", year: "numeric", month: "short",
    day: "numeric", hour: "2-digit", minute: "2-digit", hour12: true,
  });
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function OrdersList() {
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [updatingId, setUpdatingId]           = useState(null);
  const [searchQuery, setSearchQuery]         = useState("");
  const [adminStatusFilter, setAdminStatusFilter] = useState("All");
  const [dateFilter, setDateFilter]           = useState("Today");
  const [currentPage, setCurrentPage]         = useState(1);
  const itemsPerPage = 10;

  // ── SWR data fetching ────────────────────────────────────────────────────
  const { data: orders = [], error, isLoading, mutate } = useSWR(
    "/api/orders",
    fetcher,
    {
      fallbackData: [],        // render immediately with empty list, no spinner
      keepPreviousData: true,  // show cached orders while revalidating in background
    }
  );

  // Reset to page 1 on search or filter
  useEffect(() => { setCurrentPage(1); }, [searchQuery, adminStatusFilter, dateFilter]);

  // ── Status update with optimistic mutate ─────────────────────────────────
  const handleStatusChange = async (orderId, newStatus, cancelReason = null) => {
    setUpdatingId(orderId);

    // Optimistic update: immediately reflect the change in cache
    mutate(
      orders.map((o) => (o.id === orderId ? { ...o, status: newStatus, cancel_reason: cancelReason || o.cancel_reason } : o)),
      false // don't revalidate yet — we'll do it after the PATCH
    );

    try {
      const bodyPayload = { status: newStatus };
      if (cancelReason) {
        bodyPayload.cancel_reason = cancelReason;
      }
      
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });
      const data = await res.json();

      if (data.success) {
        toast.success(`Status updated to "${newStatus}"`, {
          style: { background: "#18181b", color: "#fff", border: "1px solid #27272a" },
          iconTheme: { primary: "#C0E212", secondary: "#18181b" },
        });
        mutate(); // revalidate from server to ensure consistency
      } else {
        toast.error(data.message || "Failed to update status");
        mutate(); // rollback: refetch real data from server
      }
    } catch {
      toast.error("Network error. Please try again.");
      mutate(); // rollback
    } finally {
      setUpdatingId(null);
    }
  };

  // ── Filter & Paginate ────────────────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    if (adminStatusFilter !== "All" && o.status?.toLowerCase() !== adminStatusFilter.toLowerCase()) return false;
    
    if (dateFilter !== "All Time" && o.created_at) {
      const orderDateStr = new Date(o.created_at).toDateString();
      const todayStr = new Date().toDateString();
      const yesterdayStr = new Date(Date.now() - 86400000).toDateString();
      
      if (dateFilter === "Today" && orderDateStr !== todayStr) return false;
      if (dateFilter === "Yesterday" && orderDateStr !== yesterdayStr) return false;
    }

    const q = searchQuery.toLowerCase();
    return (
      (o.id && o.id.toLowerCase().includes(q)) ||
      (o.customer_name && o.customer_name.toLowerCase().includes(q)) ||
      (o.customer_phone && o.customer_phone.includes(q)) ||
      (o.delivery_city && o.delivery_city.toLowerCase().includes(q)) ||
      (o.delivery_area && o.delivery_area.toLowerCase().includes(q))
    );
  });

  const totalPages     = Math.max(1, Math.ceil(filteredOrders.length / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ── Loading state ────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="flex justify-center p-12">
        <PiCircleNotch className="w-8 h-8 animate-spin text-zinc-500" />
      </div>
    );
  }

  // ── Error state ───────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 p-12 text-center">
        <p className="text-red-500 font-semibold">Failed to load orders.</p>
        <p className="text-zinc-500 text-sm">{error.message}</p>
        <button
          onClick={() => mutate()}
          className="flex items-center gap-2 text-sm text-zinc-600 hover:text-black underline transition-colors active:scale-95"
        >
          <PiArrowsClockwise className="w-4 h-4" /> Try again
        </button>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h2 className="text-2xl font-bold text-black">Recent Orders</h2>

        {/* Status Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full lg:w-auto no-scrollbar">
          <div className="flex items-center gap-2 pr-2 sm:border-r border-zinc-200">
            {["Today", "Yesterday", "All Time"].map((range) => (
              <button
                key={range}
                onClick={() => setDateFilter(range)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-colors ${
                  dateFilter === range 
                    ? "bg-[#C0E212] text-black shadow-sm" 
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {range}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {["All", "Pending", "Processing", "Delivered", "Failed", "Cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setAdminStatusFilter(status)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                  adminStatusFilter === status 
                    ? "bg-black text-white" 
                    : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* Search Bar & Refresh */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <PiMagnifyingGlass className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search ID, name, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-white border border-zinc-200 rounded-lg text-sm text-black focus:outline-none focus:border-zinc-400 transition-colors"
            />
          </div>
          <button
            onClick={() => mutate()}
            className="flex items-center gap-1.5 text-sm text-zinc-500 hover:text-black transition-colors active:scale-95"
          >
            <PiArrowsClockwise className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[13px] text-zinc-500 uppercase tracking-wide">
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap text-left">Order ID</th>
                <th className="hidden md:table-cell p-3 sm:p-4 font-semibold whitespace-nowrap text-left">Date & Time</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap text-left">Customer</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap text-left">Total</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap text-left">Status</th>
                <th className="p-3 sm:p-4 font-semibold whitespace-nowrap w-16 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-zinc-500">
                    {searchQuery ? "No matching orders found." : "No orders found."}
                  </td>
                </tr>
              ) : (
                paginatedOrders.map((order) => (
                  <React.Fragment key={order.id}>
                    <tr
                      className={`transition-colors cursor-pointer ${
                        expandedOrderId === order.id ? "bg-zinc-50/50" : "hover:bg-zinc-50 bg-white"
                      }`}
                      onClick={() =>
                        setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                      }
                    >
                      <td className="p-3 sm:p-4 text-[13px] font-mono text-zinc-500 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-zinc-900 block">{order.id}</span>
                          <NewOrderBadge createdAt={order.created_at} />
                        </div>
                        <span className="md:hidden flex items-center gap-1 mt-1 text-[11px]">
                          <PiCalendar className="w-3 h-3" /> {formatDateTime(order.created_at).split(',')[0]}
                        </span>
                      </td>
                      <td className="hidden md:table-cell p-3 sm:p-4 text-[13px] text-zinc-600 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <PiCalendar className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
                          {formatDateTime(order.created_at)}
                        </div>
                      </td>
                      <td className="p-3 sm:p-4 whitespace-nowrap">
                        <p className="font-semibold text-[13px] text-black">{order.customer_name}</p>
                        <p className="text-xs text-zinc-500 mt-0.5">{order.delivery_city || order.delivery_area || order.city || "Karachi"}</p>
                      </td>
                      <td className="p-3 sm:p-4 text-sm text-black font-bold whitespace-nowrap">
                        Rs. {order.total_amount}
                      </td>

                      {/* ── Status Dropdown ── */}
                      <td className="p-3 sm:p-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                        <div className="relative">
                          <select
                            value={order.status || "pending"}
                            disabled={updatingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            className={`appearance-none w-full pl-3 pr-8 py-1.5 rounded-md text-[11px] font-bold uppercase tracking-wider cursor-pointer border transition-all focus:outline-none focus:ring-2 focus:ring-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed
                              ${STATUS_STYLES[order.status] || "bg-amber-50 text-amber-600 border-amber-200"}`}
                          >
                            {ORDER_STATUSES.map((s) => (
                              <option key={s} value={s} className="bg-white text-zinc-900 normal-case font-medium tracking-normal">
                                {s.charAt(0).toUpperCase() + s.slice(1)}
                              </option>
                            ))}
                          </select>
                          <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                            {updatingId === order.id ? (
                              <PiCircleNotch className="w-3 h-3 animate-spin text-current" />
                            ) : (
                              <PiCaretDown className="w-3 h-3 text-current opacity-70" />
                            )}
                          </div>
                        </div>
                      </td>

                      {/* ── Action column ── */}
                      <td className="p-4 text-center">
                        <div className="flex justify-center items-center gap-1">
                          <button 
                            onClick={(e) => { e.stopPropagation(); window.print(); }}
                            className="text-zinc-400 hover:text-black transition-colors p-1.5 rounded-md hover:bg-zinc-200 active:scale-95"
                            title="Print Order"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"></path></svg>
                          </button>
                          <button className="text-zinc-400 hover:text-black transition-colors p-1.5 rounded-md hover:bg-zinc-200 active:scale-95">
                            {expandedOrderId === order.id ? (
                              <PiCaretUp className="w-5 h-5" />
                            ) : (
                              <PiCaretDown className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </td>
                    </tr>

                    {expandedOrderId === order.id && <ExpandedRow order={order} onStatusChange={handleStatusChange} />}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-200 bg-zinc-50">
            <span className="text-sm text-zinc-500">
              Showing{" "}
              <span className="font-medium text-black">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-black">
                {Math.min(currentPage * itemsPerPage, filteredOrders.length)}
              </span>{" "}
              of <span className="font-medium text-black">{filteredOrders.length}</span> orders
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                disabled={currentPage === 1}
                className="p-1.5 rounded-md border border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50 disabled:opacity-50 transition-all active:scale-95"
              >
                <PiCaretLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-medium text-black px-2">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="p-1.5 rounded-md border border-zinc-200 text-zinc-600 bg-white hover:bg-zinc-50 disabled:opacity-50 transition-all active:scale-95"
              >
                <PiCaretRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
