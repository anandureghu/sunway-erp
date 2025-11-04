import { Outlet } from "react-router-dom";
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { EmployeeSelectionProvider } from "@/context/employee-selection"; // use alias
import Navbar from "../navbar";

const AppLayout = () => {
  return (
    <div className="w-full">
      <SidebarProvider>
        {/* 👇 The provider must wrap AppSidebar AND the routed content */}
        <EmployeeSelectionProvider>
          <AppSidebar />
          <main className="w-full bg-secondary max-h-screen overflow-auto pt-14">
            <Navbar />
            <Outlet />
          </main>
        </EmployeeSelectionProvider>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
