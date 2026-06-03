import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    id: "broast",
    name: "Broast",
    image:
      "https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?q=80&w=2070&auto=format&fit=crop",
    slug: "broast",
  },
  {
    id: "burgers",
    name: "Burgers",
    image:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?q=80&w=1999&auto=format&fit=crop",
    slug: "burgers",
  },
  {
    id: "deals",
    name: "Deals",
    image:
      "https://images.unsplash.com/photo-1606755962773-d324e0a13086?q=80&w=1974&auto=format&fit=crop",
    slug: "deals",
  },
  {
    id: "sides",
    name: "Sides",
    image:
      "https://images.unsplash.com/photo-1576107232684-1279f390859f?q=80&w=2047&auto=format&fit=crop",
    slug: "sides",
  },
];

export default function QuickFilters() {
  return (
    <section className="py-8 sm:py-12 px-4 sm:px-12 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6 sm:mb-8">
        <h2 className="text-xl sm:text-3xl font-extrabold text-black tracking-tight">
          Shop by Category
        </h2>
      </div>

      {/* Scrollable Container for Mobile */}
      <div className="flex overflow-x-auto gap-4 sm:gap-6 lg:gap-8 pb-4 snap-x snap-mandatory [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] scrollbar-none">
        {CATEGORIES.map((cat) => (
          <Link
            href={cat.slug === "shop" ? "/shop" : `/category/${cat.slug}`}
            key={cat.id}
            className="snap-start w-28 sm:w-40 md:w-48 lg:w-56 shrink-0 group block transition-transform duration-300 active:scale-95 cursor-pointer"
          >
            {/* Image Container */}
            <div className="relative aspect-square rounded-2xl sm:rounded-3xl overflow-hidden bg-zinc-100 shadow-sm border border-zinc-200 group-hover:shadow-md group-hover:border-zinc-300 transition-all duration-200 active:ring-2 active:ring-[#C0E212] active:ring-offset-2">
              <div className="absolute inset-0 z-0">
                <Image
                  src={cat.image}
                  alt={cat.name}
                  fill
                  className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                />
              </div>

              {/* Overlay Gradient (Hidden on Mobile) */}
              <div className="hidden sm:block absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent z-10 transition-opacity duration-300 group-hover:opacity-90" />

              {/* Text Content (Overlay for Desktop) */}
              <div className="hidden sm:flex absolute inset-0 z-20 items-end p-6 lg:p-8">
                <div>
                  <h3 className="text-white font-extrabold text-xl lg:text-2xl tracking-wide uppercase">
                    {cat.name}
                  </h3>
                  <div className="w-0 h-0.5 bg-[#C0E212] mt-2 transition-all duration-300 group-hover:w-12"></div>
                </div>
              </div>
            </div>

            {/* Text Content (Below Image for Mobile) */}
            <div className="sm:hidden mt-2.5 text-center px-1">
              <h3 className="text-zinc-900 font-extrabold text-[11px] tracking-widest uppercase">
                {cat.name}
              </h3>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
