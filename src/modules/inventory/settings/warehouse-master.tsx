import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createWarehouseColumns } from "@/lib/columns/warehouse-columns";
import {
  listWarehouses,
  deleteWarehouse,
} from "@/service/inventoryService";
import type { Warehouse } from "@/types/inventory";
import {
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  CircleCheckBig,
  CircleSlash2,
} from "lucide-react";
import { useEffect, useState, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { WarehouseDialog } from "./warehouse-dialog";
import { ImportWarehousesCsvDialog } from "./import-warehouses-csv-dialog";

const TYPE_LABELS: Record<string, string> = {
  MAIN: "Main / General",
  BRANCH: "Branch",
  TRANSIT: "Transit",
  COLD_STORAGE: "Cold storage",
  RETURNS: "Returns",
  HAZARDOUS: "Hazardous",
  PPE_SAFETY: "PPE / Safety",
  SITE_STORE: "Site store",
  OTHER: "Other",
};

const WarehouseMaster = () => {
  const { confirm } = useConfirmDialog();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );

  const [, setLoading] = useState(true);
  const [, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [managerFilter, setManagerFilter] = useState<string>("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const reload = useCallback(async () => {
    const warehousesList = await listWarehouses();
    setWarehouses(warehousesList);
  }, []);

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    setDialogOpen(true);
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!(await confirm("Are you sure you want to delete this warehouse?")))
      return;

    try {
      await deleteWarehouse(id);
      toast.success("Warehouse deleted successfully!");
      await reload();
    } catch (error: unknown) {
      console.error("Failed to delete warehouse:", error);
      const message =
        (error as { response?: { data?: { message?: string } } })?.response
          ?.data?.message || "Failed to delete warehouse. Please try again.";
      toast.error(message);
    }
  };

  const handleNewWarehouse = () => {
    setEditingWarehouse(null);
    setDialogOpen(true);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);
        const warehousesList = await listWarehouses();
        if (!cancelled) setWarehouses(warehousesList);
      } catch (error: unknown) {
        if (!cancelled) {
          console.error("Failed to load warehouse data:", error);
          setLoadError(
            error instanceof Error
              ? error.message
              : "Failed to load warehouse data",
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const stats = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter((w) => w.status === "active").length;
    const inactive = warehouses.filter((w) => w.status === "inactive").length;
    return { total, active, inactive };
  }, [warehouses]);

  const typeOptions = useMemo(() => {
    const set = new Set<string>();
    warehouses.forEach((w) => {
      if (w.warehouseType) set.add(w.warehouseType);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [warehouses]);

  const cityOptions = useMemo(() => {
    const set = new Set<string>();
    warehouses.forEach((w) => {
      if (w.city?.trim()) set.add(w.city.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [warehouses]);

  const managerOptions = useMemo(() => {
    const set = new Set<string>();
    warehouses.forEach((w) => {
      if (w.managerName?.trim()) set.add(w.managerName.trim());
      else if (w.contactPersonName?.trim()) set.add(w.contactPersonName.trim());
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [warehouses]);

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

  const filteredWarehouses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return warehouses.filter((wh) => {
      const haystack = [
        wh.name,
        wh.code,
        wh.city,
        wh.street,
        wh.phone,
        wh.managerName,
        wh.contactPersonName,
        wh.warehouseType,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch = q === "" || haystack.includes(q);

      const matchesStatus =
        statusFilter === "all" || wh.status === statusFilter;

      const matchesType =
        typeFilter === "all" || (wh.warehouseType || "") === typeFilter;

      const matchesCity =
        cityFilter === "all" || (wh.city || "").trim() === cityFilter;

      const managerLabel =
        wh.managerName?.trim() || wh.contactPersonName?.trim() || "";
      const matchesManager =
        managerFilter === "all" || managerLabel === managerFilter;

      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesCity &&
        matchesManager
      );
    });
  }, [
    warehouses,
    searchQuery,
    statusFilter,
    typeFilter,
    cityFilter,
    managerFilter,
  ]);

  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);
  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredWarehouses.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredWarehouses, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, typeFilter, cityFilter, managerFilter]);

  return (
    <div className="min-w-0 max-w-full space-y-6">
      <SecondaryPageHeader
        title="Warehouses"
        description="Manage warehouses"
        icon={<WarehouseIcon className="h-5 w-5" />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <ImportWarehousesCsvDialog
              onImported={async () => {
                await reload();
              }}
            />
            <Button
              onClick={handleNewWarehouse}
              className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-sm hover:from-orange-600 hover:to-amber-600"
            >
              <Plus className="mr-2 h-4 w-4" /> New Warehouse
            </Button>
          </div>
        }
      />

      <div className="mb-6 min-w-0">
        <KpiSummaryStrip
          className="xl:grid-cols-3"
          items={[
            kpiFilterItem(
              {
                label: "Total Warehouses",
                value: stats.total,
                hint: "Total active locations",
                accent: "sky",
                icon: WarehouseIcon,
              },
              "all",
              kpiFilter,
              applyKpiFilter,
            ),
            kpiFilterItem(
              {
                label: "Active",
                value: stats.active,
                hint: "Currently in use",
                accent: "emerald",
                icon: CircleCheckBig,
              },
              "active",
              kpiFilter,
              applyKpiFilter,
            ),
            kpiFilterItem(
              {
                label: "Inactive",
                value: stats.inactive,
                hint: "Disabled locations",
                accent: "rose",
                icon: CircleSlash2,
              },
              "inactive",
              kpiFilter,
              applyKpiFilter,
            ),
          ]}
        />
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-3">
        <div className="relative min-w-0 flex-1 basis-[220px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-gray-400" />
          <Input
            placeholder="Search code, name, city, manager…"
            className="rounded-xl border-slate-200 pl-10 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={typeFilter}
          onValueChange={(value) => {
            setTypeFilter(value);
            setKpiFilter(null);
          }}
        >
          <SelectTrigger className="w-[160px] shrink-0 rounded-xl border-slate-200 text-[13px]">
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-lg">
            <SelectItem value="all">All Types</SelectItem>
            {typeOptions.map((type) => (
              <SelectItem key={type} value={type}>
                {TYPE_LABELS[type] || type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={cityFilter}
          onValueChange={(value) => {
            setCityFilter(value);
            setKpiFilter(null);
          }}
        >
          <SelectTrigger className="w-[150px] shrink-0 rounded-xl border-slate-200 text-[13px]">
            <SelectValue placeholder="All Cities" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-lg">
            <SelectItem value="all">All Cities</SelectItem>
            {cityOptions.map((city) => (
              <SelectItem key={city} value={city}>
                {city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          value={managerFilter}
          onValueChange={(value) => {
            setManagerFilter(value);
            setKpiFilter(null);
          }}
        >
          <SelectTrigger className="w-[180px] shrink-0 rounded-xl border-slate-200 text-[13px]">
            <SelectValue placeholder="All Managers" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-lg">
            <SelectItem value="all">All Managers</SelectItem>
            {managerOptions.map((manager) => (
              <SelectItem key={manager} value={manager}>
                {manager}
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
          <SelectTrigger className="w-[140px] shrink-0 rounded-xl border-slate-200 text-[13px]">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent className="rounded-xl border-slate-200 shadow-lg">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <WarehouseDialog
        open={dialogOpen}
        onOpenChange={(open) => {
          setDialogOpen(open);
          if (!open) setEditingWarehouse(null);
        }}
        warehouse={editingWarehouse}
        onSuccess={async () => {
          await reload();
        }}
      />

      {paginatedWarehouses.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">
          No warehouses found
        </div>
      ) : (
        <div className="min-w-0 max-w-full space-y-4">
          <DataTable
            columns={createWarehouseColumns(
              handleEditWarehouse,
              handleDeleteWarehouse,
            )}
            data={paginatedWarehouses}
          />
          {totalPages > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm text-muted-foreground">
                Showing{" "}
                {Math.min(
                  (currentPage - 1) * itemsPerPage + 1,
                  filteredWarehouses.length,
                )}
                -
                {Math.min(
                  currentPage * itemsPerPage,
                  filteredWarehouses.length,
                )}{" "}
                of {filteredWarehouses.length} warehouses
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  ← Previous
                </Button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(page)}
                      className={
                        currentPage === page
                          ? "min-w-[40px] border-orange-500 bg-orange-500 text-white hover:bg-orange-600"
                          : "min-w-[40px]"
                      }
                    >
                      {page}
                    </Button>
                  ),
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    setCurrentPage((p) => Math.min(totalPages, p + 1))
                  }
                  disabled={currentPage === totalPages}
                >
                  Next →
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default WarehouseMaster;
