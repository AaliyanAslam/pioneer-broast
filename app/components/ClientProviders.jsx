"use client";
import { useOrderTracking } from "@/app/lib/useOrderTracking";
import LocationModal from "@/app/components/ui/LocationModal";

export default function ClientProviders() {
  useOrderTracking();
  return <LocationModal />;
}
