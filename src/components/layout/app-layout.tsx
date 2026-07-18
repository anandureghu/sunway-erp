import { Outlet } from "react-router-dom";
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EmployeeSelectionProvider } from "@/context/employee-selection";
import Navbar from "../navbar";
import { SidebarEdgeHoverOpen } from "@/components/sidebar-edge-hover-open";
import { useAuth } from "@/context/AuthContext";
import { AssistantSidebar } from "@/components/assistant/assistant-sidebar";

const LayoutBody = () => {
  const { company } = useAuth();

  return (
    <>
      <AppSidebar />
      <SidebarEdgeHoverOpen />
      <main className="flex min-h-0 min-w-0 flex-1 flex-col overflow-auto bg-muted/30 transition-[margin] duration-200 ease-linear pb-[50px]">
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
