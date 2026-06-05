"use client";
import { useState, useEffect } from "react";
import ImageUploader from "@/app/components/ui/ImageUploader";
import toast from "react-hot-toast";
import { PiX } from "react-icons/pi";

export default function AddMenuItemForm({ initialData, onItemAdded }) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    price: "",
    discount_price: "",
    category: "Broast",
    image_url: "",
    is_spicy: false,
    is_available: true,
  });

  // Populate form if we are editing an existing item
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        description: initialData.description || "",
        price: initialData.price || "",
        discount_price: initialData.discount_price || "",
        category: initialData.category || "Broast",
        image_url: initialData.image_url || "",
        is_spicy: initialData.is_spicy ?? false,
        is_available: initialData.is_available ?? true,
      });
    } else {
      // Reset if not editing
      setFormData({
        name: "",
        description: "",
        price: "",
        discount_price: "",
        category: "Broast",
        image_url: "",
        is_spicy: false,
        is_available: true,
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };

  const handleImageUploaded = (url) => {
    setFormData({ ...formData, image_url: url });
  };

  const handleRemoveImage = () => {
    setFormData({ ...formData, image_url: "" });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEditing = !!initialData;
      const method = isEditing ? "PUT" : "POST";

      // Auto-generate slug from name
      const slug = formData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)+/g, "");

      const bodyPayload = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price
          ? parseFloat(formData.discount_price)
          : null,
        slug,
      };

      if (isEditing) {
        bodyPayload.id = initialData.id;
      }

      const res = await fetch("/api/menu", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          isEditing
            ? "Menu item successfully updated!"
            : "Menu item successfully added to store!",
        );
        if (!isEditing) {
          setFormData({
            name: "",
            description: "",
            price: "",
            discount_price: "",
            category: "Broast",
            image_url: "",
            is_spicy: false,
            is_available: true,
          });
        }
        if (onItemAdded) onItemAdded();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Something went wrong!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-420 mx-auto pb-10">
      <h2 className="text-xl font-bold tracking-tight mb-5 text-zinc-900">
        {initialData ? "Edit Menu Item" : "Add New Menu Item"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white border border-zinc-200 p-4 sm:p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
      >
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-12">
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Item Name
            </label>
            <input
              required
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
              placeholder="e.g. Zinger Burger"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            >
              <option value="Most Popular">Most Popular</option>
              <option value="Broast">Broast</option>
              <option value="Burgers">Burgers</option>
              <option value="Deals">Deals</option>
              <option value="Drinks">Drinks</option>
              <option value="Sides">Sides</option>
            </select>
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Regular Price
            </label>
            <input
              required
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />
          </div>

          <div className="sm:col-span-4">
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Discount Price
            </label>
            <input
              type="number"
              name="discount_price"
              value={formData.discount_price}
              onChange={handleChange}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
              placeholder="Optional"
            />
          </div>
        </div>

        {/* Toggles */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 p-2.5 border border-zinc-200 rounded-md bg-zinc-50 flex-1 sm:flex-none">
            <input
              type="checkbox"
              id="is_available"
              name="is_available"
              checked={formData.is_available}
              onChange={handleChange}
              className="w-4 h-4 accent-[#e63946] cursor-pointer rounded"
            />
            <label
              htmlFor="is_available"
              className="text-[13px] font-medium text-zinc-800 cursor-pointer select-none"
            >
              Is Available
            </label>
          </div>

          <div className="flex items-center gap-2 p-2.5 border border-zinc-200 rounded-md bg-zinc-50 flex-1 sm:flex-none">
            <input
              type="checkbox"
              id="is_spicy"
              name="is_spicy"
              checked={formData.is_spicy}
              onChange={handleChange}
              className="w-4 h-4 accent-[#e63946] cursor-pointer rounded"
            />
            <label
              htmlFor="is_spicy"
              className="text-[13px] font-medium text-zinc-800 cursor-pointer select-none flex items-center gap-1"
            >
              🌶️ Is Spicy
            </label>
          </div>
        </div>

        <div>
          <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
            Description
          </label>
          <textarea
            rows={3}
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all resize-none placeholder:text-zinc-400"
            placeholder="Ingredients, sizes, etc."
          />
        </div>

        {/* Image Display */}
        {formData.image_url && (
          <div>
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Current Image
            </label>
            <div className="relative w-32 h-32 rounded-md overflow-hidden border border-zinc-200 bg-zinc-50">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={formData.image_url}
                alt="Item"
                className="w-full h-full object-cover"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute top-1 right-1 bg-white p-1 rounded-sm shadow-sm text-zinc-400 hover:text-red-500 transition-colors z-10"
              >
                <PiX className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        <div className="pt-2">
          {!formData.image_url && (
            <ImageUploader onImageUploaded={handleImageUploaded} />
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 text-white font-semibold py-2.5 rounded-md hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm mt-4"
        >
          {loading
            ? "Saving..."
            : initialData
              ? "Update Menu Item"
              : "Publish Menu Item"}
        </button>
      </form>
    </div>
  );
}
