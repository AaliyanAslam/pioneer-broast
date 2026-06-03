"use client";

import { useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { supabase } from "@/app/lib/supabase";

// ─── Status Labels & Messages ─────────────────────────────────────────────────
const STATUS_MESSAGES = {
  pending: {
    emoji: "🕐",
    title: "Order Received!",
    body: "We've received your order and it's being reviewed.",
  },
  confirmed: {
    emoji: "✅",
    title: "Order Confirmed!",
    body: "Your order has been confirmed. We're getting it ready!",
  },
  processing: {
    emoji: "🔥",
    title: "Order is Being Prepared!",
    body: "Your fresh Pioneer Broast is being cooked right now!",
  },
  out_for_delivery: {
    emoji: "🛵",
    title: "Out for Delivery!",
    body: "Your rider is on the way — sit tight!",
  },
  delivered: {
    emoji: "🎉",
    title: "Order Delivered!",
    body: "Enjoy your meal! Don't forget to rate your experience.",
  },
  cancelled: {
    emoji: "❌",
    title: "Order Cancelled",
    body: "Your order has been cancelled. Contact us if this was a mistake.",
  },
  ready_for_pickup: {
    emoji: "🥡",
    title: "Ready for Pickup!",
    body: "Your order is ready — please come collect it.",
  },
};

// ─── Local-storage helpers ────────────────────────────────────────────────────
const LS_KEY = "pioneer_active_order_id";

export function setActiveOrderId(orderId) {
  if (typeof window !== "undefined") {
    localStorage.setItem(LS_KEY, String(orderId));
  }
}

export function clearActiveOrderId() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(LS_KEY);
  }
}

export function getActiveOrderId() {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(LS_KEY);
}

// ─── Custom Hook ──────────────────────────────────────────────────────────────
/**
 * useOrderTracking
 *
 * Subscribes to Supabase Realtime for the active order in localStorage.
 * Shows react-hot-toast notifications whenever the order status changes.
 *
 * Usage:
 *   // Mount once at app level (e.g. in layout or a provider):
 *   useOrderTracking();
 *
 *   // After successfully placing an order:
 *   import { setActiveOrderId } from "@/app/lib/useOrderTracking";
 *   setActiveOrderId(order.id);
 */
export function useOrderTracking() {
  const channelRef = useRef(null);
  const prevStatusRef = useRef(null);

  useEffect(() => {
    const orderId = getActiveOrderId();
    if (!orderId) return;

    // Subscribe to the specific row via Supabase Realtime
    channelRef.current = supabase
      .channel(`order-tracking-${orderId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "orders",
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          const newStatus = payload.new?.status;
          if (!newStatus || newStatus === prevStatusRef.current) return;

          prevStatusRef.current = newStatus;
          const msg = STATUS_MESSAGES[newStatus];

          if (msg) {
            toast(
              (t) => (
                <div className="flex items-start gap-3">
                  <span className="text-2xl leading-none mt-0.5">{msg.emoji}</span>
                  <div>
                    <p className="font-bold text-zinc-900 text-sm">{msg.title}</p>
                    <p className="text-zinc-500 text-xs mt-0.5">{msg.body}</p>
                  </div>
                  <button
                    onClick={() => toast.dismiss(t.id)}
                    className="ml-auto text-zinc-400 hover:text-zinc-600 text-lg leading-none"
                  >
                    ×
                  </button>
                </div>
              ),
              {
                duration: 6000,
                style: {
                  background: "#fff",
                  border: "1px solid #f0f0f0",
                  borderRadius: "16px",
                  padding: "14px 16px",
                  boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                  maxWidth: "340px",
                },
              }
            );

            // Clean up after terminal statuses
            if (["delivered", "cancelled"].includes(newStatus)) {
              clearActiveOrderId();
            }
          }
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
  }, []); // runs once on mount; orderId is read from localStorage inside
}
