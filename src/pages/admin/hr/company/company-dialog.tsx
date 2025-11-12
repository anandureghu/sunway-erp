// src/pages/admin/companies/CompanyDialog.tsx
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
import type { Company } from "@/types/company";
import type { CompanyFormData } from "@/schema/company";
import { CompanyForm } from "./company-form";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null; // optional: for edit mode
  onSuccess: (company: Company, mode: "add" | "edit") => void;
}

export const CompanyDialog = ({
  open,
  onOpenChange,
  company,
  onSuccess,
}: CompanyDialogProps) => {
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!company;

  const handleSubmit = async (data: CompanyFormData) => {
    try {
      setSubmitting(true);
      const res = isEditMode
        ? await apiClient.put(`/companies/${company!.id}`, data)
        : await apiClient.post("/companies", data);

      toast.success(
        isEditMode
          ? "Company updated successfully"
          : "Company added successfully"
      );
      onSuccess(res.data, isEditMode ? "edit" : "add");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting company:", error);
      toast.error(
        `Failed to ${isEditMode ? "update" : "add"} company. Please try again.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEditMode ? "Edit Company" : "Add Company"}
          </DialogTitle>
          <DialogDescription>
            {isEditMode
              ? "Update the company details below."
              : "Fill in the company details below."}
          </DialogDescription>
        </DialogHeader>

        <CompanyForm
          onSubmit={handleSubmit}
          loading={submitting}
          defaultValues={company}
        />
      </DialogContent>
    </Dialog>
  );
};
