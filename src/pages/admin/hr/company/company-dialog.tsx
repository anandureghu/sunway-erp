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
import type { AxiosError } from "axios";

interface CompanyDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  company?: Company | null; // optional: for edit mode
  onSuccess: (company: Company, mode: "add" | "edit") => void;
}

type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: string[];
  errors?: string[] | Record<string, string | string[]>;
};

const extractApiMessages = (error: unknown): string[] => {
  const fallback = "Failed to save company. Please try again.";
  const axiosError = error as AxiosError<ApiErrorPayload>;
  const data = axiosError?.response?.data;

  if (!data) return [fallback];

  const messages: string[] = [];

  if (typeof data.message === "string" && data.message.trim()) {
    messages.push(data.message);
  }
  if (typeof data.error === "string" && data.error.trim()) {
    messages.push(data.error);
  }
  if (Array.isArray(data.details)) {
    messages.push(...data.details.filter((item): item is string => !!item));
  }
  if (Array.isArray(data.errors)) {
    messages.push(...data.errors.filter((item): item is string => !!item));
  } else if (data.errors && typeof data.errors === "object") {
    Object.values(data.errors).forEach((value) => {
      if (Array.isArray(value)) {
        messages.push(...value.filter((item): item is string => !!item));
      } else if (typeof value === "string" && value.trim()) {
        messages.push(value);
      }
    });
  }

  const unique = [...new Set(messages.map((m) => m.trim()).filter(Boolean))];
  return unique.length ? unique : [fallback];
};

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
          : "Company added successfully",
      );
      onSuccess(res.data, isEditMode ? "edit" : "add");
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting company:", error);
      const messages = extractApiMessages(error);
      messages.forEach((message) => toast.error(message));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl overflow-auto max-h-[85vh]">
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
          isEditMode={isEditMode}
        />
      </DialogContent>
    </Dialog>
  );
};
