"use client";

import { useEffect, useState } from "react";
import { MapContainer, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { PiMapPinFill } from "react-icons/pi";

// Component to handle map movements
function LocationMarker({ position, setPosition }) {
  const map = useMap();

  useEffect(() => {
    if (position && !map.hasSetInitialCenter) {
      map.flyTo([position.lat, position.lng], map.getZoom());
      map.hasSetInitialCenter = true; // prevent constant flying back on move
    }
  }, [position, map]);

  useEffect(() => {
    map.on("moveend", () => {
      const center = map.getCenter();
      setPosition({ lat: center.lat, lng: center.lng });
    });
  }, [map, setPosition]);

  return null;
}

export default function MapSelector({ initialPosition, onConfirm, onCancel }) {
  const [position, setPosition] = useState(initialPosition || { lat: 24.8607, lng: 67.0011 });
  const [address, setAddress] = useState("");
  const [isFetching, setIsFetching] = useState(true);

  useEffect(() => {
    let isMounted = true;
    
    const fetchAddress = async () => {
      try {
        setIsFetching(true);
        const res = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.lat}&lon=${position.lng}`
        );
        const data = await res.json();
        
        if (isMounted) {
          setAddress(data.display_name || "Unknown Location");
          setIsFetching(false);
        }
      } catch (error) {
        if (isMounted) {
          if (!address) setAddress("Unable to fetch address");
          setIsFetching(false);
        }
      }
    };
    
    // Debounce the fetch
    const timeout = setTimeout(fetchAddress, 600);
    return () => {
      isMounted = false;
      clearTimeout(timeout);
    };
  }, [position.lat, position.lng]);

  return (
    <div className="flex flex-col w-full bg-white rounded-3xl overflow-hidden relative">
      <div className="relative w-full h-[350px] md:h-[400px]">
        <MapContainer
          center={[position.lat, position.lng]}
          zoom={16}
          scrollWheelZoom={true}
          style={{ height: "100%", width: "100%", zIndex: 10 }}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <LocationMarker position={position} setPosition={setPosition} />
        </MapContainer>
        
        {/* Center fixed pin */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-full z-400 pointer-events-none drop-shadow-md">
          <PiMapPinFill className="w-10 h-10 text-[#ff1900] animate-bounce" />
        </div>
      </div>
      
      <div className="flex flex-col p-6 bg-white z-500 border-t border-gray-100 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
        <h3 className="font-semibold text-gray-800 mb-1 text-[15px]">Confirm Exact Location</h3>
        <p className="text-[12px] text-gray-400 mb-2">You can edit the address below if it's slightly off.</p>
        
        <textarea 
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="text-[13px] text-gray-700 font-medium mb-5 h-16 p-2 border border-gray-200 rounded-md w-full resize-none focus:outline-none focus:border-[#ed1c24] focus:ring-1 focus:ring-[#ed1c24]"
          placeholder="Enter your exact street/house number..."
        />
        
        <div className="flex gap-3">
          <button 
            onClick={onCancel}
            className="flex-1 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => onConfirm({ ...position, address: address || "Selected Location" })}
            disabled={isFetching}
            className={`flex-1 py-3 rounded-lg text-white font-medium transition-all ${
              isFetching ? "bg-gray-300 cursor-not-allowed" : "bg-[#ed1c24] hover:bg-[#dc2626] active:scale-[0.98]"
            }`}
          >
            {isFetching ? "Locating..." : "Confirm Location"}
          </button>
        </div>
      </div>
    </div>
  );
}
