import { AppTab } from "@/components/app-tab";
import VendorsPage from "../admin/vendors/vendors-page";

import PermissionsTab from "@/components/permissions-tab";
import { PageHeader } from "@/components/PageHeader";
import { Settings, Shield, Users } from "lucide-react";

const FINANCE_MODULES = [
  { id: "finance_coa", label: "Chart of Accounts" },
  { id: "finance_journal", label: "Journal Entries" },
  { id: "finance_ledger", label: "General Ledger" },
  { id: "finance_invoice", label: "Invoices & Credit Notes" },
  { id: "finance_payment", label: "Payments" },
  { id: "finance_budget", label: "Budget" },
  { id: "finance_reconciliation", label: "Reconciliation" },
  { id: "finance_reports", label: "Finance Reports" },
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
    <div className="p-6">
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
