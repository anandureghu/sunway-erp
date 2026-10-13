import { useEffect, useState, useMemo, useCallback } from "react";
import { DataTable } from "@/components/datatable";
import type { Vendor } from "@/types/vendor";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getVendorColumns } from "@/lib/columns/vendor-listing-admin";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VendorDialog } from "./vendor-dialog";
import { useLocation, useNavigate } from "react-router-dom";
import { getParentPath } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { Users } from "lucide-react";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { ImportVendorsCsvDialog } from "./import-vendors-csv-dialog";
import { listVendors, listVendorsPaged } from "@/service/vendorService";
import { useServerPagedList } from "@/hooks/use-server-paged-list";

export default function VendorsPage({
  financeSettings,
}: {
  financeSettings?: boolean;
}) {
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("active");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [kpiVendors, setKpiVendors] = useState<Vendor[]>([]);
  const { pathname } = useLocation();
  const { user } = useAuth();

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

  const fetchVendors = useCallback(async () => {
    reload();
    try {
      setKpiVendors(await listVendors());
    } catch {
      /* best-effort */
    }
  }, [reload]);

  useEffect(() => {
    void listVendors()
      .then(setKpiVendors)
      .catch(() => {
        /* best-effort */
      });
  }, []);

  const handleDialogSuccess = () => {
    void fetchVendors();
    setSelected(null);
  };

  const handleEdit = (vendor: Vendor) => {
    setSelected(vendor);
    setOpen(true);
  };

  const handleDeactivate = async (vendor: Vendor) => {
    try {
      await apiClient.delete(`/vendors/${vendor.id}`);
      const vendorName = vendor.vendorName || "Supplier";
      toast.success(`Deactivated ${vendorName}`);
      await fetchVendors();
    } catch (err) {
      console.error("Deactivate failed:", err);
      toast.error(getApiErrorMessage(err, "Failed to deactivate supplier"));
    }
  };

  const navigate = useNavigate();

  const handleRowClick = (vendor: Vendor) => {
    const parentPath = getParentPath(pathname);
    navigate(`/${parentPath}/vendors/${vendor.id}`);
  };

  const columns = getVendorColumns({
    onEdit: handleEdit,
    onDeactivate: handleDeactivate,
    onView: handleRowClick,
    onApproveChange: fetchVendors,
    financeSettings: financeSettings,
    role: user?.role,
  });

  const stats = useMemo(() => {
    const total = kpiVendors.length;
    const active = kpiVendors.filter((v) => v.active !== false).length;
    const inactive = kpiVendors.filter((v) => v.active === false).length;
    const is1099 = kpiVendors.filter((v) => Boolean(v.is1099Vendor)).length;
    return { total, active, inactive, is1099 };
  }, [kpiVendors]);

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

  const cities = useMemo(() => {
    const set = new Set<string>();
    kpiVendors.forEach((v) => {
      if (v.city?.trim()) set.add(v.city.trim());
    });
    return Array.from(set).sort();
  }, [kpiVendors]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading suppliers...</p>
      </div>
    );

  return (
    <div className="space-y-6">
      <SecondaryPageHeader
        title="Suppliers"
        description="Manage suppliers"
        icon={<Users className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImportVendorsCsvDialog onImported={() => void fetchVendors()} />
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              + New Supplier
            </Button>
          </div>
        }
      />
      {/* Summary Cards */}
      <div className="mb-6">
        <KpiSummaryStrip
          items={[
            kpiFilterItem(
              {
                label: "Total Suppliers",
                value: stats.total,
                hint: "Vendor master rows",
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
                value: stats.active,
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
                label: "Inactive",
                value: stats.inactive,
                hint: "Disabled vendors",
                accent: "rose",
                icon: Users,
              },
              "inactive",
              kpiFilter,
              applyKpiFilter,
            ),
            kpiFilterItem(
              {
                label: "1099 Vendors",
                value: stats.is1099,
                hint: "Contractor accounts",
                accent: "orange",
                icon: Users,
              },
              "1099",
              kpiFilter,
              applyKpiFilter,
            ),
          ]}
        />
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by vendor name…"
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <Select
            value={cityFilter}
            onValueChange={(value) => {
              setCityFilter(value);
              setKpiFilter(null);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Cities" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Cities</SelectItem>
              {cities.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={statusFilter}
            onValueChange={(value) => {
              setStatusFilter(value);
              setKpiFilter(null);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
              <SelectItem value="all">All statuses</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {vendors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No suppliers found
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={vendors}
          onRowClick={(row) => handleRowClick(row.original)}
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

      <VendorDialog
        open={open}
        onOpenChange={setOpen}
        vendor={selected}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
