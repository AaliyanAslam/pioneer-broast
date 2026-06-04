"use client";
import { useState, useEffect } from "react";
import ImageUploader from "@/app/components/ui/ImageUploader";
import toast from "react-hot-toast";
import { AVAILABLE_COLORS } from "@/app/lib/colors";
import { PiX, PiCaretLeft, PiCaretRight, PiPlus } from "react-icons/pi";

export default function AddProductForm({ initialData, onProductAdded }) {
  const [loading, setLoading] = useState(false);
  const [colorSearchQuery, setColorSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    short_des: "",
    description: "",
    price: "",
    discount_price: "",
    category: "Earbuds",
    stock: 10,
    images: [],
    colors: [],
    highlights: [],
    is_active: true, // Matching schema
  });

  const handleColorToggle = (colorName) => {
    setFormData((prev) => {
      const isSelected = prev.colors.includes(colorName);
      if (isSelected) {
        return { ...prev, colors: prev.colors.filter((c) => c !== colorName) };
      } else {
        return { ...prev, colors: [...prev.colors, colorName] };
      }
    });
  };

  // Populate form if we are editing an existing product
  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        short_des: initialData.short_des || "",
        description: initialData.description || "",
        price: initialData.price || "",
        discount_price: initialData.discount_price || "",
        category: initialData.category || "Earbuds",
        stock: initialData.stock ?? 10,
        images: initialData.images || [],
        colors: initialData.colors || [],
        highlights: initialData.highlights || [],
        is_active: initialData.is_active ?? true,
      });
    } else {
      // Reset if not editing
      setFormData({
        name: "",
        short_des: "",
        description: "",
        price: "",
        discount_price: "",
        category: "Earbuds",
        stock: 10,
        images: [],
        colors: [],
        highlights: [],
        is_active: true,
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

  const handleImagesUploaded = (urls) => {
    setFormData({ ...formData, images: [...formData.images, ...urls] });
  };

  const handleRemoveImage = (indexToRemove) => {
    setFormData({
      ...formData,
      images: formData.images.filter((_, idx) => idx !== indexToRemove),
    });
  };

  const moveImageLeft = (index) => {
    if (index === 0) return;
    const newImages = [...formData.images];
    const temp = newImages[index - 1];
    newImages[index - 1] = newImages[index];
    newImages[index] = temp;
    setFormData({ ...formData, images: newImages });
  };

  const moveImageRight = (index) => {
    if (index === formData.images.length - 1) return;
    const newImages = [...formData.images];
    const temp = newImages[index + 1];
    newImages[index + 1] = newImages[index];
    newImages[index] = temp;
    setFormData({ ...formData, images: newImages });
  };

  const handleAddHighlight = () => {
    setFormData((prev) => ({ ...prev, highlights: [...prev.highlights, ""] }));
  };

  const handleHighlightChange = (index, value) => {
    const newHighlights = [...formData.highlights];
    newHighlights[index] = value;
    setFormData({ ...formData, highlights: newHighlights });
  };

  const handleRemoveHighlight = (index) => {
    setFormData((prev) => ({
      ...prev,
      highlights: prev.highlights.filter((_, idx) => idx !== index),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const isEditing = !!initialData;
      const method = isEditing ? "PUT" : "POST";
      const bodyPayload = {
        ...formData,
        price: parseFloat(formData.price),
        discount_price: formData.discount_price
          ? parseFloat(formData.discount_price)
          : null,
        stock: parseInt(formData.stock),
      };

      if (isEditing) {
        bodyPayload.id = initialData.id;
      }

      const res = await fetch("/api/products", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();

      if (data.success) {
        toast.success(
          isEditing
            ? "Product successfully updated!"
            : "Product successfully added to store!",
        );
        if (!isEditing) {
          setFormData({
            name: "",
            short_des: "",
            description: "",
            price: "",
            discount_price: "",
            category: "Earbuds",
            stock: 10,
            images: [],
            colors: [],
            highlights: [],
            is_active: true,
          });
        }
        if (onProductAdded) onProductAdded();
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
        {initialData ? "Edit Product" : "Add New Product"}
      </h2>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 bg-white border border-zinc-200 p-4 sm:p-6 rounded-xl shadow-[0_2px_10px_-4px_rgba(0,0,0,0.05)]"
      >
        {/* Row 1: Name */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
          <div className="sm:col-span-12">
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Product Name
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

          {/* Row 2: Stats */}
          <div className="sm:col-span-3">
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            >
              <option value="Earbuds">Earbuds</option>
              <option value="Smartwatches">Smartwatches</option>
              <option value="Accessories">Accessories</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Stock Qty
            </label>
            <input
              required
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all"
            />
          </div>

          <div className="sm:col-span-3">
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

          <div className="sm:col-span-3">
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

        {/* Active Toggle */}
        <div className="flex items-center gap-2 p-2.5 border border-zinc-200 rounded-md bg-zinc-50 w-full sm:w-max">
          <input
            type="checkbox"
            id="is_active"
            name="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 accent-zinc-900 cursor-pointer rounded"
          />
          <label
            htmlFor="is_active"
            className="text-[13px] font-medium text-zinc-800 cursor-pointer select-none"
          >
            Product is Active (Visible on store)
          </label>
        </div>

        {/* Descriptions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Short Description
            </label>
            <input
              type="text"
              name="short_des"
              value={formData.short_des}
              onChange={handleChange}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
              placeholder="Catchy one-liner"
            />
          </div>
          <div>
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Product Highlights
            </label>
            <div className="space-y-2">
              {formData.highlights.map((highlight, index) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={highlight}
                    onChange={(e) => handleHighlightChange(index, e.target.value)}
                    className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-1.5 text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
                    placeholder={`Highlight ${index + 1}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveHighlight(index)}
                    className="text-zinc-400 hover:text-red-500 hover:bg-red-50 px-2 rounded-md transition-colors"
                  >
                    <PiX className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={handleAddHighlight}
                className="flex items-center gap-1.5 text-[12px] text-zinc-500 font-semibold mt-1 hover:text-zinc-900 transition-colors"
              >
                <PiPlus className="w-5 h-5" /> Add Highlight
              </button>
            </div>
          </div>
          <div className="sm:col-span-2">
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Detailed Description
            </label>
            <textarea
              rows={3}
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all resize-none placeholder:text-zinc-400"
              placeholder="Full specs, details, etc."
            />
          </div>
        </div>

        {/* Colors */}
        <div>
          <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
            Available Colors
          </label>
          <div className="mb-2 max-w-sm">
            <input
              type="text"
              placeholder="Search colors..."
              value={colorSearchQuery}
              onChange={(e) => setColorSearchQuery(e.target.value)}
              className="w-full bg-transparent border border-zinc-200 rounded-md px-3 py-1.5 text-[13px] text-zinc-900 focus:outline-none focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 transition-all placeholder:text-zinc-400"
            />
          </div>
          <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 border border-zinc-100 rounded-md bg-zinc-50/50 custom-scrollbar">
            {AVAILABLE_COLORS.filter((c) =>
              c.name.toLowerCase().includes(colorSearchQuery.toLowerCase()),
            ).map((color) => {
              const isSelected = formData.colors.includes(color.name);
              return (
                <button
                  key={color.name}
                  type="button"
                  onClick={() => handleColorToggle(color.name)}
                  className={`flex items-center gap-1.5 px-2 py-1 rounded-md border text-[11px] font-semibold transition-all ${
                    isSelected
                      ? "border-zinc-900 bg-zinc-900 text-white shadow-sm"
                      : "border-zinc-200 bg-white text-zinc-600 hover:border-zinc-400"
                  }`}
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full border border-zinc-300 shadow-[inset_0_1px_2px_rgba(0,0,0,0.1)]"
                    style={{ backgroundColor: color.hex }}
                  ></span>
                  {color.name}
                </button>
              );
            })}
            {AVAILABLE_COLORS.filter((c) =>
              c.name.toLowerCase().includes(colorSearchQuery.toLowerCase()),
            ).length === 0 && (
              <p className="text-[11px] text-zinc-400 w-full text-center py-2">
                No colors found.
              </p>
            )}
          </div>
        </div>

        {/* Existing Images Display */}
        {formData.images.length > 0 && (
          <div>
            <label className="block text-[13px] font-semibold text-zinc-900 mb-1.5">
              Current Images <span className="text-[11px] text-zinc-400 font-normal ml-1">(Main cover is first)</span>
            </label>
            <div className="flex gap-3 overflow-x-auto py-1">
              {formData.images.map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-20 h-20 shrink-0 rounded-md overflow-hidden border border-zinc-200 group bg-zinc-50"
                >
                  <div className="absolute top-0 left-0 bg-black/60 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-br-md z-10">
                    {idx + 1}
                  </div>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img}
                    alt="Product"
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(idx)}
                    className="absolute top-1 right-1 bg-white p-0.5 rounded-sm shadow-sm text-zinc-400 hover:text-red-500 transition-colors z-10"
                  >
                    <PiX className="w-3 h-3" />
                  </button>

                  {/* Reorder Overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-between px-1">
                    <button
                      type="button"
                      onClick={() => moveImageLeft(idx)}
                      disabled={idx === 0}
                      className="bg-white/90 text-zinc-900 p-1 rounded-sm disabled:opacity-0 hover:bg-white transition-colors"
                    >
                      <PiCaretLeft className="w-5 h-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveImageRight(idx)}
                      disabled={idx === formData.images.length - 1}
                      className="bg-white/90 text-zinc-900 p-1 rounded-sm disabled:opacity-0 hover:bg-white transition-colors"
                    >
                      <PiCaretRight className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <ImageUploader onImagesUploaded={handleImagesUploaded} />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-zinc-900 text-white font-semibold py-2.5 rounded-md hover:bg-zinc-800 active:scale-[0.99] transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm mt-4"
        >
          {loading
            ? "Saving..."
            : initialData
              ? "Update Product"
              : "Publish Product"}
        </button>
      </form>
    </div>
  );
}
