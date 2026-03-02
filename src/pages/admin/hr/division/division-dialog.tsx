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
import type { DivisionFormData } from "@/schema/division";
import type { DivisionResponseDTO } from "@/types/division";
import { DivisionForm } from "./division-form";

interface DivisionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  division?: DivisionResponseDTO | null;
  onSuccess: (dept: DivisionResponseDTO, mode: "add" | "edit") => void;
}

export const DivisionDialog = ({
  open,
  onOpenChange,
  division,
  onSuccess,
}: DivisionDialogProps) => {
  const [loading, setLoading] = useState(false);
  const isEdit = !!division;

  const handleSubmit = async (data: DivisionFormData) => {
    try {
      setLoading(true);
      const res = isEdit
        ? await apiClient.put(`/divisions/${division!.id}`, data)
        : await apiClient.post("/divisions", data);
      toast.success(
        isEdit
          ? "Division updated successfully"
          : "Division added successfully",
      );
      onSuccess(res.data, isEdit ? "edit" : "add");
      onOpenChange(false);
    } catch (error) {
      toast.error("Failed to save division");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit Division" : "Add Division"}</DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Update division details below."
              : "Enter division details below."}
          </DialogDescription>
        </DialogHeader>

        <DivisionForm
          onSubmit={handleSubmit}
          loading={loading}
          defaultValues={division as DivisionFormData | null}
        />
      </DialogContent>
    </Dialog>
  );
};
