"use client";
import { useState } from "react";
import Image from "next/image";
import { useCartStore } from "@/app/lib/store";
import toast from "react-hot-toast";
import ItemModal from "./ItemModal";

export default function MenuItemCard({ item }) {
  // item corresponds to a row in 'menu_items'
  // schema: name, image_url, category, price, description, is_spicy, is_active
  const imageUrl = item.image_url || "https://via.placeholder.com/600";
  const [isAdding, setIsAdding] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { cart, addToCart, updateQuantity, removeFromCart, setItemToDelete } =
    useCartStore();

  const cartItem = cart.find(
    (cartObj) => (cartObj.cartItemId || cartObj.id) === item.id,
  );
  const quantityInCart = cartItem ? cartItem.quantity : 0;

  const handleQuickAdd = (e) => {
    e.preventDefault();
    e.stopPropagation();

    setIsAdding(true);

    const success = addToCart(item);
    if (success) {
      toast.success(`${item.name} added to cart!`);
    }

    setTimeout(() => {
      setIsAdding(false);
    }, 600);
  };

  return (
    <>
      <div
        onClick={() => setIsModalOpen(true)}
        className="group block bg-white rounded-[16px] sm:rounded-[20px] border border-zinc-100 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex-col h-full relative cursor-pointer w-full"
      >
        {/* Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-2 z-20 pointer-events-none">
          {item.is_spicy && (
            <span className="bg-[#e63946] text-white text-[9px] sm:text-[10px] font-semibold px-2 py-1 rounded-md shadow-sm uppercase tracking-wider flex items-center gap-1 backdrop-blur-sm">
              🌶️ Spicy
            </span>
          )}
        </div>

        {/* Image Block */}
        <div 
          className={`relative w-full overflow-hidden bg-zinc-50 shrink-0 border-b border-zinc-100 ${
            item.category?.toLowerCase().includes('drink') 
              ? 'aspect-3/4' 
              : 'aspect-4/3'
          }`}
        >
          <Image
            src={imageUrl}
            alt={item.name}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            quality={90}
            className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
          />
        </div>

        {/* Content layout below image */}
        <div className="p-2.5 sm:p-4 flex flex-col flex-1 bg-white">
          <div className="mb-0.5 sm:mb-1">
            <h3 className="text-[13px] sm:text-[16px] font-bold text-zinc-900 leading-tight capitalize line-clamp-1 group-hover:text-[#e63946] transition-colors">
              {item.name}
            </h3>
          </div>

          <p className="text-[10px] sm:text-[13px] text-zinc-700 line-clamp-2 mb-2 sm:mb-4 leading-snug font-medium">
            {item.description}
          </p>

          <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-2">
            <div className="flex flex-col">
              <span className="text-[14px] sm:text-[18px] font-bold text-zinc-900 tracking-tight">
                Rs.{" "}
                {item.discount_price && item.discount_price < item.price
                  ? item.discount_price
                  : item.price}
              </span>
              {item.discount_price && item.discount_price < item.price && (
                <span className="text-[10px] sm:text-[12px] text-zinc-500 line-through font-medium mt-[-2px]">
                  Rs. {item.price}
                </span>
              )}
            </div>

            {quantityInCart > 0 ? (
              <div className="flex items-center justify-between w-full sm:w-auto border border-[#e63946] rounded-lg sm:rounded-xl overflow-hidden shadow-sm h-7 sm:h-9 bg-[#e63946]">
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (quantityInCart === 1) {
                      setItemToDelete(item.id);
                    } else {
                      updateQuantity(item.id, "decrease");
                    }
                  }}
                  className="w-7 sm:w-9 h-full flex items-center justify-center text-white hover:bg-[#d62828] text-sm sm:text-lg font-bold transition-colors"
                >
                  -
                </button>
                <span className="tabular-nums font-bold text-[12px] sm:text-base text-[#e63946] flex-1 sm:w-8 h-full flex items-center justify-center bg-white select-none text-center">
                  {quantityInCart}
                </span>
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    updateQuantity(item.id, "increase");
                  }}
                  className="w-7 sm:w-9 h-full flex items-center justify-center text-white hover:bg-[#d62828] text-sm sm:text-lg font-bold transition-colors"
                >
                  +
                </button>
              </div>
            ) : (
              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className="bg-[#e63946] text-white font-bold text-[10px] sm:text-[12px] uppercase tracking-widest px-3 sm:px-5 py-1.5 sm:py-2 rounded-lg sm:rounded-xl transition-all duration-300 hover:bg-[#d62828] active:scale-[0.96] disabled:opacity-50 shadow-sm flex items-center justify-center w-full sm:w-auto sm:min-w-[70px]"
              >
                {isAdding ? (
                  <span className="flex items-center gap-0.5 sm:gap-1">
                    <span
                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "0ms" }}
                    />
                    <span
                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "150ms" }}
                    />
                    <span
                      className="w-1 h-1 sm:w-1.5 sm:h-1.5 bg-white rounded-full animate-bounce"
                      style={{ animationDelay: "300ms" }}
                    />
                  </span>
                ) : (
                  "ADD"
                )}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={item}
      />
    </>
  );
}
