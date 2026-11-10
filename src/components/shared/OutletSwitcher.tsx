import React, { useState, useEffect, useRef } from "react";
import { Store, ChevronDown, Check, Building2, MapPin, Lock } from "lucide-react";
import { useAuthStore } from "@/stores/authStore";
import { outletService } from "@/services/outletService";
import type { OutletInfo } from "@/services/settingService";

export const OutletSwitcher: React.FC = () => {
  const { role, outlet, setOutlet } = useAuthStore();
  const [outlets, setOutlets] = useState<OutletInfo[]>([]);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isMultiOutletAuthorized = role === "OWNER";

  useEffect(() => {
    let isMounted = true;
    const loadOutlets = async () => {
      try {
        const list = await outletService.getOutlets();
        if (isMounted) {
          setOutlets(list);
        }
      } catch (err) {
        console.error("Gagal memuat daftar outlet:", err);
      }
    };

    loadOutlets();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleSelectOutlet = async (target: OutletInfo) => {
    if (target.id === outlet?.id) {
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    try {
      await outletService.switchOutlet(target.id);
      setOutlet({
        id: target.id,
        code: target.code,
        name: target.name,
      });
      setIsOpen(false);
    } catch (err) {
      console.error("Gagal beralih outlet:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Staff with single outlet (e.g. Cashier)
  if (!isMultiOutletAuthorized) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted/50 border border-border text-xs text-muted-foreground font-medium select-none">
        <Store className="h-3.5 w-3.5 text-primary" />
        <span className="font-semibold text-foreground max-w-[140px] truncate">
          {outlet?.name || "Outlet Kasir"}
        </span>
        <span className="text-[10px] font-mono bg-background px-1.5 py-0.2 rounded border">
          {outlet?.code || "JKT-01"}
        </span>
        <Lock className="h-3 w-3 text-muted-foreground opacity-60 ml-0.5" />
      </div>
    );
  }

  // Owner with multi-outlet switcher dropdown
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={isLoading}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border bg-card hover:bg-accent text-xs font-medium text-foreground transition-all shadow-xs focus:outline-none"
        aria-label="Pilih Outlet Aktif"
      >
        <div className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Building2 className="h-3 w-3" />
        </div>

        <div className="flex flex-col text-left leading-none max-w-[150px] sm:max-w-[200px]">
          <span className="font-bold text-[11px] truncate">
            {outlet?.name || "Pilih Cabang Outlet"}
          </span>
          <span className="text-[9px] text-muted-foreground font-mono mt-0.5">
            {outlet?.code || "ALL"} • Multi-Outlet
          </span>
        </div>

        <ChevronDown className={`h-3.5 w-3.5 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Popover Dropdown */}
      {isOpen && (
        <div className="absolute left-0 sm:left-auto sm:right-0 mt-2 w-72 rounded-xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
          <div className="p-3 border-b border-border bg-muted/40 flex items-center justify-between">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Store className="h-3.5 w-3.5 text-primary" />
              Pilih Cabang Outlet Aktif
            </span>
            <span className="text-[10px] font-semibold text-muted-foreground">
              {outlets.length} Cabang
            </span>
          </div>

          <div className="p-1.5 max-h-64 overflow-y-auto space-y-1">
            {outlets.map((item) => {
              const isSelected = item.id === outlet?.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleSelectOutlet(item)}
                  className={`w-full text-left p-2.5 rounded-lg text-xs transition-colors flex items-start justify-between gap-2 ${
                    isSelected
                      ? "bg-primary/10 text-foreground font-semibold border border-primary/20"
                      : "hover:bg-accent text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-foreground text-xs truncate">
                        {item.name}
                      </span>
                      <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-muted border text-muted-foreground">
                        {item.code}
                      </span>
                    </div>

                    {item.address && (
                      <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5 shrink-0" />
                        {item.address}
                      </p>
                    )}
                  </div>

                  {isSelected && (
                    <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
