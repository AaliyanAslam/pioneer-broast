"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import Script from "next/script";

// Global utility for triggering Meta Pixel events anywhere in the app
export const trackFbqEvent = (eventName, params = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, params);
  }
};

export default function FacebookPixel() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Automatically track 'PageView' on every route change
  useEffect(() => {
    if (typeof window !== "undefined" && window.fbq) {
      // Delay slightly to ensure Next.js has updated the document title
      const timer = setTimeout(() => {
        window.fbq("track", "PageView");
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [pathname, searchParams]);

  const PIXEL_ID = process.env.NEXT_PUBLIC_FB_PIXEL_ID;

  if (!PIXEL_ID) {
    console.warn("Facebook Pixel ID is not defined in environment variables.");
    return null;
  }

  return (
    <>
      {/* 
        Use afterInteractive strategy to load the script immediately after the page 
        becomes interactive, preventing it from blocking the main thread during initial load. 
      */}
      <Script
        id="fb-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${PIXEL_ID}');
          `,
        }}
      />
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: "none" }}
          src={`https://www.facebook.com/tr?id=${PIXEL_ID}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
