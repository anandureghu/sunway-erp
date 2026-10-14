import { useEffect, useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/datatable";
import type { Customer } from "@/types/customer";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getCustomerColumns } from "@/lib/columns/customer-listing-admin";
import { Input } from "@/components/ui/input";
import { Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CustomerDialog } from "./customer-dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { getParentPath } from "@/lib/utils";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import { listCustomersPaged } from "@/service/customerService";
import {
  ListToolbar,
  ListSearchField,
  ListToolbarSelect,
} from "@/components/list-toolbar";

export default function CustomersPage() {
  const [selected, setSelected] = useState<Customer | null>(null);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [countryFilter, setCountryFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [codeFilter, setCodeFilter] = useState("");
  const [kpiCounts, setKpiCounts] = useState({
    total: 0,
    active: 0,
    inactive: 0,
  });
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const filters = useMemo(
    () => ({
      status: statusFilter,
      country: countryFilter.trim() || "all",
      city: cityFilter.trim() || "all",
      customerType: typeFilter,
      phone: phoneFilter.trim(),
      code: codeFilter.trim(),
    }),
    [statusFilter, countryFilter, cityFilter, typeFilter, phoneFilter, codeFilter],
  );

  const fetchCustomers = useCallback(
    (params: {
      page: number;
      size: number;
      search: string;
      status: string;
      country: string;
      city: string;
      customerType: string;
      phone: string;
      code: string;
    }) =>
      listCustomersPaged({
        page: params.page,
        size: params.size,
        search: params.search,
        status: params.status,
        country: params.country,
        city: params.city,
        customerType: params.customerType,
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
    {
      status: string;
      country: string;
      city: string;
      customerType: string;
      phone: string;
      code: string;
    }
  >({
    fetcher: fetchCustomers,
    filters,
    errorMessage: "Failed to load customers",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [all, active, inactive] = await Promise.all([
          listCustomersPaged({ page: 0, size: 1, status: "all" }),
          listCustomersPaged({ page: 0, size: 1, status: "active" }),
          listCustomersPaged({ page: 0, size: 1, status: "inactive" }),
        ]);
        if (cancelled) return;
        setKpiCounts({
          total: all.totalElements,
          active: active.totalElements,
          inactive: inactive.totalElements,
        });
      } catch {
        /* best-effort */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [reload]);

  const handleDialogSuccess = (_updated: Customer, mode: "add" | "edit") => {
    reload();
    setSelected(null);
    if (mode === "add") setOpen(false);
  };

  const handleEdit = (customer: Customer) => {
    setSelected(customer);
    setOpen(true);
  };

  const handleDeactivate = async (customer: Customer) => {
    const customerName = customer.customerName || customer.name || "Customer";
    try {
      await apiClient.delete(`/customers/${customer.id}`);
      toast.success(`Deactivated ${customerName}`);
      reload();
    } catch (err) {
      console.error("Deactivate failed:", err);
      toast.error("Failed to deactivate customer");
    }
  };

  const handleRowClick = (customer: Customer) => {
    const parentPath = getParentPath(pathname);
    const path = `/${parentPath}/customers/${customer.id}`;
    navigate(path);
  };

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    switch (key) {
      case "active":
        setStatusFilter("active");
        break;
      case "inactive":
        setStatusFilter("inactive");
        break;
      default:
        setStatusFilter("all");
        break;
    }
  }, []);

  const columns = getCustomerColumns({
    onEdit: handleEdit,
    onDeactivate: handleDeactivate,
    onView: handleRowClick,
  });

  return (
    <div className="space-y-6 w-full">
      <SecondaryPageHeader
        title="Customers"
        description="Manage customers"
        icon={<Users className="h-5 w-5" />}
        actions={
          <Button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            + New Customer
          </Button>
        }
      />

      <div className="mb-6">
        <KpiSummaryStrip
          items={[
            kpiFilterItem(
              {
                label: "Total Customers",
                value: kpiCounts.total,
                hint: "Customer master rows",
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
                hint: "Currently active",
                accent: "emerald",
                icon: Users,
              },
              "active",
              kpiFilter,
              applyKpiFilter,
            ),
            kpiFilterItem(
              {
                label: "Inactive",
                value: kpiCounts.inactive,
                hint: "Disabled accounts",
                accent: "rose",
                icon: Users,
              },
              "inactive",
              kpiFilter,
              applyKpiFilter,
            ),
          ]}
        />
      </div>

      <ListToolbar className="px-0 py-0">
        <ListSearchField
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search by name, email, phone, or city..."
          className="min-w-[300px] flex-1 sm:max-w-none"
        />
        <Input
          placeholder="Customer code..."
          className="h-9 w-[140px] rounded-full border-slate-200 text-sm"
          value={codeFilter}
          onChange={(e) => setCodeFilter(e.target.value)}
        />
        <Input
          placeholder="Phone..."
          className="h-9 w-[140px] rounded-full border-slate-200 text-sm"
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
        <Input
          placeholder="Country..."
          className="h-9 w-[140px] rounded-full border-slate-200 text-sm"
          value={countryFilter}
          onChange={(e) => setCountryFilter(e.target.value)}
        />
        <ListToolbarSelect
          aria-label="Customer type"
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
        >
          <option value="all">All Types</option>
          <option value="retail">Retail</option>
          <option value="wholesale">Wholesale</option>
          <option value="corporate">Corporate</option>
          <option value="individual">Individual</option>
        </ListToolbarSelect>
        <Input
          placeholder="City..."
          className="h-9 w-[140px] rounded-full border-slate-200 text-sm"
          value={cityFilter}
          onChange={(e) => setCityFilter(e.target.value)}
        />
      </ListToolbar>

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

      <CustomerDialog
        open={open}
        onOpenChange={setOpen}
        customer={selected}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
