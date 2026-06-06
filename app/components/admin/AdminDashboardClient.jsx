"use client";
import { useState, useEffect } from "react";
import ProductsList from "./ProductsList";
import OrdersList from "./OrdersList";
import AddMenuItemForm from "./AddMenuItemForm";
import AnalyticsDashboard from "./AnalyticsDashboard";
import CouponsManager from "./CouponsManager";
import { PiPackage, PiTote, PiPlusCircle, PiSquaresFour, PiSignOut, PiList, PiX, PiChartBar, PiTicket } from "react-icons/pi";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";

export default function AdminDashboardClient() {
  const [activeTab, setActiveTab] = useState("analytics");
  const [editingItem, setEditingItem] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleEditItem = (item) => {
    setEditingItem(item);
    setActiveTab("add");
    setIsSidebarOpen(false); // Close sidebar on mobile
  };

  const handleItemSaved = () => {
    setEditingItem(null);
    setActiveTab("products");
  };

  const handleTabSwitch = (tab) => {
    if (tab !== "add") {
      setEditingItem(null);
    }
    setActiveTab(tab);
    setIsSidebarOpen(false); // Close sidebar on mobile when switching tabs
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col md:flex-row text-black">
      
      {/* Mobile Header (Visible only on mobile) */}
      <div className="md:hidden bg-white border-b border-zinc-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-sm">
        <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
          <Image src="/brandlogo.webp" alt="Pioneer Broast Admin" width={140} height={40} className="object-contain h-8 w-auto" />
        </Link>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 text-zinc-600 hover:text-black transition-colors rounded-md bg-zinc-100"
        >
          {isSidebarOpen ? <PiX className="w-5 h-5" /> : <PiList className="w-5 h-5" />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          onClick={() => setIsSidebarOpen(false)} 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" 
        />
      )}

      {/* Left Sidebar */}
      <aside className={`w-64 bg-white border-r border-zinc-200 flex flex-col fixed h-full z-50 transition-transform duration-300 ease-in-out ${isSidebarOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}>
        <div className="p-6 border-b border-zinc-200 hidden md:flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 active:scale-95 transition-transform">
            <Image src="/brandlogo.webp" alt="Pioneer Broast Admin" width={180} height={50} className="object-contain h-10 w-auto" />
          </Link>
        </div>

        {/* Mobile sidebar header */}
        <div className="p-6 border-b border-zinc-200 md:hidden flex items-center justify-between">
          <span className="font-bold text-lg">Menu</span>
          <button onClick={() => setIsSidebarOpen(false)} className="p-2 text-zinc-400 hover:text-black">
            <PiX className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
          <button
            onClick={() => handleTabSwitch("analytics")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "analytics" 
                ? "bg-black text-white shadow-md" 
                : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            }`}
          >
            <PiChartBar className="w-5 h-5" /> 
            Analytics
          </button>

          <button
            onClick={() => handleTabSwitch("products")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "products" 
                ? "bg-black text-white shadow-md" 
                : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            }`}
          >
            <PiPackage className="w-5 h-5" /> 
            Manage Menu
          </button>
          
          <button
            onClick={() => handleTabSwitch("orders")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "orders" 
                ? "bg-black text-white shadow-md" 
                : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            }`}
          >
            <PiTote className="w-5 h-5" /> 
            View Orders
          </button>

          <button
            onClick={() => handleTabSwitch("coupons")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "coupons" 
                ? "bg-black text-white shadow-md" 
                : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            }`}
          >
            <PiTicket className="w-5 h-5" /> 
            Coupons
          </button>
          
          <button
            onClick={() => handleTabSwitch("add")}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-all ${
              activeTab === "add" 
                ? "bg-black text-white shadow-md" 
                : "text-zinc-600 hover:bg-zinc-100 hover:text-black"
            }`}
          >
            <PiPlusCircle className="w-5 h-5" /> 
            {editingItem ? "Edit Menu Item" : "Add Menu Item"}
          </button>

        </nav>

        <div className="p-4 border-t border-zinc-200 pb-8 md:pb-4">
          <Link href="/" className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors w-full text-left">
            <PiSignOut className="w-5 h-5" />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 min-h-screen">
        <div className="p-4 sm:p-6 md:p-8 max-w-420 mx-auto w-full">
          {activeTab === "analytics" && <AnalyticsDashboard onNavigate={handleTabSwitch} />}
          {activeTab === "products" && <ProductsList onEditItem={handleEditItem} />}
          {activeTab === "orders" && <OrdersList />}
          {activeTab === "coupons" && <CouponsManager />}
          {activeTab === "add" && <AddMenuItemForm initialData={editingItem} onItemAdded={handleItemSaved} />}
        </div>
      </main>

    </div>
  );
}
