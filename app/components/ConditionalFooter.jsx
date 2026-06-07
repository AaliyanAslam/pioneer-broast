"use client";
import { usePathname } from "next/navigation";
import Footer from "./Footer";

export default function ConditionalFooter() {
  const pathname = usePathname();

  // Hide footer on admin pages and checkout page
  if (pathname?.startsWith("/admin") || pathname?.startsWith("/cart")) {
    return null;
  }

  return <Footer />;
}
