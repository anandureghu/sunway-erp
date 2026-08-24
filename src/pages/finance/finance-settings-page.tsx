import { useMemo, type ReactNode } from "react";
import { useSearchParams } from "react-router-dom";
import { AppTab } from "@/components/app-tab";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
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
  Landmark,
  Receipt,
  Settings,
  Shield,
  SlidersHorizontal,
  Users,
} from "lucide-react";

type SubTab = {
  value: string;
  label: string;
  icon: ReactNode;
  element: () => ReactNode;
};

type GroupTab = {
  value: string;
  label: string;
  icon: ReactNode;
  element?: () => ReactNode;
  children?: SubTab[];
};

/** Map legacy flat tab ids (pre-grouping) onto group + sub. */
const legacyTabMap: Record<string, { tab: string; sub?: string }> = {
  "accounting-period": { tab: "fiscal-setup", sub: "accounting-period" },
  "bank-accounts": { tab: "fiscal-setup", sub: "bank-accounts" },
  "default-accounts": { tab: "configurations", sub: "default-accounts" },
  "tax-settings": { tab: "configurations", sub: "tax-settings" },
  "invoice-settings": { tab: "configurations", sub: "invoice-settings" },
  vendors: { tab: "configurations", sub: "vendors" },
  permissions: { tab: "administration", sub: "permissions" },
};

const FinanceSettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, permissions } = useAuth();
  const showPermissions = canManagePermissions(user?.role, permissions);

  const groups = useMemo<GroupTab[]>(() => {
    const list: GroupTab[] = [
      {
        value: "fiscal-setup",
        label: "Fiscal Setup",
        icon: <Landmark className="h-4 w-4" />,
        children: [
          {
            value: "accounting-period",
            label: "Accounting Periods",
            icon: <Calendar className="h-4 w-4" />,
            element: () => <AccountingPeriodPage financeSettings />,
          },
          {
            value: "bank-accounts",
            label: "Bank Accounts",
            icon: <Banknote className="h-4 w-4" />,
            element: () => <CompanyBankAccounts financeSettings />,
          },
        ],
      },
      {
        value: "configurations",
        label: "Configurations",
        icon: <SlidersHorizontal className="h-4 w-4" />,
        children: [
          {
            value: "default-accounts",
            label: "Default Accounts",
            icon: <Banknote className="h-4 w-4" />,
            element: () => <DefaultAccountsSettingsPage financeSettings />,
          },
          {
            value: "tax-settings",
            label: "Tax Settings",
            icon: <FileText className="h-4 w-4" />,
            element: () => <TaxSettingsPage financeSettings />,
          },
          {
            value: "invoice-settings",
            label: "Invoice Settings",
            icon: <Receipt className="h-4 w-4" />,
            element: () => <InvoiceSettingsPage financeSettings />,
          },
          {
            value: "vendors",
            label: "Suppliers",
            icon: <Users className="h-4 w-4" />,
            element: () => <VendorsPage financeSettings />,
          },
        ],
      },
    ];

    if (showPermissions) {
      list.push({
        value: "administration",
        label: "Administration",
        icon: <Shield className="h-4 w-4" />,
        children: [
          {
            value: "permissions",
            label: "Permissions",
            icon: <Shield className="h-4 w-4" />,
            element: () => (
              <PermissionsTab
                moduleType="FINANCE"
                modules={FINANCE_PERMISSION_MODULES}
              />
            ),
          },
        ],
      });
    }

    return list;
  }, [showPermissions]);

  const groupValues = groups.map((g) => g.value);
  const rawTab = searchParams.get("tab");
  const legacy = rawTab ? legacyTabMap[rawTab] : undefined;
  const requestedGroup = legacy?.tab ?? rawTab;
  const activeGroup =
    requestedGroup && groupValues.includes(requestedGroup)
      ? requestedGroup
      : (groups[0]?.value ?? "fiscal-setup");

  const activeGroupDef =
    groups.find((g) => g.value === activeGroup) ?? groups[0];
  const subValues = (activeGroupDef?.children ?? []).map((c) => c.value);
  const requestedSub = searchParams.get("sub") ?? legacy?.sub;
  const activeSub =
    requestedSub && subValues.includes(requestedSub)
      ? requestedSub
      : (subValues[0] ?? "");

  const setGroup = (value: string) => {
    const next = groups.find((g) => g.value === value);
    const firstSub = next?.children?.[0]?.value;
    const params: Record<string, string> = {};
    if (value !== groups[0]?.value) params.tab = value;
    if (firstSub) params.sub = firstSub;
    setSearchParams(params, { replace: true });
  };

  const setSub = (value: string) => {
    const params: Record<string, string> = {};
    if (activeGroup !== groups[0]?.value) params.tab = activeGroup;
    if (value) params.sub = value;
    setSearchParams(params, { replace: true });
  };

  const tabsList = groups.map((group) => ({
    value: group.value,
    label: group.label,
    icon: group.icon,
    element: () => {
      if (!group.children?.length) {
        return group.element?.() ?? null;
      }

      const sub = group.children.some((c) => c.value === activeSub)
        ? activeSub
        : group.children[0].value;

      return (
        <Tabs value={sub} onValueChange={setSub} className="w-full">
          <div className="mb-4 w-full overflow-x-auto overscroll-x-contain rounded-xl border border-slate-200/80 bg-slate-50/80 p-1 [scrollbar-width:thin]">
            <TabsList className="inline-flex min-w-max w-max flex-nowrap gap-1 bg-transparent p-0">
              {group.children.map((child) => (
                <StyledTabsTrigger
                  key={child.value}
                  value={child.value}
                  className="flex items-center gap-2 shrink-0 whitespace-nowrap"
                >
                  <span className="size-4 flex items-center justify-center">
                    {child.icon}
                  </span>
                  {child.label}
                </StyledTabsTrigger>
              ))}
            </TabsList>
          </div>
          {group.children.map((child) => (
            <TabsContent
              key={child.value}
              value={child.value}
              className="mt-0 focus-visible:outline-none"
            >
              {child.element()}
            </TabsContent>
          ))}
        </Tabs>
      );
    },
  }));

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title="Finance Settings"
        description="Fiscal setup, configurations, and administration"
        variant="darkBlue"
        icon={<Settings className="w-6 h-6" />}
      />

      <AppTab
        title=""
        variant="ledger"
        tabs={tabsList}
        value={activeGroup}
        onValueChange={setGroup}
      />
    </div>
  );
};

export default FinanceSettingsPage;
