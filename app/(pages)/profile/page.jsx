"use client";
import { useState, useEffect, useMemo } from "react";
import useSWR from "swr";
import { supabase } from "@/app/lib/supabase";
import { useRouter } from "next/navigation";
import {
  PiUser, PiPackage, PiSignOut, PiCircleNotch, PiShieldCheck, PiMapPin, PiPhone,
  PiCaretDown, PiCaretUp, PiMagnifyingGlass, PiX,
} from "react-icons/pi";
import Link from "next/link";
import Image from "next/image";
import toast from "react-hot-toast";
import Navbar from "@/app/components/Navbar";
import Tooltip from "@/app/components/ui/Tooltip";

// ─── Constants ────────────────────────────────────────────────────────────────
const STATUS_FILTERS = ["All", "pending", "processing", "delivered", "failed", "cancelled"];
const TIME_FILTERS = ["All Time", "Today", "This Week", "This Month"];

const STATUS_CONFIG = {
  pending:    { label: "Pending",    bg: "bg-amber-500" },
  processing: { label: "Processing", bg: "bg-blue-500" },
  delivered:  { label: "Delivered",  bg: "bg-green-500" },
  failed:     { label: "Failed",     bg: "bg-red-500" },
  cancelled:  { label: "Cancelled",  bg: "bg-zinc-400" },
};

// ─── StatusBadge ─────────────────────────────────────────────────────────────
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

// ─── Custom SWR fetcher for Supabase (not a REST API call) ───────────────────
const fetchUserOrders = async (userId) => {
  const { data, error } = await supabase
    .from("orders")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    const err = new Error(error.message);
    err.status = 500;
    throw err;
  }
  return data ?? [];
};

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ProfilePage() {
  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [search, setSearch]           = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [timeFilter, setTimeFilter]   = useState("All Time");
  const [activeTab, setActiveTab]     = useState("orders");
  const router = useRouter();

  // ── Resolve Supabase auth session first ─────────────────────────────────
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session?.user) {
        router.push("/cart");
        return;
      }
      setUser(session.user);
      setAuthLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [router]);

  // ── SWR: key is null until we know the userId (prevents premature fetch) ─
  const { data: orders = [], error: ordersError, isLoading: ordersLoading } = useSWR(
    user ? ["user-orders", user.id] : null,
    ([, userId]) => fetchUserOrders(userId),
    {
      fallbackData: [],        // no spinner on re-visit
      keepPreviousData: true,  // show stale orders instantly while revalidating
    }
  );

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLogout = async () => {
    toast.success("Logged out successfully");
    await supabase.auth.signOut();
    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  const toggleOrder = (orderId) => {
    setExpandedOrder(expandedOrder === orderId ? null : orderId);
  };

  // ── Derived / filtered list ───────────────────────────────────────────────
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        search === "" ||
        order.id.toLowerCase().includes(search.toLowerCase()) ||
        order.customer_name?.toLowerCase().includes(search.toLowerCase()) ||
        order.city?.toLowerCase().includes(search.toLowerCase());
      
      const matchesStatus =
        statusFilter === "All" || order.status === statusFilter;

      let matchesTime = true;
      const orderDate = new Date(order.created_at);
      const now = new Date();
      if (timeFilter === "Today") {
        matchesTime = orderDate.toDateString() === now.toDateString();
      } else if (timeFilter === "This Week") {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(now.getDate() - 7);
        matchesTime = orderDate >= oneWeekAgo;
      } else if (timeFilter === "This Month") {
        matchesTime = orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
      }

      return matchesSearch && matchesStatus && matchesTime;
    });
  }, [orders, search, statusFilter, timeFilter]);

  // ── Loading: auth check or first orders fetch ─────────────────────────────
  if (authLoading || ordersLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center bg-zinc-50">
          <PiCircleNotch className="w-10 h-10 animate-spin text-[#C0E212]" />
        </div>
      </>
    );
  }

  if (!user) {
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
    return d.toLocaleDateString("en-US", {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    }) + " at " + d.toLocaleTimeString("en-US", {
      hour: '2-digit', minute: '2-digit'
    });
  };

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-zinc-50 text-black border-t border-zinc-200">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row h-full">
          
          {/* ── Left Sidebar ── */}
          <aside className="w-full md:w-72 bg-white border-r border-zinc-200 p-6 flex flex-col md:min-h-[calc(100vh-80px)]">
            <div className="mb-10 text-center md:text-left">
              <div className="w-16 h-16 bg-zinc-100 rounded-full mx-auto md:mx-0 flex items-center justify-center mb-4">
                <span className="text-xl font-bold text-zinc-500 uppercase">
                  {(user.user_metadata?.full_name?.[0] || user.email?.[0] || "U")}
                </span>
              </div>
              <h2 className="text-lg font-bold uppercase tracking-tight text-zinc-900">
                {user.user_metadata?.full_name || user.email.split("@")[0]}
              </h2>
              <p className="text-sm font-medium text-zinc-500 truncate">{user.email}</p>
            </div>

            <nav className="flex-1 space-y-2">
              <Tooltip text="View your past orders" position="right" className="w-full block">
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium ${
                    activeTab === "orders" ? "bg-zinc-100 text-black" : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <PiPackage className="w-5 h-5" />
                  <span className="text-sm">Order History</span>
                </button>
              </Tooltip>
              
              <Tooltip text="Update your account settings" position="right" className="w-full block">
                <button
                  onClick={() => setActiveTab("settings")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all font-medium ${
                    activeTab === "settings" ? "bg-zinc-100 text-black" : "text-zinc-600 hover:bg-zinc-50"
                  }`}
                >
                  <PiUser className="w-5 h-5" />
                  <span className="text-sm">Account Settings</span>
                </button>
              </Tooltip>
            </nav>

            <div className="pt-6 border-t border-zinc-100 mt-6">
              <Tooltip text="Sign out of your account" position="right" className="w-full block">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 font-medium rounded-2xl transition-all"
                >
                  <PiSignOut className="w-5 h-5" />
                  <span className="text-sm">Sign Out</span>
                </button>
              </Tooltip>
            </div>
          </aside>

          {/* ── Main Content Area ── */}
          <main className="flex-1 p-6 md:p-12 overflow-x-hidden">
            
            {activeTab === "settings" && (
              <div className="bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm text-center">
                <PiUser className="w-16 h-16 mx-auto text-zinc-300 mb-4" />
                <h3 className="text-xl font-bold mb-2">Account Settings</h3>
                <p className="text-zinc-500">Settings will be available in the next update.</p>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="max-w-420">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold uppercase tracking-tighter">Order History</h1>
                    <p className="text-zinc-500 text-sm mt-1">Track and manage your recent purchases.</p>
                  </div>
                  <span className="hidden sm:inline-flex bg-zinc-100 text-zinc-600 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full shadow-sm">
                    {filteredOrders.length} order{filteredOrders.length !== 1 ? "s" : ""}
                  </span>
                </div>

                {/* Orders Card */}
                <div className="bg-white rounded-3xl shadow-sm border border-zinc-200 overflow-hidden">
                  
                  {/* Search & Filter Bar */}
                  <div className="px-6 py-4 border-b border-zinc-100 flex flex-col lg:flex-row gap-4 bg-zinc-50/50">
                    <div className="relative flex-1">
                      <PiMagnifyingGlass className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by order ID..."
                        className="w-full pl-9 pr-9 py-2.5 bg-white border border-zinc-200 rounded-xl text-sm text-black placeholder-zinc-400 focus:outline-none focus:border-black transition-colors shadow-sm"
                      />
                      {search && (
                        <Tooltip text="Clear search" position="top">
                          <button
                            onClick={() => setSearch("")}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black transition-colors"
                          >
                            <PiX className="w-4 h-4" />
                          </button>
                        </Tooltip>
                      )}
                    </div>

                    <div className="flex items-center gap-3 overflow-x-auto [&::-webkit-scrollbar]:hidden pb-1 sm:pb-0">
                      <div className="relative shrink-0">
                        <select 
                          value={timeFilter} 
                          onChange={(e) => setTimeFilter(e.target.value)}
                          className="appearance-none bg-white border border-zinc-200 text-zinc-600 text-[10px] font-bold uppercase tracking-widest px-4 py-3 pr-8 rounded-xl outline-none focus:border-black shadow-sm transition-colors cursor-pointer hover:bg-zinc-50"
                        >
                          {TIME_FILTERS.map(f => <option key={f} value={f}>{f}</option>)}
                        </select>
                        <PiCaretDown className="w-3 h-3 absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
                      </div>

                      <div className="flex gap-2">
                        {STATUS_FILTERS.map((status) => (
                          <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            title={`Filter orders by ${status}`}
                            className={`shrink-0 px-4 py-3 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 shadow-sm ${
                              statusFilter === status
                                ? "bg-black text-white"
                                : "bg-white border border-zinc-200 text-zinc-500 hover:bg-zinc-50"
                            }`}
                          >
                            {status}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Orders Error State */}
                  {ordersError && (
                    <div className="p-8 text-center text-red-500 text-sm font-medium">
                      Could not load your orders. Please refresh the page.
                    </div>
                  )}

                  {/* Orders List */}
                  {!ordersError && (
                    filteredOrders.length === 0 ? (
                      <div className="p-16 text-center">
                        {orders.length === 0 ? (
                          <>
                            <PiPackage className="w-16 h-16 text-zinc-200 mx-auto mb-4" />
                            <p className="text-zinc-500 mb-4 font-medium">You haven&apos;t placed any orders yet.</p>
                            <Link href="/" className="inline-block bg-black text-white text-xs font-bold uppercase tracking-widest px-6 py-3 rounded-full hover:bg-zinc-800 transition-colors shadow-sm">
                              Start Shopping
                            </Link>
                          </>
                        ) : (
                          <p className="text-zinc-500 font-medium">No orders match your search or filters.</p>
                        )}
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-100">
                        {filteredOrders.map((order) => {
                          const isExpanded = expandedOrder === order.id;
                          // Extract metadata and actual items
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
                                      <div className="flex flex-col sm:flex-row gap-6">
                                        <div className="flex-1">
                                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Shipping Information</h4>
                                          <p className="text-sm font-bold text-black mb-1">{order.customer_name}</p>
                                          <p className="text-sm text-zinc-600 font-medium">{order.shipping_address}</p>
                                          <p className="text-sm text-zinc-600 font-medium">{order.city}, PK</p>
                                          <p className="text-sm text-zinc-600 font-medium mt-1">{order.phone}</p>
                                        </div>
                                        <div className="flex-1">
                                          <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Payment Details</h4>
                                          <p className="text-sm font-bold text-black mb-1">
                                            {metaItem?.paymentMethod || "Cash on Delivery (COD)"}
                                          </p>
                                          {metaItem?.couponCode && (
                                            <div className="mt-3 bg-green-50 border border-green-200 rounded-xl p-3 inline-block">
                                              <p className="text-[11px] font-bold text-green-700 uppercase tracking-widest mb-0.5">Coupon Applied: {metaItem.couponCode}</p>
                                              <p className="text-[11px] text-green-600 font-bold uppercase tracking-widest">Discount: -Rs. {metaItem.discountAmount}</p>
                                            </div>
                                          )}
                                          {!metaItem?.couponCode && (
                                            <p className="text-sm text-zinc-500 font-medium mt-1">No coupon applied</p>
                                          )}
                                        </div>
                                      </div>
                                    </div>

                                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">
                                      Purchased Items
                                    </h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                      {realItems.map((item, idx) => (
                                        <div key={idx} className="flex gap-4 items-center bg-white border border-zinc-200 p-3 rounded-2xl shadow-sm">
                                          <div className="relative w-16 h-16 bg-zinc-50 rounded-xl overflow-hidden shrink-0 border border-zinc-100">
                                            <Image
                                              src={item.images?.[0] || "https://via.placeholder.com/100"}
                                              alt={item.name}
                                              fill
                                              sizes="64px"
                                              quality={90}
                                              className="object-cover"
                                            />
                                          </div>
                                          <div className="flex-1 min-w-0">
                                            <Link
                                              href={`/product/${item.slug}`}
                                              className="text-sm font-bold truncate text-black hover:underline block"
                                            >
                                              {item.name}
                                            </Link>
                                            {item.chosenColor && (
                                              <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-0.5">
                                                Color: {item.chosenColor}
                                              </p>
                                            )}
                                            <p className="text-xs font-medium text-zinc-500 mt-1">
                                              Qty: {item.quantity} × <span className="font-bold text-black">Rs. {item.discount_price || item.price}</span>
                                            </p>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </>
  );
}
