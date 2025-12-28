import { AppTab } from "@/components/app-tab";
import VendorsPage from "../admin/vendors/vendors-page";
import CustomersPage from "../admin/customers/customers-page";
import ChartOfAccountsPage from "@/modules/finance/chart-of-accounts-list";
import { useAuth } from "@/context/AuthContext";

const FinanceSettingsPage = () => {
  const { user } = useAuth();
  const tabsList = [
    {
      value: "coa",
      label: "Chart of Accounts",
      element: () => <ChartOfAccountsPage companyId={user?.companyId || ""} />,
    },
    {
      value: "customers",
      label: "Customers",
      element: () => <CustomersPage />,
    },
    {
      value: "vendors",
      label: "Vendors",
      element: () => <VendorsPage />,
    },
  ];
  return (
    <div className="p-5">
      <AppTab
        title="Finance Settings"
        tabs={tabsList}
        defaultValue="customers"
        // props={{
        //   invoices,
        //   companyId: user?.companyId ? Number(user.companyId) : 0,
        // }}
      />
    </div>
  );
};

export default FinanceSettingsPage;
