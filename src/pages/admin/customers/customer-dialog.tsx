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
import type { Customer } from "@/types/customer";
import type { CustomerFormData } from "@/schema/customer";
import { CustomerForm } from "./customer-form";

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
      // Map isActive to the API format and ensure all required fields are present
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
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Customer" : "Add Customer"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the customer details below."
              : "Fill in the customer details below."}
          </DialogDescription>
        </DialogHeader>

        <CustomerForm
          onSubmit={handleSubmit}
          loading={submitting}
          defaultValues={
            customer
              ? {
                  ...customer,
                  customerName: customer.name || customer.customerName || "",
                  isActive: (customer as any).active ?? customer.isActive ?? true,
                }
              : null
          }
        />
      </DialogContent>
    </Dialog>
  );
};

