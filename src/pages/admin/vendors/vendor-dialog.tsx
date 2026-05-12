import {
  Dialog,
  DialogContent,
  DialogTitle,
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
import { X, Truck } from "lucide-react";

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
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{ maxWidth: 720, maxHeight: "92vh", width: "calc(100vw - 32px)" }}
      >
        {/* ── Top bar ── */}
        <div className="bg-gradient-to-r from-slate-800 to-slate-700 flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-violet-100 text-violet-600">
              <Truck className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEditMode ? "Edit Supplier" : "Add Supplier"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEditMode
                  ? "Update the supplier details below"
                  : "Fill in the supplier details below"}
              </p>
            </div>
          </div>

          <button
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Body: embedded form ── */}
        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 132px)" }}
        >
          <VendorForm
            key={`${open ? "open" : "closed"}-${vendor?.id ?? "new"}`}
            onSubmit={handleSubmit}
            loading={submitting}
            defaultValues={formDefaults}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};