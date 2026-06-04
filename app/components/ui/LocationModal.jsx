"use client";

import { useEffect, useRef, useState } from "react";
import { gsap } from "gsap";
import { useLocationStore } from "@/app/lib/store";
import { PiCrosshair, PiSpinner, PiLockFill } from "react-icons/pi";
import { toast } from "react-hot-toast";
import dynamic from "next/dynamic";

const MapSelector = dynamic(() => import("./MapSelector"), { ssr: false });

// ─── Data ─────────────────────────────────────────────────────────────────────
const CITIES = [
  "Karachi",
  "Hyderabad",
  "Lahore",
  "Islamabad",
  "Multan",
  "Gujranwala",
  "Sialkot",
  "Faisalabad",
  "Rahim Yar Khan",
  "Bahawalpur",
  "Larkana",
];

const KARACHI_AREAS = [
  // DHA & Clifton
  "Clifton Block 1", "Clifton Block 2", "Clifton Block 3", "Clifton Block 4", "Clifton Block 5", 
  "Clifton Block 6", "Clifton Block 7", "Clifton Block 8", "Clifton Block 9", "Bath Island",
  "DHA Phase 1", "DHA Phase 2", "DHA Phase 2 Extension", "DHA Phase 3", "DHA Phase 4", 
  "DHA Phase 5", "DHA Phase 5 Extension", "DHA Phase 6", "DHA Phase 7", "DHA Phase 7 Extension", 
  "DHA Phase 8", "DHA Phase 8 (Zone A)", "DHA Phase 8 (Zone B)", "Defence View",
  
  // Central & East
  "PECHS Block 2", "PECHS Block 6", "Tariq Road", "Sindhi Muslim (SMCHS)", "Bahadurabad", 
  "Dhoraji", "Sharfabad", "KDA Scheme 1", "Muhammad Ali Society (MACHS)", "Karachi Administration Society", 
  "Baloch Colony", "Mehmoodabad", "Manzoor Colony", "Azam Basti", "Akhtar Colony",
  
  // Gulshan & Jauhar
  "Gulshan-e-Iqbal Block 1", "Gulshan-e-Iqbal Block 4", "Gulshan-e-Iqbal Block 10", "Gulshan-e-Iqbal Block 13",
  "Gulistan-e-Jauhar Block 1", "Gulistan-e-Jauhar Block 12", "Gulistan-e-Jauhar Block 15", "Gulistan-e-Jauhar Block 19",
  "Rabia City", "Kamran Chowrangi", "Pehalwan Goth", "Abul Hassan Isphani Road", "University Road",
  "Scheme 33", "Saadi Town", "Safoora Goth", "Malir Cantt", "Malir Halt", "Model Colony", "Malir 15",
  
  // Korangi & Landhi
  "Korangi Industrial Area", "Korangi Crossing", "Qayyumabad", "Korangi K Area", "Korangi J Area",
  "Korangi Sector 31", "Korangi Sector 32", "Korangi Sector 33", "Landhi",
  
  // North & Nazimabad
  "Nazimabad Block 1", "Nazimabad Block 2", "Nazimabad Block 3", "Nazimabad Block 4", "Nazimabad Block 5",
  "North Nazimabad Block A", "North Nazimabad Block B", "North Nazimabad Block H", "North Nazimabad Block L", "North Nazimabad Block M",
  "North Karachi Sector 11-A", "North Karachi Sector 11-B", "North Karachi Sector 11-C", "North Karachi Sector 11-D", 
  "North Karachi Sector 11-E", "North Karachi Sector 11-F", "New Karachi", "Buffer Zone", "Shadman Town",
  
  // F.B Area & Others
  "F.B Area Block 1", "F.B Area Block 10", "F.B Area Block 15", "F.B Area Block 20", "Gulberg",
  "Liaquatabad", "Gharibabad", "Hassan Square", "PIB Colony", "Essa Nagri",
  
  // South & Old City
  "Saddar", "I.I. Chundrigar Road", "Civil Lines", "Frere Town", "Jodia Bazaar", "Kharadar", "Mithadar",
  "Garden East", "Garden West", "Soldier Bazaar", "Jamshed Road", "Guru Mandir", "Lyari",
  
  // Outskirts
  "Gadap Town", "Gulshan-e-Hadeed", "Orangi Town", "Surjani Town", "Timbergoth", "Gulshan-e-Maymar"
].sort();

// Simple SVG placeholders for cities to match the visual style
const CityIcon = ({ city, active }) => {
  const color = active ? "#ed1c24" : "#4b5563";
  const strokeColor = active ? "#ed1c24" : "#4b5563";

  switch (city) {
    case "Karachi":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" className="w-8 h-8 mb-2">
          <path d="M4 20h16M7 20V12h10v8M12 4a5 5 0 0 0-5 5v3h10V9a5 5 0 0 0-5-5z" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M10 16h4M12 4V2" strokeLinecap="round"/>
        </svg>
      );
    case "Lahore":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" className="w-8 h-8 mb-2">
          <path d="M8 22h8M10 22V12h4v10M12 4L8 10h8l-4-6zM12 4V2M10 10v2M14 10v2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "Islamabad":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" className="w-8 h-8 mb-2">
          <path d="M2 22h20M12 8L4 20h16L12 8zM12 8V4M6 22V6M18 22V6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "Multan":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" className="w-8 h-8 mb-2">
          <path d="M4 22h16M6 22V14a6 6 0 0 1 12 0v8M12 6a4 4 0 0 0-4 4h8a4 4 0 0 0-4-4zM12 6V3M8 18h8" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "Gujranwala":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 mb-2 transition-colors duration-300" style={{ color: active ? "#ed1c24" : "#4b5563" }}>
          <path d="M13.5 2C15.5 3 17 4 18 6C19 8 21 9 20 12C19 15 16 18 14 20C11 22 7 21 5 18C3 15 2 11 4 8C6 5 9 3 11 2.5C12 2.2 12.5 2 13.5 2Z" />
        </svg>
      );
    case "Hyderabad":
    case "Sialkot":
    case "Faisalabad":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" className="w-8 h-8 mb-2">
          <path d="M8 22h8M10 22V10h4v12M9 10V6h6v4M12 6L9 2h6l-3 4z" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="8" r="1.5" />
        </svg>
      );
    case "Bahawalpur":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" className="w-8 h-8 mb-2">
          <path d="M2 22h20M4 22V14h16v8M8 14V8a4 4 0 0 1 8 0v6M12 8V4M7 8a2 2 0 0 0 4 0M13 8a2 2 0 0 0 4 0" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "Larkana":
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" className="w-8 h-8 mb-2">
          <path d="M4 22h16M6 22V16h12v6M8 16V10h8v6M10 10V6a2 2 0 0 1 4 0v4M12 6V3" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    case "Rahim Yar Khan":
    default:
      return (
        <svg viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="1.5" className="w-8 h-8 mb-2">
          <path d="M6 22h12M8 22V10M16 22V10M8 10C8 6 16 6 16 10" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M12 10V4M12 4L10 6M12 4L14 6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
  }
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function LocationModal() {
  const {
    orderType,
    deliveryCity,
    deliveryArea,
    exactLocation,
    isLocationModalOpen,
    setOrderType,
    setDeliveryCity,
    setDeliveryArea,
    setExactLocation,
    setLocationModalOpen,
  } = useLocationStore();

  const [localType, setLocalType] = useState(orderType || "Delivery");
  const [localCity, setLocalCity] = useState(deliveryCity || "Karachi");
  const [localArea, setLocalArea] = useState(deliveryArea || "");
  const [isLocating, setIsLocating] = useState(false);
  
  const [showMap, setShowMap] = useState(false);
  const [tempCoords, setTempCoords] = useState(null);

  const overlayRef = useRef(null);
  const cardRef = useRef(null);

  // Modal MUST show if they haven't picked an orderType, OR if they selected Karachi but haven't chosen an area AND haven't chosen an exact map location
  const isMissingAreaForKarachi = deliveryCity === "Karachi" && !deliveryArea && !exactLocation;
  const shouldShow = isLocationModalOpen || orderType === null || isMissingAreaForKarachi;

  useEffect(() => {
    if (shouldShow) {
      setLocalType(orderType || "Delivery");
      setLocalCity(deliveryCity || "Karachi");
      setLocalArea(deliveryArea || "");
    }
  }, [shouldShow, orderType, deliveryCity, deliveryArea]);

  useEffect(() => {
    if (!shouldShow || !overlayRef.current || !cardRef.current) return;

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

  const handleClose = () => {
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

  const handleSelect = () => {
    const currentAreas = localCity === "Karachi" ? KARACHI_AREAS : [];
    
    // Validate if the selected city requires an area
    if (currentAreas.length > 0 && !localArea) {
      toast.error("Please select your area before confirming.");
      return;
    }

    setOrderType(localType);
    setDeliveryCity(localCity);
    setDeliveryArea(localArea);
    setExactLocation(null); // Clear map pin if they switch back to manual selection
    handleClose();
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setTempCoords({ lat: latitude, lng: longitude });
        setShowMap(true);
        setIsLocating(false);
      },
      (error) => {
        console.error("Geolocation error:", error);
        toast.error("Location permission denied. Please select manually.");
        setIsLocating(false);
      },
      { timeout: 10000 }
    );
  };

  const handleConfirmMap = (locationData) => {
    // locationData = { lat, lng, address }
    setExactLocation(locationData);
    
    // Attempt to match the detected address to our predefined cities and areas if possible
    const detectedCity = locationData.address || "";
    const matchedCity = CITIES.find(c => detectedCity.toLowerCase().includes(c.toLowerCase()));
    
    setOrderType(localType);
    setDeliveryCity(matchedCity || "Karachi"); 
    setDeliveryArea(""); 
    
    toast.success("Exact location pinned!");
    
    setShowMap(false);
    
    // Close Modal completely (removes blur)
    handleClose();
  };

  if (!shouldShow) return null;

  const currentAreas = localCity === "Karachi" ? KARACHI_AREAS : [];

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      style={{ opacity: 0 }}
    >
      <div
        className="absolute inset-0"
        onClick={(!orderType || (localCity === "Karachi" && !localArea && !exactLocation)) ? undefined : handleClose}
      />
      <div
        ref={cardRef}
        className="relative w-full max-w-[500px] bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col"
      >
        {showMap ? (
          <MapSelector 
            initialPosition={tempCoords} 
            onConfirm={handleConfirmMap} 
            onCancel={() => setShowMap(false)} 
          />
        ) : (
          <>
            <div className="p-6 flex flex-col items-center">
              <h2 className="text-[#1e293b] font-semibold text-[20px] mb-4">
                Select your order type
              </h2>
          
              {/* Toggle Switch */}
              <div className="flex bg-[#e2e8f0] rounded-full p-1 w-[260px] mb-6 relative">
                <div
                  className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-[#ed1c24] rounded-full transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                    localType === "Pickup" ? "translate-x-[100%]" : "translate-x-0"
                  }`}
                />
                <button
                  onClick={() => setLocalType("Delivery")}
                  className={`flex-1 py-2 text-[12px] font-bold rounded-full z-10 transition-colors duration-300 ${
                    localType === "Delivery" ? "text-white" : "text-[#475569]"
                  }`}
                >
                  DELIVERY
                </button>
                <button
                  disabled
                  title="Pickup is temporarily locked"
                  className={`flex-1 py-2 text-[12px] font-bold rounded-full z-10 transition-colors duration-300 flex items-center justify-center gap-1 opacity-50 cursor-not-allowed ${
                    localType === "Pickup" ? "text-white" : "text-[#475569]"
                  }`}
                >
                  <PiLockFill className="w-3.5 h-3.5 mb-0.5" /> PICK-UP
                </button>
              </div>

              <h3 className="text-[#334155] font-medium text-[15px] mb-3">
                Please select your location
              </h3>
              
              {/* Red Current Location Button */}
              <button
                onClick={handleUseCurrentLocation}
                disabled={isLocating}
                className="flex items-center justify-center gap-2 bg-[#ed1c24] hover:bg-[#dc2626] text-white px-5 py-2 rounded-full text-[13px] font-medium transition-all mb-8 disabled:opacity-80 disabled:cursor-wait"
              >
                {isLocating ? (
                  <PiSpinner className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <PiCrosshair className="w-4 h-4 text-white" />
                )}
                {isLocating ? "Detecting location..." : "Use Current Location"}
              </button>
              
              <div className="grid grid-cols-4 md:grid-cols-5 gap-3 md:gap-4 w-full mb-8 justify-center">
            {CITIES.map((city) => (
              <button
                key={city}
                onClick={() => {
                  setLocalCity(city);
                  setLocalArea("");
                }}
                className={`flex flex-col items-center justify-center p-2 pt-3 rounded-xl border transition-all duration-200 active:scale-95 ${
                  localCity === city
                    ? "border-[#ed1c24] bg-white"
                    : "border-gray-200 bg-white hover:border-gray-300"
                }`}
              >
                <CityIcon city={city} active={localCity === city} />
                <span
                  className={`text-[12px] mt-1 font-normal text-center leading-tight transition-colors ${
                    localCity === city ? "text-[#ed1c24]" : "text-[#1e293b]"
                  }`}
                >
                  {city}
                </span>
              </button>
            ))}
          </div>
              <div className="w-full relative px-2">
                <select
                  value={localArea}
                  onChange={(e) => setLocalArea(e.target.value)}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-md px-4 py-3 text-gray-800 text-[14px] font-normal focus:outline-none focus:border-[#ed1c24] transition-all cursor-pointer disabled:bg-gray-50 disabled:text-gray-400 disabled:cursor-not-allowed"
                  disabled={currentAreas.length === 0}
                >
                  <option value="" disabled>
                    {currentAreas.length > 0 ? "Select an area" : "Coming soon to this city"}
                  </option>
                  {currentAreas.map((area) => (
                    <option key={area} value={area}>
                      {area}
                    </option>
                  ))}
                </select>
                <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                  <svg width="12" height="8" viewBox="0 0 12 8" fill="none">
                    <path d="M1 1L6 6L11 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Footer Action */}
            <div className="px-6 py-4 bg-white border-t border-gray-100">
              <button
                onClick={handleSelect}
                className="w-full bg-[#ed1c24] hover:bg-[#dc2626] text-white font-medium py-3 rounded-lg text-[16px] transition-all active:scale-[0.98] duration-200"
              >
                Select
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
