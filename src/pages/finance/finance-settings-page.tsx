import { AppTab } from "@/components/app-tab";
import VendorsPage from "../admin/vendors/vendors-page";

import PermissionsTab from "@/components/permissions-tab";

const FINANCE_MODULES = [
  { id: "coa", label: "Chart of Accounts" },
  { id: "ledger", label: "General Ledger" },
  { id: "payable", label: "Accounts Payable" },
  { id: "receivable", label: "Accounts Receivable" },
  { id: "journal", label: "Journal Entries" },
  { id: "budget", label: "Budget" },
  { id: "payment", label: "Payments" },
  { id: "invoice", label: "Invoices" },
];

const FinanceSettingsPage = () => {
  const tabsList = [
    {
      value: "vendors",
      label: "Suppliers",
      element: () => <VendorsPage financeSettings />,
    },
    {
      value: "permissions",
      label: "Permissions",
      element: () => <PermissionsTab moduleType="FINANCE" modules={FINANCE_MODULES} />,
    },
  ];

  return (
    <div className="p-5">
      <AppTab
        title="Finance Settings"
        variant="warning"
        subtitle="Manage your finance settings and suppliers"
        tabs={tabsList}
        defaultValue="vendors"
      />
    </div>
  );
};

export default FinanceSettingsPage;
