import { useEffect, useState, useMemo } from "react";
import { DataTable } from "@/components/ui/data-table";
import type { Vendor } from "@/types/vendor";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getVendorColumns } from "@/lib/columns/vendor-listing-admin";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
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

export default function VendorsPage({
  financeSettings,
}: {
  financeSettings?: boolean;
}) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [countryFilter, setCountryFilter] = useState<string>("all");
  const [vendorTypeFilter, setVendorTypeFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const { pathname } = useLocation();
  const { user } = useAuth();

  console.log("first");

  const fetchVendors = async () => {
    try {
      const res = await apiClient.get("/vendors");
      const mappedVendors = res.data.content.map((vendor: Vendor) => {
        // Debug: Log first vendor to see what fields are available

        const mapped = {
          ...vendor,
        };
        return mapped;
      });
      setVendors(mappedVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load suppliers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  const handleDialogSuccess = (updated: Vendor, mode: "add" | "edit") => {
    if (mode === "add") {
      // Refresh the list to get all data from backend
      fetchVendors();
    } else {
      // For edit, update the local state but also refresh to ensure we have latest data
      setVendors((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v)),
      );
      // Also refresh to get any server-computed fields like createdAt
      fetchVendors();
    }
    setSelected(null);
  };

  const handleEdit = (vendor: Vendor) => {
    setSelected(vendor);
    setOpen(true);
  };

  const handleDelete = async (vendor: Vendor) => {
    try {
      await apiClient.delete(`/vendors/${vendor.id}`);
      const vendorName = vendor.vendorName || "Supplier";
      toast.success(`Deleted ${vendorName}`);
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete supplier");
    }
  };

  const navigate = useNavigate();

  const handleRowClick = (vendor: Vendor) => {
    const parentPath = getParentPath(pathname);
    navigate(`/${parentPath}/vendors/${vendor.id}`);
  };

  const columns = getVendorColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
    onView: handleRowClick,
    financeSettings: financeSettings,
    role: user?.role,
  });

  // Calculate statistics
  const stats = useMemo(() => {
    const total = vendors.length;
    const active = vendors.filter((v) => v.active !== false).length;
    const inactive = vendors.filter((v) => v.active === false).length;
    const is1099 = vendors.filter((v) => v.is1099Vendor === true).length;
    return { total, active, inactive, is1099 };
  }, [vendors]);

  // Get unique countries for filter
  const countries = useMemo(() => {
    const countrySet = new Set<string>();
    vendors.forEach((v) => {
      if (v.country) countrySet.add(v.country);
    });
    return Array.from(countrySet).sort();
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        (vendor.vendorName?.toLowerCase() ?? "").includes(query) ||
        (vendor.contactPersonName?.toLowerCase() ?? "").includes(query) ||
        (vendor.email?.toLowerCase() ?? "").includes(query) ||
        (vendor.phoneNo?.toLowerCase() ?? "").includes(query) ||
        (vendor.city?.toLowerCase() ?? "").includes(query);

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && vendor.active !== false) ||
        (statusFilter === "inactive" && vendor.active === false);

      const matchesCountry =
        countryFilter === "all" || vendor.country === countryFilter;

      const matchesVendorType =
        vendorTypeFilter === "all" ||
        (vendorTypeFilter === "1099" && vendor.is1099Vendor === true) ||
        (vendorTypeFilter === "non1099" && vendor.is1099Vendor !== true);

      return (
        matchesSearch && matchesStatus && matchesCountry && matchesVendorType
      );
    });
  }, [vendors, searchQuery, statusFilter, countryFilter, vendorTypeFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredVendors.length / itemsPerPage);
  const paginatedVendors = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredVendors.slice(startIndex, endIndex);
  }, [filteredVendors, currentPage, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading suppliers...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Suppliers</h1>
        {!financeSettings && (
          <Button
            onClick={() => {
              setSelected(null);
              setOpen(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white"
          >
            + New Supplier
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  TOTAL SUPPLIERS
                </p>
                <h2 className="text-2xl font-bold">{stats.total}</h2>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-green-400 bg-green-50">
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
        <Card className="border-red-400 bg-red-50">
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
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  1099 VENDORS
                </p>
                <h2 className="text-2xl font-bold">{stats.is1099}</h2>
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
                placeholder="Search by name, email, phone, or city..."
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
              <Select value={countryFilter} onValueChange={setCountryFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Countries" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Countries</SelectItem>
                  {countries.map((country) => (
                    <SelectItem key={country} value={country}>
                      {country}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={vendorTypeFilter}
                onValueChange={setVendorTypeFilter}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="All Suppliers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Suppliers</SelectItem>
                  <SelectItem value="1099">1099 Vendors</SelectItem>
                  <SelectItem value="non1099">Non-1099</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {paginatedVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found
            </div>
          ) : (
            <>
              <DataTable columns={columns} data={paginatedVendors} />
              {/* Pagination */}
              {totalPages > 0 && (
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing{" "}
                    {Math.min(
                      (currentPage - 1) * itemsPerPage + 1,
                      filteredVendors.length,
                    )}
                    -
                    {Math.min(
                      currentPage * itemsPerPage,
                      filteredVendors.length,
                    )}{" "}
                    of {filteredVendors.length} suppliers
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

      <VendorDialog
        open={open}
        onOpenChange={setOpen}
        vendor={selected}
        onSuccess={handleDialogSuccess}
      />
    </div>
  );
}
