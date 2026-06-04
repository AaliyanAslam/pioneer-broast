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
  const { cart, addToCart, updateQuantity, removeFromCart, setItemToDelete } = useCartStore();

  const cartItem = cart.find(cartObj => (cartObj.cartItemId || cartObj.id) === item.id);
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
      className="group block bg-white rounded-2xl border border-zinc-200 overflow-hidden  hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex-col h-full relative cursor-pointer max-w-[340px] mx-auto w-full"
    >
      {/* Badges */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 z-20 pointer-events-none">
        {item.is_spicy && (
          <span className="bg-[#e63946] text-white text-[10px] font-bold px-2 py-1 rounded shadow-sm uppercase tracking-wider flex items-center gap-1">
            🌶️ Spicy
          </span>
        )}
      </div>

      {/* Image Block */}
      <div className="relative aspect-4/3 w-full overflow-hidden bg-zinc-50 border-b border-zinc-100 shrink-0">
        <Image
          src={imageUrl}
          alt={item.name}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          quality={80}
          className="object-cover object-center transition-transform duration-500 ease-out"
        />
      </div>

      {/* Content layout */}
      <div className="p-4 sm:p-5 flex flex-col flex-1">
        <div className="mb-1">
          <h3 className="text-[15px] sm:text-base font-bold text-black leading-tight capitalize line-clamp-1">
            {item.name}
          </h3>
        </div>
        
        <p className="text-[12px] sm:text-[13px] text-zinc-500 line-clamp-2 mb-4 leading-snug">
          {item.description}
        </p>

        <div className="mt-auto flex items-center justify-between pt-2">
          <span className="text-lg sm:text-xl font-extrabold text-black">
            Rs. {item.discount_price && item.discount_price < item.price ? item.discount_price : item.price}
          </span>

          {quantityInCart > 0 ? (
            <div className="flex items-center border border-[#e63946] rounded-lg overflow-hidden shadow-sm h-8 sm:h-9">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (quantityInCart === 1) {
                    setItemToDelete(item.id);
                  } else {
                    updateQuantity(item.id, 'decrease');
                  }
                }}
                className="w-8 sm:w-9 h-full flex items-center justify-center bg-[#e63946] text-white hover:bg-[#d62828] text-lg font-medium transition-colors"
              >
                -
              </button>
              <span className="tabular-nums font-black text-sm sm:text-base text-[#e63946] w-8 sm:w-9 h-full flex items-center justify-center bg-white select-none">
                {quantityInCart}
              </span>
              <button
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  updateQuantity(item.id, 'increase');
                }}
                className="w-8 sm:w-9 h-full flex items-center justify-center bg-[#e63946] text-white hover:bg-[#d62828] text-lg font-medium transition-colors"
              >
                +
              </button>
            </div>
          ) : (
            <button
              onClick={handleQuickAdd}
              disabled={isAdding}
              className="bg-[#e63946] text-white font-black text-[13px] sm:text-sm uppercase tracking-wider px-5 sm:px-6 py-1.5 sm:py-2 rounded-lg transition-all duration-300 hover:bg-[#d62828] active:scale-[0.98] disabled:opacity-50 shadow-sm"
            >
              {isAdding ? "..." : "ADD"}
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
