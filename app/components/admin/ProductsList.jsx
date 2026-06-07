"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { PiTrash, PiPencil, PiCircleNotch, PiMagnifyingGlass } from "react-icons/pi";
import toast from "react-hot-toast";

export default function ProductsList({ onEditItem }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/menu");
      const data = await res.json();
      if (data.success) {
        setItems(data.data);
      } else {
        toast.error("Failed to load menu items");
      }
    } catch (error) {
      toast.error("Error loading menu items");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this menu item?")) return;

    try {
      const res = await fetch(`/api/menu?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("Item deleted successfully");
        setItems(items.filter(i => i.id !== id));
      } else {
        toast.error(data.message || "Failed to delete item");
      }
    } catch (error) {
      toast.error("Error deleting item");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><PiCircleNotch className="w-10 h-10 animate-spin text-[#C0E212]" /></div>;
  }

  const filteredItems = items.filter(item => 
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    item.category?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-black">Manage Menu</h2>
        
        <div className="flex w-full sm:w-auto items-center gap-3">
          <div className="relative w-full sm:w-64">
            <PiMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-zinc-200 rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-black focus:ring-1 focus:ring-black"
            />
          </div>
          <button onClick={fetchItems} className="text-sm text-zinc-500 hover:text-black underline shrink-0">Refresh</button>
        </div>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[13px] text-zinc-500">
                <th className="p-3 sm:p-4 font-medium w-16 sm:w-20">Image</th>
                <th className="p-3 sm:p-4 font-medium">Item Name</th>
                <th className="hidden md:table-cell p-3 sm:p-4 font-medium whitespace-nowrap">Category</th>
                <th className="p-3 sm:p-4 font-medium whitespace-nowrap">Price</th>
                <th className="p-3 sm:p-4 font-medium text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-zinc-500">No menu items found.</td>
                </tr>
              ) : (
                filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200">
                        <Image src={item.image_url || "https://via.placeholder.com/100"} alt={item.name} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 min-w-[140px] sm:min-w-[200px]">
                      <p className="font-semibold text-[13px] text-black line-clamp-1">{item.name} {item.is_spicy && "ðŸŒ¶ï¸"}</p>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{item.slug}</p>
                      
                      {/* Mobile Status */}
                      <div className="mt-1.5 md:hidden">
                        {item.is_available ? (
                          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-green-200">Available</span>
                        ) : (
                          <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200">Disabled</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell p-3 sm:p-4 text-[13px] text-zinc-600 whitespace-nowrap">{item.category}</td>
                    <td className="p-3 sm:p-4 text-[13px] text-black font-bold whitespace-nowrap">
                      {item.discount_price && item.discount_price < item.price ? (
                        <div className="flex flex-col">
                          <span className="text-[10px] text-zinc-400 line-through font-normal">Rs. {item.price}</span>
                          <span className="text-[#ff1900]">Rs. {item.discount_price}</span>
                        </div>
                      ) : (
                        <span>Rs. {item.price}</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button onClick={() => onEditItem && onEditItem(item)} className="p-1.5 sm:p-2 text-zinc-400 hover:text-black transition-colors rounded hover:bg-zinc-100">
                          <PiPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(item.id)} className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-500 transition-colors rounded hover:bg-red-50">
                          <PiTrash className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
