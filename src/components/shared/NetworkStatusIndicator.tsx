import React, { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";

export const NetworkStatusIndicator: React.FC = () => {
  const [isOnline, setIsOnline] = useState<boolean>(() => {
    return typeof navigator !== "undefined" ? navigator.onLine : true;
  });
  const [showRestoredNotice, setShowRestoredNotice] = useState<boolean>(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowRestoredNotice(true);
      const timer = setTimeout(() => setShowRestoredNotice(false), 4000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowRestoredNotice(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Offline Warning Pill
  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="assertive"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-amber-600 text-white text-xs font-semibold shadow-xl border border-amber-500 animate-in fade-in slide-in-from-bottom-3"
      >
        <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
        <span>Mode Offline: Koneksi terputus. Data transaksi tersimpan aman di laci lokal.</span>
      </div>
    );
  }

  // Temporary Restored Toast
  if (showRestoredNotice) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600 text-white text-xs font-semibold shadow-xl border border-emerald-500 animate-in fade-in slide-in-from-bottom-3"
      >
        <Wifi className="h-4 w-4 shrink-0" />
        <span>Koneksi Pulih: Terhubung kembali ke sistem backend FOODPOS.</span>
      </div>
    );
  }

  return null;
};
