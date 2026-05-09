import { AppTab } from "@/components/app-tab";
import CategoriesMaster from "@/modules/inventory/settings/categories-master";
import WarehouseMaster from "@/modules/inventory/settings/warehouse-master";
import VendorsPage from "../admin/vendors/vendors-page";
import CustomersPage from "../admin/customers/customers-page";
import { Card, CardContent } from "@/components/ui/card";

import PermissionsTab from "@/components/permissions-tab";

const INVENTORY_MODULES = [
  { id: "category", label: "Categories" },
  { id: "warehouse", label: "Warehouse" },
  { id: "stock", label: "Stock Management" },
  { id: "item", label: "Items" },
  { id: "purchase", label: "Purchase" },
  { id: "receipt", label: "Goods Receipt" },
  { id: "sales", label: "Sales" },
];

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
    {
      value: "permissions",
      label: "Permissions",
      element: () => (
        <PermissionsTab moduleType="INVENTORY" modules={INVENTORY_MODULES} />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <Card className="m-6 mb-0 border-0 shadow-md bg-gradient-to-r from-slate-900 via-blue-900 to-indigo-900 text-white">
        <CardContent className="p-6 sm:p-8 !py-2">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            Inventory Settings
          </h1>
          <p className="mt-2 text-white/80 max-w-2xl">
            Configure master data for categories, warehouses, customers, and
            suppliers.
          </p>
        </CardContent>
      </Card>

      <AppTab
        title=""
        variant="warning"
        tabs={tabsList}
        defaultValue={tabsList[0].value}
      />
    </div>
  );
};

export default InventorySettingsPage;
