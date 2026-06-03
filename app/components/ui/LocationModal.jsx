"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useLocationStore } from "@/app/lib/store";
import {
  PiMapPin,
  PiMotorcycle,
  PiBag,
  PiMagnifyingGlass,
  PiX,
  PiLockSimple,
  PiNavigationArrow,
} from "react-icons/pi";

// ─── Data ─────────────────────────────────────────────────────────────────────
const CITIES = [
  { name: "Karachi", available: true },
  { name: "Lahore", available: false },
  { name: "Islamabad", available: false },
  { name: "Multan", available: false },
];

const KARACHI_AREAS = [
  "Bahria Town",
  "Clifton",
  "DHA Phase 1",
  "DHA Phase 2",
  "DHA Phase 3",
  "DHA Phase 4",
  "DHA Phase 5",
  "DHA Phase 6",
  "DHA Phase 7",
  "DHA Phase 8",
  "Gadap Town",
  "Garden East",
  "Garden West",
  "Gulistan-e-Jauhar",
  "Gulshan-e-Hadeed",
  "Gulshan-e-Iqbal",
  "KCHD",
  "Korangi",
  "Landhi",
  "Lyari",
  "Malir",
  "Nazimabad",
  "New Karachi",
  "North Karachi",
  "North Nazimabad",
  "Orangi Town",
  "PECHS",
  "Saddar",
  "Safoora Goth",
  "Shah Faisal Colony",
  "Surjani Town",
  "Timbergoth",
].sort();

// ─── Component ────────────────────────────────────────────────────────────────
export default function LocationModal() {
  const {
    orderType,
    isLocationModalOpen,
    setOrderType,
    setDeliveryCity,
    setDeliveryArea,
    setLocationModalOpen,
  } = useLocationStore();

  // step: 1 = type select, 2 = city select, 3 = area select
  const [step, setStep] = useState(1);
  const [search, setSearch] = useState("");

  const overlayRef = useRef(null);
  const cardRef = useRef(null);
  const tlRef = useRef(null);

  // Open automatically on first visit (orderType === null)
  const shouldShow = isLocationModalOpen || orderType === null;

  // ── GSAP entrance ────────────────────────────────────────────────────────
  useEffect(() => {
    if (!shouldShow || !overlayRef.current || !cardRef.current) return;

    // Reset step on re-open
    setStep(1);
    setSearch("");

    const ctx = gsap.context(() => {
      gsap.fromTo(
        overlayRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.35, ease: "power2.out" }
      );
      gsap.fromTo(
        cardRef.current,
        { opacity: 0, y: 60, scale: 0.95 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, ease: "back.out(1.4)" }
      );
    });

    return () => ctx.revert();
  }, [shouldShow]);

  // ── GSAP slide between steps ──────────────────────────────────────────────
  const animateStep = (cb) => {
    if (!cardRef.current) return cb();
    gsap.to(cardRef.current, {
      opacity: 0,
      y: -20,
      duration: 0.2,
      ease: "power2.in",
      onComplete: () => {
        cb();
        gsap.fromTo(
          cardRef.current,
          { opacity: 0, y: 30 },
          { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
        );
      },
    });
  };

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleClose = () => {
    if (tlRef.current) tlRef.current.kill();
    gsap.to(overlayRef.current, { opacity: 0, duration: 0.25 });
    gsap.to(cardRef.current, {
      opacity: 0,
      y: 40,
      scale: 0.95,
      duration: 0.3,
      ease: "power2.in",
      onComplete: () => setLocationModalOpen(false),
    });
  };

  const handleSelectType = (type) => {
    setOrderType(type);
    if (type === "Pickup") {
      handleClose();
    } else {
      animateStep(() => setStep(2));
    }
  };

  const handleSelectCity = (city) => {
    if (!city.available) return;
    setDeliveryCity(city.name);
    animateStep(() => setStep(3));
  };

  const handleSelectArea = (area) => {
    setDeliveryArea(area);
    setDeliveryCity("Karachi");
    handleClose();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      () => {
        // Simplified: just pick Karachi + prompt area selection
        setDeliveryCity("Karachi");
        animateStep(() => setStep(3));
      },
      () => {
        // Permission denied — silently skip
      }
    );
  };

  const filteredAreas = KARACHI_AREAS.filter((a) =>
    a.toLowerCase().includes(search.toLowerCase())
  );

  if (!shouldShow) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ opacity: 0 }}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={orderType !== null ? handleClose : undefined}
      />

      {/* Card */}
      <div
        ref={cardRef}
        className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden"
        style={{
          background:
            "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div className="relative px-6 pt-6 pb-4">
          <div className="flex items-center gap-3 mb-1">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-[#e63946]/20 border border-[#e63946]/30">
              <PiMapPin className="w-5 h-5 text-[#e63946]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">
                {step === 1 && "How would you like your order?"}
                {step === 2 && "Select Your City"}
                {step === 3 && "Select Your Area"}
              </h2>
              <p className="text-white/50 text-xs">
                {step === 1 && "Choose your preferred order type"}
                {step === 2 && "We currently deliver to Karachi"}
                {step === 3 && "Karachi — pick your neighbourhood"}
              </p>
            </div>
          </div>

          {/* Back arrow for step 2 and 3 */}
          {step > 1 && (
            <button
              onClick={() => animateStep(() => setStep((s) => s - 1))}
              className="absolute top-5 right-14 text-white/40 hover:text-white transition-colors text-xs uppercase tracking-widest font-bold"
            >
              ← Back
            </button>
          )}

          {/* Close — only show when orderType is already set */}
          {orderType !== null && (
            <button
              onClick={handleClose}
              className="absolute top-5 right-5 p-1.5 rounded-full text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <PiX className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Divider */}
        <div className="h-px mx-6 bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* ── Step 1: Type Selection ───────────────────────────────────────── */}
        {step === 1 && (
          <div className="px-6 py-6 grid grid-cols-2 gap-4">
            <button
              id="location-modal-delivery-btn"
              onClick={() => handleSelectType("Delivery")}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-[#e63946]/30 bg-[#e63946]/10 hover:bg-[#e63946]/20 hover:border-[#e63946]/60 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              <div className="w-14 h-14 rounded-2xl bg-[#e63946]/20 flex items-center justify-center group-hover:bg-[#e63946]/40 transition-colors">
                <PiMotorcycle className="w-8 h-8 text-[#e63946]" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">
                Delivery
              </span>
              <span className="text-white/40 text-[11px] text-center">
                Get it delivered to your door
              </span>
            </button>

            <button
              id="location-modal-pickup-btn"
              onClick={() => handleSelectType("Pickup")}
              className="group flex flex-col items-center gap-3 p-6 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 transition-all duration-300 hover:scale-[1.03] active:scale-[0.97]"
            >
              <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                <PiBag className="w-8 h-8 text-white/70" />
              </div>
              <span className="text-white font-bold text-sm tracking-wide">
                Pickup
              </span>
              <span className="text-white/40 text-[11px] text-center">
                Pick up from our outlet
              </span>
            </button>
          </div>
        )}

        {/* ── Step 2: City Selection ───────────────────────────────────────── */}
        {step === 2 && (
          <div className="px-6 py-5 space-y-4">
            {/* Current Location */}
            <button
              id="location-modal-use-gps-btn"
              onClick={handleUseCurrentLocation}
              className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl bg-[#e63946]/10 border border-[#e63946]/30 hover:bg-[#e63946]/20 hover:border-[#e63946]/50 transition-all group"
            >
              <PiNavigationArrow className="w-5 h-5 text-[#e63946] group-hover:scale-110 transition-transform" />
              <span className="text-white font-semibold text-sm">
                Use Current Location
              </span>
            </button>

            <p className="text-white/30 text-[11px] text-center uppercase tracking-widest">
              — or select a city —
            </p>

            {/* City Grid */}
            <div className="grid grid-cols-2 gap-3">
              {CITIES.map((city) => (
                <div key={city.name} className="relative group/city">
                  <button
                    id={`city-btn-${city.name.toLowerCase()}`}
                    onClick={() => handleSelectCity(city)}
                    disabled={!city.available}
                    className={`w-full py-4 rounded-2xl font-bold text-sm transition-all duration-300 border ${
                      city.available
                        ? "bg-white/8 border-white/15 text-white hover:bg-[#e63946]/20 hover:border-[#e63946]/50 hover:scale-[1.03] active:scale-[0.97] cursor-pointer"
                        : "bg-white/3 border-white/5 text-white/25 cursor-not-allowed"
                    }`}
                  >
                    <span className="flex flex-col items-center gap-1.5">
                      <span>{city.name}</span>
                      {!city.available && (
                        <span className="flex items-center gap-1 text-[10px] text-white/25 font-normal">
                          <PiLockSimple className="w-3 h-3" /> Coming Soon
                        </span>
                      )}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3: Area Selection ───────────────────────────────────────── */}
        {step === 3 && (
          <div className="px-6 py-5 space-y-3">
            {/* Search */}
            <div className="relative">
              <PiMagnifyingGlass className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                id="area-search-input"
                type="text"
                placeholder="Search area..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/8 border border-white/10 text-white placeholder-white/30 text-sm focus:outline-none focus:border-[#e63946]/50 focus:bg-white/10 transition-all"
              />
            </div>

            {/* Area list */}
            <div className="max-h-64 overflow-y-auto pr-1 space-y-1 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:rounded-full [&::-webkit-scrollbar-track]:bg-white/5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-white/20">
              {filteredAreas.length === 0 ? (
                <p className="text-center py-8 text-white/30 text-sm">
                  No areas found for &quot;{search}&quot;
                </p>
              ) : (
                filteredAreas.map((area) => (
                  <button
                    key={area}
                    id={`area-btn-${area.replace(/\s+/g, "-").toLowerCase()}`}
                    onClick={() => handleSelectArea(area)}
                    className="w-full text-left px-4 py-3 rounded-xl text-sm text-white/80 hover:text-white hover:bg-[#e63946]/15 hover:border-[#e63946]/30 border border-transparent transition-all duration-200 font-medium"
                  >
                    {area}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        {/* Footer brand strip */}
        <div className="px-6 py-4 border-t border-white/5 flex items-center justify-center">
          <span className="text-white/20 text-[11px] tracking-widest uppercase font-bold">
            Pioneer Broast — Karachi&apos;s Finest
          </span>
        </div>
      </div>
    </div>
  );
}
