import Link from "next/link";
import Image from "next/image";
import { 
  PiEnvelopeSimple, 
  PiMapPin, 
  PiPhone, 
  PiInstagramLogo, 
  PiFacebookLogo, 
  PiTwitterLogo, 
  PiTiktokLogo, 
  PiPaperPlaneRight 
} from "react-icons/pi";

const LINKS = {
  shop: [
    { label: "Earbuds",      href: "/category/earbuds" },
    { label: "Smartwatches", href: "/category/smartwatches" },
    { label: "Accessories",  href: "/category/accessories" },
  ],
  support: [
    { label: "Track Order",    href: "/profile" },
    { label: "Cart",           href: "/cart" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Use",   href: "#" },
  ],
};

const SOCIALS = [
  { Icon: PiInstagramLogo, href: "#", label: "Instagram" },
  { Icon: PiFacebookLogo,  href: "#", label: "Facebook" },
  { Icon: PiTwitterLogo,   href: "#", label: "Twitter" },
  { Icon: PiTiktokLogo,    href: "#", label: "TikTok" },
];

export default function Footer() {
  return (
    <footer className="bg-zinc-950 text-gray-400 border-t border-gray-800">
      {/* ── Main Footer Grid ── */}
      <div className="max-w-420 mx-auto px-5 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col items-start">
            <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/brandlogo.webp"
                alt="Pioneer Broast Logo"
                width={150}
                height={24}
                className="h-8 w-auto object-contain brightness-0 invert"
              />
            </Link>
            <p className="text-sm leading-relaxed text-gray-400 mb-6">
              Premium tech accessories designed for those who demand more. Fast delivery across Pakistan.
            </p>
            <div className="flex items-center gap-4">
              {SOCIALS.map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="text-gray-400 hover:text-[#C0E212] transition-colors"
                >
                  <Icon className="w-5 h-5" />
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: Shop */}
          <div className="flex flex-col">
            <h3 className="text-white text-sm font-bold mb-4">SHOP</h3>
            <ul className="space-y-3">
              {LINKS.shop.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support & Legal */}
          <div className="flex flex-col">
            <h3 className="text-white text-sm font-bold mb-4">SUPPORT</h3>
            <ul className="space-y-3">
              {LINKS.support.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Newsletter */}
          <div className="flex flex-col">
            <h3 className="text-white text-sm font-bold mb-4">CONTACT</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <PiEnvelopeSimple className="w-4 h-4 shrink-0 text-[#C0E212]" />
                <span>support@kovatech.store</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <PiPhone className="w-4 h-4 shrink-0 text-[#C0E212]" />
                <span>+92 300 0000000</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-gray-400">
                <PiMapPin className="w-4 h-4 shrink-0 text-[#C0E212]" />
                <span>Karachi, Pakistan</span>
              </li>
            </ul>
            
            {/* Newsletter */}
            <div className="w-full">
              <form className="flex items-center border border-gray-800 rounded-md overflow-hidden focus-within:border-[#C0E212] transition-colors">
                <input
                  type="email"
                  placeholder="Subscribe to our newsletter"
                  className="w-full bg-transparent text-sm text-white px-3 py-2.5 focus:outline-none placeholder:text-gray-500"
                  required
                />
                <button
                  type="submit"
                  className="bg-gray-800 hover:bg-[#C0E212] text-white hover:text-black px-4 py-2.5 transition-colors"
                  aria-label="Subscribe"
                >
                  <PiPaperPlaneRight className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* ── Bottom Bar ── */}
      <div className="border-t border-gray-800">
        <div className="max-w-420 mx-auto px-5 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-gray-400 text-center sm:text-left">
            © 2026 Kova Tech. All rights reserved.
          </p>
          <p className="text-sm text-gray-400 text-center sm:text-right flex items-center gap-1 justify-center">
            Made with 💚 in Pakistan
          </p>
        </div>
      </div>
    </footer>
  );
}
