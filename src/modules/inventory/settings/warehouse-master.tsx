import { DataTable } from "@/components/ui/data-table";
import SelectEmployees from "@/components/select-employees";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Plus, Search } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const WarehouseMaster = () => {
  // Warehouses management state
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [showWarehouseForm, setShowWarehouseForm] = useState(false);
  const [editingWarehouse, setEditingWarehouse] = useState<Warehouse | null>(
    null,
  );

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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Warehouses</h1>
        <Button
          onClick={handleNewWarehouse}
          className="bg-orange-500 hover:bg-orange-600 text-white"
        >
          <Plus className="h-4 w-4 mr-2" /> New Warehouse
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  TOTAL WAREHOUSES
                </p>
                <h2 className="text-2xl font-bold">{stats.total}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  ACTIVE
                </p>
                <h2 className="text-2xl font-bold">{stats.active}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  INACTIVE
                </p>
                <h2 className="text-2xl font-bold">{stats.inactive}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex-1 relative min-w-[300px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search warehouses..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        {/* Warehouse Form */}
        {showWarehouseForm && (
          <Card className="mb-5">
            <CardHeader>
              <CardTitle>
                {editingWarehouse ? "Edit Warehouse" : "Add Warehouse"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleWarehouseSubmit(onWarehouseSubmit)}
                className="space-y-4"
              >
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Warehouse Name <span className="text-red-500">*</span>
                    </label>
                    <Input
                      placeholder="Warehouse name"
                      {...registerWarehouse("name")}
                    />
                    {warehouseErrors.name && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.name.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Status <span className="text-red-500">*</span>
                    </label>
                    <Select
                      onValueChange={(value) =>
                        resetWarehouse({
                          ...watchWarehouse(),
                          status: value as "active" | "inactive",
                        })
                      }
                      value={watchWarehouse("status")}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    {warehouseErrors.status && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.status.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      City
                    </label>
                    <Input placeholder="City" {...registerWarehouse("city")} />
                    {warehouseErrors.city && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.city.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Street
                    </label>
                    <Input
                      placeholder="Street"
                      {...registerWarehouse("street")}
                    />
                    {warehouseErrors.street && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.street.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Country
                    </label>
                    <Input
                      placeholder="Country"
                      {...registerWarehouse("country")}
                    />
                    {warehouseErrors.country && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.country.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Phone
                    </label>
                    <Input
                      placeholder="Phone"
                      {...registerWarehouse("phone")}
                    />
                    {warehouseErrors.phone && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.phone.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Pin Code
                    </label>
                    <Input
                      placeholder="Pin Code"
                      {...registerWarehouse("pin")}
                    />
                    {warehouseErrors.pin && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.pin.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Contact Person Name
                    </label>
                    <Input
                      placeholder="Contact Person Name"
                      {...registerWarehouse("contactPersonName")}
                    />
                    {warehouseErrors.contactPersonName && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.contactPersonName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <SelectEmployees
                      value={watchWarehouse("manager")?.toString()}
                      onChange={(v) =>
                        resetWarehouse({
                          ...watchWarehouse(),
                          manager: Number(v),
                        })
                      }
                      label="Manager"
                      placeholder="Select Manager"
                    />
                    {warehouseErrors.manager && (
                      <p className="text-sm text-red-500 mt-1">
                        {warehouseErrors.manager.message}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowWarehouseForm(false);
                      setEditingWarehouse(null);
                      resetWarehouse();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button type="submit">
                    {editingWarehouse ? "Update" : "Create"} Warehouse
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}

        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  );
};

export default WarehouseMaster;
