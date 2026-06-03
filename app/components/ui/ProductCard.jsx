"use client";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/app/lib/store";
import toast from "react-hot-toast";
import { AVAILABLE_COLORS } from "@/app/lib/colors";

export default function ProductCard({ product }) {
  // Use our DB's images or a fallback
  const images = product.images?.length > 0 ? product.images : ["https://via.placeholder.com/600"];
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || null);
  const { addToCart } = useCartStore();
  const segments = Array.from({ length: 9 });

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) return;

    setIsAdding(true);

    const productToAdd = {
      ...product,
      chosenColor: selectedColor,
    };

    const success = addToCart(productToAdd);
    if (success) {
      toast.success(`${product.name} ${selectedColor ? `(${selectedColor}) ` : ''}added to cart!`);
    }

    setTimeout(() => {
      setIsAdding(false);
    }, 900);
  };

  const hasDiscount = product.discount_price && product.discount_price < product.price;

  return (
    <Link
      href={`/product/${product.slug}`}
      className="product-card group block"
    >
      {/* Container Block */}
      <div className="relative aspect-square w-full overflow-hidden bg-zinc-100 rounded-lg border border-zinc-200 transition-colors duration-300 group-hover:border-zinc-300">
        <Image
          src={images[activeImageIndex] || images[0]}
          alt={product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          quality={100}
          className="object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
        />

        {/* Hover Image Grid Segments */}
        <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 z-10">
          {segments.map((_, i) => (
            <div
              key={i}
              onMouseEnter={() => {
                if (images.length > 0) {
                  setActiveImageIndex(i % images.length);
                }
              }}
              onMouseLeave={() => setActiveImageIndex(0)}
              className="w-full h-full cursor-pointer"
            />
          ))}
        </div>

        {/* Image Pagination Indicators */}
        <div className="absolute bottom-3 group-hover:bottom-16 left-0 right-0 flex justify-center gap-1.5 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 ease-out">
          {images.slice(0, 9).map((_, idx) => (
            <div
              key={idx}
              className={`h-0.5 w-2 rounded-full transition-all duration-300 ${
                idx === activeImageIndex
                  ? "bg-zinc-950 w-4 shadow-sm"
                  : "bg-zinc-400/40"
              }`}
            />
          ))}
        </div>

        {/* Premium Floating Glassmorphism Quick Add Pill Button */}
        {product.stock > 0 && (
          <button
            onClick={handleQuickAdd}
            disabled={isAdding}
            className="absolute bottom-3 left-3 right-3 bg-white/90 backdrop-blur-md text-zinc-950 text-[11px] font-semibold uppercase tracking-widest py-2.5 rounded-md active:rounded-3xl z-30 shadow-sm border border-zinc-200/50 transition-all duration-300 ease-out opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 flex items-center justify-center gap-2 hover:bg-zinc-950 hover:text-white hover:border-zinc-950 active:scale-95 select-none"
          >
            {isAdding ? (
              <span className="flex items-center gap-1.5 font-medium tracking-normal text-zinc-500 lowercase group-hover:text-zinc-300">
                <svg
                  className="animate-spin h-3.5 w-3.5 text-current"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                adding...
              </span>
            ) : (
              <span className="flex items-center gap-1">
                Quick Add{" "}
                <span className="text-xs font-normal text-zinc-400 group-hover:text-zinc-300 transition-colors">
                  +
                </span>
              </span>
            )}
          </button>
        )}

        {/* Badges */}
        <div className="absolute top-3 left-3 flex flex-col gap-2 z-20">
          {hasDiscount && (
            <span className="bg-zinc-900 text-white text-[10px] font-bold px-2.5 py-1 rounded shadow-sm uppercase tracking-wider">
              Sale
            </span>
          )}
          {product.stock <= 0 && (
            <span className="bg-white/90 backdrop-blur text-red-600 border border-red-100 text-[10px] font-bold px-2.5 py-1 rounded uppercase tracking-wider">
              Out of Stock
            </span>
          )}
        </div>
      </div>

      {/* Product Details info layout */}
      <div className="mt-5 space-y-1">
        <h3 className="text-sm font-semibold text-zinc-900 group-hover:text-zinc-600 transition-colors line-clamp-1 uppercase tracking-tight">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-zinc-400 font-medium uppercase tracking-widest truncate pr-2">
            {product.category}
          </p>
          {product.colors && product.colors.length > 0 && (
            <div className="flex items-center gap-1 shrink-0">
              {product.colors.slice(0, 3).map((colorName, idx) => {
                const colorHex = AVAILABLE_COLORS.find(c => c.name === colorName)?.hex || "#000";
                const isSelected = selectedColor === colorName;
                return (
                  <button
                    key={idx}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedColor(colorName); }}
                    className={`w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full border shadow-sm transition-all ${isSelected ? 'border-zinc-950 scale-125 ring-1 ring-zinc-950/20' : 'border-zinc-200 hover:scale-110'}`}
                    style={{ backgroundColor: colorHex }}
                    title={colorName}
                  />
                );
              })}
              {product.colors.length > 3 && (
                <span className="text-[9px] font-bold text-zinc-400 ml-0.5">+{product.colors.length - 3}</span>
              )}
            </div>
          )}
        </div>
        <div className="pt-1 flex items-baseline gap-2">
          {hasDiscount ? (
            <>
              <span className="text-base font-bold text-zinc-900">
                Rs. {product.discount_price}
              </span>
              <span className="text-xs text-zinc-500 font-medium line-through">
                Rs. {product.price}
              </span>
            </>
          ) : (
            <span className="text-base font-bold text-zinc-900">
              Rs. {product.price}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}