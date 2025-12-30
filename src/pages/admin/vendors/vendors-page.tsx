import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
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
import type { Row } from "@tanstack/react-table";
import { getParentPath } from "@/lib/utils";

export default function VendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { pathname } = useLocation();

  const fetchVendors = async () => {
    try {
      const res = await apiClient.get("/vendors");
      const mappedVendors = res.data.map((vendor: any) => {
        // Debug: Log first vendor to see what fields are available
        if (res.data.indexOf(vendor) === 0) {
          console.log("Sample vendor data from API:", vendor);
          console.log("All vendor keys:", Object.keys(vendor));
        }

        const mapped = {
          ...vendor,
          // Map createdAt from various possible field names
          createdAt:
            vendor.createdAt ||
            vendor.created_at ||
            vendor.dateCreated ||
            vendor.date_created ||
            vendor.createdDate ||
            vendor.created_date,
          // Map is1099Vendor from various possible field names
          is1099Vendor:
            vendor.is1099Vendor !== undefined
              ? vendor.is1099Vendor
              : vendor.is_1099_vendor !== undefined
              ? vendor.is_1099_vendor
              : vendor.is1099 !== undefined
              ? vendor.is1099
              : vendor.is_1099 !== undefined
              ? vendor.is_1099
              : false, // Default to false if not provided
        };

        if (res.data.indexOf(vendor) === 0) {
          console.log("Mapped vendor data:", mapped);
          console.log("Mapped createdAt:", mapped.createdAt);
          console.log("Mapped is1099Vendor:", mapped.is1099Vendor);
        }

        return mapped;
      });
      setVendors(mappedVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      toast.error("Failed to load vendors");
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
        prev.map((v) => (v.id === updated.id ? updated : v))
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
      const vendorName = vendor.vendorName || "Vendor";
      toast.success(`Deleted ${vendorName}`);
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
    } catch (err) {
      console.error("Delete failed:", err);
      toast.error("Failed to delete vendor");
    }
  };

  const navigate = useNavigate();

  const handleRowClick = (row: Row<Vendor>) => {
    const vendor = row.original;
    const parentPath = getParentPath(pathname);
    navigate(`/${parentPath}/vendors/${vendor.id}`);
  };

  const columns = getVendorColumns({
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const filteredVendors = vendors.filter((vendor) => {
    const query = searchQuery.toLowerCase();
    return (
      (vendor.vendorName?.toLowerCase() ?? "").includes(query) ||
      (vendor.contactPersonName?.toLowerCase() ?? "").includes(query) ||
      (vendor.email?.toLowerCase() ?? "").includes(query) ||
      (vendor.phoneNo?.toLowerCase() ?? "").includes(query)
    );
  });

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading vendors...</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Vendors</h1>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by vendor name..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                setSelected(null);
                setOpen(true);
              }}
            >
              Add New Vendor
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No vendors found
            </div>
          ) : (
            <DataTable
              columns={columns}
              data={filteredVendors}
              onRowClick={handleRowClick}
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
