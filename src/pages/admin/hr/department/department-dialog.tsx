// src/pages/admin/departments/DepartmentDialog.tsx
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
import type { DepartmentFormData } from "@/schema/department";
import type { Department } from "@/types/department";
import { DepartmentForm } from "./department-form";

interface DepartmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  department?: Department | null;
  onSuccess: (dept: Department, mode: "add" | "edit") => void;
}

export const DepartmentDialog = ({
  open,
  onOpenChange,
  department,
  onSuccess,
}: DepartmentDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!department;

  const handleSubmit = async (data: DepartmentFormData) => {
    try {
      setLoading(true);
      const res = isEdit
        ? await apiClient.put(`/departments/${department!.id}`, data)
        : await apiClient.post("/departments", data);
      toast.success(
        isEdit
          ? "Department updated successfully"
          : "Department added successfully"
      );
      onSuccess(res.data, isEdit ? "edit" : "add");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save department");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Edit Department" : "Add Department"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update department details below."
              : "Enter department details below."}
          </DialogDescription>
        </DialogHeader>

        <DepartmentForm
          onSubmit={handleSubmit}
          loading={loading}
          defaultValues={department as DepartmentFormData | null}
        />
      </DialogContent>
    </Dialog>
  );
};
