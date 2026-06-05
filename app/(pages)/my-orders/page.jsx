"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  PiCircleNotch,
  PiPackage,
  PiCaretDown,
  PiCaretUp,
  PiMagnifyingGlass,
  PiCaretLeft,
  PiCaretRight,
  PiPhoneCall,
  PiWarningCircle,
  PiX,
} from "react-icons/pi";
import Image from "next/image";
import Navbar from "@/app/components/Navbar";
import toast from "react-hot-toast";

const StatusBadge = ({ status }) => {
  const s = status?.toLowerCase() || "pending";
  let bgClass = "bg-orange-50 text-orange-600";

  if (s === "processing") bgClass = "bg-blue-50 text-blue-600";
  if (s === "delivered") bgClass = "bg-green-50 text-green-600";
  if (s === "failed" || s === "cancelled")
    bgClass = "bg-zinc-100 text-zinc-500";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[11px] font-medium capitalize ${bgClass}`}
    >
      {status || "Waiting for delivery"}
    </span>
  );
};

const formatOrderDate = (dateString) => {
  const d = new Date(dateString);
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "short" });
  const time = d.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${day} ${month}, ${time}`;
};

const CountdownTimer = ({ createdAt, status }) => {
  const [timeLeft, setTimeLeft] = useState(null);

  useEffect(() => {
    if (status !== "pending" && status !== "processing") return;

    const calculateTimeLeft = () => {
      const orderTime = new Date(createdAt).getTime();
      const targetTime = orderTime + 45 * 60 * 1000; // 45 minutes
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
  }, [createdAt, status]);

  if (status !== "pending" && status !== "processing") return null;
  if (!timeLeft) return null;

  return (
    <div className="bg-[#1e1e24] text-white rounded-xl p-4 flex flex-col items-center justify-center w-full shadow-lg mb-6 border border-zinc-800">
      <p className="text-zinc-400 text-[10px] font-semibold uppercase tracking-widest mb-3">
        Order will be delivered in
      </p>
      <div className="flex items-center justify-center gap-8">
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black tabular-nums tracking-tight">
            {timeLeft.minutes.toString().padStart(2, "0")}
          </span>
          <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mt-1">
            Minutes
          </span>
        </div>
        <div className="w-px h-8 bg-zinc-700"></div>
        <div className="flex flex-col items-center">
          <span className="text-3xl font-black tabular-nums tracking-tight">
            {timeLeft.seconds.toString().padStart(2, "0")}
          </span>
          <span className="text-zinc-500 text-[9px] uppercase font-bold tracking-widest mt-1">
            Seconds
          </span>
        </div>
      </div>
    </div>
  );
};

const OrderSkeleton = () => (
  <div className="bg-white rounded-[1.25rem] shadow-sm border border-zinc-100 p-4 sm:p-5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 animate-pulse mb-4">
    <div className="flex flex-col gap-2 w-full sm:w-1/2">
      <div className="h-5 bg-zinc-200 rounded w-3/4 sm:w-1/2"></div>
      <div className="h-4 bg-zinc-100 rounded w-1/2 sm:w-1/3"></div>
    </div>
    <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 pt-3 sm:border-0 sm:pt-0">
      <div className="flex items-center -space-x-2">
        <div className="w-10 h-10 rounded-lg bg-zinc-200 border-2 border-white"></div>
        <div className="w-10 h-10 rounded-lg bg-zinc-200 border-2 border-white"></div>
      </div>
      <div className="text-right flex flex-col items-end">
        <div className="h-3 bg-zinc-200 rounded w-8 mb-1"></div>
        <div className="h-5 bg-zinc-200 rounded w-16"></div>
      </div>
    </div>
  </div>
);

export default function GuestOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [cancellingOrder, setCancellingOrder] = useState(null);
  const [showProcessingModal, setShowProcessingModal] = useState(false);


  const [pastOrdersData, setPastOrdersData] = useState([]);
  const [fetchingPast, setFetchingPast] = useState(false);

  // New States for Search, Sort, and Pagination
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortOption, setSortOption] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchInitialOrders = async () => {
      const savedOrderIds = JSON.parse(
        localStorage.getItem("guestOrders") || "[]",
      );

      if (savedOrderIds.length === 0) {
        setLoading(false);
        return;
      }

      try {
        // Fetch all saved order IDs
        const promises = savedOrderIds.map((id) =>
          fetch(`/api/orders/${id}`)
            .then((res) => res.json())
            .catch(() => null),
        );
        const results = await Promise.all(promises);

        const allFetched = results
          .filter((res) => res && res.success && res.data)
          .map((res) => res.data);

        // Sort by created_at descending (newest first)
        allFetched.sort(
          (a, b) => new Date(b.created_at) - new Date(a.created_at),
        );

        // Split into active (in-progress) and completed orders
        const activeOrders = [];
        const completedOrders = [];

        for (const order of allFetched) {
          if (order.status === "pending" || order.status === "processing") {
            activeOrders.push(order);
          } else {
            completedOrders.push(order);
          }
        }

        setOrders(activeOrders);
        setPastOrdersData(completedOrders);
      } catch (error) {
        console.error("Error fetching your orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchInitialOrders();
  }, []);

  const loadPastOrders = () => {
    // Completed orders are already fetched, just add them to displayed orders
    setOrders((prev) => [...prev, ...pastOrdersData]);
    setPastOrdersData([]);
  };

  // Process Orders: Search and Sort
  const isFilterActive = searchQuery.trim() !== "" || statusFilter !== "all";

  const processedOrders = useMemo(() => {
    // When filtering, include past orders too so filters work across all orders
    let result = isFilterActive
      ? [...orders, ...pastOrdersData]
      : [...orders];

    // Search filter
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      result = result.filter((order) => {
        const matchId = order.id.toLowerCase().includes(query);
        const matchItem = order.items?.some((item) =>
          item.name?.toLowerCase().includes(query),
        );
        return matchId || matchItem;
      });
    }

    // Status filter
    if (statusFilter !== "all") {
      result = result.filter((order) => order.status === statusFilter);
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
  }, [orders, pastOrdersData, searchQuery, sortOption, statusFilter, isFilterActive]);

  // Pagination logic
  const totalPages = Math.ceil(processedOrders.length / itemsPerPage);
  const currentOrders = processedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset to page 1 when search, sort, or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, sortOption, statusFilter]);

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-[#fafafa] pt-24 sm:pt-32 pb-12 px-4 sm:px-8">
          <div className="max-w-[900px] mx-auto">
            <div className="h-8 bg-zinc-200 rounded w-48 mb-8 animate-pulse"></div>
            {[...Array(3)].map((_, i) => (
              <OrderSkeleton key={i} />
            ))}
          </div>
        </div>
      </>
    );
  }

  // Replaced with timeAgo and formatExactTime

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  const handleCancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    setCancellingOrder(orderId);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "cancelled",
          cancel_reason: "Customer requested cancellation",
        }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success("Order cancelled successfully");
        setOrders(
          orders.map((o) =>
            o.id === orderId
              ? {
                  ...o,
                  status: "cancelled",
                  cancel_reason: "Customer requested cancellation",
                }
              : o,
          ),
        );
      } else {
        toast.error(result.message || "Failed to cancel order");
      }
    } catch (error) {
      toast.error("Error cancelling order");
    } finally {
      setCancellingOrder(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#fafafa] text-black pt-24 sm:pt-32 pb-12 px-4 sm:px-8">
        <div className="max-w-[900px] mx-auto">
          <div className="mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h1 className="text-2xl sm:text-3xl font-semibold text-black">
              My Orders
            </h1>

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
              <h2 className="text-xl font-semibold mb-2">
                No active orders
              </h2>
              <p className="text-zinc-500 text-sm mb-6">
                You don't have any orders in progress right now.
              </p>
              {pastOrdersData.length > 0 ? (
                <button
                  onClick={loadPastOrders}
                  disabled={fetchingPast}
                  className="inline-flex items-center gap-2 bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {fetchingPast ? (
                    <><PiCircleNotch className="w-4 h-4 animate-spin" /> Loading...</>
                  ) : (
                    "View Completed Orders"
                  )}
                </button>
              ) : (
                <Link
                  href="/"
                  className="inline-block bg-black text-white text-xs font-semibold uppercase tracking-widest px-6 py-3 rounded-xl hover:bg-zinc-800 transition-colors shadow-sm"
                >
                  Start Ordering
                </Link>
              )}
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
                  const realItems =
                    order.items?.filter((item) => !item.isMetadata) || [];

                  return (
                    <div
                      key={order.id}
                      className="bg-white rounded-[1.25rem] shadow-sm border border-zinc-200 overflow-hidden transition-all duration-300"
                    >
                      {/* Card Header */}
                      <div
                        className="p-4 sm:p-5 cursor-pointer flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-zinc-50/50 transition-colors"
                        onClick={() => toggleOrder(order.id)}
                      >
                        <div className="flex flex-col gap-1.5">
                          <div className="flex items-center flex-wrap gap-2 sm:gap-3">
                            <span className="font-medium text-black text-[15px]">
                              Order #{order.id.slice(0, 12)}
                            </span>
                            <span className="text-zinc-500 text-[13px] font-normal">
                              {formatOrderDate(order.created_at)}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto gap-4 sm:gap-6 border-t border-zinc-100 pt-3 sm:border-0 sm:pt-0">
                          <div className="flex items-center -space-x-2">
                            {realItems.slice(0, 3).map((item, idx) => (
                              <div
                                key={idx}
                                className="w-10 h-10 rounded-lg border border-zinc-200 bg-white overflow-hidden shadow-sm z-10 relative"
                              >
                                <Image
                                  src={
                                    item.image_url ||
                                    "https://via.placeholder.com/100"
                                  }
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
                              <p className="text-[11px] text-zinc-400 font-medium mb-0.5">
                                Total
                              </p>
                              <p className="text-[15px] font-semibold text-black">
                                Rs. {order.total_amount}
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-colors text-zinc-600">
                              {isExpanded ? (
                                <PiCaretUp className="w-4 h-4" />
                              ) : (
                                <PiCaretDown className="w-4 h-4" />
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Expanded Items Section */}
                      <div
                        className={`transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"} overflow-hidden`}
                      >
                        <div className="px-4 sm:px-6 pb-6 pt-2 border-t border-zinc-100 mt-2">
                          {/* Tracking History / Status Details */}
                          <div className="mb-6 bg-zinc-50/50 rounded-2xl p-5 border border-zinc-100">
                            <div className="flex items-center justify-between mb-4">
                              <h4 className="text-[14px] font-medium text-black">
                                Order Status
                              </h4>
                              <div className="flex items-center gap-3">
                                <StatusBadge status={order.status} />
                                {order.status === "pending" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCancelOrder(order.id);
                                    }}
                                    disabled={cancellingOrder === order.id}
                                    className="text-red-500 text-[13px] font-medium hover:text-red-600 transition-colors disabled:opacity-50"
                                  >
                                    {cancellingOrder === order.id
                                      ? "Cancelling..."
                                      : "Cancel Order"}
                                  </button>
                                )}
                                {order.status === "processing" && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setShowProcessingModal(true);
                                    }}
                                    className="text-amber-600 text-[13px] font-medium hover:text-amber-700 transition-colors"
                                  >
                                    Cancel Order
                                  </button>
                                )}
                              </div>
                            </div>

                            <CountdownTimer
                              createdAt={order.created_at}
                              status={order.status}
                            />

                            {/* Timeline UI */}
                            <div className="relative flex items-center justify-between mt-6 px-2">
                              <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-0.5 bg-zinc-200 z-0"></div>
                              <div
                                className="absolute left-2 top-1/2 -translate-y-1/2 h-0.5 bg-blue-500 z-0 transition-all duration-500"
                                style={{
                                  width:
                                    order.status === "delivered"
                                      ? "calc(100% - 16px)"
                                      : order.status === "processing"
                                        ? "50%"
                                        : order.status === "cancelled" ||
                                            order.status === "failed"
                                          ? "calc(100% - 16px)"
                                          : "0%",
                                }}
                              ></div>

                              {[
                                "Pending",
                                "Processing",
                                order.status === "cancelled"
                                  ? "Cancelled"
                                  : order.status === "failed"
                                    ? "Failed"
                                    : "Delivered",
                              ].map((step, idx) => {
                                let isCompleted = false;
                                let isCurrent = false;
                                let isError =
                                  step === "Cancelled" || step === "Failed";

                                if (order.status === "delivered")
                                  isCompleted = true;
                                else if (order.status === "processing") {
                                  if (idx === 0) isCompleted = true;
                                  if (idx === 1) isCurrent = true;
                                } else if (
                                  order.status === "cancelled" ||
                                  order.status === "failed"
                                ) {
                                  if (idx < 2) isCompleted = true;
                                  if (idx === 2) {
                                    isCurrent = true;
                                    isCompleted = true;
                                  }
                                } else {
                                  // pending
                                  if (idx === 0) isCurrent = true;
                                }

                                return (
                                  <div
                                    key={idx}
                                    className="relative z-10 flex flex-col items-center gap-2 bg-zinc-50/50 px-1"
                                  >
                                    <div
                                      className={`w-3.5 h-3.5 rounded-full border-2 ${isCompleted || isCurrent ? (isError ? "bg-red-500 border-red-500" : "bg-blue-500 border-blue-500") : "bg-white border-zinc-300"}`}
                                    ></div>
                                    <span
                                      className={`text-[11px] font-medium absolute top-6 whitespace-nowrap ${isCurrent ? (isError ? "text-red-500" : "text-blue-600") : isCompleted ? "text-zinc-600" : "text-zinc-400"}`}
                                    >
                                      {step}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="mt-10">
                              {order.status === "cancelled" &&
                                order.cancel_reason && (
                                  <div className="text-[13px] text-red-500/80 font-normal bg-red-50/50 p-3 rounded-lg border border-red-100/50">
                                    Reason: {order.cancel_reason}
                                  </div>
                                )}
                              {order.status !== "cancelled" &&
                                order.estimated_time && (
                                  <div className="text-[13px] text-amber-600/80 font-normal bg-amber-50/50 p-3 rounded-lg border border-amber-100/50">
                                    Estimated delivery time:{" "}
                                    {order.estimated_time}
                                  </div>
                                )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-4">
                            {realItems.map((item, idx) => {
                              const originalPrice = item.price;
                              const activePrice =
                                item.discount_price || item.price;
                              const hasDiscount =
                                item.discount_price &&
                                item.discount_price < item.price;

                              return (
                                <div
                                  key={idx}
                                  className="bg-white border border-zinc-200 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm"
                                >
                                  <div className="flex items-start gap-4 flex-1">
                                    <div className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-xl border border-zinc-100 bg-zinc-50 overflow-hidden shrink-0">
                                      <Image
                                        src={
                                          item.image_url ||
                                          "https://via.placeholder.com/100"
                                        }
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <div className="flex flex-col">
                                      <h3 className="font-medium text-black text-[14px]">
                                        {item.name}
                                      </h3>
                                      <p className="text-[13px] text-zinc-500 mt-0.5">
                                        {item.category}
                                      </p>
                                      {item.specialInstructions && (
                                        <p className="text-[12px] text-zinc-400 mt-0.5 font-normal">
                                          Note: {item.specialInstructions}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between w-full sm:w-auto sm:gap-12 mt-2 sm:mt-0 pt-3 sm:pt-0 border-t border-zinc-100 sm:border-0">
                                    <div className="text-left sm:text-right flex items-center sm:block gap-2">
                                      {hasDiscount && (
                                        <span className="text-[11px] line-through text-zinc-400 sm:block hidden">
                                        </span>
                                      )}
                                      <p className="text-[13px] font-medium text-zinc-600">
                                        Rs. {activePrice}{" "}
                                        <span className="text-zinc-400 mx-1">
                                          x
                                        </span>{" "}
                                        {item.quantity} pc
                                      </p>
                                    </div>
                                    <div className="text-right sm:w-24 shrink-0">
                                      <p className="text-[15px] font-semibold text-black">
                                        Rs. {activePrice * item.quantity}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>

                          <div className="mt-4 bg-zinc-50 border border-zinc-100 rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row justify-between gap-4">
                            <div>
                              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                                Delivery Details
                              </p>
                              <p className="text-[14px] font-medium text-black">
                                {order.customer_name}{" "}
                                <span className="text-zinc-400 font-normal">
                                  | {order.customer_phone}
                                </span>
                              </p>
                              <p className="text-[13px] text-zinc-600 mt-0.5 font-normal">
                                {order.customer_address},{" "}
                                {order.delivery_area || order.delivery_city}
                              </p>
                            </div>
                            <div className="sm:text-right">
                              <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-widest mb-2">
                                Summary
                              </p>
                              <p className="text-[13px] text-zinc-600 font-normal">
                                Subtotal: Rs.{" "}
                                {order.total_amount -
                                  (order.order_type === "Delivery" ? 150 : 0)}
                              </p>
                              <p className="text-[13px] text-zinc-600 mb-1 font-normal">
                                Delivery Fee: Rs.{" "}
                                {order.order_type === "Delivery" ? 150 : 0}
                              </p>
                              <p className="text-[15px] font-semibold text-black mt-1">
                                Total: Rs. {order.total_amount}
                              </p>
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
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
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
                            ? "bg-black text-white border border-black"
                            : "bg-white border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <PiCaretRight className="w-5 h-5" />
                  </button>
                </div>
              )}

              {/* Load Past Orders Button */}
              {pastOrdersData.length > 0 && (
                <div className="mt-8 text-center">
                  <button
                    onClick={loadPastOrders}
                    disabled={fetchingPast}
                    className="bg-white border border-zinc-200 text-zinc-700 text-sm font-semibold px-6 py-3 rounded-xl hover:bg-zinc-50 transition-colors disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {fetchingPast ? (
                      <>
                        <PiCircleNotch className="w-4 h-4 animate-spin" />{" "}
                        Loading...
                      </>
                    ) : (
                      "View Completed Orders"
                    )}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
      {/* Processing Modal */}
      {showProcessingModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center px-4" onClick={() => setShowProcessingModal(false)}>
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[6px] transition-opacity duration-300"></div>
          <div 
            className="relative bg-white rounded-[2rem] shadow-2xl max-w-[400px] w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
            style={{ animation: 'modalPop 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Top accent bar */}
            <div className="h-1.5 w-full bg-gradient-to-r from-amber-400 via-orange-400 to-red-400"></div>
            
            <div className="p-7 pb-6">
              <button 
                onClick={() => setShowProcessingModal(false)}
                className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full bg-zinc-100 hover:bg-zinc-200 transition-colors text-zinc-400 hover:text-zinc-600"
              >
                <PiX className="w-4 h-4" />
              </button>

              {/* Animated cooking icon */}
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-100 flex items-center justify-center mx-auto mb-5">
                <span className="text-4xl" style={{ animation: 'cookBounce 2s ease-in-out infinite' }}>👨‍🍳</span>
              </div>

              <h3 className="text-[20px] font-bold text-black mb-2 leading-tight">Order Preparation Started!</h3>
              <p className="text-zinc-500 text-[13px] leading-relaxed mb-6">
                Our kitchen team is already preparing your delicious order. Online cancellation is not available at this stage.
              </p>

              {/* Contact Card — matching Navbar style */}
              <a
                href="tel:021111666111"
                className="flex items-center gap-4 p-4 bg-white border-2 border-zinc-200 rounded-2xl hover:border-[#D21716]/30 hover:bg-red-50/30 transition-all duration-200 active:scale-[0.98] group"
              >
                <div className="w-12 h-12 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center shrink-0 group-hover:bg-red-100 transition-colors">
                  <PiPhoneCall className="w-6 h-6 text-[#D21716]" weight="fill" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[15px] font-bold text-black leading-tight">Contact us</span>
                  <span className="text-[13px] text-zinc-500 leading-tight mt-0.5">021-111-666-111</span>
                </div>
              </a>

              <button 
                onClick={() => setShowProcessingModal(false)}
                className="mt-4 w-full text-zinc-400 text-[13px] font-medium py-2.5 hover:text-zinc-600 transition-colors"
              >
                Go Back
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes modalPop {
          from { opacity: 0; transform: scale(0.92) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes cookBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.1) rotate(-5deg); }
          75% { transform: scale(1.05) rotate(5deg); }
        }
      `}</style>
    </>
  );
}
