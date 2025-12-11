// import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { getSidebarItems } from "@/service/companyService";
import type { SidebarItem } from "@/types/company";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const Dashboard = () => {
  const { user } = useAuth();
  const [sidebarItems, setSidebarItems] = useState<SidebarItem[]>([]);
  useEffect(() => {
    if (user?.companyId) {
      getSidebarItems(user.companyId).then((items) => {
        setSidebarItems(items);
      });
    }
  }, [user]);
  return (
    <div className="">
      <h1 className="text-3xl mb-10 font-bold bg-primary text-white py-3 px-6 mt-5">
        Sunway ERP Modules
      </h1>
      <div className="flex justify-between items-start gap-3 p-6">
        {sidebarItems.map((item) => (
          <div key={item.title} className="mb-4 w-full">
            <h1 className="mb-4 font-semibold text-gray-400">
              Sunway {item.title} System
            </h1>
            <div className="flex items-center w-full h-full">
              <Link to={item.url}>
                <img src={item.image} alt={item.title} className="mb-4 w-40" />
              </Link>
              <div className="flex-1">
                {item.items.map((subItem) => (
                  <div key={subItem.title} className="mb-2">
                    <Link to={subItem.url}>
                      {/* <subItem.icon className={cn("w-5 h-5", item.color)} /> */}
                      <h4 className="text-lg text-blue-500">{subItem.title}</h4>
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
