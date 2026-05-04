import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import type { Vendor } from "@/types/vendor";
import type { VendorFormData } from "@/schema/vendor";
import {
  normalizeVendorFromApi,
  vendorFormToApiPayload,
  vendorToFormDefaults,
} from "@/lib/vendor-api";
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

  const formDefaults = useMemo(
    () => (vendor ? vendorToFormDefaults(vendor) : null),
    [vendor],
  );

  const handleSubmit = async (data: VendorFormData) => {
    try {
      setSubmitting(true);
      const payload = vendorFormToApiPayload(data);

      const res = isEditMode
        ? await apiClient.put(`/vendors/${vendor!.id}`, payload)
        : await apiClient.post("/vendors", payload);

      const mappedVendor = normalizeVendorFromApi(res.data);

      toast.success(
        isEditMode
          ? "Supplier updated successfully"
          : "Supplier added successfully",
      );
      onSuccess(mappedVendor, isEditMode ? "edit" : "add");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting vendor:", error);
      toast.error(
        `Failed to ${isEditMode ? "update" : "add"} supplier. Please try again.`,
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
          key={`${open ? "open" : "closed"}-${vendor?.id ?? "new"}`}
          onSubmit={handleSubmit}
          loading={submitting}
          defaultValues={formDefaults}
        />
      </DialogContent>
    </Dialog>
  );
};
