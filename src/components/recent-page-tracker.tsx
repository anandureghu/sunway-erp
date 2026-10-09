import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { recordRecentPage } from "@/lib/recent-pages";

/** Records navigations for the Home → Overview recent-activity list. */
export function RecentPageTracker() {
  const location = useLocation();
  const { activeCompanyId } = useAuth();

  useEffect(() => {
    recordRecentPage(location.pathname, activeCompanyId);
  }, [location.pathname, activeCompanyId]);

  return null;
}
