"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { PiTrash, PiCircleNotch, PiTicket } from "react-icons/pi";

export default function CouponsManager() {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    discount_type: "free_delivery",
    discount_value: 0,
    usage_limit: "",
  });

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons");
      const data = await res.json();
      if (data.success) {
        setCoupons(data.data);
      } else {
        toast.error("Failed to load coupons");
      }
    } catch (error) {
      toast.error("Error loading coupons");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleGenerate = () => {
    const randomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
    let prefix = "PION";
    if (formData.discount_type === "free_delivery") prefix = "FREEDEL";
    if (formData.discount_type === "percentage") prefix = "DISC";
    
    setFormData({ ...formData, code: `${prefix}-${randomCode}` });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.code) return toast.error("Coupon code is required");
    
    setGenerating(true);
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          discount_value: Number(formData.discount_value) || 0,
          usage_limit: formData.usage_limit ? Number(formData.usage_limit) : null
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Coupon created successfully!");
        setCoupons([data.data, ...coupons]);
        setFormData({
          code: "",
          discount_type: "free_delivery",
          discount_value: 0,
          usage_limit: "",
        });
      } else {
        toast.error(data.message || "Failed to create coupon");
      }
    } catch (error) {
      toast.error("Error creating coupon");
    } finally {
      setGenerating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this coupon?")) return;

    try {
      const res = await fetch(`/api/coupons?id=${id}`, { method: "DELETE" });
      const data = await res.json();

      if (data.success) {
        toast.success("Coupon deleted successfully");
        setCoupons(coupons.filter((c) => c.id !== id));
      } else {
        toast.error(data.message || "Failed to delete coupon");
      }
    } catch (error) {
      toast.error("Error deleting coupon");
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-black flex items-center gap-2">
          <PiTicket className="w-6 h-6 text-[#C0E212]" /> Manage Coupons
        </h2>
        <button onClick={fetchCoupons} className="text-sm text-zinc-500 hover:text-black underline">Refresh</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Create Coupon Form */}
        <div className="lg:col-span-1 bg-white border border-zinc-200 rounded-xl p-5 shadow-sm h-fit">
          <h3 className="font-bold text-black mb-4">Create New Coupon</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">Discount Type</label>
              <select
                name="discount_type"
                value={formData.discount_type}
                onChange={handleChange}
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#C0E212]"
              >
                <option value="free_delivery">Free Delivery</option>
                <option value="percentage">Percentage Discount (%)</option>
                <option value="fixed">Fixed Amount Discount (Rs)</option>
              </select>
            </div>

            {formData.discount_type !== "free_delivery" && (
              <div>
                <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                  Discount Value {formData.discount_type === "percentage" ? "(%)" : "(Rs)"}
                </label>
                <input
                  type="number"
                  name="discount_value"
                  value={formData.discount_value}
                  onChange={handleChange}
                  required
                  min="1"
                  className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#C0E212]"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1 justify-between">
                <span>Coupon Code</span>
                <button type="button" onClick={handleGenerate} className="text-[#C0E212] hover:underline">Auto Generate</button>
              </label>
              <input
                type="text"
                name="code"
                value={formData.code}
                onChange={handleChange}
                required
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm uppercase focus:outline-none focus:border-[#C0E212]"
                placeholder="e.g. FREEDEL50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-zinc-500 uppercase mb-1">
                Usage Limit (Optional)
              </label>
              <input
                type="number"
                name="usage_limit"
                value={formData.usage_limit}
                onChange={handleChange}
                min="1"
                placeholder="Leave blank for unlimited"
                className="w-full border border-zinc-200 rounded-lg p-2.5 text-sm focus:outline-none focus:border-[#C0E212]"
              />
            </div>

            <button
              type="submit"
              disabled={generating}
              className="w-full bg-black text-white font-bold py-3 rounded-lg hover:bg-zinc-800 transition-colors flex items-center justify-center disabled:opacity-50"
            >
              {generating ? <PiCircleNotch className="w-5 h-5 animate-spin" /> : "Create Coupon"}
            </button>
          </form>
        </div>

        {/* Coupons List */}
        <div className="lg:col-span-2 bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm">
          {loading ? (
             <div className="flex justify-center p-12"><PiCircleNotch className="w-10 h-10 animate-spin text-[#C0E212]" /></div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[600px]">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-200 text-[13px] text-zinc-500">
                    <th className="p-4 font-medium">Code</th>
                    <th className="p-4 font-medium">Type</th>
                    <th className="p-4 font-medium">Value</th>
                    <th className="p-4 font-medium">Usage</th>
                    <th className="p-4 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {coupons.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-zinc-500">No coupons created yet.</td>
                    </tr>
                  ) : (
                    coupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-zinc-50 transition-colors text-sm">
                        <td className="p-4 font-bold text-black uppercase tracking-wide">
                          {coupon.code}
                          {!coupon.is_active && <span className="ml-2 text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full">Inactive</span>}
                        </td>
                        <td className="p-4 text-zinc-600">
                          {coupon.discount_type === "free_delivery" && "Free Delivery"}
                          {coupon.discount_type === "percentage" && "Percentage"}
                          {coupon.discount_type === "fixed" && "Fixed Amount"}
                        </td>
                        <td className="p-4 font-bold text-[#9ab50e]">
                          {coupon.discount_type === "free_delivery" ? "-" : 
                           coupon.discount_type === "percentage" ? `${coupon.discount_value}%` : 
                           `Rs. ${coupon.discount_value}`}
                        </td>
                        <td className="p-4 text-zinc-500 text-xs">
                          {coupon.times_used} / {coupon.usage_limit || "∞"}
                        </td>
                        <td className="p-4 text-right">
                          <button onClick={() => handleDelete(coupon.id)} className="p-2 text-zinc-400 hover:text-red-500 transition-colors rounded hover:bg-red-50">
                            <PiTrash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
