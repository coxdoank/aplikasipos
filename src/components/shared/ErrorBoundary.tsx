import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertOctagon, RotateCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("[FOODPOS ErrorBoundary] Uncaught render error:", error, errorInfo);
  }

  public handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.reload();
    }
  };

  public handleGoHome = () => {
    if (typeof window !== "undefined") {
      window.location.href = "#/";
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-muted/20 text-foreground">
          <div className="max-w-md w-full p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-2xl text-center space-y-5">
            <div className="h-14 w-14 rounded-full bg-destructive/10 text-destructive flex items-center justify-center mx-auto">
              <AlertOctagon className="h-8 w-8" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold tracking-tight text-foreground">
                Terjadi Kendala Teknis pada Tampilan
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Sistem mendeteksi kendala pada antarmuka pengguna. Data transaksi Anda tetap tersimpan aman di sistem.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 rounded-lg bg-muted text-left font-mono text-xs text-destructive overflow-x-auto max-h-32 border">
                {this.state.error.message || String(this.state.error)}
              </div>
            )}

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto gap-1.5 text-xs"
              >
                <Home className="h-4 w-4" />
                Halaman Utama
              </Button>

              <Button
                type="button"
                size="sm"
                onClick={this.handleReload}
                className="w-full sm:w-auto gap-1.5 text-xs font-semibold"
              >
                <RotateCw className="h-4 w-4" />
                Muat Ulang Halaman
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
