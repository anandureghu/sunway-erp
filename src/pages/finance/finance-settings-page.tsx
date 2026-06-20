import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AppTab } from "@/components/app-tab";
import VendorsPage from "../admin/vendors/vendors-page";
import AccountingPeriodPage from "../admin/hr/accounting-period/accounting-period-list-page";
import { CompanyBankAccounts } from "../admin/hr/company/company-bank-accounts";
import DefaultAccountsSettingsPage from "../admin/hr/company/default-accounts-settings-page";
import TaxSettingsPage from "../admin/hr/company/tax-settings-page";
import InvoiceSettingsPage from "../admin/hr/company/invoice-settings-page";

import PermissionsTab from "@/components/permissions-tab";
import { PageHeader } from "@/components/PageHeader";
import {
  Banknote,
  Calendar,
  FileText,
  Receipt,
  Settings,
  Shield,
  Users,
} from "lucide-react";

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

const TAB_VALUES = [
  "vendors",
  "accounting-period",
  "bank-accounts",
  "default-accounts",
  "tax-settings",
  "invoice-settings",
  "permissions",
] as const;

type FinanceSettingsTab = (typeof TAB_VALUES)[number];

const FinanceSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabParam = searchParams.get("tab");
  const activeTab: FinanceSettingsTab = TAB_VALUES.includes(
    tabParam as FinanceSettingsTab,
  )
    ? (tabParam as FinanceSettingsTab)
    : "vendors";

  const tabsList = useMemo(
    () => [
      {
        value: "vendors",
        label: "Suppliers",
        icon: <Users className="w-6 h-6" />,
        element: () => <VendorsPage financeSettings />,
      },
      {
        value: "accounting-period",
        label: "Accounting Period",
        icon: <Calendar className="w-6 h-6" />,
        element: () => <AccountingPeriodPage financeSettings />,
      },
      {
        value: "bank-accounts",
        label: "Bank Accounts",
        icon: <Banknote className="w-6 h-6" />,
        element: () => <CompanyBankAccounts financeSettings />,
      },
      {
        value: "default-accounts",
        label: "Default Accounts",
        icon: <Banknote className="w-6 h-6" />,
        element: () => <DefaultAccountsSettingsPage financeSettings />,
      },
      {
        value: "tax-settings",
        label: "Tax Settings",
        icon: <FileText className="w-6 h-6" />,
        element: () => <TaxSettingsPage financeSettings />,
      },
      {
        value: "invoice-settings",
        label: "Invoice Settings",
        icon: <Receipt className="w-6 h-6" />,
        element: () => <InvoiceSettingsPage financeSettings />,
      },
      {
        value: "permissions",
        label: "Permissions",
        icon: <Shield className="w-6 h-6" />,
        element: () => (
          <PermissionsTab moduleType="FINANCE" modules={FINANCE_MODULES} />
        ),
      },
    ],
    [],
  );

  const handleTabChange = (value: string) => {
    setSearchParams(
      value === "vendors" ? {} : { tab: value },
      { replace: true },
    );
  };

  return (
    <div className="p-6">
      <PageHeader
        title="Finance Settings"
        description="Manage finance configuration, suppliers, and permissions"
        variant="darkBlue"
        icon={<Settings className="w-6 h-6" />}
      />
      <AppTab
        tabs={tabsList}
        value={activeTab}
        onValueChange={handleTabChange}
      />
    </div>
  );
};

export default FinanceSettingsPage;
