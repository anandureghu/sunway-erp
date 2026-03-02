import { useEffect, useState } from "react";
import { DataTable } from "@/components/datatable";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { getVendorColumns } from "@/lib/columns/vendor-listing-admin";
import type { Vendor } from "@/types/vendor";
import type { Row } from "@tanstack/react-table";
import { VendorDialog } from "@/pages/admin/vendors/vendor-dialog";

export default function SuppliersPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Vendor | null>(null);
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const navigate = useNavigate();

  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get("/vendors");
      const mappedVendors = res.data.map((vendor: any) => ({
        ...vendor,
        createdAt:
          vendor.createdAt ||
          vendor.created_at ||
          vendor.dateCreated ||
          vendor.date_created ||
          vendor.createdDate ||
          vendor.created_date,

        is1099Vendor: vendor["1099Vendor"],
      }));
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

  const handleEdit = (vendor: Vendor) => {
    setSelected(vendor);
    setOpen(true);
  };

  const handleDelete = async (vendor: Vendor) => {
    if (
      !confirm(
        `Are you sure you want to delete supplier "${vendor.vendorName}"?`,
      )
    ) {
      return;
    }
    try {
      await apiClient.delete(`/vendors/${vendor.id}`);
      const vendorName = vendor.vendorName || "Supplier";
      toast.success(`Supplier "${vendorName}" deleted successfully`);
      setVendors((prev) => prev.filter((v) => v.id !== vendor.id));
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete supplier");
    }
  };

  const handleRowClick = (row: Row<Vendor>) => {
    // Optional: navigate to vendor detail page
    const vendor = row.original;
    navigate(`/inventory/purchase/suppliers/${vendor.id}`);
  };

  const handleDialogSuccess = (updated: Vendor, mode: "add" | "edit") => {
    if (mode === "add") {
      fetchVendors(); // Refresh the list to get all data from backend
    } else {
      setVendors((prev) =>
        prev.map((v) => (v.id === updated.id ? updated : v)),
      );
      fetchVendors(); // Also refresh to get any server-computed fields
    }
    setSelected(null);
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/inventory/purchase">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <h1 className="text-2xl font-semibold">Suppliers</h1>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by name, email, phone, or city..."
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
              Add New Supplier
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {filteredVendors.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No suppliers found
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
