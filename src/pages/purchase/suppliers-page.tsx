import { useEffect, useMemo, useState, useCallback } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Building2, Mail, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import { listVendors, listVendorsPaged } from "@/service/vendorService";
import { toast } from "sonner";
import { getVendorColumns } from "@/lib/columns/vendor-listing-admin";
import type { Vendor } from "@/types/vendor";
import type { Row } from "@tanstack/react-table";
import { VendorDialog } from "@/pages/admin/vendors/vendor-dialog";
import { ImportVendorsCsvDialog } from "@/pages/admin/vendors/import-vendors-csv-dialog";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  KpiSummaryStrip,
  type KpiSummaryStat,
} from "@/components/kpi-summary-strip";
import { PageHeader } from "@/components/PageHeader";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { useServerPagedList } from "@/hooks/use-server-paged-list";
import {
  ListToolbar,
  ListSearchField,
  ListToolbarSelect,
} from "@/components/list-toolbar";

export default function SuppliersPage() {
  const { confirm } = useConfirmDialog();
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("active");
  const [cityFilter, setCityFilter] = useState("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [kpiVendors, setKpiVendors] = useState<Vendor[]>([]);

  const navigate = useNavigate();

  const filters = useMemo(() => {
    const base: {
      city?: string;
      isActive?: boolean;
      approved?: boolean;
      rejected?: boolean;
    } = {};
    if (cityFilter !== "all") base.city = cityFilter;
    if (statusFilter === "active") base.isActive = true;
    else if (statusFilter === "inactive") base.isActive = false;
    else if (statusFilter === "approved") {
      base.approved = true;
      base.rejected = false;
    } else if (statusFilter === "pending") {
      base.approved = false;
      base.rejected = false;
    }
    return base;
  }, [statusFilter, cityFilter]);

  const fetchPage = useCallback(
    async (params: {
      page: number;
      size: number;
      search: string;
      city?: string;
      isActive?: boolean;
      approved?: boolean;
      rejected?: boolean;
    }) =>
      listVendorsPaged({
        page: params.page,
        size: params.size,
        search: params.search,
        city: params.city,
        isActive: params.isActive,
        approved: params.approved,
        rejected: params.rejected,
      }),
    [],
  );

  const {
    rows: vendors,
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
    Vendor,
    {
      city?: string;
      isActive?: boolean;
      approved?: boolean;
      rejected?: boolean;
    }
  >({
    fetcher: fetchPage,
    filters,
    errorMessage: "Failed to load suppliers",
  });

  const refreshKpis = useCallback(async () => {
    try {
      setKpiVendors(await listVendors());
    } catch {
      /* best-effort */
    }
  }, []);

  useEffect(() => {
    void refreshKpis();
  }, [refreshKpis]);

  const fetchVendors = useCallback(async () => {
    reload();
    await refreshKpis();
  }, [reload, refreshKpis]);

  const handleEdit = (vendor: Vendor) => {
    setSelected(vendor);
    setOpen(true);
  };

  const handleDeactivate = async (vendor: Vendor) => {
    if (
      !(await confirm(
        `Deactivate supplier "${vendor.vendorName}"? They will be hidden from new purchase orders until reactivated.`,
      ))
    ) {
      return;
    }
    try {
      await apiClient.delete(`/vendors/${vendor.id}`);
      const vendorName = vendor.vendorName || "Supplier";
      toast.success(`Supplier "${vendorName}" deactivated`);
      await fetchVendors();
    } catch (error) {
      console.error("Deactivate failed:", error);
      toast.error(getApiErrorMessage(error, "Failed to deactivate supplier"));
    }
  };

  const handleRowClick = (row: Row<Vendor>) => {
    const vendor = row.original;
    navigate(`/inventory/purchase/suppliers/${vendor.id}`);
  };

  const handleDialogSuccess = () => {
    void fetchVendors();
    setSelected(null);
  };

  const columns = getVendorColumns({
    onEdit: handleEdit,
    onDeactivate: handleDeactivate,
  });

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    kpiVendors.forEach((v) => {
      if (v.city?.trim()) set.add(v.city.trim());
    });
    return Array.from(set).sort();
  }, [kpiVendors]);

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    switch (key) {
      case "active":
        setStatusFilter("active");
        break;
      case "approved":
        setStatusFilter("approved");
        break;
      case "pending":
        setStatusFilter("pending");
        break;
      default:
        setStatusFilter("all");
        break;
    }
  }, []);

  const supplierKpis = useMemo((): KpiSummaryStat[] => {
    const total = kpiVendors.length;
    const active = kpiVendors.filter((v) => v.active !== false).length;
    const approved = kpiVendors.filter((v) => v.approved && !v.rejected).length;
    const withEmail = kpiVendors.filter((v) => (v.email || "").trim()).length;
    return [
      kpiFilterItem(
        {
          label: "Total suppliers",
          value: total,
          hint: "Vendor master rows",
          accent: "sky",
          icon: Building2,
        },
        "all",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Active",
          value: active,
          hint: "Available on Purchase Orders",
          accent: "emerald",
          icon: Users,
        },
        "active",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Approved",
          value: approved,
          hint: "Passed onboarding checks",
          accent: "violet",
          icon: ShieldCheck,
        },
        "approved",
        kpiFilter,
        applyKpiFilter,
      ),
      kpiFilterItem(
        {
          label: "Pending for Approval",
          value: withEmail,
          hint: "Contacts on file",
          accent: "amber",
          icon: Mail,
        },
        "pending",
        kpiFilter,
        applyKpiFilter,
      ),
    ];
  }, [kpiVendors, kpiFilter, applyKpiFilter]);

  if (loading && vendors.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <PageHeader
        title="Suppliers"
        description="Manage Vendors and suppliers - Supplier have to approved by the finance manager"
        backHref="/inventory/purchase"
        variant="darkGreen"
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImportVendorsCsvDialog onImported={() => void fetchVendors()} />
            <Button
              size="lg"
              className="bg-white text-slate-900 hover:bg-white/90"
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add New Supplier
            </Button>
          </div>
        }
      />

      <KpiSummaryStrip items={supplierKpis} />

      <Card>
        <CardHeader>
          <ListToolbar className="p-0">
            <ListSearchField
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search by vendor name…"
              className="min-w-[240px] flex-1 sm:max-w-none"
            />
            <ListToolbarSelect
              aria-label="City"
              value={cityFilter}
              onChange={(e) => {
                setCityFilter(e.target.value);
                setKpiFilter(null);
              }}
            >
              <option value="all">All Cities</option>
              {cityOptions.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </ListToolbarSelect>
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
              <option value="approved">Approved only</option>
              <option value="pending">Pending approval</option>
              <option value="all">All statuses</option>
            </ListToolbarSelect>
          </ListToolbar>
        </CardHeader>

        <CardContent>
          {vendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={vendors}
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

      <VendorDialog
        open={open}
        onOpenChange={setOpen}
        vendor={selected}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
