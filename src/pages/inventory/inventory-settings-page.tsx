import { AppTab } from "@/components/app-tab";
import CategoriesMaster from "@/modules/inventory/settings/categories-master";
import WarehouseMaster from "@/modules/inventory/settings/warehouse-master";
import VendorsPage from "../admin/vendors/vendors-page";
import CustomersPage from "../admin/customers/customers-page";

import PermissionsTab from "@/components/permissions-tab";
import { PageHeader } from "@/components/PageHeader";
import { Building, List, Settings, Shield, Users } from "lucide-react";

const INVENTORY_MODULES = [
  { id: "inventory_category", label: "Categories" },
  { id: "inventory_warehouse", label: "Warehouse" },
  { id: "inventory_stock", label: "Stock Management" },
  { id: "inventory_item", label: "Items" },
  { id: "inventory_purchase", label: "Purchase" },
  { id: "inventory_receipt", label: "Goods Receipt" },
  { id: "inventory_sales", label: "Sales" },
];

const InventorySettingsPage = () => {
  const tabsList = [
    {
      value: "categories",
      label: "Categories",
      element: () => <CategoriesMaster />,
      icon: <List className="w-6 h-6" />,
    },
    {
      value: "warehouse",
      label: "Warehouse",
      element: () => <WarehouseMaster />,
      icon: <Building className="w-6 h-6" />,
    },
    {
      value: "customers",
      label: "Customers",
      element: () => <CustomersPage />,
      icon: <Users className="w-6 h-6" />,
    },
    {
      value: "vendors",
      label: "Suppliers",
      element: () => <VendorsPage />,
      icon: <Users className="w-6 h-6" />,
    },
    {
      value: "permissions",
      label: "Permissions",
      element: () => (
        <PermissionsTab moduleType="INVENTORY" modules={INVENTORY_MODULES} />
      ),
      icon: <Shield className="w-6 h-6" />,
    },
  ];

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Inventory Settings"
        description="Configure master data for categories, warehouses, customers, and suppliers."
        variant="darkBlue"
        icon={<Settings className="w-6 h-6" />}
      />

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
