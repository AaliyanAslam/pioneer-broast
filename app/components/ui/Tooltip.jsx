"use client";

export default function Tooltip({ children, text, position = "top", className = "inline-flex" }) {
  if (!text) return children;

  const positions = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2 origin-bottom",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2 origin-top",
    left: "right-full top-1/2 -translate-y-1/2 mr-2 origin-right",
    right: "left-full top-1/2 -translate-y-1/2 ml-2 origin-left",
  };

  return (
    <div className={`group relative ${className}`}>
      {children}
      <div 
        className={`pointer-events-none absolute ${positions[position]} opacity-0 scale-95 transition-all duration-150 ease-out group-hover:opacity-100 group-hover:scale-100 bg-zinc-950 border border-zinc-800 text-zinc-100 text-[11px] font-medium tracking-wide px-3 py-1.5 rounded-md shadow-xl whitespace-nowrap z-50`}
      >
        {text}
      </div>
    </div>
  );
}
