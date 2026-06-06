"use client";
import { useEffect } from "react";
import { useCartStore } from "@/app/lib/store";
import { PiWarningCircle, PiTrash } from "react-icons/pi";

export default function DeleteConfirmModal() {
  const { itemToDelete, setItemToDelete, removeFromCart } = useCartStore();

  useEffect(() => {
    if (itemToDelete) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [itemToDelete]);

  if (!itemToDelete) return null;

  const handleConfirm = () => {
    removeFromCart(itemToDelete);
    setItemToDelete(null);
  };

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999] transition-opacity" 
        onClick={() => setItemToDelete(null)}
      />
      <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-white w-full max-w-[300px] sm:max-w-[340px] rounded-3xl overflow-hidden shadow-2xl animate-success-pop relative pointer-events-auto border border-zinc-100">
          
          <div className="px-5 pt-6 pb-2 sm:px-6 sm:pt-7 sm:pb-3 text-center relative z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-red-50 text-[#e63946] rounded-full flex items-center justify-center mb-4 ring-8 ring-red-50/50">
              <PiWarningCircle className="w-7 h-7 animate-pulse" weight="bold" />
            </div>
            
            <h3 className="text-[19px] sm:text-[21px] font-black text-zinc-900 mb-1.5 tracking-tight">Remove Item?</h3>
            <p className="text-zinc-500 text-[13px] sm:text-[14px] leading-relaxed font-medium px-2">
              Are you sure you want to remove this item from your cart?
            </p>
          </div>
          
          <div className="p-5 sm:p-6 flex gap-3 relative z-10">
            <button
              onClick={() => setItemToDelete(null)}
              className="flex-1 px-2 py-3 rounded-2xl text-zinc-600 font-bold bg-zinc-100 hover:bg-zinc-200 active:scale-[0.98] transition-all text-[13px] sm:text-[14px] uppercase tracking-wider"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="flex-1 px-2 py-3 rounded-2xl text-white font-bold bg-[#e63946] hover:bg-[#d62828] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 shadow-md shadow-red-500/20 text-[13px] sm:text-[14px] uppercase tracking-wider"
            >
              <PiTrash className="w-4 h-4" weight="bold" />
              Remove
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
