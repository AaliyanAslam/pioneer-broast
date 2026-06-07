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
  menu: [
    { label: "Broast",       href: "/#broast" },
    { label: "Burgers",      href: "/#burgers" },
    { label: "Deals",        href: "/#deals" },
  ],
  support: [
    { label: "Track Order",    href: "/my-orders" },
    { label: "Bucket",           href: "/cart" },
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
    <footer className="bg-white text-zinc-600 relative pt-12 border-t border-zinc-200">
      {/* â”€â”€ Main Footer Grid â”€â”€ */}
      <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-8 py-10 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 lg:gap-12">
          
          {/* Column 1: Brand Info */}
          <div className="flex flex-col items-start sm:col-span-2 lg:col-span-1">
            <Link href="/" className="inline-block mb-6 transition-transform hover:scale-105 active:scale-95">
              <Image
                src="/brandlogo.webp"
                alt="Pioneer Broast Logo"
                width={200}
                height={80}
                className="h-14 sm:h-16 w-auto object-contain"
              />
            </Link>
            <p className="text-[14px] leading-relaxed text-zinc-500 mb-8 max-w-sm font-medium">
              Premium fast food and broast designed for those who demand more. Fast delivery across Pakistan.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ Icon, href, label }) => (
                <Link
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-10 h-10 rounded-full bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-500 hover:bg-[#ff1900] hover:text-white hover:border-[#ff1900] transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-1"
                >
                  <Icon className="w-5 h-5" weight="fill" />
                </Link>
              ))}
            </div>
          </div>

          {/* Column 2: Menu */}
          <div className="flex flex-col">
            <h3 className="text-black text-[16px] font-black tracking-widest uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FDD541] rounded-full"></span>
              Menu
            </h3>
            <ul className="space-y-4">
              {LINKS.menu.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-[14px] text-zinc-500 hover:text-[#ff1900] font-bold transition-colors flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-2 h-[2px] bg-[#ff1900] transition-all duration-300 rounded-full" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: Support & Legal */}
          <div className="flex flex-col">
            <h3 className="text-black text-[16px] font-black tracking-widest uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#ff1900] rounded-full"></span>
              Support
            </h3>
            <ul className="space-y-4">
              {LINKS.support.map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-[14px] text-zinc-500 hover:text-[#ff1900] font-bold transition-colors flex items-center gap-2 group">
                    <span className="w-0 group-hover:w-2 h-[2px] bg-[#ff1900] transition-all duration-300 rounded-full" />
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 4: Contact & Newsletter */}
          <div className="flex flex-col">
            <h3 className="text-black text-[16px] font-black tracking-widest uppercase mb-6 flex items-center gap-2">
              <span className="w-2 h-2 bg-[#FDD541] rounded-full"></span>
              Contact Us
            </h3>
            <ul className="space-y-5 mb-8">
              <li className="flex items-start gap-4 text-[14px] text-zinc-600 font-medium">
                <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center shrink-0 shadow-sm border border-red-100">
                  <PiPhone className="w-5 h-5 text-[#ff1900]" weight="fill" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="text-[11px] text-zinc-400 uppercase font-black tracking-wider mb-0.5">Helpline</span>
                  <a href="tel:021111666111" className="hover:text-[#ff1900] transition-colors font-bold text-black">021-111-666-111</a>
                </div>
              </li>
              <li className="flex items-start gap-4 text-[14px] text-zinc-600 font-medium">
                <div className="w-10 h-10 rounded-full bg-yellow-50 flex items-center justify-center shrink-0 shadow-sm border border-yellow-100">
                  <PiMapPin className="w-5 h-5 text-[#ff1900]" weight="fill" />
                </div>
                <div className="flex flex-col pt-0.5">
                  <span className="text-[11px] text-zinc-400 uppercase font-black tracking-wider mb-0.5">Location</span>
                  <span className="font-bold text-black">Karachi, Pakistan</span>
                </div>
              </li>
            </ul>
            
            {/* Newsletter */}
            <div className="w-full">
              <h4 className="text-[12px] font-black text-black uppercase tracking-widest mb-3">Subscribe for Deals</h4>
              <form className="flex items-center bg-zinc-50 border border-zinc-200 rounded-xl overflow-hidden focus-within:border-[#ff1900] focus-within:ring-1 focus-within:ring-[#ff1900] transition-all shadow-inner">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full bg-transparent text-[14px] text-black px-4 py-3 focus:outline-none placeholder:text-zinc-400 font-medium"
                  required
                />
                <button
                  type="submit"
                  className="bg-[#FDD541] hover:bg-[#eac438] text-black px-5 py-3 transition-colors active:scale-95 flex items-center justify-center h-full border-l border-yellow-300"
                  aria-label="Subscribe"
                >
                  <PiPaperPlaneRight className="w-5 h-5" weight="bold" />
                </button>
              </form>
            </div>
          </div>

        </div>
      </div>

      {/* â”€â”€ Bottom Bar â”€â”€ */}
      <div className="border-t border-zinc-100 bg-white">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-6 lg:px-8 py-5 sm:py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-[13px] font-bold text-zinc-400 text-center sm:text-left">
            Â© {new Date().getFullYear()} <span className="text-zinc-700">Pioneer Broast</span>. All rights reserved.
          </p>
          <div className="flex items-center gap-2 justify-center">
            <span className="text-[13px] font-bold text-zinc-500 flex items-center gap-1.5">
              Made with <span className="text-[#ff1900] animate-pulse">â¤ï¸</span> in Pakistan
            </span>
          </div>
        </div>
      </div>

      {/* Decorative Bunting / Scalloped Bottom â€” alternating gold & white */}
      <div
        className="w-full shrink-0"
        style={{ filter: "drop-shadow(0 -3px 4px rgba(0,0,0,0.10))" }}
      >
        <div
          className="w-full h-[22px]"
          style={{
            backgroundImage:
              `url("data:image/svg+xml,%3Csvg width='52' height='22' viewBox='0 0 52 22' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='13' cy='22' r='14' fill='%23FDD541'/%3E%3Ccircle cx='39' cy='22' r='14' fill='%23ffffff' stroke='%23FED645' stroke-width='0.8'/%3E%3C/svg%3E")`,
            backgroundRepeat: "repeat-x",
            backgroundPosition: "0 0",
          }}
        />
      </div>
    </footer>
  );
}
