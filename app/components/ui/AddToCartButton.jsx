"use client";
import { useCartStore } from "@/app/lib/store";
import toast from "react-hot-toast";

export default function AddToCartButton({ product }) {
  const { addToCart } = useCartStore();

  const handleAddToCart = () => {
    const success = addToCart(product);
    if (success) {
      toast.success(`${product.name} added to cart!`);
    }
  };

  return (
    <button 
      onClick={handleAddToCart}
      className="w-full bg-black text-white font-bold py-4 rounded-md transition-colors hover:bg-zinc-800 shadow-md"
    >
      Add to Cart
    </button>
  );
}
