import { useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { AppTab } from "@/components/app-tab";
import { StyledTabsTrigger } from "@/components/styled-tabs-trigger";
import { Tabs, TabsContent, TabsList } from "@/components/ui/tabs";
import CategoriesMaster from "@/modules/inventory/settings/categories-master";
import WarehouseMaster from "@/modules/inventory/settings/warehouse-master";
import CarrierMaster from "@/modules/inventory/settings/carrier-master";
import VendorsPage from "../admin/vendors/vendors-page";
import CustomersPage from "../admin/customers/customers-page";
import PermissionsTab from "@/components/permissions-tab";
import { PageHeader } from "@/components/PageHeader";
import {
  Building,
  Handshake,
  List,
  Settings,
  Shield,
  Truck,
  Users,
} from "lucide-react";
import { INVENTORY_PERMISSION_MODULES } from "@/lib/permission-catalog";
import { useAuth } from "@/context/AuthContext";
import { canManagePermissions } from "@/lib/permission-ui";
import type { ReactNode } from "react";

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
  /** Single panel (no nested tabs). */
  element?: () => ReactNode;
  /** Nested items when the group has more than one setting. */
  children?: SubTab[];
};

const InventorySettingsPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { user, permissions } = useAuth();
  const showPermissions = canManagePermissions(user?.role, permissions);

  const groups = useMemo<GroupTab[]>(() => {
    const list: GroupTab[] = [
      {
        value: "categories",
        label: "Categories",
        icon: <List className="w-4 h-4" />,
        element: () => <CategoriesMaster />,
      },
      {
        value: "warehouses",
        label: "Warehouses",
        icon: <Building className="w-4 h-4" />,
        children: [
          {
            value: "warehouses",
            label: "Warehouses",
            icon: <Building className="w-4 h-4" />,
            element: () => <WarehouseMaster />,
          },
          {
            value: "carriers",
            label: "Carriers",
            icon: <Truck className="w-4 h-4" />,
            element: () => <CarrierMaster />,
          },
        ],
      },
      {
        value: "partners",
        label: "Partners",
        icon: <Handshake className="w-4 h-4" />,
        children: [
          {
            value: "customers",
            label: "Customers",
            icon: <Users className="w-4 h-4" />,
            element: () => <CustomersPage />,
          },
          {
            value: "suppliers",
            label: "Suppliers",
            icon: <Users className="w-4 h-4" />,
            element: () => <VendorsPage />,
          },
        ],
      },
    ];

    if (showPermissions) {
      list.push({
        value: "administration",
        label: "Administration",
        icon: <Shield className="w-4 h-4" />,
        children: [
          {
            value: "permissions",
            label: "Permissions",
            icon: <Shield className="w-4 h-4" />,
            element: () => (
              <PermissionsTab
                moduleType="INVENTORY"
                modules={INVENTORY_PERMISSION_MODULES}
              />
            ),
          },
        ],
      });
    }

    return list;
  }, [showPermissions]);

  // Map legacy flat tab ids (pre-grouping) onto group + sub.
  const legacyTabMap: Record<string, { tab: string; sub?: string }> = {
    categories: { tab: "categories" },
    warehouse: { tab: "warehouses", sub: "warehouses" },
    carriers: { tab: "warehouses", sub: "carriers" },
    customers: { tab: "partners", sub: "customers" },
    vendors: { tab: "partners", sub: "suppliers" },
    suppliers: { tab: "partners", sub: "suppliers" },
    permissions: { tab: "administration", sub: "permissions" },
  };

  const groupValues = groups.map((g) => g.value);
  const rawTab = searchParams.get("tab");
  const legacy = rawTab ? legacyTabMap[rawTab] : undefined;
  const requestedGroup = legacy?.tab ?? rawTab;
  const activeGroup =
    requestedGroup && groupValues.includes(requestedGroup)
      ? requestedGroup
      : groups[0]?.value ?? "categories";

  const activeGroupDef = groups.find((g) => g.value === activeGroup) ?? groups[0];
  const subValues = (activeGroupDef?.children ?? []).map((c) => c.value);
  const requestedSub = searchParams.get("sub") ?? legacy?.sub;
  const activeSub =
    requestedSub && subValues.includes(requestedSub)
      ? requestedSub
      : subValues[0] ?? "";

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
        title="Inventory Settings"
        description="Configure categories, warehouses, partners, and administration."
        variant="darkBlue"
        icon={<Settings className="w-6 h-6" />}
      />

      <AppTab
        title=""
        variant="warning"
        tabs={tabsList}
        value={activeGroup}
        onValueChange={setGroup}
      />
    </div>
  );
};

export default InventorySettingsPage;
