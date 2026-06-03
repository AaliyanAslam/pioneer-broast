"use client";

import React, { useState, useEffect, useRef } from "react";
import { PiMagnifyingGlass, PiCircleNotch, PiX, PiSparkle } from "react-icons/pi";
import { supabase } from "@/app/lib/supabase";
import Link from "next/link";
import { gsap } from "gsap";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [recommended, setRecommended] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  const dropdownRef = useRef(null);
  const searchContainerRef = useRef(null);

  // Debounce API Call
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length >= 2) {
        fetchResults(query);
      } else {
        setResults([]);
        setRecommended([]);
        setShowDropdown(false);
        setIsLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchResults = async (searchQuery) => {
    setIsLoading(true);
    setShowDropdown(true);

    // Fetch active products matching the query
    const { data, error } = await supabase
      .from("products")
      .select("id, name, slug, price, discount_price, images")
      .eq("is_active", true)
      .ilike("name", `%${searchQuery}%`)
      .limit(5); // Show max 5 results

    if (!error && data && data.length > 0) {
      setResults(data);
      setRecommended([]);
    } else {
      setResults([]);
      // Fetch 3 latest/popular products as a fallback
      const { data: recData } = await supabase
        .from("products")
        .select("id, name, slug, price, discount_price, images")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      setRecommended(recData || []);
    }

    setIsLoading(false);
  };

  // GSAP Animation for Dropdown Appearance
  useEffect(() => {
    if (showDropdown && dropdownRef.current) {
      gsap.fromTo(
        dropdownRef.current,
        { opacity: 0, y: -15, scale: 0.98 },
        { opacity: 1, y: 0, scale: 1, duration: 0.4, ease: "back.out(1.2)" },
      );
    }
  }, [showDropdown, results, recommended]);

  // Click Outside to Close
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        searchContainerRef.current &&
        !searchContainerRef.current.contains(event.target)
      ) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getParsedImages = (imgData) => {
    if (!imgData) return ["https://via.placeholder.com/150"];
    if (Array.isArray(imgData)) return imgData;
    try {
      const parsed = JSON.parse(imgData);
      return Array.isArray(parsed) ? parsed : [imgData];
    } catch {
      return [imgData];
    }
  };

  const handleClear = () => {
    setQuery("");
    setResults([]);
    setRecommended([]);
    setShowDropdown(false);
  };

  const renderProductItem = (product) => {
    const images = getParsedImages(product.images);
    const displayPrice = product.discount_price || product.price;
    return (
      <Link
        key={product.id}
        href={`/product/${product.slug}`}
        onClick={() => setShowDropdown(false)}
        className="flex items-center gap-4 p-2.5 hover:bg-zinc-50 rounded-xl transition-colors group border border-transparent hover:border-zinc-200"
      >
        <div className="relative w-14 h-14 bg-zinc-100 rounded-lg overflow-hidden shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={images[0]}
            alt={product.name}
            className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-500"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="text-[15px] font-bold text-zinc-900 line-clamp-1 group-hover:text-black transition-colors">
            {product.name}
          </h4>
          <p className="text-[13px] font-black tracking-wide text-zinc-500 mt-0.5">
            Rs. {displayPrice.toLocaleString()}
          </p>
        </div>
      </Link>
    );
  };

  return (
    <div className="relative w-full max-w-lg mx-auto z-50" ref={searchContainerRef}>
      {/* Premium Search Input Box */}
      <div className="relative flex items-center w-full bg-white rounded-full border border-zinc-300 focus-within:border-black focus-within:ring-4 focus-within:ring-black/5 transition-all shadow-sm group">
        <div className="pl-3.5 sm:pl-4 pr-2 text-zinc-400 group-focus-within:text-black transition-colors">
          <PiMagnifyingGlass className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            const val = e.target.value.trim();
            if (val.length >= 2 && !showDropdown) {
              setShowDropdown(true);
            } else if (val.length < 2) {
              setShowDropdown(false);
            }
          }}
          placeholder="Search premium gear..."
          className="w-full bg-transparent border-none py-2.5 sm:py-3 text-[13px] sm:text-[14px] font-medium text-black focus:outline-none placeholder:text-zinc-400 placeholder:font-normal"
        />
        <div className="pr-4 flex items-center justify-center min-w-[40px]">
          {isLoading ? (
            <PiCircleNotch className="w-5 h-5 text-black animate-spin" />
          ) : query ? (
            <button
              onClick={handleClear}
              className="p-1.5 hover:bg-zinc-100 rounded-full text-zinc-500 hover:text-black transition-colors"
            >
              <PiX className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      </div>

      {/* Dropdown Results */}
      {showDropdown && query.trim().length >= 2 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-2 bg-white border border-zinc-200 shadow-[0_20px_60px_-10px_rgba(0,0,0,0.2)] rounded-2xl overflow-hidden z-50 transform origin-top"
        >
          {isLoading && results.length === 0 && recommended.length === 0 ? (
            <div className="p-8 text-center text-zinc-500 text-sm flex flex-col items-center gap-3">
              <PiCircleNotch className="w-8 h-8 animate-spin text-zinc-300" />
              <span className="font-medium tracking-wide animate-pulse">
                Scanning catalog...
              </span>
            </div>
          ) : results.length > 0 ? (
            <div className="max-h-[400px] overflow-y-auto custom-scrollbar p-2 space-y-1">
              {results.map(renderProductItem)}

              <div className="bg-zinc-50 p-3 mt-2 rounded-xl text-center border border-zinc-100">
                <span className="text-[11px] font-bold uppercase tracking-widest text-zinc-500">
                  {results.length === 1 ? "1 match found" : `${results.length} matches found`}
                </span>
              </div>
            </div>
          ) : recommended.length > 0 ? (
            <div className="p-2">
              <div className="p-6 text-center border-b border-zinc-100 mb-2">
                <span className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-zinc-100 mb-3">
                  <PiMagnifyingGlass className="w-5 h-5 text-zinc-400" />
                </span>
                <p className="font-bold text-black text-base mb-1">
                  No exact matches
                </p>
                <p className="text-sm text-zinc-500">
                  We couldn't find "{query}".
                </p>
              </div>

              <div className="px-3 pt-3 pb-2 flex items-center gap-2">
                <PiSparkle className="w-4 h-4 text-[#C0E212]" />
                <p className="text-xs font-bold text-zinc-800 uppercase tracking-widest">
                  You Might Like
                </p>
              </div>

              <div className="space-y-1">
                {recommended.map(renderProductItem)}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}
