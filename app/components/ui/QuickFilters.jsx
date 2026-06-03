import Link from "next/link";
import Image from "next/image";

const CATEGORIES = [
  {
    id: "smartwatches",
    name: "Smartwatches",
    image:
      "https://images.unsplash.com/photo-1579586337278-3befd40fd17a?q=80&w=2072&auto=format&fit=crop",
    slug: "smartwatches",
  },
  {
    id: "earbuds",
    name: "Earbuds",
    image:
      "https://images.unsplash.com/photo-1588423771073-b8903fbb85b5?q=80&w=1932&auto=format&fit=crop",
    slug: "earbuds",
  },
  {
    id: "accessories",
    name: "Accessories",
    image:
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?q=80&w=1984&auto=format&fit=crop",
    slug: "accessories",
  },
  {
    id: "all",
    name: "More Gear",
    image:
      "https://images.unsplash.com/photo-1498049794561-7780e7231661?q=80&w=2070&auto=format&fit=crop",
    slug: "shop",
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
