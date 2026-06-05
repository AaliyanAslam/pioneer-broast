import Link from "next/link";
import Image from "next/image";
import { PiLockKeyFill } from "react-icons/pi";

const CATEGORIES = [
  // Unlocked (Left)
  {
    id: "broast",
    name: "Broast",
    image:
      "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=400&auto=format&fit=crop",
    slug: "broast",
  },
  {
    id: "burgers",
    name: "Burgers",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=400&auto=format&fit=crop",
    slug: "burgers",
  },
  {
    id: "sides",
    name: "Sides",
    image:
      "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=400&auto=format&fit=crop",
    slug: "sides",
  },
  {
    id: "drinks",
    name: "Drinks",
    image:
      "https://images.unsplash.com/photo-1544145945-f90425340c7e?q=80&w=400&auto=format&fit=crop",
    slug: "drinks",
  },

  // Locked (Right)
  {
    id: "deals",
    name: "Deals",
    image:
      "https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=400&auto=format&fit=crop",
    slug: "deals",
    locked: true,
  },
  {
    id: "wraps",
    name: "Wraps",
    image:
      "https://images.unsplash.com/photo-1626700051175-6818013e1d4f?q=80&w=400&auto=format&fit=crop",
    slug: "wraps",
    locked: true,
  },
  {
    id: "wings",
    name: "Wings",
    image:
      "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?q=80&w=400&auto=format&fit=crop",
    slug: "wings",
    locked: true,
  },
  {
    id: "pizza",
    name: "Pizza",
    image:
      "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?q=80&w=400&auto=format&fit=crop",
    slug: "pizza",
    locked: true,
  },
  {
    id: "rolls",
    name: "Rolls",
    image:
      "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?q=80&w=400&auto=format&fit=crop",
    slug: "rolls",
    locked: true,
  },
  {
    id: "desserts",
    name: "Desserts",
    image:
      "https://images.unsplash.com/photo-1551024601-bec78aea704b?q=80&w=400&auto=format&fit=crop",
    slug: "desserts",
    locked: true,
  },
  {
    id: "pasta",
    name: "Pasta",
    image:
      "https://images.unsplash.com/photo-1473093295043-cdd812d0e601?q=80&w=400&auto=format&fit=crop",
    slug: "pasta",
    locked: true,
  },
];

export default function QuickFilters() {
  return (
    <section className="py-4 sm:py-8 sm:px-12 max-w-[1400px] sm:max-w-420 mx-auto">
   

      {/* Scrollable Container */}
      <div className="flex overflow-x-auto sm:justify-center gap-2 sm:gap-6 pb-4 pt-2 px-4 sm:px-0 snap-x snap-mandatory touch-pan-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
        {CATEGORIES.map((cat) => {
          const content = (
            <>
              {/* Circle Image */}
              <div className={`relative w-20 h-20 sm:w-26 sm:h-26 rounded-full overflow-hidden bg-zinc-100 border-2 mx-auto transition-all duration-200 ${cat.locked ? 'border-zinc-200 opacity-60' : 'border-zinc-200 group-hover:border-[#C0392B] shadow-sm group-hover:shadow-md'}`}>
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className={`object-cover transition-transform duration-500 ease-out ${cat.locked ? 'grayscale' : 'group-hover:scale-110'}`}
                  sizes="104px"
                />
                {/* Subtle overlay on hover */}
                {!cat.locked && <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-all duration-200 rounded-full" />}
                
                {/* Lock Overlay */}
                {cat.locked && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full backdrop-blur-[1px]">
                    <div className="w-8 h-8 sm:w-10 sm:h-10 bg-black/50 rounded-full flex items-center justify-center backdrop-blur-md border border-white/20">
                      <PiLockKeyFill className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                    </div>
                  </div>
                )}
              </div>

              {/* Label */}
              <p className={`mt-2 text-center text-xs sm:text-sm font-bold tracking-widest uppercase leading-tight transition-colors duration-200 ${cat.locked ? 'text-zinc-400' : 'text-zinc-800 group-hover:text-[#C0392B]'}`}>
                {cat.name}
              </p>
            </>
          );

          return cat.locked ? (
            <div
              key={cat.id}
              className="snap-start shrink-0 block w-20 sm:w-28 cursor-not-allowed select-none"
              title={`${cat.name} - Coming Soon`}
            >
              {content}
            </div>
          ) : (
            <Link
              href={`/#${cat.slug}`}
              key={cat.id}
              className="snap-start shrink-0 group block transition-transform duration-200 active:scale-95 cursor-pointer w-20 sm:w-28"
            >
              {content}
            </Link>
          );
        })}
      </div>
    </section>
  );
}
