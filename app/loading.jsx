import { PiCircleNotch } from "react-icons/pi";

export default function Loading() {
  return (
    <div className="fixed inset-0 z-9999  backdrop-blur-sm flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-5">
        {/* Inner spinning icon */}
        <div className=" p-3.5 sm:p-4 rounded-full  flex items-center justify-center">
          <PiCircleNotch className="w-6 h-6 sm:w-7 sm:h-7 animate-spin text-[#ff1900]" />
        </div>
        <p className="font-medium tracking-widest text-[11px] sm:text-xs text-zinc-500 uppercase animate-pulse">
          Loading
        </p>
      </div>
    </div>
  );
}
