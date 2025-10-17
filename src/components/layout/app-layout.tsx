import { Outlet } from "react-router-dom";
import Navbar from "../navbar";
import { AppSidebar } from "../app-sidebar";
import { SidebarProvider } from "../ui/sidebar";

const AppLayout = () => {
  return (
    <div className="w-full">
      <SidebarProvider>
        <AppSidebar />
        <main className="w-full bg-secondary max-h-screen overflow-auto pt-14">
          <Navbar />
          <Outlet />
        </main>
      </SidebarProvider>
    </div>
  );
};

export default AppLayout;
