import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";

interface AccessDeniedPageProps {
  requiredPermission?: string;
  requiredRole?: string;
}

export const AccessDeniedPage: React.FC<AccessDeniedPageProps> = ({
  requiredPermission,
  requiredRole,
}) => {
  const navigate = useNavigate();
  const { profile, role, logout } = useAuthStore();

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full border rounded-2xl bg-card p-8 text-center shadow-lg space-y-6">
        <div className="h-16 w-16 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <ShieldAlert className="h-9 w-9" />
        </div>

        <div className="space-y-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-destructive bg-destructive/10 px-2.5 py-0.5 rounded-full">
            Error 403 — Forbidden
          </span>
          <h1 className="text-2xl font-black text-foreground">Akses Halaman Dibatasi</h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Akun Anda saat ini tidak memiliki hak otorisasi yang memadai untuk membuka menu atau menjalankan operasi ini.
          </p>
        </div>

        {/* User context box */}
        <div className="p-3 rounded-xl bg-muted/40 border text-xs text-left space-y-1.5">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Staf Masuk:</span>
            <span className="font-bold text-foreground">{profile?.fullName || "Pengguna"}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Peran Aktif:</span>
            <span className="font-mono font-bold text-primary">{role || "Tamu"}</span>
          </div>
          {requiredPermission && (
            <div className="flex justify-between pt-1 border-t border-muted">
              <span className="text-muted-foreground">Izin Dibutuhkan:</span>
              <span className="font-mono text-destructive font-bold">{requiredPermission}</span>
            </div>
          )}
          {requiredRole && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Peran Minimum:</span>
              <span className="font-mono text-destructive font-bold">{requiredRole}</span>
            </div>
          )}
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex-1 gap-1.5 text-xs font-semibold"
          >
            <ArrowLeft className="h-4 w-4" /> Kembali
          </Button>

          <Link to="/backoffice" className="flex-1">
            <Button size="sm" className="w-full gap-1.5 text-xs font-semibold">
              <Home className="h-4 w-4" /> Dashboard
            </Button>
          </Link>
        </div>

        <button
          onClick={() => logout()}
          className="text-xs text-muted-foreground hover:text-destructive inline-flex items-center gap-1 font-medium transition-colors"
        >
          <LogOut className="h-3.5 w-3.5" /> Ganti Akun Staf Lain
        </button>
      </div>
    </div>
  );
};
