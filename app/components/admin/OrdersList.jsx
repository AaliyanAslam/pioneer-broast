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

// ─── GSAP Expanded Row ──────────────────────────────────────────────────────
const ExpandedRow = ({ order }) => {
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    gsap.fromTo(
      contentRef.current,
      { height: 0, opacity: 0 },
      { height: "auto", opacity: 1, duration: 0.35, ease: "power2.out" }
    );
  }, []);

  return (
    <tr className="bg-zinc-50 border-t-0">
      <td colSpan="6" className="p-0 border-b border-zinc-200">
        <div ref={contentRef} className="overflow-hidden">
          <div className="p-4 sm:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border border-zinc-200 p-5 sm:p-6 rounded-xl shadow-sm">
              {/* Customer & Delivery Info */}
              <div className="space-y-4">
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-2">
                  Delivery Details
                </h4>
                <div className="flex items-start gap-3">
                  <PiPhone className="w-4 h-4 text-zinc-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-black">Contact Number</p>
                    <p className="text-sm text-zinc-600">{order.customer_phone || order.phone}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PiMapPin className="w-4 h-4 text-zinc-400 mt-1 shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-black">Shipping Address</p>
                    <p className="text-sm text-zinc-600 leading-relaxed max-w-sm">
                      {order.customer_address || order.shipping_address}, {order.delivery_city || order.delivery_area || order.city}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-widest text-zinc-400 mb-4">
                  Order Items
                </h4>
                <div className="space-y-3 bg-zinc-50 p-4 rounded-lg border border-zinc-100 max-h-48 overflow-y-auto">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-start justify-between border-b border-zinc-200/50 last:border-0 pb-3 last:pb-0"
                      >
                        <div className="flex items-start gap-2">
                          <PiPackage className="w-4 h-4 text-zinc-400 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-black">{item.name}</p>
                            <p className="text-xs text-zinc-500">
                              Qty: {item.quantity}{" "}
                              {item.chosenColor ? `• Color: ${item.chosenColor}` : ""}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm font-bold text-black whitespace-nowrap">
                          Rs. {(item.discount_price || item.price) * item.quantity}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-zinc-500">No items recorded.</p>
                  )}
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

  // Reset to page 1 on search
  useEffect(() => { setCurrentPage(1); }, [searchQuery]);

  // ── Status update with optimistic mutate ─────────────────────────────────
  const handleStatusChange = async (orderId, newStatus) => {
    setUpdatingId(orderId);

    // Optimistic update: immediately reflect the change in cache
    mutate(
      orders.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)),
      false // don't revalidate yet — we'll do it after the PATCH
    );

    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
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
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-black">Recent Orders</h2>

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
                        <span className="font-bold text-zinc-900 block">{order.id.slice(0, 8)}...</span>
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

                      {/* ── Expand toggle ── */}
                      <td className="p-4 text-center">
                        <button className="text-zinc-400 hover:text-black transition-colors p-1.5 rounded-md hover:bg-zinc-200 active:scale-95">
                          {expandedOrderId === order.id ? (
                            <PiCaretUp className="w-5 h-5" />
                          ) : (
                            <PiCaretDown className="w-5 h-5" />
                          )}
                        </button>
                      </td>
                    </tr>

                    {expandedOrderId === order.id && <ExpandedRow order={order} />}
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
