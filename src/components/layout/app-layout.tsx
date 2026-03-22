import { Outlet } from "react-router-dom";
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EmployeeSelectionProvider } from "@/context/employee-selection"; // use alias
import Navbar from "../navbar";
import { SidebarEdgeHoverOpen } from "@/components/sidebar-edge-hover-open";

const AppLayout = () => {
  return (
    <div className="w-full">
      <SidebarProvider>
        <EmployeeSelectionProvider>
          <AppSidebar />
          <SidebarEdgeHoverOpen />
          <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-muted/30">
            <Navbar />
            <div className="flex-1">
              <Outlet />
            </div>
          </main>
        </EmployeeSelectionProvider>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
