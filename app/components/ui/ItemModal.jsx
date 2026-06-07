"use client";
import { useState, useEffect } from "react";
import Image from "next/image";
import { PiX, PiMinus, PiPlus } from "react-icons/pi";
import { useCartStore } from "@/app/lib/store";
import toast from "react-hot-toast";

export default function ItemModal({ isOpen, onClose, item }) {
  const [quantity, setQuantity] = useState(1);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const { addToCart } = useCartStore();

  const imageUrl = item.image_url || "https://via.placeholder.com/600";
  const activePrice =
    item.discount_price && item.discount_price < item.price
      ? item.discount_price
      : item.price;
  const originalPrice = item.price;
  const hasDiscount = item.discount_price && item.discount_price < item.price;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      setQuantity(1);
      setSpecialInstructions("");
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleAddToCart = () => {
    setIsAdding(true);

    // Add multiple items if quantity > 1
    const success = addToCart({
      ...item,
      quantity: quantity,
      specialInstructions: specialInstructions.trim(),
    });

    if (success) {
      toast.success(`${quantity}x ${item.name} added to bucket!`);
      setTimeout(() => {
        setIsAdding(false);
        onClose();
      }, 500);
    } else {
      setIsAdding(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-100 transition-opacity"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-x-0 bottom-0 sm:inset-0 sm:m-auto sm:h-fit sm:max-h-[90vh] z-110 w-full max-w-md bg-white sm:rounded-3xl rounded-t-3xl overflow-hidden shadow-2xl flex flex-col transform transition-transform animate-slide-up sm:animate-fade-in">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center bg-white/50 backdrop-blur rounded-full text-zinc-900 hover:bg-white transition-colors"
        >
          <PiX className="w-5 h-5" />
        </button>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">
          {/* Header Image */}
          <div className="relative w-full aspect-4/3 bg-zinc-100">
            <Image
              src={imageUrl}
              alt={item.name}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 400px"
              priority
            />
            {/* Badges Overlay */}
            <div className="absolute top-4 left-4 flex flex-col gap-2">
              {item.is_spicy && (
                <span className="bg-[#ff1900] text-white text-[10px] font-bold px-2.5 py-1.5 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1 backdrop-blur-md">
                  ðŸŒ¶ï¸ Spicy
                </span>
              )}
            </div>
          </div>

          <div className="p-4 sm:p-6 pb-28 sm:pb-32">
            <div className="flex justify-between items-start gap-3 sm:gap-4 mb-1.5 sm:mb-2">
              <h2 className="text-[18px] sm:text-2xl font-bold text-black leading-tight">
                {item.name}
              </h2>
              <div className="text-right shrink-0">
                {hasDiscount ? (
                  <div className="flex flex-col items-end">
                    <span className="text-[12px] sm:text-sm text-zinc-400 line-through font-medium">
                      Rs. {originalPrice}
                    </span>
                    <span className="text-[18px] sm:text-xl font-bold text-[#ff1900]">
                      Rs. {activePrice}
                    </span>
                  </div>
                ) : (
                  <span className="text-[18px] sm:text-xl font-bold text-[#ff1900]">
                    Rs. {originalPrice}
                  </span>
                )}
              </div>
            </div>

            <p className="text-[11px] sm:text-xs text-zinc-500 font-semibold uppercase tracking-wide mb-3 sm:mb-4">
              {item.category}
            </p>

            <p className="text-[12px] sm:text-sm text-zinc-600 leading-relaxed mb-5 sm:mb-6">
              {item.description}
            </p>

            {/* Special Instructions */}
            <div className="mb-2 hidden">
              <label className="flex justify-between items-center mb-1.5 sm:mb-2">
                <span className="text-[12px] sm:text-sm font-semibold text-black uppercase tracking-wide">
                  Special Instructions
                </span>
                <span className="text-[9px] sm:text-[10px] text-zinc-400 font-medium bg-zinc-100 px-1.5 py-0.5 rounded uppercase">
                  Optional
                </span>
              </label>
              <textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="E.g. Extra mayo, no pickles..."
                className="w-full bg-zinc-50 border border-zinc-200 rounded-xl p-2.5 sm:p-3 text-[13px] sm:text-sm text-black focus:outline-none focus:border-[#ff1900] focus:ring-1 focus:ring-[#ff1900] transition-colors resize-none placeholder:text-zinc-400"
                rows="2"
              />
            </div>
          </div>
        </div>

        {/* Bottom Action Bar */}
        <div className="absolute bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-zinc-200 p-3 sm:p-5 shadow-[0_-10px_30px_rgba(0,0,0,0.05)] flex items-center gap-3 sm:gap-4 z-20">
          {/* Quantity Controls */}
          <div className="flex items-center bg-zinc-100 rounded-xl p-1 shrink-0 border border-zinc-200/50">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-white rounded-lg transition-colors shadow-sm active:scale-95"
            >
              <PiMinus className="w-4 h-4" />
            </button>
            <span className="w-6 sm:w-8 text-center font-bold text-black tabular-nums text-[14px] sm:text-base">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => q + 1)}
              className="w-9 h-9 sm:w-10 sm:h-10 flex items-center justify-center text-zinc-500 hover:text-black hover:bg-white rounded-lg transition-colors shadow-sm active:scale-95"
            >
              <PiPlus className="w-4 h-4" />
            </button>
          </div>

          {/* Add to Cart Button */}
          <button
            onClick={handleAddToCart}
            disabled={isAdding}
            className="flex-1 bg-[#ff1900] text-white font-bold text-[12px] sm:text-sm uppercase tracking-wide py-3 sm:py-4 rounded-xl transition-all duration-300 hover:bg-[#cc1400] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 shadow-lg shadow-[#ff1900]/20"
          >
            {isAdding ? (
              "Adding..."
            ) : (
              <span>
                Add to Bucket â€¢ Rs. {(activePrice * quantity).toLocaleString()}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Animations */}
      <style jsx>{`
        @keyframes slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @media (min-width: 640px) {
          .animate-fade-in {
            animation: fade-in 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          }
        }
      `}</style>
    </>
  );
}
