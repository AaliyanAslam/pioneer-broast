"use client";
import { SWRConfig } from "swr";

/**
 * Module-level Map: lives outside the component, so it survives
 * React re-mounts and Next.js client-side navigations.
 * This is the "persistent cache" trick from the SWR docs.
 */
const globalCache = new Map();

export default function SWRProvider({ children }) {
  return (
    <SWRConfig
      value={{
        provider: () => globalCache,   // shared cache across all navigations
        keepPreviousData: true,         // show stale data instantly; no spinner on re-visit
        revalidateOnFocus: true,        // silently refresh when tab regains focus
        revalidateOnReconnect: true,    // refresh on network reconnect
        dedupingInterval: 10_000,       // prevent duplicate requests within 10s
        errorRetryCount: 2,             // retry failed fetches up to 2 times
      }}
    >
      {children}
    </SWRConfig>
  );
}
