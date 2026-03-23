import { AppTab } from "@/components/app-tab";
import CategoriesMaster from "@/modules/inventory/settings/categories-master";
import WarehouseMaster from "@/modules/inventory/settings/warehouse-master";
import VendorsPage from "../admin/vendors/vendors-page";
import CustomersPage from "../admin/customers/customers-page";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const InventorySettingsPage = () => {
  const tabsList = [
    {
      value: "categories",
      label: "Categories",
      element: () => <CategoriesMaster />,
    },
    {
      value: "warehouse",
      label: "Warehouse",
      element: () => <WarehouseMaster />,
    },
    {
      value: "customers",
      label: "Customers",
      element: () => <CustomersPage />,
    },
    {
      value: "vendors",
      label: "Suppliers",
      element: () => <VendorsPage />,
    },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <Card className="border-0 shadow-md bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
        <CardContent className="p-6 sm:p-8">
          <Badge className="mb-3 bg-white/20 text-white hover:bg-white/20">
            Inventory Configuration
          </Badge>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Inventory Settings
          </h1>
          <p className="mt-2 text-white/80 max-w-2xl">
            Configure master data for categories, warehouses, customers, and
            suppliers.
          </p>
        </CardContent>
      </Card>

      {/* <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {settingHighlights.map((item) => (
          <Card key={item.title} className="shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {item.description}
                  </p>
                </div>
                <div className={`rounded-lg p-2 ${item.bgClass}`}>
                  {item.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div> */}

      <AppTab
        // title="Inventory Settings"
        variant="warning"
        // subtitle="Manage inventory masters and supplier data"
        tabs={tabsList}
        defaultValue={tabsList[0].value}
      />
    </div>
  );
};

export default InventorySettingsPage;
