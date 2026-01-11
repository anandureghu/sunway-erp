import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { type Vendor } from "@/types/vendor";
import { ArrowLeft, Edit, Trash } from "lucide-react";
import { VendorDialog } from "./vendor-dialog";

export default function VendorDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  const fetchVendor = async () => {
    try {
      const res = await apiClient.get(`/vendors/${id}`);
      setVendor(res.data);
    } catch (err) {
      console.error("fetchVendor:", err);
      toast.error("Failed to load supplier");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      await apiClient.delete(`/vendors/${id}`);
      toast.success("Supplier deleted");
      navigate(-1);
    } catch (err) {
      console.error(err);
      toast.error("Error deleting supplier");
    }
  };

  useEffect(() => {
    fetchVendor();
  }, [id]);

  if (loading)
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );

  if (!vendor)
    return (
      <div className="p-6">
        <p className="text-red-500">Supplier not found.</p>
      </div>
    );

  return (
    <div className="p-6 space-y-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex gap-3 items-center">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="flex gap-1"
          >
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <h1 className="text-2xl font-semibold">{vendor.vendorName}</h1>
        </div>

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setOpen(true)}>
            <Edit className="h-4 w-4 mr-1" /> Edit
          </Button>

          <Button variant="destructive" onClick={handleDelete}>
            <Trash className="h-4 w-4 mr-1" /> Delete
          </Button>
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Vendor Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Supplier Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Supplier Name:</span>{" "}
              {vendor.vendorName}
            </p>
            <p>
              <span className="font-semibold">Contact Person:</span>{" "}
              {vendor.contactPersonName || "-"}
            </p>
            <p>
              <span className="font-semibold">Email:</span>{" "}
              {vendor.email || "-"}
            </p>
            <p>
              <span className="font-semibold">Phone:</span>{" "}
              {vendor.phoneNo || "-"}
            </p>
            <p>
              <span className="font-semibold">Fax:</span> {vendor.fax || "-"}
            </p>
            <p>
              <span className="font-semibold">Active:</span>{" "}
              {vendor.active ? "Yes" : "No"}
            </p>
            <p>
              <span className="font-semibold">1099 Supplier:</span>{" "}
              {vendor.is1099Vendor ? "Yes" : "No"}
            </p>
          </CardContent>
        </Card>

        {/* Address */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Street:</span>{" "}
              {vendor.street || "-"}
            </p>
            <p>
              <span className="font-semibold">City:</span> {vendor.city || "-"}
            </p>
            <p>
              <span className="font-semibold">Country:</span>{" "}
              {vendor.country || "-"}
            </p>
          </CardContent>
        </Card>

        {/* Financial Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Financial Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <p>
              <span className="font-semibold">Tax ID:</span>{" "}
              {vendor.taxId || "-"}
            </p>
            <p>
              <span className="font-semibold">Payment Terms:</span>{" "}
              {vendor.paymentTerms || "-"}
            </p>
            <p>
              <span className="font-semibold">Currency:</span>{" "}
              {vendor.currencyCode || "-"}
            </p>
            <p>
              <span className="font-semibold">Credit Limit:</span>{" "}
              {vendor.creditLimit
                ? `${
                    vendor.currencyCode || ""
                  } ${vendor.creditLimit.toLocaleString()}`
                : "-"}
            </p>
            {vendor.websiteUrl && (
              <p>
                <span className="font-semibold">Website:</span>{" "}
                <a
                  href={vendor.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  {vendor.websiteUrl}
                </a>
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <VendorDialog
        open={open}
        onOpenChange={setOpen}
        vendor={vendor}
        onSuccess={() => {
          setOpen(false);
          fetchVendor();
        }}
      />
    </div>
  );
}
