/**
 * Global SWR fetcher utility for Kova Tech.
 * Throws on non-OK responses so SWR's `error` state is populated correctly.
 *
 * Usage:
 *   import useSWR from "swr";
 *   import fetcher from "@/app/lib/fetcher";
 *   const { data, error, isLoading } = useSWR("/api/orders", fetcher);
 */
export default async function fetcher(url) {
  const res = await fetch(url);

  if (!res.ok) {
    const info = await res.json().catch(() => ({}));
    const error = new Error(info.message || "An error occurred while fetching data.");
    error.status = res.status;
    throw error;
  }

  const json = await res.json();
  // Our API wraps data in { success, data } — unwrap it for convenience
  return json.data ?? json;
}
