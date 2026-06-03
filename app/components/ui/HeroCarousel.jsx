"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";

const BANNERS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?q=80&w=2071&auto=format&fit=crop",
    title: "Next-Gen Workstation",
    subtitle: "Power meets elegance. Upgrade your desk setup.",
    buttonText: "Shop Now",
    buttonLink: "#featured",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=2070&auto=format&fit=crop",
    title: "Immersive Audio",
    subtitle: "Experience sound like never before.",
    buttonText: "Explore Audio",
    buttonLink: "#featured",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1964&auto=format&fit=crop",
    title: "Smart Wearables",
    subtitle: "Track your fitness in style.",
    buttonText: "View Watches",
    buttonLink: "#featured",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1603302576837-37561b2e2302?q=80&w=2068&auto=format&fit=crop",
    title: "Premium Accessories",
    subtitle: "The perfect companions for your devices.",
    buttonText: "Shop Accessories",
    buttonLink: "#featured",
  },
];

export default function HeroCarousel() {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  // Update indicator dots when scrolling
  const handleScroll = () => {
    if (scrollRef.current) {
      const scrollLeft = scrollRef.current.scrollLeft;
      const width = scrollRef.current.offsetWidth;
      const index = Math.round(scrollLeft / width);
      setCurrentIndex(index);
    }
  };

  const scrollToIndex = (index) => {
    if (scrollRef.current) {
      const width = scrollRef.current.offsetWidth;
      scrollRef.current.scrollTo({
        left: width * index,
        behavior: "smooth",
      });
      setCurrentIndex(index);
    }
  };

  // Optional: Auto-play functionality
  useEffect(() => {
    const timer = setInterval(() => {
      let nextIndex = (currentIndex + 1) % BANNERS.length;
      scrollToIndex(nextIndex);
    }, 5000); // Change slide every 5 seconds
    
    return () => clearInterval(timer);
  }, [currentIndex]);

  return (
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 mt-6 rounded-2xl overflow-hidden group">
      
      {/* Carousel Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        className="flex overflow-x-auto snap-x snap-mandatory hide-scrollbar rounded-2xl h-[350px] sm:h-[500px] lg:h-[600px] relative"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {BANNERS.map((banner, index) => (
          <div 
            key={banner.id} 
            className="w-full shrink-0 snap-center relative"
          >
            {/* Background Image */}
            <div className="absolute inset-0 bg-black">
              <Image 
                src={banner.image} 
                alt={banner.title} 
                fill 
                className="object-cover opacity-60 transition-transform duration-700 ease-out hover:scale-105"
                priority={index === 0}
              />
            </div>

            {/* Overlay Gradients for readability */}
            <div className="absolute inset-0 bg-linear-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute inset-0 bg-linear-to-r from-black/90 via-black/40 to-transparent sm:w-2/3 pointer-events-none" />

            {/* Content Container */}
            <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-16 lg:p-24 pb-16 sm:pb-24">
              <h1 className="text-[28px] leading-tight sm:text-5xl md:text-6xl font-extrabold text-white mb-3 sm:mb-4 tracking-tight drop-shadow-md">
                {banner.title}
              </h1>
              <p className="text-sm sm:text-xl text-zinc-200 mb-6 sm:mb-8 max-w-2xl drop-shadow-md">
                {banner.subtitle}
              </p>
              <div>
                <Link 
                  href={banner.buttonLink} 
                  className="inline-block bg-[#C0E212] text-black font-extrabold px-6 py-3 sm:px-10 sm:py-4 text-[13px] sm:text-base rounded-md active:rounded-3xl hover:bg-[#a5c20e] active:scale-95 transition-all shadow-lg"
                >
                  {banner.buttonText}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Navigation Buttons (Desktop only) */}
      <button 
        onClick={() => scrollToIndex(Math.max(currentIndex - 1, 0))}
        className={`absolute left-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 hidden sm:block disabled:opacity-0 ${currentIndex === 0 ? "pointer-events-none" : ""}`}
      >
        <PiCaretLeft className="w-6 h-6" />
      </button>

      <button 
        onClick={() => scrollToIndex(Math.min(currentIndex + 1, BANNERS.length - 1))}
        className={`absolute right-8 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 hidden sm:block disabled:opacity-0 ${currentIndex === BANNERS.length - 1 ? "pointer-events-none" : ""}`}
      >
        <PiCaretRight className="w-6 h-6" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentIndex === idx 
                ? "w-8 h-2 bg-[#C0E212]" 
                : "w-2 h-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
