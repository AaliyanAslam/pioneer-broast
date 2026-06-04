import { Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import SWRProvider from "@/app/components/SWRProvider";
import ConditionalFooter from "@/app/components/ConditionalFooter";
import FloatingCartWidget from "@/app/components/ui/FloatingCartWidget";
import ClientProviders from "@/app/components/ClientProviders";
import DeleteConfirmModal from "@/app/components/ui/DeleteConfirmModal";
import { GoogleAnalytics } from "@next/third-parties/google";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://kovatechstore.vercel.app";

// ─── Global / Fallback SEO ────────────────────────────────────────────────────
export const metadata = {
  // Resolved on every child page as: "Page Title | Kova Tech"
  metadataBase: new URL(SITE_URL),

  title: {
    default: "Kova Tech — Premium Tech Accessories in Pakistan",
    template: "%s | Kova Tech",
  },

  description:
    "Shop the latest smartwatches, earbuds, and premium tech accessories at Kova Tech. Fast nationwide delivery across Pakistan. Quality guaranteed.",

  keywords: [
    "tech accessories Pakistan",
    "smartwatch Pakistan",
    "earbuds Pakistan",
    "Kova Tech",
    "buy earbuds online Pakistan",
    "wireless earbuds Pakistan",
    "smartwatch buy online",
    "premium tech store Pakistan",
  ],

  authors: [{ name: "Kova Tech", url: SITE_URL }],
  creator: "Kova Tech",
  publisher: "Kova Tech",

  // Tells Google to index all pages except /admin (also enforced in robots.js)
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },

  // ── Open Graph (Facebook, WhatsApp, LinkedIn, Slack) ────────────────────────
  openGraph: {
    type: "website",
    locale: "en_PK",
    url: SITE_URL,
    siteName: "Kova Tech",
    title: "Kova Tech — Premium Tech Accessories in Pakistan",
    description:
      "Shop the latest smartwatches, earbuds, and premium tech accessories at Kova Tech. Fast nationwide delivery across Pakistan.",
    images: [
      {
        url: "/og-image.png",    // place a 1200×630 image in /public/og-image.jpg
        width: 1200,
        height: 630,
        alt: "Kova Tech — Premium Tech Accessories",
      },
    ],
  },

  // ── Twitter / X Card ────────────────────────────────────────────────────────
  twitter: {
    card: "summary_large_image",
    title: "Kova Tech — Premium Tech Accessories in Pakistan",
    description:
      "Shop the latest smartwatches, earbuds, and premium tech accessories at Kova Tech.",
    images: ["/og-image.png"],
    creator: "@kovatech",    // update to your Twitter handle if you have one
  },

  // ── Canonical (prevents duplicate content) ───────────────────────────────────
  alternates: {
    canonical: SITE_URL,
  },

  // ── Site Verification (Google Search Console) ───────────────────────────────
  verification: {
    google: "fgea7rcXmWZtZd5ww6gFaASDlN4PMP_zwhEg1giVhlE",
  },
};

// ─── Root Layout ──────────────────────────────────────────────────────────────
export default function RootLayout({ children }) {
  return (
    <html
      suppressHydrationWarning={true}
      lang="en"
      className={`${outfit.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans bg-white text-zinc-950"
        suppressHydrationWarning
      >
        <SWRProvider>
          {children}
          <ConditionalFooter />
          <FloatingCartWidget />
          <ClientProviders />
          <DeleteConfirmModal />
          <Toaster position="top-center" />
        </SWRProvider>

        {/* Global Analytics & Tracking */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID && (
          <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID} />
        )}
      </body>
    </html>
  );
}

