import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";
import { toast } from "sonner";
import { apiClient } from "@/service/apiClient";
import type { Customer } from "@/types/customer";
import type { CustomerFormData } from "@/schema/customer";
import { CustomerForm } from "./customer-form";
import { X, Users } from "lucide-react";
import { isCustomerActive } from "@/lib/customer-api";

interface CustomerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer?: Customer | null;
  onSuccess: (customer: Customer, mode: "add" | "edit") => void;
}

export const CustomerDialog = ({
  open,
  onOpenChange,
  customer,
  onSuccess,
}: CustomerDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!customer;

  const handleSubmit = async (data: CustomerFormData) => {
    try {
      setSubmitting(true);
      const payload = {
        ...data,
        isActive: data.isActive ?? true,
      };

      const res = isEditMode
        ? await apiClient.put(`/customers/${customer!.id}`, payload)
        : await apiClient.post("/customers", payload);

      toast.success(
        isEditMode
          ? "Customer updated successfully"
          : "Customer added successfully"
      );
      onSuccess(res.data, isEditMode ? "edit" : "add");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting customer:", error);
      toast.error(
        `Failed to ${isEditMode ? "update" : "add"} customer. Please try again.`
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
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-sm font-bold tracking-wide transition-all duration-300 border-2 border-white/20 bg-emerald-100 text-emerald-600">
              <Users className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEditMode ? "Edit Customer" : "Add Customer"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEditMode
                  ? "Update the customer details below"
                  : "Fill in the customer details below"}
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
          <CustomerForm
            onSubmit={handleSubmit}
            loading={submitting}
            defaultValues={
              customer
                ? {
                    ...customer,
                    customerName: customer.name || customer.customerName || "",
                    country: customer.country ?? "",
                    isActive: isCustomerActive(customer),
                  }
                : null
            }
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};