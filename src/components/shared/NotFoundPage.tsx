import React from "react";
import { Link } from "react-router-dom";
import { AlertCircle, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background text-foreground">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="h-20 w-20 mx-auto rounded-full bg-destructive/10 text-destructive flex items-center justify-center">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
          <h2 className="text-xl font-bold">Halaman Tidak Ditemukan</h2>
          <p className="text-sm text-muted-foreground">
            Maaf, halaman yang Anda cari tidak tersedia atau telah dipindahkan.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          <Link to="/">
            <Button className="gap-2">
              <Home className="h-4 w-4" /> Kembali ke Beranda
            </Button>
          </Link>
          <Link to="/backoffice">
            <Button variant="outline">Backoffice</Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
