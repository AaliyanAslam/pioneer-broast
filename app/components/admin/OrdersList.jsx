"use client";
import React, { useState, useEffect } from "react";
import useSWR from "swr";
import {
  PiCircleNotch, PiCaretDown, PiCaretUp, PiMapPin, PiCalendar, PiCaretLeft, PiCaretRight, PiArrowsClockwise, PiPhone,
  PiCheckCircle, PiClock, PiTruck, PiPackage, PiXCircle, PiMagnifyingGlass, PiEye, PiFunnel
} from "react-icons/pi";
import toast from "react-hot-toast";
import { gsap } from "gsap";
import fetcher from "@/app/lib/fetcher";

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
  const subtotal = order.total_amount - (isDelivery ? 150 : 0);
  const realItems = order.items?.filter(item => !item.isMetadata) || [];

  return (
    <tr className="bg-zinc-50 border-t-0">
      <td colSpan="7" className="p-0 border-b border-zinc-200">
        <div ref={contentRef} className="overflow-hidden">
          <div className="p-4 sm:p-5">
            <div className="flex flex-col lg:flex-row gap-4">
              
              {/* LEFT COLUMN: Items (60%) */}
              <div className="flex-1 lg:w-[60%] space-y-3">
                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                    <PiPackage className="w-3.5 h-3.5" /> Purchased Items
                  </h4>
                  <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                    {realItems.length > 0 ? (
                      realItems.map((item, i) => {
                        const originalPrice = item.price;
                        const activePrice = item.discount_price || item.price;
                        const hasDiscount = item.discount_price && item.discount_price < item.price;
                        
                        return (
                          <div key={i} className="flex flex-col border-b border-zinc-100 pb-3 mb-3 last:border-0 last:pb-0 last:mb-0">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="text-sm font-semibold text-black">{item.name}</p>
                                <p className="text-[11px] font-medium text-zinc-500 mt-0.5">
                                  {item.quantity} pc × Rs. {activePrice}
                                </p>
                              </div>
                              <p className="text-sm font-bold text-black">
                                Rs. {activePrice * item.quantity}
                              </p>
                            </div>
                            {item.specialInstructions && (
                              <div className="mt-2 bg-amber-50 text-amber-700 text-xs p-2 rounded-md border border-amber-100 font-medium">
                                Note: {item.specialInstructions}
                              </div>
                            )}
                          </div>
                        )
                      })
                    ) : (
                      <p className="text-sm text-zinc-500">No items recorded.</p>
                    )}
                  </div>
                </div>

                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm flex flex-col gap-3">
                   {order.status !== 'cancelled' && (
                     <div className="flex gap-2">
                       <button 
                         onClick={() => onStatusChange(order.id, 'processing')}
                         className="flex-1 bg-black text-white py-2.5 rounded-lg text-sm font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-1.5"
                       >
                         <PiCheckCircle className="w-4 h-4" /> Accept Order
                       </button>
                     </div>
                   )}
                   {order.status !== 'cancelled' ? (
                     <div className="flex flex-col gap-2 p-3 bg-red-50 rounded-lg border border-red-100">
                       <p className="text-[11px] font-bold text-red-600 uppercase tracking-widest">Cancel Order</p>
                       <div className="flex flex-col sm:flex-row gap-2">
                         <select 
                           id={`cancel-reason-${order.id}`}
                           className="flex-1 bg-white border border-red-200 text-sm text-red-900 rounded-md px-2.5 py-1.5 outline-none focus:ring-1 focus:ring-red-400"
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
                           className="bg-red-600 text-white px-4 rounded-md font-bold hover:bg-red-700 transition-colors"
                         >
                           Confirm
                         </button>
                       </div>
                     </div>
                   ) : (
                     <div className="p-3 bg-zinc-100 rounded-lg border border-zinc-200 text-center">
                       <p className="text-sm font-bold text-zinc-600">Order is Cancelled</p>
                       {order.cancel_reason && (
                         <p className="text-xs text-zinc-500 mt-1">Reason: {order.cancel_reason}</p>
                       )}
                     </div>
                   )}
                </div>
              </div>

              {/* RIGHT COLUMN: Fulfillment & Bill (40%) */}
              <div className="w-full lg:w-[40%] space-y-3">
                
                {/* Customer Details */}
                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm space-y-4">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <PiMapPin className="w-3.5 h-3.5" /> Fulfillment Details
                  </h4>
                  
                  <div className="bg-green-50 text-green-700 border border-green-200 font-bold text-center py-2 rounded-lg text-xs tracking-wide uppercase">
                    Cash on Delivery
                  </div>
                  
                  <div className="space-y-2.5 pt-1">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold mb-0.5">Customer</p>
                      <p className="text-sm font-semibold text-black">{order.customer_name}</p>
                      <p className="text-sm text-zinc-600 flex items-center gap-1.5 mt-1">
                        <PiPhone className="w-4 h-4 text-zinc-400" /> {order.customer_phone}
                      </p>
                    </div>
                    
                    <div className="pt-2 border-t border-zinc-100">
                      <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold mb-1">Address</p>
                      <p className="text-sm text-zinc-600 leading-relaxed font-medium">
                        {order.customer_address}, {order.delivery_area || order.delivery_city}
                      </p>
                      {order.customer_address && (
                        <a 
                          href={`https://maps.google.com/?q=${encodeURIComponent(order.customer_address + " " + (order.delivery_area || order.delivery_city))}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-blue-600 font-semibold mt-2 inline-flex items-center gap-1 hover:underline"
                        >
                          Open in Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>

                {/* Estimated Time */}
                <div className="bg-white border border-zinc-200 rounded-xl p-4 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-2 flex items-center gap-1.5">
                    <PiClock className="w-3.5 h-3.5" /> Estimated Time
                  </p>
                  <div className="flex items-center gap-2">
                    <input 
                      type="text" 
                      value={time}
                      onChange={(e) => setTime(e.target.value)}
                      placeholder="e.g. 45-50 mins" 
                      className="flex-1 bg-zinc-50 border border-zinc-200 rounded-lg px-2.5 py-1.5 text-sm text-black font-medium focus:outline-none focus:border-zinc-400 transition-colors"
                    />
                    <button 
                      onClick={saveEstimatedTime}
                      disabled={savingTime}
                      className="bg-zinc-100 text-black px-4 py-2 rounded-lg text-sm font-bold hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                    >
                      {savingTime ? <PiCircleNotch className="w-4 h-4 animate-spin mx-auto" /> : "Save"}
                    </button>
                  </div>
                </div>

                {/* Bill Summary */}
                <div className="bg-zinc-900 text-white rounded-xl p-4 shadow-md">
                  <h4 className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-3 flex items-center gap-1.5">
                    Order Summary
                  </h4>
                  <div className="space-y-1.5 text-sm">
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Subtotal</span>
                      <span>Rs. {subtotal}</span>
                    </div>
                    <div className="flex justify-between items-center text-zinc-300">
                      <span>Delivery Fee</span>
                      <span>Rs. {isDelivery ? 150 : 0}</span>
                    </div>
                    <div className="pt-2 mt-2 border-t border-zinc-700 flex justify-between items-center">
                      <span className="font-semibold">Total Amount</span>
                      <span className="text-lg font-bold text-[#C0E212]">Rs. {order.total_amount}</span>
                    </div>
                  </div>
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
  useEffect(() => { setCurrentPage(1); }, [searchQuery, adminStatusFilter]);

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
        <div className="flex items-center gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto no-scrollbar">
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
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[13px] text-zinc-500">
                <th className="p-3 sm:p-4 font-medium whitespace-nowrap">Order ID</th>
                <th className="hidden md:table-cell p-3 sm:p-4 font-medium whitespace-nowrap">Date & Time</th>
                <th className="p-4 font-medium whitespace-nowrap">Customer</th>
                <th className="p-4 font-medium whitespace-nowrap">Total</th>
                <th className="p-4 font-medium whitespace-nowrap">Status</th>
                <th className="p-4 font-medium whitespace-nowrap w-16 text-center">Action</th>
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
                      className={`hover:bg-zinc-50 transition-colors cursor-pointer ${
                        expandedOrderId === order.id ? "bg-zinc-50" : ""
                      }`}
                      onClick={() =>
                        setExpandedOrderId(expandedOrderId === order.id ? null : order.id)
                      }
                    >
                      <td className="p-3 sm:p-4 text-[13px] font-mono text-zinc-500 whitespace-nowrap">
                        <span className="font-semibold text-zinc-900 block">{order.id}</span>
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
                      <td className="p-4 text-sm text-black font-bold whitespace-nowrap">
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
