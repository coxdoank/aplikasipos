import React from "react";
import { Navigate, useLocation, Outlet } from "react-router-dom";
import { useAuthStore } from "@/stores/authStore";
import { AccessDeniedPage } from "@/components/shared/AccessDeniedPage";

interface ProtectedRouteProps {
  requiredPermission?: string;
  requiredRole?: "OWNER" | "ADMIN" | "CASHIER";
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  requiredPermission,
  requiredRole,
  children,
}) => {
  const location = useLocation();
  const { isAuthenticated, hasPermission, role } = useAuthStore();

  // 1. Check if authenticated
  if (!isAuthenticated) {
    return <Navigate to="/backoffice/login" state={{ from: location }} replace />;
  }

  // 2. Check permission if required
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <AccessDeniedPage requiredPermission={requiredPermission} />;
  }

  // 3. Check role if required (OWNER always bypasses)
  if (requiredRole && role !== requiredRole && role !== "OWNER") {
    return <AccessDeniedPage requiredRole={requiredRole} />;
  }

  return children ? <>{children}</> : <Outlet />;
};
