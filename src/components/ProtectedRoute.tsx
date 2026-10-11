import React from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  allowedRoles?: import("@/lib/supabase").UserRole[];
}

export function ProtectedRoute({ allowedRoles }: ProtectedRouteProps) {
  const { user, userRole, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!userRole) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md space-y-3 text-center" role="alert">
          <h1 className="text-xl font-semibold">
            Account access could not be verified
          </h1>
          <p className="text-muted-foreground">
            Contact Head Office to check your account permissions, or try
            signing in again.
          </p>
          <a className="text-primary underline" href="/auth">
            Return to sign in
          </a>
        </div>
      </div>
    );
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // Redirect to appropriate dashboard based on role
    if (userRole === "super_admin") {
      return <Navigate to="/admin/dashboard" replace />;
    } else if (userRole === "franchise_owner") {
      return <Navigate to="/franchise/dashboard" replace />;
    }
    return (
      <Navigate
        to={userRole === "parent" ? "/erp/parent" : "/erp/overview"}
        replace
      />
    );
  }

  return <Outlet />;
}
