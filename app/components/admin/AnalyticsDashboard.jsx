"use client";
import React, { useMemo, useState } from "react";
import useSWR from "swr";
import fetcher from "@/app/lib/fetcher";
import { PiCircleNotch, PiTrendUp, PiCurrencyDollar, PiTote, PiPackage, PiClock, PiUsers } from "react-icons/pi";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar
} from "recharts";

export default function AnalyticsDashboard({ onNavigate }) {
  const { data: orders = [], isLoading: loadingOrders } = useSWR("/api/orders", fetcher, { refreshInterval: 5000 });
  const { data: products = [], isLoading: loadingProducts } = useSWR("/api/products", fetcher, { refreshInterval: 30000 });

  const [selectedDateStr, setSelectedDateStr] = useState(new Date().toISOString().split('T')[0]);

  const metrics = useMemo(() => {
    if (!orders.length) return null;

    const targetDate = new Date(selectedDateStr);
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const sevenDaysAgo = new Date(endOfDay.getTime() - 7 * 24 * 60 * 60 * 1000);

    let selectedDayRevenue = 0;
    let selectedDayOrders = 0;
    let pendingOrders = 0;

    // Daily revenue for the 7 days ending on target date
    const dailyMap = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date(endOfDay.getTime() - i * 24 * 60 * 60 * 1000);
      dailyMap[d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })] = 0;
    }

    const productSales = {};

    orders.forEach((order) => {
      const orderDate = new Date(order.created_at);
      const amount = Number(order.total_amount) || 0;
      const isSelectedDay = orderDate >= startOfDay && orderDate <= endOfDay;

      if (order.status === "pending" || order.status === "processing") {
        pendingOrders++;
      }

      if (order.status !== "failed" && order.status !== "cancelled") {
        if (isSelectedDay) {
          selectedDayRevenue += amount;
          selectedDayOrders++;

          if (order.items) {
            order.items.forEach(item => {
              if (!productSales[item.name]) productSales[item.name] = 0;
              productSales[item.name] += item.quantity || 1;
            });
          }
        }

        if (orderDate > sevenDaysAgo && orderDate <= endOfDay) {
          const dayStr = orderDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
          if (dailyMap[dayStr] !== undefined) {
            dailyMap[dayStr] += amount;
          }
        }
      }
    });

    const revenueChartData = Object.keys(dailyMap).map(day => ({
      name: day,
      revenue: dailyMap[day]
    }));

    const topProducts = Object.keys(productSales)
      .map(name => ({ name: name.length > 15 ? name.substring(0, 15) + "..." : name, sales: productSales[name] }))
      .sort((a, b) => b.sales - a.sales)
      .slice(0, 5);

    return {
      selectedDayRevenue,
      selectedDayOrders,
      pendingOrders,
      revenueChartData,
      topProducts
    };
  }, [orders, selectedDateStr]);

  if (loadingOrders || loadingProducts) {
    return (
      <div className="flex justify-center items-center h-64">
        <PiCircleNotch className="w-10 h-10 animate-spin text-[#C0E212]" />
      </div>
    );
  }

  if (!metrics) {
    return <div className="text-center p-12 text-zinc-500">No data available yet.</div>;
  }

  const StatCard = ({ title, value, subtext, icon: Icon, trend, targetTab }) => (
    <div 
      onClick={() => targetTab && onNavigate && onNavigate(targetTab)}
      className={`bg-white border border-zinc-200 p-5 rounded-xl shadow-sm flex flex-col justify-between ${targetTab ? 'cursor-pointer hover:border-zinc-300 hover:shadow-md transition-all active:scale-[0.98]' : ''}`}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <h3 className="text-2xl font-semibold text-black mt-1">{value}</h3>
        </div>
        <div className="p-2 bg-zinc-50 rounded-lg group-hover:bg-zinc-100 transition-colors">
          <Icon className="w-5 h-5 text-zinc-600" />
        </div>
      </div>
      {subtext && (
        <div className="flex items-center gap-1.5 text-xs font-medium">
          {trend === "up" && <PiTrendUp className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1 text-emerald-500" />}
          {trend === "neutral" && <PiClock className="w-3.5 h-3.5 text-amber-500" />}
          <span className={trend === "up" ? "text-emerald-600" : "text-amber-600"}>
            {subtext}
          </span>
        </div>
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-end mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-black mb-1">Analytics Dashboard</h2>
          <p className="text-sm text-zinc-500">Overview of your store's performance for the selected date.</p>
        </div>
        <div className="flex items-center gap-3 bg-white border border-zinc-200 p-2 rounded-xl shadow-sm">
          <label className="text-xs font-bold text-zinc-500 uppercase tracking-widest ml-2">Date:</label>
          <input 
            type="date" 
            value={selectedDateStr}
            onChange={(e) => setSelectedDateStr(e.target.value)}
            className="bg-zinc-50 border border-zinc-200 rounded-lg px-3 py-1.5 text-sm font-bold text-black focus:outline-none focus:border-black cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 group">
        <StatCard 
          title="Revenue (Selected Day)" 
          value={`Rs. ${metrics.selectedDayRevenue.toLocaleString()}`} 
          icon={PiCurrencyDollar}
          targetTab="orders"
        />
        <StatCard 
          title="Orders (Selected Day)" 
          value={metrics.selectedDayOrders} 
          icon={PiTote}
          targetTab="orders"
        />
        <StatCard 
          title="Active Orders (Overall)" 
          value={metrics.pendingOrders} 
          subtext="Pending / Processing"
          icon={PiClock}
          targetTab="orders"
        />
        <StatCard 
          title="Total Products" 
          value={products.length} 
          subtext="Active inventory"
          icon={PiPackage}
          targetTab="products"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Revenue Area Chart */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 p-5 rounded-xl shadow-sm">
          <h3 className="text-[15px] font-semibold text-black mb-6">Revenue (Last 7 Days)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={metrics.revenueChartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#18181b" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#18181b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e4e4e7" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#71717a' }}
                  tickFormatter={(val) => `Rs ${val >= 1000 ? (val/1000).toFixed(0) + 'k' : val}`}
                  width={60}
                />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}
                  labelStyle={{ fontWeight: 'bold', color: '#18181b' }}
                  formatter={(value) => [`Rs. ${value.toLocaleString()}`, 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#18181b" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Products Bar Chart */}
        <div className="bg-white border border-zinc-200 p-4 sm:p-5 rounded-xl shadow-sm">
          <h3 className="text-[15px] font-semibold text-black mb-6">Top Selling Products</h3>
          <div className="h-[300px] w-full flex flex-col justify-center">
            {metrics.topProducts.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.topProducts} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e4e4e7" />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 11, fill: '#18181b', fontWeight: 500 }}
                    width={80}
                  />
                  <Tooltip 
                    cursor={{fill: '#f4f4f5'}}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #e4e4e7', fontSize: '12px' }}
                    formatter={(value) => [value, 'Units Sold']}
                  />
                  <Bar dataKey="sales" fill="#18181b" radius={[0, 4, 4, 0]} barSize={20} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-zinc-500 text-center w-full">No sales data yet.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
