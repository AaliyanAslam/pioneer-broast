"use client";
import { useCartStore } from "@/app/lib/store";
import { PiWarningCircle, PiTrash } from "react-icons/pi";

export default function DeleteConfirmModal() {
  const { itemToDelete, setItemToDelete, removeFromCart } = useCartStore();

  if (!itemToDelete) return null;

  const handleConfirm = () => {
    removeFromCart(itemToDelete);
    setItemToDelete(null);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl animate-success-pop">
        <div className="p-6 pb-0 flex justify-center mt-2">
          <div className="w-16 h-16 bg-red-50 text-[#e63946] rounded-full flex items-center justify-center">
            <PiWarningCircle className="w-8 h-8" />
          </div>
        </div>
        <div className="p-6 text-center">
          <h3 className="text-lg font-bold text-black mb-2">Remove Item?</h3>
          <p className="text-zinc-500 text-sm">Are you sure you want to remove this item from your cart?</p>
        </div>
        <div className="bg-zinc-50 border-t border-zinc-100 p-4 flex gap-3">
          <button
            onClick={() => setItemToDelete(null)}
            className="flex-1 px-4 py-2.5 rounded-xl text-zinc-600 font-bold bg-white border border-zinc-200 hover:bg-zinc-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2.5 rounded-xl text-white font-bold bg-[#e63946] border border-[#e63946] hover:bg-[#d62828] transition-colors flex items-center justify-center gap-2"
          >
            <PiTrash className="w-4 h-4" />
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}
