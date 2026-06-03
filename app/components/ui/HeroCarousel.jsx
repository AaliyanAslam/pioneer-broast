"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";

const BANNERS = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1626082895617-2c63c7b998f5?q=80&w=2070&auto=format&fit=crop",
    title: "Crispy Pioneer Broast",
    subtitle: "The crunch you've been craving all day.",
    buttonText: "Order Now",
    buttonLink: "#featured",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1586190848861-99aa4a171e90?q=80&w=2080&auto=format&fit=crop",
    title: "Juicy Zinger Burgers",
    subtitle: "Spicy, crispy, and packed with flavor.",
    buttonText: "Explore Burgers",
    buttonLink: "#featured",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1594212691516-7d686f0283c7?q=80&w=2070&auto=format&fit=crop",
    title: "Sizzling Family Deals",
    subtitle: "Perfect meals for sharing with everyone.",
    buttonText: "View Deals",
    buttonLink: "#featured",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?q=80&w=2070&auto=format&fit=crop",
    title: "Crispy Hot Sides",
    subtitle: "The perfect companions for your meal.",
    buttonText: "Shop Sides",
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
