import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import toast from 'react-hot-toast';

// ─── Location / Order-type store (persisted) ──────────────────────────────────
export const useLocationStore = create(
  persist(
    (set) => ({
      orderType: null,       // 'Delivery' | 'Pickup' | null
      deliveryCity: null,    // e.g. 'Karachi'
      deliveryArea: null,    // e.g. 'DHA'
      exactLocation: null,   // e.g. { lat, lng, address }
      isLocationModalOpen: false,

      setOrderType: (orderType) => set({ orderType }),
      setDeliveryCity: (deliveryCity) => set({ deliveryCity }),
      setDeliveryArea: (deliveryArea) => set({ deliveryArea }),
      setExactLocation: (exactLocation) => set({ exactLocation }),
      setLocationModalOpen: (isOpen) => set({ isLocationModalOpen: isOpen }),

      // Reset everything (e.g. user wants to change location)
      resetLocation: () =>
        set({ orderType: null, deliveryCity: null, deliveryArea: null, exactLocation: null }),
    }),
    {
      name: 'pioneer-location-storage',
      partialize: (state) => ({
        orderType: state.orderType,
        deliveryCity: state.deliveryCity,
        deliveryArea: state.deliveryArea,
        exactLocation: state.exactLocation,
      }),
    }
  )
);

// ─── Cart store ───────────────────────────────────────────────────────────────
export const useCartStore = create(
  persist(
    (set, get) => ({
      cart: [],
      isCartOpen: false,
      appliedCoupon: null,

      setCartOpen: (isOpen) => set({ isCartOpen: isOpen }),
      setAppliedCoupon: (coupon) => set({ appliedCoupon: coupon }),
      
      // Product Cart mein dalna
      addToCart: (product) => {
        const cart = get().cart;
        const cartItemId = product.id;
        
        const existingItem = cart.find((item) => (item.cartItemId || item.id) === cartItemId);
        const quantityToAdd = product.quantity || 1; 
        
        if (existingItem) {
          if (existingItem.quantity + quantityToAdd > product.stock) {
            toast.error(`Cannot add more. Only ${product.stock} in stock!`);
            return false;
          }
          set({
            cart: cart.map((item) =>
              (item.cartItemId || item.id) === cartItemId ? { ...item, quantity: item.quantity + quantityToAdd } : item
            ),
            isCartOpen: true
          });
          return true;
        } else {
          if (quantityToAdd > product.stock) {
            toast.error(`Only ${product.stock} in stock!`);
            return false;
          }
          set({ 
            cart: [...cart, { ...product, cartItemId, quantity: quantityToAdd }],
            isCartOpen: true 
          });
          return true;
        }
      },
      
      // Product Cart se nikalna
      removeFromCart: (cartItemId) => {
        set({ cart: get().cart.filter((item) => (item.cartItemId || item.id) !== cartItemId) });
      },
      
      // Quantity kam ya zyada karna (+ / -)
      updateQuantity: (cartItemId, action) => {
        set({
          cart: get().cart.map((item) => {
            if ((item.cartItemId || item.id) === cartItemId) {
              if (action === 'increase') {
                if (item.quantity >= item.stock) {
                  toast.error(`Maximum stock reached (${item.stock})`);
                  return item;
                }
                return { ...item, quantity: item.quantity + 1 };
              }
              if (action === 'decrease' && item.quantity > 1) return { ...item, quantity: item.quantity - 1 };
            }
            return item;
          }),
        });
      },

      // Update special instructions
      updateInstructions: (cartItemId, instructions) => {
        set({
          cart: get().cart.map((item) => {
            if ((item.cartItemId || item.id) === cartItemId) {
              return { ...item, specialInstructions: instructions };
            }
            return item;
          }),
        });
      },
      
      // Cart khali karna (Order place hone ke baad)
      clearCart: () => set({ cart: [], appliedCoupon: null }),
    }),
    {
      name: 'kova-cart-storage',
      partialize: (state) => ({ cart: state.cart, appliedCoupon: state.appliedCoupon }),
    }
  )
);