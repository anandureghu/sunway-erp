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
import { FINANCE_PERMISSION_MODULES } from "@/lib/permission-catalog";
import { canManagePermissions } from "@/lib/permission-ui";
import { useAuth } from "@/context/AuthContext";
import {
  Banknote,
  Calendar,
  FileText,
  Receipt,
  Settings,
  Shield,
  Users,
} from "lucide-react";

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
  const { user, permissions } = useAuth();
  const showPermissions = canManagePermissions(user?.role, permissions);

  const tabParam = searchParams.get("tab");
  const requestedTab = TAB_VALUES.includes(tabParam as FinanceSettingsTab)
    ? (tabParam as FinanceSettingsTab)
    : "vendors";
  // Don't land on a Permissions tab the user can't use.
  const activeTab: FinanceSettingsTab =
    requestedTab === "permissions" && !showPermissions
      ? "vendors"
      : requestedTab;

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
      ...(showPermissions
        ? [
            {
              value: "permissions",
              label: "Permissions",
              icon: <Shield className="w-6 h-6" />,
              element: () => (
                <PermissionsTab
                  moduleType="FINANCE"
                  modules={FINANCE_PERMISSION_MODULES}
                />
              ),
            },
          ]
        : []),
    ],
    [showPermissions],
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
