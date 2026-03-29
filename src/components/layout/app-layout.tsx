import { Outlet } from "react-router-dom";
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EmployeeSelectionProvider } from "@/context/employee-selection"; // use alias
import Navbar from "../navbar";
import { SidebarEdgeHoverOpen } from "@/components/sidebar-edge-hover-open";
import { ErrorBoundary } from "../error-boundary";

const LayoutBody = () => {
  return (
    <>
      <AppSidebar />
      <SidebarEdgeHoverOpen />
      <main className="ml-auto flex min-h-0 min-w-0 w-full flex-1 flex-col overflow-auto bg-muted/30 transition-[max-width] duration-200 ease-linear md:peer-data-[state=expanded]:max-w-[calc(100vw-var(--sidebar-width))] md:peer-data-[state=collapsed]:max-w-full">
        <Navbar />
        <div className="flex-1">
          <Outlet />
        </div>
      </main>
    </>
  );
};

const AppLayout = () => {
  return (
    <div className="flex min-h-svh w-full">
      <SidebarProvider>
        <EmployeeSelectionProvider>
<<<<<<< Updated upstream
          <LayoutBody />
=======
          <AppSidebar />
          <SidebarEdgeHoverOpen />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-muted/30">
            <ErrorBoundary>
              <Navbar />
              <div className="flex-1">
                <Outlet />
              </div>
            </ErrorBoundary>
          </main>
>>>>>>> Stashed changes
        </EmployeeSelectionProvider>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
