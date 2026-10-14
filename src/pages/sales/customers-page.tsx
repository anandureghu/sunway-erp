import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, UserCheck, Mail, UserX } from "lucide-react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getCustomerColumns } from "@/lib/columns/customer-listing-admin";
import type { Customer } from "@/types/customer";
import type { Row } from "@tanstack/react-table";
import { CustomerDialog } from "@/pages/admin/customers/customer-dialog";
import { PageHeader } from "@/components/PageHeader";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import {
  ListToolbar,
  ListSearchField,
  ListToolbarSelect,
} from "@/components/list-toolbar";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import { listCustomersPaged } from "@/service/customerService";

export default function CustomersPage() {
  const { confirm } = useConfirmDialog();
  const navigate = useNavigate();
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [phoneFilter, setPhoneFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [kpiCounts, setKpiCounts] = useState({
    total: 0,
    active: 0,
    withEmail: 0,
    inactive: 0,
  });

  const filters = useMemo(
    () => ({
      status: statusFilter,
      phone: phoneFilter.trim(),
      code: codeFilter.trim(),
    }),
    [statusFilter, phoneFilter, codeFilter],
  );

  const fetchCustomers = useCallback(
    (params: {
      page: number;
      size: number;
      search: string;
      status: string;
      phone: string;
      code: string;
    }) =>
      listCustomersPaged({
        page: params.page,
        size: params.size,
        search: params.search,
        status: params.status,
        phone: params.phone,
        code: params.code,
      }),
    [],
  );

  const {
    rows: customers,
    loading,
    searchInput: searchQuery,
    setSearchInput: setSearchQuery,
    page,
    setPage,
    pageSize,
    setPageSize,
    totalElements,
    pageCount,
    reload,
  } = useServerPagedList<
    Customer,
    { status: string; phone: string; code: string }
  >({
    fetcher: fetchCustomers,
    filters,
    errorMessage: "Failed to load customers",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, active, inactive, withEmail] = await Promise.all([
          listCustomersPaged({ page: 0, size: 1, status: "all" }),
          listCustomersPaged({ page: 0, size: 1, status: "active" }),
          listCustomersPaged({ page: 0, size: 1, status: "inactive" }),
          listCustomersPaged({ page: 0, size: 1, status: "with_email" }),
        ]);
        if (cancelled) return;
        setKpiCounts({
          total: all.totalElements,
          active: active.totalElements,
          inactive: inactive.totalElements,
          withEmail: withEmail.totalElements,
        });
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const handleEdit = (customer: Customer) => {
    setSelected(customer);
    setOpen(true);
  };

  const handleDeactivate = async (customer: Customer) => {
    const displayName = customer.customerName || customer.name || "Customer";
    if (
      !(await confirm(
        `Deactivate customer "${displayName}"? They will be hidden from new orders until reactivated.`,
      ))
    ) {
      return;
    }
    try {
      await apiClient.delete(`/customers/${customer.id}`);
      toast.success(`Customer "${displayName}" deactivated`);
      reload();
    } catch (error) {
      console.error("Deactivate failed:", error);
      toast.error("Failed to deactivate customer");
    }
  };

  const handleRowClick = (row: Row<Customer>) => {
    const customer = row.original;
    navigate(`/inventory/sales/customers/${customer.id}`);
  };

  const handleDialogSuccess = (_updated: Customer, mode: "add" | "edit") => {
    reload();
    setSelected(null);
    if (mode === "add") setOpen(false);
  };

  const columns = getCustomerColumns({
    onEdit: handleEdit,
    onDeactivate: handleDeactivate,
  });

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    switch (key) {
      case "active":
        setStatusFilter("active");
        break;
      case "inactive":
        setStatusFilter("inactive");
        break;
      case "with_email":
        setStatusFilter("with_email");
        break;
      default:
        setStatusFilter("all");
        break;
    }
  }, []);

  const customerKpis = useMemo((): KpiSummaryStat[] => {
    return [
      kpiFilterItem(
        {
          label: "Total customers",
          value: kpiCounts.total,
          hint: "Sales buyer accounts",
          accent: "sky",
          icon: Users,
        },
        "all",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Active",
          value: kpiCounts.active,
          hint: "Enabled for ordering",
          accent: "emerald",
          icon: UserCheck,
        },
        "active",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "With email",
          value: kpiCounts.withEmail,
          hint: "Reachable for invoicing",
          accent: "violet",
          icon: Mail,
        },
        "with_email",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Inactive",
          value: kpiCounts.inactive,
          hint: "Deactivated accounts",
          accent: "amber",
          icon: UserX,
        },
        "inactive",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [kpiCounts, kpiFilter, applyKpiFilter]);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <PageHeader
        variant="darkBlue"
        title="Sales Customers"
        description="Maintain buyers used on sales orders: contacts, billing details, and account notes."
        backHref="/inventory/sales"
        actions={
          <Button
            size="lg"
            className="bg-white text-slate-900 hover:bg-white/90"
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
          >
            Add New Customer
          </Button>
        }
      />

      <KpiSummaryStrip items={customerKpis} />

      <Card>
        <CardHeader>
          <ListToolbar className="p-0">
            <ListSearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by customer name..."
              className="flex-1 min-w-[220px] sm:max-w-none"
            />
            <Input
              placeholder="Filter by customer code..."
              className="h-9 w-full rounded-full border-slate-200 text-sm lg:w-48"
              value={codeFilter}
              onChange={(e) => setCodeFilter(e.target.value)}
            />
            <Input
              placeholder="Filter by phone..."
              className="h-9 w-full rounded-full border-slate-200 text-sm lg:w-44"
              value={phoneFilter}
              onChange={(e) => setPhoneFilter(e.target.value)}
            />
            <ListToolbarSelect
              aria-label="Status"
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setKpiFilter(null);
              }}
            >
              <option value="active">Active only</option>
              <option value="inactive">Inactive only</option>
              <option value="all">All statuses</option>
            </ListToolbarSelect>
          </ListToolbar>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">
              Loading customers...
            </div>
          ) : customers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No customers found
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={customers}
              onRowClick={handleRowClick}
              serverPagination={{
                total: totalElements,
                pageIndex: page,
                pageSize,
                pageCount: Math.max(pageCount, 1),
                onPageChange: setPage,
                onPageSizeChange: setPageSize,
              }}
            />
          )}
        </CardContent>
      </Card>

      <CustomerDialog
        open={open}
        onOpenChange={setOpen}
        customer={selected}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
