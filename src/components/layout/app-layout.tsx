import { Outlet } from "react-router-dom";
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EmployeeSelectionProvider } from "@/context/employee-selection";
import Navbar from "../navbar";
import { SidebarEdgeHoverOpen } from "@/components/sidebar-edge-hover-open";
import { useAuth } from "@/context/AuthContext";
import { AssistantSidebar } from "@/components/assistant/assistant-sidebar";
import { SubscriptionExpiryBanner } from "@/components/subscription/subscription-expiry-banner";
import { SubscriptionHardLock } from "@/components/subscription/subscription-hard-lock";
import { MaxShiftCheckoutGuard } from "@/components/max-shift-checkout-guard";
import { SessionIdleTimeoutGuard } from "@/components/session-idle-timeout-guard";

const LayoutBody = () => {
  const { company } = useAuth();

  return (
    <>
      <MaxShiftCheckoutGuard />
      <SessionIdleTimeoutGuard />
      <AppSidebar />
      <SidebarEdgeHoverOpen />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-muted/30 transition-[margin] duration-200 ease-linear pb-[60px]">
        <SubscriptionExpiryBanner />
        <Navbar />
        <div key={company?.id ?? "no-company"} className="min-w-0 flex-1">
          <Outlet />
        </div>
      </main>
      <AssistantSidebar />
    </>
  );
};

const AppLayout = () => {
  const { user, subscriptionStatus, permissionsLoading } = useAuth();
  const isSuperAdmin = user?.role === "SUPER_ADMIN";

  if (
    !permissionsLoading &&
    subscriptionStatus?.locked &&
    !isSuperAdmin
  ) {
    return <SubscriptionHardLock />;
  }

  return (
    <div className="flex min-h-svh w-full">
      <SidebarProvider>
        <EmployeeSelectionProvider>
          <LayoutBody />
        </EmployeeSelectionProvider>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
