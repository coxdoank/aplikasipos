import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  Lock,
  Mail,
  Store,
  ShieldCheck,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  ArrowRight,
  UserCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/authStore";
import { DEMO_STAFF_ACCOUNTS } from "@/services/authService";

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/backoffice";

  const { login, isLoading, errorMessage, clearError } = useAuthStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    const success = await login(email.trim(), password);
    if (success) {
      navigate(from, { replace: true });
    }
  };

  const handleQuickDemoLogin = async (demoEmail: string) => {
    clearError();
    setEmail(demoEmail);
    setPassword("DemoPassword123!");
    const success = await login(demoEmail, "DemoPassword123!");
    if (success) {
      navigate(from, { replace: true });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-center items-center p-4 bg-muted/20 text-foreground">
      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="bg-primary text-primary-foreground p-2 rounded-xl shadow-md">
              <Store className="h-6 w-6" />
            </div>
            <span className="font-black text-2xl tracking-tight text-foreground">
              FOOD<span className="text-primary">POS</span>
            </span>
          </Link>
          <h1 className="text-2xl font-black tracking-tight text-foreground">
            Portal Masuk Staf & Kasir
          </h1>
          <p className="text-xs text-muted-foreground">
            Masuk dengan akun terdaftar untuk mengoperasikan kasir POS dan manajemen restoran.
          </p>
        </div>

        {/* Login Card */}
        <div className="border rounded-2xl bg-card p-6 sm:p-8 shadow-xl space-y-6">
          {errorMessage && (
            <div className="p-3.5 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-xs font-semibold flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Alamat Email Staf</label>
              <div className="relative">
                <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type="email"
                  required
                  placeholder="staf@foodpos.local"
                  value={email}
                  onChange={(e) => {
                    clearError();
                    setEmail(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground">Kata Sandi</label>
              <div className="relative">
                <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => {
                    clearError();
                    setPassword(e.target.value);
                  }}
                  className="w-full pl-9 pr-10 py-2 text-xs rounded-lg border bg-background focus:outline-none focus:ring-1 focus:ring-primary font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-muted-foreground hover:text-foreground"
                  aria-label="Tampilkan sandi"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full gap-2 font-bold text-xs h-10 shadow-md"
            >
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Memverifikasi Kredensial...
                </>
              ) : (
                <>
                  Masuk ke Backoffice <ArrowRight className="h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          {/* Quick Demo Testing Accounts */}
          <div className="border-t pt-4 space-y-3">
            <div className="flex items-center justify-between text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              <span>Akun Demo Cepat (Simulator)</span>
              <UserCheck className="h-3.5 w-3.5 text-primary" />
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_STAFF_ACCOUNTS.map((acc) => (
                <button
                  key={acc.role}
                  type="button"
                  onClick={() => handleQuickDemoLogin(acc.email)}
                  className="p-2 border rounded-xl text-left bg-muted/20 hover:bg-primary/10 hover:border-primary/40 transition-all text-center flex flex-col items-center"
                >
                  <span className="text-[11px] font-bold text-primary">{acc.role}</span>
                  <span className="text-[9px] text-muted-foreground block truncate max-w-full">
                    {acc.role === "OWNER" ? "Akses Penuh" : acc.role === "ADMIN" ? "Manajer" : "Kasir POS"}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Security Information Footer */}
        <div className="text-center space-y-2 text-xs text-muted-foreground max-w-xs mx-auto">
          <p className="flex items-center justify-center gap-1 font-medium">
            <ShieldCheck className="h-3.5 w-3.5 text-primary" /> Hak Akses Berbasis Peran & RLS
          </p>
          <p className="text-[11px]">
            Sistem tidak menyediakan pendaftaran publik untuk peran Owner demi keamanan keuangan restoran.
          </p>
          <Link to="/" className="text-primary hover:underline font-semibold text-xs block pt-1">
            &larr; Kembali ke Website Publik
          </Link>
        </div>
      </div>
    </div>
  );
};
