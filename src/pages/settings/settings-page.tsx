import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import CompanyDetailPage from "../hr/company-detail-page";

// Company settings are restricted to ADMIN / SUPER_ADMIN. The sidebar already
// hides the entry point for everyone else; this guard also blocks direct URL
// access to /settings/:id.
const ADMIN_ROLES = ["ADMIN", "SUPER_ADMIN"];

// ─── Main Component ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { user } = useAuth();

  if (!ADMIN_ROLES.includes(user?.role ?? "")) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen font-sans">
      {/* Content */}
      <CompanyDetailPage />
    </div>
  );
}
