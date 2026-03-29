import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";

export const PermissionProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, permissionsLoading, permissions, user } = useAuth();

  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";

  if (!isAuthenticated) {
    return <Navigate to="/auth/login" replace />;
  }

  if (permissionsLoading) {
    return (
      <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
        <p className="text-lg font-medium text-muted-foreground">Loading permissions...</p>
        <p className="text-sm text-muted-foreground/70 mt-1">
          Please wait while we check your access rights.
        </p>
      </div>
    );
  }

  // Admin bypass + permissions loaded (even empty = no restrictions)
  if (isAdmin || permissions !== null) {
    return <>{children}</>;
  }

  // No permissions loaded and not admin → access denied
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
      <svg className="h-12 w-12 text-destructive mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h2 className="text-xl font-semibold text-destructive mb-2">Access Denied</h2>
      <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
        You don't have permission to access this page. 
        <br />
        Contact your administrator to assign appropriate role permissions.
      </p>
      <div className="flex gap-3">
        <button 
          onClick={() => window.location.reload()} 
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90"
        >
          Retry
        </button>
        <button 
          onClick={() => window.history.back()} 
          className="px-4 py-2 border border-border bg-background rounded-lg font-medium hover:bg-muted"
        >
          Go Back
        </button>
      </div>
    </div>
  );
};
