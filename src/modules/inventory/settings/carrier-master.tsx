import { DataTable } from "@/components/ui/data-table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import PhoneInput from "@/components/PhoneInput";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createCarrierColumns } from "@/lib/columns/carrier-columns";
import { CARRIER_SCHEMA, type CarrierFormData } from "@/schema/inventory";
import {
  createCarrier,
  deleteCarrier,
  listCarriers,
  updateCarrier,
} from "@/service/inventoryService";
import type { DispatchCarrier } from "@/types/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Search, Truck, CircleCheckBig, CircleSlash2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { KpiSummaryStrip } from "@/components/kpi-summary-strip";
import { kpiFilterItem } from "@/lib/kpi-filter";

const icls =
  "h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

export default function CarrierMaster() {
  const { confirm } = useConfirmDialog();
  const [carriers, setCarriers] = useState<DispatchCarrier[]>([]);
  const [showCarrierDialog, setShowCarrierDialog] = useState(false);
  const [editing, setEditing] = useState<DispatchCarrier | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [kpiFilter, setKpiFilter] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors },
  } = useForm<CarrierFormData>({
    resolver: zodResolver(CARRIER_SCHEMA),
    defaultValues: { status: "active" },
  });

  const loadCarriers = useCallback(async () => {
    try {
      setCarriers(await listCarriers());
    } catch {
      toast.error("Could not load carriers.");
    }
  }, []);

  useEffect(() => {
    void loadCarriers();
  }, [loadCarriers]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return carriers.filter((c) => {
      if (statusFilter !== "all" && c.status !== statusFilter) return false;
      if (!q) return true;
      return [c.name, c.driverName, c.vehicleNumber, c.driverPhone, c.comments]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [carriers, searchQuery, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    reset({ status: "active", name: "", vehicleNumber: "", driverName: "", driverPhone: "", comments: "" });
    setShowCarrierDialog(true);
  };

  const openEdit = (carrier: DispatchCarrier) => {
    setEditing(carrier);
    reset({
      name: carrier.name,
      vehicleNumber: carrier.vehicleNumber || "",
      driverName: carrier.driverName || "",
      driverPhone: carrier.driverPhone || "",
      comments: carrier.comments || "",
      status: carrier.status,
    });
    setShowCarrierDialog(true);
  };

  const closeCarrierDialog = () => {
    setShowCarrierDialog(false);
    setEditing(null);
    reset({
      status: "active",
      name: "",
      vehicleNumber: "",
      driverName: "",
      driverPhone: "",
      comments: "",
    });
  };

  const onSubmit = async (data: CarrierFormData) => {
    try {
      const payload = {
        name: data.name.trim(),
        vehicleNumber: data.vehicleNumber?.trim() || undefined,
        driverName: data.driverName?.trim() || undefined,
        driverPhone: data.driverPhone?.trim() || undefined,
        comments: data.comments?.trim() || undefined,
        status: data.status,
      };
      if (editing) {
        await updateCarrier(editing.id, payload);
        toast.success("Carrier updated.");
      } else {
        await createCarrier(payload);
        toast.success("Carrier created.");
      }
      setShowCarrierDialog(false);
      setEditing(null);
      await loadCarriers();
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "response" in err
          ? String((err as { response?: { data?: { message?: string } } }).response?.data?.message || "Failed to save carrier.")
          : "Failed to save carrier.";
      toast.error(message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!(await confirm("Delete this carrier preset?"))) return;
    try {
      await deleteCarrier(id);
      toast.success("Carrier deleted.");
      await loadCarriers();
    } catch {
      toast.error("Could not delete carrier.");
    }
  };

  const columns = useMemo(
    () => createCarrierColumns(openEdit, (id) => void handleDelete(id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  const activeCount = carriers.filter((c) => c.status === "active").length;

  const applyKpiFilter = useCallback((key: string) => {
    setKpiFilter(key);
    switch (key) {
      case "active":
        setStatusFilter("active");
        break;
      case "inactive":
        setStatusFilter("inactive");
        break;
      default:
        setStatusFilter("all");
        break;
    }
  }, []);

  return (
    <div className="space-y-6">
      <SecondaryPageHeader
        title="Dispatch carriers"
        description="Save carrier, driver, and default dispatch comments for quick selection when creating shipments."
        icon={<Truck className="h-5 w-5 text-white" />}
        actions={
          <Button onClick={openCreate} className="rounded-xl">
            <Plus className="mr-2 h-4 w-4" />
            Add carrier
          </Button>
        }
      />

      <KpiSummaryStrip
        items={[
          kpiFilterItem(
            {
              label: "Total carriers",
              value: carriers.length,
              hint: "Saved dispatch presets",
              accent: "blue",
              icon: Truck,
            },
            "all",
            kpiFilter,
            applyKpiFilter,
          ),
          kpiFilterItem(
            {
              label: "Active",
              value: activeCount,
              hint: "Available in dispatch form",
              accent: "emerald",
              icon: CircleCheckBig,
            },
            "active",
            kpiFilter,
            applyKpiFilter,
          ),
          kpiFilterItem(
            {
              label: "Inactive",
              value: carriers.length - activeCount,
              hint: "Hidden from dispatch picker",
              accent: "slate",
              icon: CircleSlash2,
            },
            "inactive",
            kpiFilter,
            applyKpiFilter,
          ),
        ]}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search carriers…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={statusFilter}
          onValueChange={(value) => {
            setStatusFilter(value);
            setKpiFilter(null);
          }}
        >
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={filtered} />

      <Dialog
        open={showCarrierDialog}
        onOpenChange={(open) => {
          if (!open) closeCarrierDialog();
          else setShowCarrierDialog(true);
        }}
      >
        <DialogContent
          className="gap-0 overflow-hidden rounded-2xl border border-slate-200 p-0 shadow-2xl shadow-slate-200/60 [&>button]:hidden"
          style={{ maxWidth: 640, width: "calc(100vw - 32px)" }}
        >
          <div className="flex items-center justify-between bg-gradient-to-r from-slate-800 to-slate-700 px-6 py-4">
            <div className="flex items-center gap-3.5">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border-2 border-white/20 bg-blue-100 text-blue-600">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <DialogTitle className="text-[15px] font-semibold leading-tight text-white">
                  {editing ? "Edit carrier" : "Add carrier"}
                </DialogTitle>
                <p className="mt-0.5 text-[12px] text-slate-300">
                  Defaults populate the dispatch form when this carrier is selected.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={closeCarrierDialog}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-white/10 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="overflow-y-auto bg-white px-6 py-5">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Carrier name *
                  </label>
                  <Input className={icls} {...register("name")} />
                  {errors.name ? (
                    <p className="text-sm text-rose-600">{errors.name.message}</p>
                  ) : null}
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </label>
                  <Controller
                    name="status"
                    control={control}
                    render={({ field }) => (
                      <Select value={field.value} onValueChange={field.onChange}>
                        <SelectTrigger className={icls}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="inactive">Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Vehicle number
                  </label>
                  <Input className={icls} {...register("vehicleNumber")} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Driver name
                  </label>
                  <Input className={icls} {...register("driverName")} />
                </div>
                <div className="space-y-1.5 md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Driver phone
                  </label>
                  <Controller
                    name="driverPhone"
                    control={control}
                    render={({ field, fieldState }) => (
                      <PhoneInput
                        value={field.value ?? ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        invalid={!!fieldState.error}
                      />
                    )}
                  />
                  {errors.driverPhone ? (
                    <p className="text-sm text-rose-600">{errors.driverPhone.message}</p>
                  ) : null}
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Default comments
                </label>
                <Textarea
                  className="min-h-[100px] rounded-xl"
                  placeholder="Prefilled into dispatch notes when this carrier is selected"
                  {...register("comments")}
                />
                {errors.comments ? (
                  <p className="text-sm text-rose-600">{errors.comments.message}</p>
                ) : null}
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 pt-4">
                <Button type="button" variant="outline" onClick={closeCarrierDialog}>
                  Cancel
                </Button>
                <Button type="submit">
                  {editing ? "Save changes" : "Create carrier"}
                </Button>
              </div>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
