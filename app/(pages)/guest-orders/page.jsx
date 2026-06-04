"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { PiCircleNotch, PiPackage, PiCaretDown, PiCaretUp, PiMagnifyingGlass, PiCaretLeft, PiCaretRight } from "react-icons/pi";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || "pending";
  let bgClass = "bg-orange-50 text-orange-600";
  
  if (s === "processing") bgClass = "bg-blue-50 text-blue-600";
  if (s === "delivered") bgClass = "bg-green-50 text-green-600";
  if (s === "failed" || s === "cancelled") bgClass = "bg-zinc-100 text-zinc-600";

  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-semibold capitalize ${bgClass}`}>
      {status || "Waiting for delivery"}
    </span>
  );
};

export default function GuestOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);

  // New States for Search, Sort, and Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

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

  // Process Orders: Search and Sort
  const processedOrders = useMemo(() => {
    let result = [...orders];

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter(order => {
        const matchId = order.id.toLowerCase().includes(query);
        const matchItem = order.items?.some(item => item.name?.toLowerCase().includes(query));
        return matchId || matchItem;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter(order => order.status === statusFilter);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortOption) {
        case "newest":
          return new Date(b.created_at) - new Date(a.created_at);
        case "oldest":
          return new Date(a.created_at) - new Date(b.created_at);
        case "price_high":
          return b.total_amount - a.total_amount;
        case "price_low":
          return a.total_amount - b.total_amount;
        default:
          return 0;
      }
    });

    return result;
  }, [orders, searchQuery, sortOption, statusFilter]);

  // Pagination logic
  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Reset to page 1 when search, sort, or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, statusFilter]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-[#fafafa]">
          <PiCircleNotch className="w-10 h-10 animate-spin text-black" />
        </div>
      </>
    );
  }

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#fafafa] text-black pt-24 sm:pt-32 pb-12 px-4 sm:px-8">
        <div className="max-w-[900px] mx-auto">
          
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-black">Order history</h1>
            
            {/* Active Search & Sort UI */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex items-center bg-white border border-zinc-200 rounded-lg px-3 py-2.5 sm:py-2 shadow-sm sm:w-56 focus-within:border-zinc-400 focus-within:ring-1 focus-within:ring-zinc-400 transition-all">
                <PiMagnifyingGlass className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                <input 
                  type="text" 
                  placeholder="Search orders..." 
                  className="bg-transparent text-sm w-full focus:outline-none font-medium"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              
              <div className="relative flex items-center bg-white border border-zinc-200 rounded-lg shadow-sm group">
                <select 
                  className="appearance-none bg-transparent w-full sm:w-36 text-sm font-medium text-zinc-700 py-2.5 sm:py-2 pl-3 pr-8 focus:outline-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="processing">Processing</option>
                  <option value="delivered">Delivered</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                <PiCaretDown className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
              </div>

              <div className="relative flex items-center bg-white border border-zinc-200 rounded-lg shadow-sm group">
                <select 
                  className="appearance-none bg-transparent w-full sm:w-40 text-sm font-medium text-zinc-700 py-2.5 sm:py-2 pl-3 pr-8 focus:outline-none cursor-pointer"
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value)}
                >
                  <option value="newest">Newest first</option>
                  <option value="oldest">Oldest first</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="price_low">Price: Low to High</option>
                </select>
                <PiCaretDown className="w-4 h-4 text-zinc-400 absolute right-3 pointer-events-none" />
              </div>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-16 text-center mt-8">
              <PiPackage className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
              <h2 className="text-xl font-semibold mb-2">No active orders found</h2>
              <p className="text-zinc-500 text-sm mb-6">
                You haven't placed any orders on this device recently.
              </p>
              <Link
                href="/"
                className="inline-block bg-black text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
              >
                Start Shopping
              </Link>
            </div>
          ) : processedOrders.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-zinc-100 p-16 text-center mt-8">
              <PiMagnifyingGlass className="w-12 h-12 text-zinc-200 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2">No results found</h2>
              <p className="text-zinc-500 text-sm mb-6">
                Try adjusting your search query.
              </p>
              <button
                onClick={() => setSearchQuery("")}
                className="text-sm font-medium text-blue-600 hover:underline"
              >
                Clear Search
              </button>
            </div>
          ) : (
            <>
              <div className="flex flex-col gap-4">
                {currentOrders.map((order) => {
                  const isExpanded = expandedOrder === order.id;
                  const realItems = order.items?.filter(item => !item.isMetadata) || [];

                  return (
                    <div key={order.id} className="bg-white rounded-[1.25rem] shadow-sm border border-zinc-200 overflow-hidden transition-all duration-300">
                      {/* Card Header */}
                      <div 
                        className="p-4 sm:p-6 cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-zinc-50/50 transition-colors"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                            <span className="font-semibold text-black text-[15px]">
                              Order Number: {order.id.slice(0, 12)}
                            </span>
                            <span className="text-zinc-400 text-sm font-medium">
                              {formatDate(order.created_at)}
                            </span>
                          </div>
                          <div className="flex items-center gap-3">
                            <StatusBadge status={order.status} />
                            <span className="text-[#38b000] text-[13px] font-semibold underline decoration-[#38b000]/30 underline-offset-4 hover:decoration-[#38b000] transition-all">
                              Track order
                            </span>
                          </div>
                          {order.status === 'cancelled' && order.cancel_reason && (
                            <div className="mt-1 flex items-center gap-2">
                               <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                               <span className="text-[12px] font-bold text-red-600">Reason: {order.cancel_reason}</span>
                            </div>
                          )}
                          {order.status !== 'cancelled' && order.estimated_time && (
                            <div className="mt-1 flex items-center gap-2">
                               <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                               <span className="text-[12px] font-bold text-amber-600">Estimated delivery time: {order.estimated_time}</span>
                            </div>
                          )}
                        </div>

                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-8 border-t border-zinc-100 pt-3 sm:border-0 sm:pt-0">
                          <div className="flex items-center -space-x-2">
                            {realItems.slice(0, 3).map((item, idx) => (
                              <div key={idx} className="w-10 h-10 rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm z-10 relative">
                                <Image 
                                  src={item.image_url || "https://via.placeholder.com/100"} 
                                  alt={item.name} 
                                  fill 
                                  className="object-cover"
                                />
                              </div>
                            ))}
                            {realItems.length > 3 && (
                              <div className="w-10 h-10 rounded-lg border border-zinc-200 bg-zinc-50 flex items-center justify-center text-[10px] font-semibold text-zinc-500 shadow-sm z-0 relative">
                                +{realItems.length - 3}
                              </div>
                            )}
                          </div>

                          <div className="text-right flex items-center gap-4">
                            <div>
                              <p className="text-[11px] text-zinc-400 font-semibold mb-0.5">Total</p>
                              <p className="text-base font-bold text-black">Rs. {order.total_amount}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-zinc-100 transition-colors text-zinc-600">
                              {isExpanded ? <PiCaretUp className="w-5 h-5" /> : <PiCaretDown className="w-5 h-5" />}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Items Section */}
                      <div className={`transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'} overflow-hidden`}>
                        <div className="px-4 sm:px-6 pb-6 pt-2">
                          <div className="flex flex-col gap-4">
                            {realItems.map((item, idx) => {
                              const originalPrice = item.price;
                              const activePrice = item.discount_price || item.price;
                              const hasDiscount = item.discount_price && item.discount_price < item.price;

                              return (
                                <div key={idx} className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                                  
                                  <div className="flex items-start gap-4 flex-1">
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0">
                                      <Image
                                        src={item.image_url || "https://via.placeholder.com/100"}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex flex-col">
                                      <h3 className="font-semibold text-black text-[15px]">{item.name}</h3>
                                      <p className="text-[13px] text-zinc-500 mt-1">{item.category}</p>
                                      {item.specialInstructions && (
                                        <p className="text-[12px] text-zinc-400 mt-0.5">Note: {item.specialInstructions}</p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between w-full sm:w-auto sm:gap-12 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-zinc-100 sm:border-0">
                                    <div className="text-left sm:text-right flex items-center sm:block gap-2">
                                      {hasDiscount && (
                                        <span className="text-[11px] line-through text-zinc-400 sm:block hidden">Rs. {originalPrice}</span>
                                      )}
                                      <p className="text-[13px] font-medium text-zinc-600">
                                        Rs. {activePrice} <span className="text-zinc-400 mx-1">x</span> {item.quantity} pc
                                      </p>
                                    </div>
                                    <div className="text-right sm:w-24 shrink-0">
                                      <p className="text-base font-bold text-black">Rs. {activePrice * item.quantity}</p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 bg-zinc-50 border border-zinc-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                              <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Delivery Details</p>
                              <p className="text-sm font-semibold text-black">{order.customer_name} <span className="text-zinc-400 font-normal">| {order.customer_phone}</span></p>
                              <p className="text-[13px] text-zinc-600 mt-0.5">{order.customer_address}, {order.delivery_area || order.delivery_city}</p>
                            </div>
                            <div className="sm:text-right">
                               <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-2">Summary</p>
                               <p className="text-[13px] text-zinc-600">Subtotal: Rs. {order.total_amount - (order.order_type === 'Delivery' ? 150 : 0)}</p>
                               <p className="text-[13px] text-zinc-600 mb-1">Delivery Fee: Rs. {order.order_type === 'Delivery' ? 150 : 0}</p>
                               <p className="text-sm font-bold text-black">Total: Rs. {order.total_amount}</p>
                            </div>
                          </div>

                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PiCaretLeft className="w-5 h-5" />
                  </button>
                  
                  <div className="flex items-center gap-1">
                    {Array.from({ length: totalPages }).map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentPage(idx + 1)}
                        className={`w-9 h-9 rounded-lg text-sm font-semibold transition-colors ${
                          currentPage === idx + 1 
                            ? 'bg-black text-white border border-black' 
                            : 'bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PiCaretRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
