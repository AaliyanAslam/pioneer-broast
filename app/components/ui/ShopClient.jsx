"use client";
import { useState, useMemo, useEffect, useRef, useCallback } from "react";
import ProductCard from "./ProductCard";
import { PiSlidersHorizontal, PiX, PiCaretDown } from "react-icons/pi";

const CATEGORIES = ["All", "Smartwatches", "Earbuds", "Accessories"];

export default function ShopClient({ initialProducts }) {
  const [categoryFilter, setCategoryFilter] = useState("All");
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(30000);
  const [sortBy, setSortBy] = useState("newest");
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const trackRef = useRef(null);
  const draggingRef = useRef(null); // 'min' | 'max' | null

  const clampToTrack = useCallback((clientX) => {
    const track = trackRef.current;
    if (!track) return null;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    return Math.round(ratio * 30000 / 100) * 100; // snap to 100s
  }, []);

  useEffect(() => {
    const onPointerMove = (e) => {
      if (!draggingRef.current) return;
      e.preventDefault();
      const val = clampToTrack(e.clientX);
      if (val === null) return;
      if (draggingRef.current === 'min') {
        setMinPrice((prev) => Math.min(val, maxPrice - 200));
      } else {
        setMaxPrice((prev) => Math.max(val, minPrice + 200));
      }
    };
    const onPointerUp = () => {
      draggingRef.current = null;
      document.body.style.userSelect = '';
    };
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    return () => {
      document.removeEventListener('pointermove', onPointerMove);
      document.removeEventListener('pointerup', onPointerUp);
    };
  }, [clampToTrack, minPrice, maxPrice]);

  const startDrag = (which, e) => {
    e.preventDefault();
    draggingRef.current = which;
    document.body.style.userSelect = 'none';
  };

  // Filter and Sort logic
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // 1. Category Filter
    if (categoryFilter !== "All") {
      result = result.filter((p) => {
        const catStr = categoryFilter.toLowerCase();
        // Handle plural matching (Smartwatches -> smartwatch, Earbuds -> earbud)
        const searchStr = catStr.endsWith("es") ? catStr.slice(0, -2) : catStr.endsWith("s") ? catStr.slice(0, -1) : catStr;
        return (
          p.category?.toLowerCase() === catStr || 
          p.slug?.toLowerCase().includes(searchStr)
        );
      });
    }

    // 2. Price Filter
    result = result.filter((p) => {
      const price = p.discount_price || p.price;
      return price >= minPrice && price <= maxPrice;
    });

    // 3. Sorting
    switch (sortBy) {
      case "price_asc":
        result.sort((a, b) => (a.discount_price || a.price) - (b.discount_price || b.price));
        break;
      case "price_desc":
        result.sort((a, b) => (b.discount_price || b.price) - (a.discount_price || a.price));
        break;
      case "newest":
      default:
        // Already sorted by newest from server
        break;
    }

    return result;
  }, [initialProducts, categoryFilter, minPrice, maxPrice, sortBy]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (isMobileFilterOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileFilterOpen]);

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Categories */}
      <div>
        <h3 className="text-[13px] font-semibold text-zinc-900 uppercase tracking-widest mb-4">Categories</h3>
        <div className="space-y-3">
          {CATEGORIES.map((cat) => (
            <label key={cat} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center w-5 h-5">
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={categoryFilter === cat}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="peer appearance-none w-5 h-5 border-2 border-zinc-300 rounded-full checked:border-black transition-colors"
                />
                <div className="absolute w-2.5 h-2.5 bg-black rounded-full opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
              </div>
              <span className={`text-[14px] font-medium transition-colors ${categoryFilter === cat ? 'text-black' : 'text-zinc-500 group-hover:text-zinc-800'}`}>
                {cat}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div className="pt-6 border-t border-zinc-100">
        <h3 className="text-[13px] font-semibold text-zinc-900 uppercase tracking-widest mb-6">Price Range</h3>
        
        {/* Custom Dual-Thumb Slider */}
        <div 
          ref={trackRef}
          className="relative h-[3px] bg-zinc-200 rounded-full mb-3 cursor-pointer"
          onClick={(e) => {
            const val = clampToTrack(e.clientX);
            if (val === null) return;
            // Click on track: move whichever thumb is closer
            const distMin = Math.abs(val - minPrice);
            const distMax = Math.abs(val - maxPrice);
            if (distMin < distMax) {
              setMinPrice(Math.min(val, maxPrice - 200));
            } else {
              setMaxPrice(Math.max(val, minPrice + 200));
            }
          }}
        >
          {/* Active Track Fill */}
          <div 
            className="absolute h-full bg-zinc-800 rounded-full pointer-events-none"
            style={{ 
              left: `${(minPrice / 30000) * 100}%`, 
              right: `${100 - (maxPrice / 30000) * 100}%` 
            }}
          />
          
          {/* Min Thumb */}
          <div
            onPointerDown={(e) => startDrag('min', e)}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-[18px] bg-white border-[2.5px] border-zinc-800 rounded-full cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform z-30 touch-none"
            style={{ left: `${(minPrice / 30000) * 100}%` }}
          />
          
          {/* Max Thumb */}
          <div
            onPointerDown={(e) => startDrag('max', e)}
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-[18px] h-[18px] bg-white border-[2.5px] border-zinc-800 rounded-full cursor-grab active:cursor-grabbing shadow-sm hover:scale-110 transition-transform z-30 touch-none"
            style={{ left: `${(maxPrice / 30000) * 100}%` }}
          />
        </div>

        {/* Slider Range Labels */}
        <div className="flex justify-between items-center text-[11px] font-medium text-zinc-400 mb-6">
          <span>0</span>
          <span>30,000</span>
        </div>

        {/* From / To Input Boxes */}
        <div className="flex items-center gap-2">
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 block">From</label>
            <div className="flex items-center border-2 border-zinc-200 rounded-lg overflow-hidden focus-within:border-black transition-colors">
              <span className="text-[11px] font-semibold text-zinc-400 pl-2.5 shrink-0 select-none">Rs.</span>
              <input 
                type="number"
                min="0"
                max="30000"
                value={minPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val) && val >= 0) setMinPrice(Math.min(val, maxPrice - 200));
                }}
                className="w-full bg-transparent py-2.5 pl-1 pr-2 text-[14px] font-semibold text-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
          <span className="text-zinc-300 mt-5 select-none">—</span>
          <div className="flex-1">
            <label className="text-[10px] font-semibold text-zinc-400 uppercase tracking-wider mb-1 block">To</label>
            <div className="flex items-center border-2 border-zinc-200 rounded-lg overflow-hidden focus-within:border-black transition-colors">
              <span className="text-[11px] font-semibold text-zinc-400 pl-2.5 shrink-0 select-none">Rs.</span>
              <input 
                type="number"
                min="0"
                max="30000"
                value={maxPrice}
                onChange={(e) => {
                  const val = Number(e.target.value);
                  if (!isNaN(val) && val >= 0) setMaxPrice(Math.max(val, minPrice + 200));
                }}
                className="w-full bg-transparent py-2.5 pl-1 pr-2 text-[14px] font-semibold text-black focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-420 mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      {/* Header & Mobile Toggle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-black tracking-tight uppercase">Premium Gear</h1>
          <p className="text-sm text-zinc-500 mt-2 font-medium">Explore our complete collection.</p>
        </div>

        {/* Mobile Filter Toggle */}
        <button
          onClick={() => setIsMobileFilterOpen(true)}
          className="lg:hidden flex items-center justify-between w-full bg-zinc-50 border border-zinc-200 p-3.5 rounded-xl active:scale-[0.98] transition-transform"
        >
          <div className="flex items-center gap-2">
            <PiSlidersHorizontal className="w-5 h-5 text-black" />
            <span className="text-[13px] font-bold text-black uppercase tracking-widest">Filter & Sort</span>
          </div>
          <span className="bg-white border border-zinc-200 text-zinc-700 text-[10px] font-bold px-2.5 py-1 rounded-md shadow-sm">
            {filteredProducts.length} Items
          </span>
        </button>

        {/* Desktop Sort */}
        <div className="hidden lg:flex items-center gap-3">
          <span className="text-[12px] font-semibold text-zinc-500 uppercase tracking-widest">Sort By:</span>
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="appearance-none bg-zinc-50 border border-zinc-200 text-sm font-medium text-black py-2 pl-4 pr-10 rounded-lg focus:outline-none focus:ring-2 focus:ring-black/5 cursor-pointer"
            >
              <option value="newest">Newest Arrivals</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
            </select>
            <PiCaretDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Desktop Sidebar */}
        <div className="hidden lg:block w-64 shrink-0">
          <div className="sticky top-24 bg-white border border-zinc-100 shadow-sm rounded-2xl p-6">
            <FilterContent />
          </div>
        </div>

        {/* Product Grid */}
        <div className="flex-1">
          {/* Active Filters Summary (Desktop) */}
          <div className="hidden lg:flex items-center justify-between mb-6 pb-6 border-b border-zinc-100">
            <p className="text-sm text-zinc-500 font-medium">Showing <span className="text-black font-bold">{filteredProducts.length}</span> {filteredProducts.length === 1 ? 'product' : 'products'}</p>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="bg-zinc-50 border border-dashed border-zinc-200 rounded-3xl py-20 flex flex-col items-center justify-center text-center px-4">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm border border-zinc-100 mb-4">
                <PiSlidersHorizontal className="w-8 h-8 text-zinc-400" />
              </div>
              <h3 className="text-lg font-bold text-black mb-2">No matching products</h3>
              <p className="text-sm text-zinc-500 max-w-sm">Try adjusting your filters or price range to find what you're looking for.</p>
              <button 
                onClick={() => { setCategoryFilter("All"); setMinPrice(0); setMaxPrice(30000); }}
                className="mt-6 text-[12px] font-bold text-black bg-[#C0E212] px-6 py-2.5 rounded-full uppercase tracking-widest hover:bg-[#a6c40e] transition-colors"
              >
                Clear Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {isMobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end">
          <div 
            className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="relative w-[85%] max-w-[320px] h-full bg-white flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 border-l border-zinc-200">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-5 border-b border-zinc-100 bg-white">
              <h2 className="text-[15px] font-extrabold uppercase tracking-widest text-black">Filter & Sort</h2>
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 bg-zinc-50 hover:bg-zinc-100 rounded-full text-zinc-500 hover:text-black transition-colors"
              >
                <PiX className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              {/* Mobile Sort By */}
              <div className="mb-8">
                <h3 className="text-[13px] font-semibold text-zinc-900 uppercase tracking-widest mb-4">Sort By</h3>
                <div className="relative">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full appearance-none bg-zinc-50 border border-zinc-200 text-sm font-medium text-black py-3.5 pl-4 pr-10 rounded-xl focus:outline-none focus:ring-2 focus:ring-black/5"
                  >
                    <option value="newest">Newest Arrivals</option>
                    <option value="price_asc">Price: Low to High</option>
                    <option value="price_desc">Price: High to Low</option>
                  </select>
                  <PiCaretDown className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-400 pointer-events-none" />
                </div>
              </div>

              <FilterContent />
            </div>

            {/* Drawer Footer */}
            <div className="p-5 border-t border-zinc-100 bg-zinc-50">
              <button 
                onClick={() => setIsMobileFilterOpen(false)}
                className="w-full bg-[#C0E212] text-black py-4 rounded-xl text-[13px] font-bold uppercase tracking-widest hover:bg-[#a6c40e] transition-colors shadow-md border border-[#9ab50e]/30 flex items-center justify-center gap-2"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
