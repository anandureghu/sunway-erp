import { DataTable } from "@/components/ui/data-table";
import SelectEmployees from "@/components/select-employees";
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
import { type WarehouseFormData, WAREHOUSE_SCHEMA } from "@/schema/inventory";
import {
  listWarehouses,
  createWarehouse,
  deleteWarehouse,
  generateWarehouseCode,
  updateWarehouse,
} from "@/service/inventoryService";
import type { Warehouse } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Plus,
  Search,
  Warehouse as WarehouseIcon,
  CircleCheckBig,
  CircleSlash2,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

// Section card
function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-slate-700">
          {title}
        </span>
      </div>
      <div className="p-5 space-y-5">{children}</div>
    </div>
  );
}

// Field wrapper
function F({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
        {required && <span className="ml-0.5 text-rose-400">*</span>}
      </label>
      {children}
    </div>
  );
}

const icls =
  "h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

const WarehouseMaster = () => {
  // Warehouses management state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(null);

  // TODO: set loading and error states properly
  const [, setLoading] = useState(true);
  const [, setLoadError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const {
    register: registerWarehouse,
    handleSubmit: handleWarehouseSubmit,
    formState: { errors: warehouseErrors },
    reset: resetWarehouse,
    watch: watchWarehouse,
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(WAREHOUSE_SCHEMA),
    defaultValues: {
      status: "active",
    },
  });

  // Warehouse handlers
  const onWarehouseSubmit = async (data: WarehouseFormData) => {
    try {
      const normalizedName = data.name.trim();

      const payload: any = {
        ...data,
        status: data.status || "active",
      };

      // Add code for new warehouses
      if (!editingWarehouse) {
        payload.code = generateWarehouseCode(normalizedName);
      }

      if (editingWarehouse) {
        await updateWarehouse(editingWarehouse.id, payload);
        toast.success("Warehouse updated successfully!");
      } else {
        await createWarehouse(payload);
        toast.success("Warehouse created successfully!");
      }

      // Reload warehouses
      const warehousesList = await listWarehouses();
      setWarehouses(warehousesList);

      // Reset form
      setShowWarehouseForm(false);
      setEditingWarehouse(null);
      resetWarehouse();
    } catch (error: any) {
      console.error("Failed to save warehouse:", error);
      const status = error?.response?.status;
      const errorMessage = error?.response?.data?.message || "";
      const errorData = error?.response?.data || {};

      if (status === 409) {
        // Conflict - warehouse name or code already exists
        const conflictField =
          errorData.field ||
          (errorMessage.toLowerCase().includes("code") ? "code" : "name");
        if (conflictField === "code") {
          toast.error(
            `Warehouse code already exists. The name "${data.name}" generates a code that conflicts. Please use a different name.`,
          );
        } else {
          toast.error(
            `Warehouse name "${data.name}" already exists. Please use a different name.`,
          );
        }
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error(
          editingWarehouse
            ? "Failed to update warehouse. Please try again."
            : "Failed to create warehouse. Please try again.",
        );
      }
    }
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setEditingWarehouse(warehouse);
    resetWarehouse({
      ...warehouse,
      name: warehouse.name,
      status: warehouse.status,
    });
    setShowWarehouseForm(true);
  };

  const handleDeleteWarehouse = async (id: string) => {
    if (!confirm("Are you sure you want to delete this warehouse?")) return;

    try {
      await deleteWarehouse(id);
      toast.success("Warehouse deleted successfully!");

      // Reload warehouses
      const warehousesList = await listWarehouses();
      setWarehouses(warehousesList);
    } catch (error: any) {
      console.error("Failed to delete warehouse:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to delete warehouse. Please try again.",
      );
    }
  };

  const handleNewWarehouse = () => {
    setEditingWarehouse(null);
    resetWarehouse({
      status: "active",
    });
    setShowWarehouseForm(true);
  };

  // Load stock data from API
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setLoadError(null);

        // Fetch all data in parallel
        const [warehousesList] = await Promise.all([listWarehouses()]);

        if (!cancelled) {
          setWarehouses(warehousesList);
        }
      } catch (error: any) {
        if (!cancelled) {
          console.error("Failed to load warehouse data:", error);
          setLoadError(error?.message || "Failed to load warehouse data");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Calculate statistics
  const stats = useMemo(() => {
    const total = warehouses.length;
    const active = warehouses.filter((w) => w.status === "active").length;
    const inactive = warehouses.filter((w) => w.status === "inactive").length;
    return { total, active, inactive };
  }, [warehouses]);

  const filteredWarehouses = useMemo(() => {
    return warehouses.filter((wh) => {
      const matchesSearch =
        searchQuery === "" ||
        wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (wh.location || "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesStatus =
        statusFilter === "all" || wh.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [warehouses, searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredWarehouses.length / itemsPerPage);
  const paginatedWarehouses = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredWarehouses.slice(startIndex, endIndex);
  }, [filteredWarehouses, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  return (
    <div className="space-y-6">
      <SecondaryPageHeader
        title="Warehouses"
        description="Manage warehouses"
        icon={<WarehouseIcon className="h-5 w-5" />}
        actions={
          <Button
            onClick={handleNewWarehouse}
            className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
          >
            <Plus className="h-4 w-4 mr-2" /> New Warehouse
          </Button>
        }
      />
      {/* Summary Cards */}
      <div className="mb-6">
        <KpiSummaryStrip
          items={[
            {
              label: "Total Warehouses",
              value: stats.total,
              hint: "Total active locations",
              accent: "sky",
              icon: WarehouseIcon,
            },
            {
              label: "Active",
              value: stats.active,
              hint: "Currently in use",
              accent: "emerald",
              icon: CircleCheckBig,
            },
            {
              label: "Inactive",
              value: stats.inactive,
              hint: "Disabled locations",
              accent: "rose",
              icon: CircleSlash2,
            },
          ]}
        />
      </div>

      {/* Search and Filters */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex-1 relative min-w-[300px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search warehouses..."
            className="pl-10 rounded-xl border-slate-200 text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] rounded-xl border-slate-200 text-[13px]">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-xl border-slate-200 shadow-lg">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Warehouse Form */}
      {showWarehouseForm && (
        <div className="rounded-2xl border border-slate-100 bg-white shadow-sm overflow-hidden">
          {/* ── Form Header ── */}
          <div className="flex items-center gap-3 border-b border-slate-100 px-5 py-3.5 bg-slate-50/60">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-orange-500">
              <WarehouseIcon className="h-3.5 w-3.5 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-slate-700">
              {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
            </span>
          </div>

          <div className="p-5">
            <form
              onSubmit={handleWarehouseSubmit(onWarehouseSubmit)}
              className="space-y-6"
            >
              {/* ── Section: Basic Information ── */}
              <SectionCard
                icon={<WarehouseIcon className="h-3.5 w-3.5 text-white" />}
                title="Basic information"
              >
                <div className="grid grid-cols-2 gap-5">
                  <F label="Warehouse Name" required>
                    <Input
                      placeholder="Warehouse name"
                      {...registerWarehouse("name")}
                      className={icls}
                    />
                    {warehouseErrors.name && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {warehouseErrors.name.message}
                      </p>
                    )}
                  </F>

                  <F label="Status" required>
                    <Select
                      onValueChange={(value) =>
                        resetWarehouse({
                          ...watchWarehouse(),
                          status: value as "active" | "inactive",
                        })
                      }
                      value={watchWarehouse("status")}
                    >
                      <SelectTrigger className={icls}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {warehouseErrors.status && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {warehouseErrors.status.message}
                      </p>
                    )}
                  </F>

                  <F label="Phone">
                    <Input
                      placeholder="Phone"
                      {...registerWarehouse("phone")}
                      className={icls}
                    />
                    {warehouseErrors.phone && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {warehouseErrors.phone.message}
                      </p>
                    )}
                  </F>

                  <F label="Contact Person Name">
                    <Input
                      placeholder="Contact Person Name"
                      {...registerWarehouse("contactPersonName")}
                      className={icls}
                    />
                    {warehouseErrors.contactPersonName && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {warehouseErrors.contactPersonName.message}
                      </p>
                    )}
                  </F>
                </div>
              </SectionCard>

              {/* ── Section: Address ── */}
              <SectionCard
                icon={<WarehouseIcon className="h-3.5 w-3.5 text-white" />}
                title="Address"
              >
                <div className="grid grid-cols-2 gap-5">
                  <F label="Street">
                    <Input
                      placeholder="Street"
                      {...registerWarehouse("street")}
                      className={icls}
                    />
                    {warehouseErrors.street && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {warehouseErrors.street.message}
                      </p>
                    )}
                  </F>

                  <F label="City">
                    <Input
                      placeholder="City"
                      {...registerWarehouse("city")}
                      className={icls}
                    />
                    {warehouseErrors.city && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {warehouseErrors.city.message}
                      </p>
                    )}
                  </F>

                  <F label="Country">
                    <Input
                      placeholder="Country"
                      {...registerWarehouse("country")}
                      className={icls}
                    />
                    {warehouseErrors.country && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {warehouseErrors.country.message}
                      </p>
                    )}
                  </F>

                  <F label="Pin Code">
                    <Input
                      placeholder="Pin Code"
                      {...registerWarehouse("pin")}
                      className={icls}
                    />
                    {warehouseErrors.pin && (
                      <p className="text-[11px] text-rose-400 mt-1">
                        {warehouseErrors.pin.message}
                      </p>
                    )}
                  </F>
                </div>
              </SectionCard>

              {/* ── Section: Manager Assignment ── */}
              <SectionCard
                icon={<WarehouseIcon className="h-3.5 w-3.5 text-white" />}
                title="Manager assignment"
              >
                <SelectEmployees
                  value={watchWarehouse("manager")?.toString()}
                  onChange={(v) =>
                    resetWarehouse({
                      ...watchWarehouse(),
                      manager: Number(v),
                    })
                  }
                  label=""
                  placeholder="Select Manager"
                />
                {warehouseErrors.manager && (
                  <p className="text-[11px] text-rose-400 mt-1">
                    {warehouseErrors.manager.message}
                  </p>
                )}
              </SectionCard>

              {/* ── Footer ── */}
              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setShowWarehouseForm(false);
                    setEditingWarehouse(null);
                    resetWarehouse();
                  }}
                  className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
                >
                  {editingWarehouse ? "Update" : "Create"} Warehouse
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {paginatedWarehouses.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No warehouses found
        </div>
      ) : (
        <>
          <DataTable
            columns={createWarehouseColumns(
              handleEditWarehouse,
              handleDeleteWarehouse,
            )}
            data={paginatedWarehouses}
          />
          {/* Pagination */}
          {totalPages > 0 && (
            <div className="flex items-center justify-between mt-4">
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
              <div className="flex items-center gap-2">
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
                          ? "min-w-[40px] bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
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
        </>
      )}
    </div>
  );
};

export default WarehouseMaster;
