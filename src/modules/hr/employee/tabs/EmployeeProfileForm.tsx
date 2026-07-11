import { useState, useCallback, useEffect, useRef } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { FormRow, FormField } from "@/modules/hr/components/form-components";
import {
  User,
  Upload,
  Camera,
  Calendar,
  Briefcase,
  MapPin,
  Globe,
  Heart,
  ShieldCheck,
  Hash,
  UserCircle2,
  Building2,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import roleService from "@/service/roleService";
import { cn } from "@/lib/utils";
import CountrySelect from "@/components/country-select";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import type { ProfileCtx } from "./ProfileShell";

type Prefix = "" | "Mr." | "Mrs." | "Ms." | "Miss" | "Dr.";

type EmpProfile = {
  employeeNo: string;
  prefix: Prefix;
  firstName: string;
  middleName?: string;
  lastName: string;
  photoUrl?: string;
  joinDate: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other" | "";
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed" | "";
  status?: string;
  birthplace?: string;
  hometown?: string;
  nationality?: string;
  religion?: string;
  identification?: string;
  companyRole?: string; // Security role from linked user
  companyRoleId?: number | null; // FK to CompanyRole
  designation?: string; // Derived from current job's job_codes.title
};

const NEW_EMP: EmpProfile = {
  employeeNo: "",
  prefix: "",
  firstName: "",
  middleName: "",
  lastName: "",
  joinDate: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  status: "Active",
  birthplace: "",
  hometown: "",
  nationality: "",
  religion: "",
  identification: "",
  companyRole: "",
  companyRoleId: null,
  designation: "",
};

// ── helpers ───────────────────────────────────────────────────────────────────
const fromBackendStatus = (s?: string | null): string => {
  if (!s) return NEW_EMP.status ?? "Active";
  const up = String(s).toUpperCase();
  if (up === "ACTIVE") return "Active";
  if (up === "INACTIVE") return "Inactive";
  if (up === "ON_LEAVE") return "On Leave";
  if (up === "RESIGNED") return "Resigned";
  if (up === "TERMINATED") return "Terminated";
  if (up === "RETIRED") return "Retired";
  return String(s);
};

/** Normalize a backend employee record into the form's profile shape. */
const mapEmployeeToProfile = (emp: any): EmpProfile => ({
  ...NEW_EMP,
  ...emp,
  photoUrl: emp.imageUrl ?? "",
  status: fromBackendStatus(emp.status),
  prefix: (emp.prefix ?? "") as Prefix,
  companyRole: emp.companyRole ?? emp.CompanyRole ?? "",
  companyRoleId: emp.companyRoleId ?? null,
  designation: emp.designation ?? "",
});

const getInitials = (first?: string, last?: string) => {
  const f = (first ?? "").trim()[0] ?? "";
  const l = (last ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
};

function validateEmployeeProfile(data: EmpProfile): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!data.firstName?.trim()) errors.firstName = "First name is required";
  if (!data.lastName?.trim()) errors.lastName = "Last name is required";
  return errors;
}

const getStatusMeta = (status?: string) => {
  switch (status) {
    case "Active":
      return {
        dot: "bg-emerald-500",
        badge:
          "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100",
      };
    case "On Leave":
      return {
        dot: "bg-amber-400",
        badge:
          "bg-amber-50   text-amber-700   border-amber-200   ring-amber-100",
      };
    case "Resigned":
    case "Terminated":
      return {
        dot: "bg-rose-500",
        badge:
          "bg-rose-50   text-rose-700   border-rose-200   ring-rose-100",
      };
    case "Retired":
      return {
        dot: "bg-blue-400",
        badge:
          "bg-blue-50   text-blue-700   border-blue-200   ring-blue-100",
      };
    default:
      return {
        dot: "bg-slate-400",
        badge:
          "bg-slate-50   text-slate-600   border-slate-200   ring-slate-100",
      };
  }
};

// ── shared styled select ──────────────────────────────────────────────────────
const StyledSelect = ({
  disabled,
  value,
  onChange,
  children,
}: {
  disabled?: boolean;
  value: string;
  onChange: React.ChangeEventHandler<HTMLSelectElement>;
  children: React.ReactNode;
}) => (
  <select
    disabled={disabled}
    value={value}
    onChange={onChange}
    className={cn(
      "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm",
      "focus:outline-none focus:border-violet-300 focus:ring-2 focus:ring-violet-300/20",
      "transition-all bg-white",
      disabled && "bg-slate-50 text-slate-500 cursor-not-allowed",
    )}
  >
    {children}
  </select>
);

// ── field with leading icon ───────────────────────────────────────────────────
const IconInput = ({
  icon,
  ...props
}: React.ComponentProps<typeof Input> & { icon: React.ReactNode }) => (
  <div className="relative">
    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      {icon}
    </span>
    <Input
      {...props}
      className={cn(
        "h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-300 focus-visible:ring-violet-300/20",
        props.disabled && "bg-slate-50 text-slate-600",
        props.className,
      )}
    />
  </div>
);

// ── section heading ───────────────────────────────────────────────────────────
const SectionHeading = ({
  icon,
  label,
  description,
  accent = "from-violet-600 to-blue-600",
}: {
  icon: React.ReactNode;
  label: string;
  description?: string;
  accent?: string;
}) => (
  <div className="flex items-center gap-3 mb-5 pb-4 border-b border-slate-100">
    <div
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm",
        accent,
      )}
    >
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800">{label}</h3>
      {description && (
        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
      )}
    </div>
  </div>
);

// ── main component ────────────────────────────────────────────────────────────
export default function EmployeeProfileForm() {
  const { id } = useParams<{ id: string }>();
  const { editing, registerHandlers } = useOutletContext<ProfileCtx>();
  const { validationError } = useConfirmDialog();
  const { user: currentUser } = useAuth();
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR"].includes(
    (currentUser?.role ?? "").toUpperCase(),
  );

  const [saved, setSaved] = useState<EmpProfile>(NEW_EMP);
  const [draft, setDraft] = useState<EmpProfile>(NEW_EMP);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imageHover, setImageHover] = useState(false);
  const [, setPendingFile] = useState<File | null>(null);
  const [companyRoleOptions, setCompanyRoleOptions] = useState<
    { label: string; value: number; id: number }[]
  >([]);

  const set = useCallback(
    <K extends keyof EmpProfile>(k: K, v: EmpProfile[K]) =>
      setDraft((d) => ({ ...d, [k]: v })),
    [],
  );

  // Fetch company roles with IDs
  useEffect(() => {
    const companyId = currentUser?.companyId;
    if (!companyId) return;
    roleService
      .getRoles(Number(companyId))
      .then((roles) => {
        const options = roles
          .filter((r) => r.active !== false)
          .map((r) => ({ label: r.name, value: r.id ?? 0, id: r.id ?? 0 }));
        setCompanyRoleOptions(options);
      })
      .catch(() => console.error("Failed to fetch company roles"));
  }, [currentUser?.companyId]);

  // Load employee
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const emp = await import("@/service/hr.service").then((m) =>
          m.hrService.getEmployee(id),
        );
        if (!mounted) return;
        if (emp) {
          const merged = mapEmployeeToProfile(emp);
          setSaved(merged);
          setDraft(merged);
        }
      } catch (err) {
        console.error("Failed to load employee:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const persistChanges = useCallback(
    async (updated: EmpProfile) => {
      const toBackendStatus = (s?: string | null) => {
        if (!s) return null;
        const low = String(s).toLowerCase();
        if (low === "active") return "ACTIVE";
        if (low === "inactive") return "INACTIVE";
        if (low === "on leave" || low === "on_leave") return "ON_LEAVE";
        if (low === "resigned") return "RESIGNED";
        if (low === "terminated") return "TERMINATED";
        if (low === "retired") return "RETIRED";
        return String(s).toUpperCase();
      };
      const statusVal = toBackendStatus(updated.status ?? null);
      const payload: any = {
        employeeNo: updated.employeeNo,
        firstName: updated.firstName,
        middleName: updated.middleName || null,
        lastName: updated.lastName,
        gender: updated.gender || null,
        prefix: updated.prefix || null,
        maritalStatus: updated.maritalStatus || null,
        dateOfBirth: updated.dateOfBirth || null,
        joinDate: updated.joinDate || null,
        imageUrl: updated.photoUrl || null,
        birthplace: updated.birthplace || null,
        hometown: updated.hometown || null,
        nationality: updated.nationality || null,
        religion: updated.religion || null,
        identification: updated.identification || null,
        companyRole: updated.companyRole || null,
        companyRoleId: updated.companyRoleId || null,
      };
      if (statusVal != null) payload.status = statusVal;
      try {
        const { hrService } = await import("@/service/hr.service");
        let createdResult: any = null;
        if (id) {
          await hrService.updateEmployee(Number(id), payload);
          toast.success("Employee profile updated successfully!");
        } else {
          createdResult = await hrService.createEmployee(payload);
          toast.success("Employee created successfully!");
        }
        return createdResult;
      } catch (err) {
        console.error("Failed to persist employee changes to server:", err);
        toast.error("Failed to save employee profile. Please try again.");
        throw err;
      }
    },
    [id],
  );

  const handleSave = useCallback(async (): Promise<boolean> => {
    const fieldErrors = validateEmployeeProfile(draft);
    if (Object.keys(fieldErrors).length > 0) {
      await validationError({
        messages: Object.values(fieldErrors).filter(Boolean),
      });
      return false;
    }

    try {
      await persistChanges(draft);

      let next = draft;
      if (id) {
        try {
          const { hrService } = await import("@/service/hr.service");
          const fresh = await hrService.getEmployee(id);
          if (fresh) next = mapEmployeeToProfile(fresh);
        } catch {
          /* keep local draft if refetch fails */
        }
      }

      setSaved(next);
      setDraft(next);

      try {
        window.dispatchEvent(
          new CustomEvent("employee:updated", { detail: next }),
        );
      } catch {
        /* no-op */
      }

      return true;
    } catch {
      return false;
    }
  }, [draft, persistChanges, id, validationError]);

  const handleCancel = useCallback(() => {
    setDraft(saved);
  }, [saved]);

  useEffect(() => {
    registerHandlers({
      save: handleSave,
      cancel: handleCancel,
      beginEdit: () => setDraft(saved),
    });
    return () => registerHandlers(null);
  }, [saved, handleSave, handleCancel, registerHandlers]);

  const uploadImage = async (
    file: File,
    employeeId?: number,
  ): Promise<string> => {
    try {
      const { hrService } = await import("@/service/hr.service");
      if (employeeId) return hrService.uploadImage(employeeId, file);
    } catch {
      toast.error("Failed to upload image. Please try again.");
    }
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const statusMeta = getStatusMeta(draft.status);
  const initials = getInitials(draft.firstName, draft.lastName);
  const fullName = [draft.prefix, draft.firstName, draft.lastName]
    .filter(Boolean)
    .join(" ");
  const errors = validateEmployeeProfile(draft);

  return (
    <div className="bg-slate-50/60 min-h-screen space-y-5">
      {/* ── Hero header card ── */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Gradient banner */}

        {/* Profile row — avatar overlaps banner, name sits safely below */}
        <div className="px-6 py-3 flex items-center gap-4 bg-linear-to-br from-violet-500 to-blue-600">
          {/* Avatar — pulled up to overlap the banner */}
          <div className="relative shrink-0 mb-3 w-fit">
            <div
              className={cn(
                "relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-lg",
                editing && "cursor-pointer",
              )}
              onMouseEnter={() => editing && setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
              onClick={() => {
                if (editing) fileInputRef.current?.click();
              }}
            >
              {draft.photoUrl ? (
                <img
                  src={draft.photoUrl}
                  alt="Profile"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-blue-600 text-white text-2xl font-bold select-none">
                  {initials}
                </div>
              )}
              {/* Camera overlay only while editing */}
              {editing && (
                <div
                  className={cn(
                    "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-200",
                    imageHover ? "opacity-100" : "opacity-0",
                  )}
                >
                  <Camera className="h-5 w-5 text-white" />
                </div>
              )}
            </div>
            {/* Upload button only while editing */}
            {editing && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md hover:shadow-lg transition-shadow"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Name + meta — always below the banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-50 leading-tight truncate">
                {fullName || "New Employee"}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {draft.employeeNo ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                    <Hash className="h-3 w-3" />
                    {draft.employeeNo}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    No employee number
                  </span>
                )}
                {(draft.companyRole || draft.designation) && (
                  <span
                    className="inline-flex items-center gap-1 rounded-md bg-sky-50 px-2 py-0.5 text-xs font-medium text-sky-700 border border-sky-100"
                    title="Role — company role / access level for this employee"
                  >
                    <ShieldCheck className="h-3 w-3" />
                    {draft.companyRole || draft.designation}
                  </span>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span
              className={cn(
                "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ring-4",
                statusMeta.badge,
              )}
            >
              <span
                className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)}
              />
              {draft.status || "Active"}
            </span>
          </div>
        </div>
      </div>

      {/* ── Personal Information ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<UserCircle2 className="h-4 w-4" />}
          label="Personal Information"
          description="Basic identity and demographic details"
          accent="from-violet-600 to-blue-600"
        />
        <FormRow columns={3}>
          <FormField label="Employee No">
            <IconInput
              icon={<Hash className="h-4 w-4" />}
              disabled
              value={draft.employeeNo}
              readOnly
              className="font-mono"
            />
          </FormField>

          <FormField label="Prefix">
            <StyledSelect
              disabled={!editing}
              value={draft.prefix}
              onChange={(e) => set("prefix", e.target.value as Prefix)}
            >
              <option value="">Select prefix</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Miss">Miss</option>
              <option value="Dr.">Dr.</option>
            </StyledSelect>
          </FormField>

          <FormField label="First Name" required error={errors.firstName}>
            <IconInput
              icon={<User className="h-4 w-4" />}
              disabled={!editing}
              value={draft.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="Enter first name"
            />
          </FormField>

          <FormField label="Middle Name">
            <IconInput
              icon={<User className="h-4 w-4" />}
              disabled={!editing}
              value={draft.middleName ?? ""}
              onChange={(e) => set("middleName", e.target.value)}
              placeholder="Enter middle name"
            />
          </FormField>

          <FormField label="Last Name" required error={errors.lastName}>
            <IconInput
              icon={<User className="h-4 w-4" />}
              disabled={!editing}
              value={draft.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Enter last name"
            />
          </FormField>

          <FormField label="Date of Birth">
            <IconInput
              icon={<Calendar className="h-4 w-4" />}
              type="date"
              disabled={!editing}
              value={draft.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
            />
          </FormField>

          <FormField label="Gender">
            <StyledSelect
              disabled={!editing}
              value={draft.gender}
              onChange={(e) =>
                set("gender", e.target.value as EmpProfile["gender"])
              }
            >
              <option value="">Select gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </StyledSelect>
          </FormField>

          <FormField label="Marital Status">
            <StyledSelect
              disabled={!editing}
              value={draft.maritalStatus ?? ""}
              onChange={(e) =>
                set(
                  "maritalStatus",
                  e.target.value as EmpProfile["maritalStatus"],
                )
              }
            >
              <option value="">Select status</option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </StyledSelect>
          </FormField>

          <FormField label="Identification No">
            <IconInput
              icon={<ShieldCheck className="h-4 w-4" />}
              disabled={!editing}
              value={draft.identification ?? ""}
              onChange={(e) => set("identification", e.target.value)}
              placeholder="Enter ID number"
            />
          </FormField>

          <FormField label="Religion">
            <IconInput
              icon={<Heart className="h-4 w-4" />}
              disabled={!editing}
              value={draft.religion ?? ""}
              onChange={(e) => set("religion", e.target.value)}
              placeholder="Enter religion"
            />
          </FormField>
        </FormRow>
      </div>

      {/* ── Professional Details ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<Briefcase className="h-4 w-4" />}
          label="Professional Details"
          description="Employment status, role, and joining information"
          accent="from-emerald-500 to-teal-600"
        />
        <FormRow columns={3}>
          <FormField label="Join Date">
            <IconInput
              icon={<Calendar className="h-4 w-4" />}
              type="date"
              disabled={!editing}
              value={draft.joinDate}
              onChange={(e) => set("joinDate", e.target.value)}
            />
          </FormField>

          <FormField label="Employee Status">
            <StyledSelect
              disabled={!editing}
              value={draft.status ?? "Active"}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
              <option value="Resigned">Resigned</option>
              <option value="Terminated">Terminated</option>
              <option value="Retired">Retired</option>
            </StyledSelect>
          </FormField>

          <FormField label="Role">
            {isAdmin ? (
              <StyledSelect
                disabled={!editing}
                value={draft.companyRoleId ? String(draft.companyRoleId) : ""}
                onChange={(e) => {
                  const selectedId = Number(e.target.value) || null;
                  const selectedOption = companyRoleOptions.find(
                    (r) => r.id === selectedId,
                  );
                  set("companyRoleId", selectedId);
                  set("companyRole", selectedOption?.label ?? "");
                }}
              >
                <option value="">Select role</option>
                {companyRoleOptions.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.label}
                  </option>
                ))}
              </StyledSelect>
            ) : (
              <IconInput
                icon={<Building2 className="h-4 w-4" />}
                disabled
                value={draft.companyRole || "—"}
              />
            )}
          </FormField>
        </FormRow>
      </div>

      {/* ── Origin & Background ── */}
      <div className="rounded-2xl bg-white border border-slate-200 shadow-sm p-6">
        <SectionHeading
          icon={<Globe className="h-4 w-4" />}
          label="Origin & Background"
          description="Nationality, birthplace, and hometown information"
          accent="from-amber-500 to-orange-500"
        />
        <FormRow columns={3}>
          <FormField label="Nationality">
            <CountrySelect
              disabled={!editing}
              value={draft.nationality ?? ""}
              onChange={(nationality) => set("nationality", nationality)}
              placeholder="Select country"
            />
          </FormField>

          <FormField label="Birthplace">
            <IconInput
              icon={<MapPin className="h-4 w-4" />}
              disabled={!editing}
              value={draft.birthplace ?? ""}
              onChange={(e) => set("birthplace", e.target.value)}
              placeholder="Enter birthplace"
            />
          </FormField>

          <FormField label="Hometown">
            <IconInput
              icon={<MapPin className="h-4 w-4" />}
              disabled={!editing}
              value={draft.hometown ?? ""}
              onChange={(e) => set("hometown", e.target.value)}
              placeholder="Enter hometown"
            />
          </FormField>
        </FormRow>
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const input = e.target;
          const file = input.files?.[0];
          // Only allow changing the photo while the form is in edit mode.
          if (file && editing) {
            if (id) {
              const url = await uploadImage(file, Number(id));
              set("photoUrl", url);
              setSaved((prev) => ({ ...prev, photoUrl: url }));
              toast.success("Photo uploaded successfully!");
            } else {
              setPendingFile(file);
              const url = await uploadImage(file);
              set("photoUrl", url);
              toast.success("Photo selected successfully!");
            }
          }
          // Allow re-selecting the same file to fire onChange again.
          input.value = "";
        }}
      />
    </div>
  );
}
