import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import type { Vendor } from "@/types/vendor";
import type { VendorFormData } from "@/schema/vendor";
import { VendorForm } from "./vendor-form";

interface VendorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendor?: Vendor | null;
  onSuccess: (vendor: Vendor, mode: "add" | "edit") => void;
}

export const VendorDialog = ({
  open,
  onOpenChange,
  vendor,
  onSuccess,
}: VendorDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!vendor;

  const handleSubmit = async (data: VendorFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        active: data.active ?? true,
        is1099Vendor: data.is1099Vendor ?? false,
      };

      const res = isEditMode
        ? await apiClient.put(`/vendors/${vendor!.id}`, payload)
        : await apiClient.post("/vendors", payload);

      // Map the response to ensure consistent field names
      const mappedVendor = {
        ...res.data,
        createdAt: res.data.createdAt || res.data.created_at || res.data.dateCreated || res.data.date_created,
        is1099Vendor: res.data.is1099Vendor !== undefined ? res.data.is1099Vendor :
                     res.data.is_1099_vendor !== undefined ? res.data.is_1099_vendor :
                     res.data.is1099 !== undefined ? res.data.is1099 :
                     payload.is1099Vendor ?? false,
      };

      toast.success(
        isEditMode
          ? "Supplier updated successfully"
          : "Supplier added successfully"
      );
      onSuccess(mappedVendor, isEditMode ? "edit" : "add");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting vendor:", error);
      toast.error(
        `Failed to ${isEditMode ? "update" : "add"} supplier. Please try again.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Supplier" : "Add Supplier"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the supplier details below."
              : "Fill in the supplier details below."}
          </DialogDescription>
        </DialogHeader>

        <VendorForm
          onSubmit={handleSubmit}
          loading={submitting}
          defaultValues={
            vendor
              ? {
                  ...vendor,
                  active: vendor.active ?? true,
                  is1099Vendor: vendor.is1099Vendor ?? false,
                }
              : null
          }
        />
      </DialogContent>
    </Dialog>
  );
};

