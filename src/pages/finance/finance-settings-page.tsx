import { AppTab } from "@/components/app-tab";
import VendorsPage from "../admin/vendors/vendors-page";

import PermissionsTab from "@/components/permissions-tab";
import { PageHeader } from "@/components/PageHeader";
import { Settings, Shield, Users } from "lucide-react";

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
      icon: <Users className="w-6 h-6" />,
      element: () => <VendorsPage financeSettings />,
    },
    {
      value: "permissions",
      label: "Permissions",
      icon: <Shield className="w-6 h-6" />,
      element: () => (
        <PermissionsTab moduleType="FINANCE" modules={FINANCE_MODULES} />
      ),
    },
  ];

  return (
    <div className="p-5">
      <PageHeader
        title="Finance Settings"
        description="Manage your finance settings and suppliers"
        variant="darkBlue"
        icon={<Settings className="w-6 h-6" />}
      />
      <AppTab tabs={tabsList} defaultValue="vendors" />
    </div>
  );
};

export default FinanceSettingsPage;
