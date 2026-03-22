import { AppTab } from "@/components/app-tab";
import CategoriesMaster from "@/modules/inventory/settings/categories-master";
import WarehouseMaster from "@/modules/inventory/settings/warehouse-master";
import VendorsPage from "../admin/vendors/vendors-page";
import CustomersPage from "../admin/customers/customers-page";

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
    <div className="p-5">
      <AppTab
        title="Invetory Settings"
        variant="warning"
        subtitle="Manage your inventory settings and suppliers"
        tabs={tabsList}
        defaultValue="categories"
      />
    </div>
  );
};

export default InventorySettingsPage;
