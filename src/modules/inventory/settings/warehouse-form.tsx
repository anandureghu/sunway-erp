import SelectEmployees from "@/components/select-employees";
import PhoneInput from "@/components/PhoneInput";
import CountrySelect from "@/components/country-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { type WarehouseFormData, WAREHOUSE_SCHEMA } from "@/schema/inventory";
import { zodResolver } from "@hookform/resolvers/zod";
import { MapPin, UserCog, Warehouse as WarehouseIcon } from "lucide-react";
import { useEffect } from "react";
import { Controller, useForm } from "react-hook-form";

const WAREHOUSE_TYPES = [
  { value: "MAIN", label: "Main / General" },
  { value: "BRANCH", label: "Branch" },
  { value: "TRANSIT", label: "Transit" },
  { value: "COLD_STORAGE", label: "Cold storage" },
  { value: "RETURNS", label: "Returns" },
  { value: "HAZARDOUS", label: "Hazardous" },
  { value: "PPE_SAFETY", label: "PPE / Safety" },
  { value: "SITE_STORE", label: "Site store" },
  { value: "OTHER", label: "Other" },
] as const;

function SectionCard({
  icon,
  title,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-slate-100 bg-slate-50/60 px-5 py-3.5">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-slate-900">
          {icon}
        </div>
        <span className="text-[13px] font-semibold text-slate-700">{title}</span>
      </div>
      <div className="space-y-5 p-5">{children}</div>
    </div>
  );
}

function F({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-600">
        {label}
        {required ? <span className="ml-0.5 text-rose-400">*</span> : null}
      </label>
      {children}
    </div>
  );
}

const icls =
  "h-10 rounded-xl border border-slate-200 bg-white text-[13px] text-slate-800 placeholder:text-slate-300 outline-none focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.12)]";

interface WarehouseFormProps {
  onSubmit: (data: WarehouseFormData) => Promise<void> | void;
  onCancel: () => void;
  loading?: boolean;
  defaultValues?: Partial<WarehouseFormData> | null;
  warehouseCode?: string | null;
  isEditMode?: boolean;
}

export function WarehouseForm({
  onSubmit,
  onCancel,
  loading,
  defaultValues,
  warehouseCode,
  isEditMode,
}: WarehouseFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
    watch,
    setValue,
  } = useForm<WarehouseFormData>({
    resolver: zodResolver(WAREHOUSE_SCHEMA),
    defaultValues: {
      name: "",
      status: "active",
      warehouseType: "",
      capacity: undefined,
      city: "",
      street: "",
      country: "",
      pin: "",
      phone: "",
      contactPersonName: "",
      manager: null,
      ...defaultValues,
    },
  });

  useEffect(() => {
    reset({
      name: "",
      status: "active",
      warehouseType: "",
      capacity: undefined,
      city: "",
      street: "",
      country: "",
      pin: "",
      phone: "",
      contactPersonName: "",
      manager: null,
      ...defaultValues,
    });
  }, [defaultValues, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <SectionCard
        icon={<WarehouseIcon className="h-3.5 w-3.5 text-white" />}
        title="Basic information"
      >
        <div className="grid grid-cols-2 gap-5">
          <F label="Warehouse Code">
            <Input
              value={
                isEditMode
                  ? warehouseCode || ""
                  : "Auto-generated on save (WH-…)"
              }
              disabled
              className={`${icls} bg-slate-50 text-slate-500`}
            />
          </F>

          <F label="Warehouse Name" required>
            <Input
              placeholder="Warehouse Name"
              {...register("name")}
              className={icls}
            />
            {errors.name ? (
              <p className="mt-1 text-[11px] text-rose-400">
                {errors.name.message}
              </p>
            ) : null}
          </F>

          <F label="Type">
            <Select
              value={watch("warehouseType") || undefined}
              onValueChange={(value) =>
                setValue("warehouseType", value, { shouldDirty: true })
              }
            >
              <SelectTrigger className={icls}>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                {WAREHOUSE_TYPES.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    {t.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </F>

          <F label="Capacity">
            <Input
              type="number"
              min={0}
              step="any"
              placeholder="Capacity"
              {...register("capacity", {
                setValueAs: (v) =>
                  v === "" || v == null || Number.isNaN(Number(v))
                    ? undefined
                    : Number(v),
              })}
              className={icls}
            />
            {errors.capacity ? (
              <p className="mt-1 text-[11px] text-rose-400">
                {errors.capacity.message}
              </p>
            ) : null}
          </F>

          <F label="Status" required>
            <Select
              value={watch("status")}
              onValueChange={(value) =>
                setValue("status", value as "active" | "inactive", {
                  shouldDirty: true,
                })
              }
            >
              <SelectTrigger className={icls}>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-slate-200 shadow-lg">
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
            {errors.status ? (
              <p className="mt-1 text-[11px] text-rose-400">
                {errors.status.message}
              </p>
            ) : null}
          </F>

          <F label="Contact Person Name">
            <Input
              placeholder="Contact Person Name"
              {...register("contactPersonName")}
              className={icls}
            />
          </F>

          <F label="Phone">
            <Controller
              name="phone"
              control={control}
              render={({ field, fieldState }) => (
                <PhoneInput
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  invalid={!!fieldState.error}
                  className={icls}
                />
              )}
            />
            {errors.phone ? (
              <p className="mt-1 text-[11px] text-rose-400">
                {errors.phone.message}
              </p>
            ) : null}
          </F>
        </div>
      </SectionCard>

      <SectionCard
        icon={<MapPin className="h-3.5 w-3.5 text-white" />}
        title="Address"
      >
        <div className="grid grid-cols-2 gap-5">
          <F label="Street">
            <Input placeholder="Street" {...register("street")} className={icls} />
          </F>
          <F label="City">
            <Input placeholder="City" {...register("city")} className={icls} />
          </F>
          <F label="Country">
            <Controller
              name="country"
              control={control}
              render={({ field }) => (
                <CountrySelect
                  value={field.value ?? ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  placeholder="Select country"
                  className={icls}
                />
              )}
            />
          </F>
          <F label="Pin Code">
            <Input placeholder="Pin Code" {...register("pin")} className={icls} />
          </F>
        </div>
      </SectionCard>

      <SectionCard
        icon={<UserCog className="h-3.5 w-3.5 text-white" />}
        title="Manager assignment"
      >
        <SelectEmployees
          idMode="user"
          value={watch("manager")?.toString()}
          onChange={(v) =>
            setValue("manager", v ? Number(v) : null, { shouldDirty: true })
          }
          label=""
          placeholder="Select Manager"
        />
      </SectionCard>

      <div className="flex items-center justify-end gap-2.5 border-t border-slate-100 pt-2">
        <Button
          type="button"
          variant="ghost"
          onClick={onCancel}
          disabled={loading}
          className="h-10 rounded-xl border border-slate-200 bg-white px-5 text-[13px] font-medium text-slate-600 shadow-sm hover:bg-slate-50 hover:text-slate-800"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={loading}
          className="h-10 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 text-[13px] font-semibold text-white shadow-sm hover:from-blue-700 hover:to-indigo-700"
        >
          {loading
            ? "Saving…"
            : isEditMode
              ? "Update Warehouse"
              : "Create Warehouse"}
        </Button>
      </div>
    </form>
  );
}
