"use client";

import React, { useRef, useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { PiCaretLeft, PiCaretRight } from "react-icons/pi";

const BANNERS = [
  {
    id: 1,
    image: "/b1.webp",
    href: "/#burgers",
  },
  {
    id: 2,
    image: "/b2.webp",
    href: "/#broast",
  },
  {
    id: 3,
    image: "/b3.webp",
    href: "/#burgers",
  },
];

export default function HeroCarousel() {
  const scrollRef = useRef(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [hasDragged, setHasDragged] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

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

  const handleMouseDown = (e) => {
    setIsDragging(true);
    setHasDragged(false); // Reset drag state on fresh click
    setStartX(e.pageX - scrollRef.current.offsetLeft);
    setScrollLeft(scrollRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    e.preventDefault(); // Prevent text selection/ghost drag
    setHasDragged(true); // Mark that a drag is actively occurring
    const x = e.pageX - scrollRef.current.offsetLeft;
    const walk = (x - startX) * 2; // scroll speed multiplier
    scrollRef.current.scrollLeft = scrollLeft - walk;
  };

  return (
    <div className="select-none relative max-w-[1400px] sm:max-w-400 mx-auto sm:px-6 mt-4 sm:mt-6 sm:rounded-2xl overflow-hidden group">
      
      {/* Carousel Container */}
      <div 
        ref={scrollRef}
        onScroll={handleScroll}
        onMouseDown={handleMouseDown}
        onMouseLeave={handleMouseLeave}
        onMouseUp={handleMouseUp}
        onMouseMove={handleMouseMove}
        className={`flex overflow-x-auto hide-scrollbar sm:rounded-2xl relative gap-3 sm:gap-0 px-4 sm:px-0 ${isDragging ? '' : 'snap-x snap-mandatory scroll-smooth'}`}
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {BANNERS.map((banner, index) => (
          <div 
            key={banner.id} 
            className="w-[95%] sm:w-full shrink-0 snap-center relative aspect-video sm:aspect-video lg:aspect-21/9 xl:aspect-2.5/1 rounded-2xl sm:rounded-none overflow-hidden block"
          >
            {/* Background Image */}
            <Link 
              href={banner.href} 
              className="absolute inset-0 block cursor-pointer"
              onClick={(e) => {
                if (hasDragged) {
                  e.preventDefault(); // Don't navigate if user was dragging
                }
              }}
              draggable={false}
            >
              <Image 
                src={banner.image} 
                alt={`Hero Banner ${index + 1}`} 
                fill 
                className="object-cover transition-transform duration-1000 ease-out hover:scale-[1.02] pointer-events-none"
                priority={index === 0}
                quality={100}
                unoptimized={true}
                draggable={false}
              />
            </Link>
          </div>
        ))}
      </div>

      {/* Navigation Buttons (Desktop only) */}
      <button 
        onClick={() => scrollToIndex(Math.max(currentIndex - 1, 0))}
        className={`absolute left-16 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 hidden sm:block disabled:opacity-0 ${currentIndex === 0 ? "pointer-events-none" : ""}`}
      >
        <PiCaretLeft className="w-6 h-6" />
      </button>

      <button 
        onClick={() => scrollToIndex(Math.min(currentIndex + 1, BANNERS.length - 1))}
        className={`absolute right-16 top-1/2 -translate-y-1/2 bg-white/20 hover:bg-white/40 backdrop-blur-md p-3 rounded-full text-white transition-all opacity-0 group-hover:opacity-100 hidden sm:block disabled:opacity-0 ${currentIndex === BANNERS.length - 1 ? "pointer-events-none" : ""}`}
      >
        <PiCaretRight className="w-6 h-6" />
      </button>

      {/* Indicator Dots */}
      <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
        {BANNERS.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollToIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              currentIndex === idx 
                ? "w-6 sm:w-8 h-1.5 sm:h-2 bg-[#C0E212]" 
                : "w-1.5 sm:w-2 h-1.5 sm:h-2 bg-white/50 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>

    </div>
  );
}
