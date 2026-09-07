import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { normalizePhone } from "@/lib/countries";
import { type WarehouseFormData } from "@/schema/inventory";
import {
  createWarehouse,
  updateWarehouse,
} from "@/service/inventoryService";
import type { Warehouse } from "@/types/inventory";
import { Warehouse as WarehouseIcon, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { WarehouseForm } from "./warehouse-form";

interface WarehouseDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  warehouse?: Warehouse | null;
  onSuccess: (warehouse: Warehouse, mode: "add" | "edit") => void;
}

export function WarehouseDialog({
  open,
  onOpenChange,
  warehouse,
  onSuccess,
}: WarehouseDialogProps) {
  const [submitting, setSubmitting] = useState(false);
  const isEditMode = !!warehouse;

  const formDefaults = useMemo((): Partial<WarehouseFormData> | null => {
    if (!warehouse) return null;
    return {
      name: warehouse.name,
      status: warehouse.status,
      warehouseType: warehouse.warehouseType ?? "",
      capacity: warehouse.capacity,
      street: warehouse.street ?? "",
      city: warehouse.city ?? "",
      country: warehouse.country ?? "",
      pin: warehouse.pin ?? "",
      phone: normalizePhone(warehouse.phone),
      contactPersonName: warehouse.contactPersonName ?? "",
      manager: warehouse.managerId ?? null,
    };
  }, [warehouse]);

  const handleSubmit = async (data: WarehouseFormData) => {
    try {
      setSubmitting(true);
      const payload: Record<string, unknown> = {
        name: data.name.trim(),
        status: data.status || "active",
        warehouseType: data.warehouseType?.trim() || null,
        capacity: data.capacity ?? null,
        street: data.street || "",
        city: data.city || "",
        country: data.country || "",
        pin: data.pin || "",
        phone: data.phone || "",
        contactPersonName: data.contactPersonName || "",
      };
      if (data.manager != null && !Number.isNaN(Number(data.manager))) {
        payload.manager = Number(data.manager);
      } else {
        payload.manager = null;
      }

      const saved = isEditMode
        ? await updateWarehouse(warehouse!.id, payload)
        : await createWarehouse(payload);

      toast.success(
        isEditMode
          ? "Warehouse updated successfully"
          : "Warehouse created successfully",
      );
      onSuccess(saved, isEditMode ? "edit" : "add");
      onOpenChange(false);
    } catch (error: unknown) {
      console.error("Failed to save warehouse:", error);
      const err = error as {
        response?: { status?: number; data?: { message?: string; field?: string } };
      };
      const status = err?.response?.status;
      const errorMessage = err?.response?.data?.message || "";
      if (status === 409) {
        toast.error(
          errorMessage ||
            "A warehouse with this name or code already exists.",
        );
      } else if (errorMessage) {
        toast.error(errorMessage);
      } else {
        toast.error(
          `Failed to ${isEditMode ? "update" : "create"} warehouse. Please try again.`,
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
        style={{
          maxWidth: 720,
          maxHeight: "92vh",
          width: "calc(100vw - 32px)",
        }}
      >
        <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-orange-100 text-orange-600">
              <WarehouseIcon className="h-5 w-5" />
            </div>
            <div>
              <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                {isEditMode ? "Edit Warehouse" : "Add Warehouse"}
              </DialogTitle>
              <p className="mt-0.5 text-[12px] text-slate-300">
                {isEditMode
                  ? "Update the warehouse details below"
                  : "Fill in the warehouse details below"}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div
          className="overflow-y-auto bg-white px-6 py-5"
          style={{ maxHeight: "calc(92vh - 88px)" }}
        >
          <WarehouseForm
            key={warehouse?.id ?? "new"}
            onSubmit={handleSubmit}
            onCancel={() => onOpenChange(false)}
            loading={submitting}
            defaultValues={formDefaults}
            warehouseCode={warehouse?.code}
            isEditMode={isEditMode}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
