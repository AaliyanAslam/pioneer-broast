"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { PiTrash, PiPencil, PiCircleNotch } from "react-icons/pi";
import toast from "react-hot-toast";

export default function ProductsList({ onEditProduct }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      if (data.success) {
        setProducts(data.data);
      } else {
        toast.error("Failed to load products");
      }
    } catch (error) {
      toast.error("Error loading products");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const res = await fetch(`/api/products?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("Product deleted successfully");
        setProducts(products.filter(p => p.id !== id));
      } else {
        toast.error(data.message || "Failed to delete product");
      }
    } catch (error) {
      toast.error("Error deleting product");
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><PiCircleNotch className="w-10 h-10 animate-spin text-[#C0E212]" /></div>;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black">Manage Products</h2>
        <button onClick={fetchProducts} className="text-sm text-zinc-500 hover:text-black underline">Refresh</button>
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-zinc-50 border-b border-zinc-200 text-[13px] text-zinc-500">
                <th className="p-3 sm:p-4 font-medium w-16 sm:w-20">Image</th>
                <th className="p-3 sm:p-4 font-medium">Product Name</th>
                <th className="hidden md:table-cell p-3 sm:p-4 font-medium whitespace-nowrap">Category</th>
                <th className="p-3 sm:p-4 font-medium whitespace-nowrap">Price</th>
                <th className="hidden md:table-cell p-3 sm:p-4 font-medium whitespace-nowrap">Stock</th>
                <th className="p-3 sm:p-4 font-medium text-right whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {products.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-zinc-500">No products found.</td>
                </tr>
              ) : (
                products.map((product) => (
                  <tr key={product.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="p-3 sm:p-4">
                      <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-md overflow-hidden bg-zinc-100 border border-zinc-200">
                        <Image src={product.images?.[0] || "https://via.placeholder.com/100"} alt={product.name} fill className="object-cover" />
                      </div>
                    </td>
                    <td className="p-3 sm:p-4 min-w-[140px] sm:min-w-[200px]">
                      <p className="font-semibold text-[13px] text-black line-clamp-1">{product.name}</p>
                      <p className="text-[11px] text-zinc-400 line-clamp-1">{product.slug}</p>
                      
                      {/* Mobile Stock Status */}
                      <div className="mt-1.5 md:hidden">
                        {product.stock > 0 ? (
                          <span className="bg-green-50 text-green-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-green-200">{product.stock} in stock</span>
                        ) : (
                          <span className="bg-red-50 text-red-700 px-1.5 py-0.5 rounded text-[10px] font-bold border border-red-200">Out of stock</span>
                        )}
                      </div>
                    </td>
                    <td className="hidden md:table-cell p-3 sm:p-4 text-[13px] text-zinc-600 whitespace-nowrap">{product.category}</td>
                    <td className="p-3 sm:p-4 text-[13px] text-black font-bold whitespace-nowrap">Rs. {product.price}</td>
                    <td className="hidden md:table-cell p-3 sm:p-4 whitespace-nowrap">
                      {product.stock > 0 ? (
                        <span className="bg-green-50 text-green-700 px-2 py-1 rounded text-[11px] font-bold border border-green-200">{product.stock} in stock</span>
                      ) : (
                        <span className="bg-red-50 text-red-700 px-2 py-1 rounded text-[11px] font-bold border border-red-200">Out of stock</span>
                      )}
                    </td>
                    <td className="p-3 sm:p-4 text-right">
                      <div className="flex justify-end gap-1 sm:gap-2">
                        <button onClick={() => onEditProduct && onEditProduct(product)} className="p-1.5 sm:p-2 text-zinc-400 hover:text-black transition-colors rounded hover:bg-zinc-100">
                          <PiPencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleDelete(product.id)} className="p-1.5 sm:p-2 text-zinc-400 hover:text-red-500 transition-colors rounded hover:bg-red-50">
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
