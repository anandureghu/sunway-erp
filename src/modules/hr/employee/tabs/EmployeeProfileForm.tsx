import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
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

type Prefix = "" | "Mr." | "Mrs." | "Ms." | "Miss" | "Dr.";

type EmpProfile = {
  employeeNo:     string;
  prefix:         Prefix;
  firstName:      string;
  lastName:       string;
  photoUrl?:      string;
  joinDate:       string;
  dateOfBirth:    string;
  gender:         "Male" | "Female" | "Other" | "";
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed" | "";
  status?:        string;
  birthplace?:    string;
  hometown?:      string;
  nationality?:   string;
  religion?:      string;
  identification?: string;
  companyRole?:   string;       // Role name (for display)
  companyRoleId?: number | null; // Role ID (FK to CompanyRole table)
};

const NEW_EMP: EmpProfile = {
  employeeNo: "", prefix: "", firstName: "", lastName: "",
  joinDate: "", dateOfBirth: "", gender: "", maritalStatus: "",
  status: "Active", birthplace: "", hometown: "", nationality: "",
  religion: "", identification: "", companyRole: "", companyRoleId: null,
};

// ── helpers ───────────────────────────────────────────────────────────────────
const getInitials = (first?: string, last?: string) => {
  const f = (first ?? "").trim()[0] ?? "";
  const l = (last  ?? "").trim()[0] ?? "";
  return (f + l).toUpperCase() || "?";
};

const getStatusMeta = (status?: string) => {
  switch (status) {
    case "Active":
      return { dot: "bg-emerald-500", badge: "bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-100" };
    case "On Leave":
      return { dot: "bg-amber-400",   badge: "bg-amber-50   text-amber-700   border-amber-200   ring-amber-100"   };
    default:
      return { dot: "bg-slate-400",   badge: "bg-slate-50   text-slate-600   border-slate-200   ring-slate-100"   };
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
      "focus:outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30",
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
        "h-9 pl-9 rounded-lg border-slate-200 focus-visible:border-violet-400 focus-visible:ring-violet-400/30",
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
    <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-white shadow-sm", accent)}>
      {icon}
    </div>
    <div>
      <h3 className="text-sm font-bold text-slate-800">{label}</h3>
      {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
    </div>
  </div>
);

// ── main component ────────────────────────────────────────────────────────────
export default function EmployeeProfileForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;
  const { user: currentUser } = useAuth();
  const isAdmin = ["ADMIN", "SUPER_ADMIN", "HR"].includes((currentUser?.role ?? "").toUpperCase());

  const [editing, setEditing] = useState<boolean>(isNew);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved,  setSaved]  = useState<EmpProfile>(NEW_EMP);
  const [draft,  setDraft]  = useState<EmpProfile>(NEW_EMP);
  const [imageHover, setImageHover] = useState(false);
  const [, setPendingFile] = useState<File | null>(null);
  const [companyRoleOptions, setCompanyRoleOptions] = useState<{ label: string; value: number; id: number }[]>([]);

  const set = useCallback(
    <K extends keyof EmpProfile>(k: K, v: EmpProfile[K]) =>
      setDraft((d) => ({ ...d, [k]: v })),
    [],
  );

  // Fetch company roles with IDs
  useEffect(() => {
    const companyId = currentUser?.companyId;
    if (!companyId) return;
    roleService.getRoles(Number(companyId))
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
        const emp = await import("@/service/hr.service").then((m) => m.hrService.getEmployee(id));
        if (!mounted) return;
        if (emp) {
          const fromBackendStatus = (s?: string | null) => {
            if (!s) return NEW_EMP.status;
            const up = String(s).toUpperCase();
            if (up === "ACTIVE")   return "Active";
            if (up === "INACTIVE") return "Inactive";
            if (up === "ON_LEAVE") return "On Leave";
            return String(s);
          };
          const merged: EmpProfile = {
            ...NEW_EMP, ...(emp as any),
            photoUrl:      (emp as any).imageUrl ?? "",
            status:        fromBackendStatus((emp as any).status),
            prefix:        ((emp as any).prefix ?? "") as Prefix,
            companyRole:   (emp as any).companyRole ?? (emp as any).CompanyRole ?? "",
            companyRoleId: (emp as any).companyRoleId ?? null,
          };
          setSaved(merged);
          setDraft(merged);
          setEditing(false);
        }
      } catch (err) {
        console.error("Failed to load employee:", err);
      }
    })();
    return () => { mounted = false; };
  }, [id]);

  const persistChanges = useCallback(async (updated: EmpProfile) => {
    const toBackendStatus = (s?: string | null) => {
      if (!s) return null;
      const low = String(s).toLowerCase();
      if (low === "active")                           return "ACTIVE";
      if (low === "inactive")                         return "INACTIVE";
      if (low === "on leave" || low === "on_leave")  return "ON_LEAVE";
      return String(s).toUpperCase();
    };
    const statusVal = toBackendStatus(updated.status ?? null);
    const payload: any = {
      employeeNo:     updated.employeeNo,
      firstName:      updated.firstName,
      lastName:       updated.lastName,
      gender:         updated.gender         || null,
      prefix:         updated.prefix         || null,
      maritalStatus:  updated.maritalStatus  || null,
      dateOfBirth:    updated.dateOfBirth    || null,
      joinDate:       updated.joinDate       || null,
      imageUrl:       updated.photoUrl       || null,
      birthplace:     updated.birthplace     || null,
      hometown:       updated.hometown       || null,
      nationality:    updated.nationality    || null,
      religion:       updated.religion       || null,
      identification: updated.identification || null,
      companyRole:    updated.companyRole    || null,
      companyRoleId:  updated.companyRoleId  || null,
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
  }, [id]);

  const handleSave = useCallback(async () => {
    try {
      await persistChanges(draft);
      setSaved(draft);
      setEditing(false);
    } catch { /* handled inside */ }
  }, [draft, persistChanges]);

  const handleCancel = useCallback(() => {
    setDraft(saved);
    setEditing(false);
  }, [saved]);

  useEffect(() => {
    const onEdit   = () => { setDraft(saved); setEditing(true); };
    const onSave   = () => { void handleSave(); };
    const onCancel = () => { handleCancel(); };
    document.addEventListener("profile:edit",   onEdit);
    document.addEventListener("profile:save",   onSave);
    document.addEventListener("profile:cancel", onCancel);
    return () => {
      document.removeEventListener("profile:edit",   onEdit);
      document.removeEventListener("profile:save",   onSave);
      document.removeEventListener("profile:cancel", onCancel);
    };
  }, [saved, handleSave, handleCancel]);

  const uploadImage = async (file: File, employeeId?: number): Promise<string> => {
    try {
      const { hrService } = await import("@/service/hr.service");
      if (employeeId) return hrService.uploadImage(employeeId, file);
    } catch {}
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  };

  const statusMeta = getStatusMeta(draft.status);
  const initials   = getInitials(draft.firstName, draft.lastName);
  const fullName   = [draft.prefix, draft.firstName, draft.lastName].filter(Boolean).join(" ");

  return (
    <div className="bg-slate-50/60 min-h-screen p-5 space-y-5">

      {/* ── Hero header card ── */}
      <div className="overflow-hidden rounded-2xl bg-white border border-slate-200 shadow-sm">
        {/* Gradient banner */}
        <div className="relative h-28 bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 overflow-hidden">
          {/* Dot pattern overlay */}
          <div
            className="absolute inset-0 opacity-20"
            style={{
              backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)",
              backgroundSize: "20px 20px",
            }}
          />
          <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -left-8 bottom-0  h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        </div>

        {/* Profile row — avatar overlaps banner, name sits safely below */}
        <div className="px-6 pb-5">
          {/* Avatar — pulled up to overlap the banner */}
          <div className="relative shrink-0 -mt-12 mb-3 w-fit">
            <div
              className="relative h-24 w-24 overflow-hidden rounded-2xl border-4 border-white shadow-lg cursor-pointer"
              onMouseEnter={() => setImageHover(true)}
              onMouseLeave={() => setImageHover(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              {draft.photoUrl ? (
                <img src={draft.photoUrl} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500 to-blue-600 text-white text-2xl font-bold select-none">
                  {initials}
                </div>
              )}
              <div className={cn(
                "absolute inset-0 flex items-center justify-center bg-black/50 transition-opacity duration-200",
                imageHover ? "opacity-100" : "opacity-0",
              )}>
                <Camera className="h-5 w-5 text-white" />
              </div>
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-1 -right-1 flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-blue-600 text-white shadow-md hover:shadow-lg transition-shadow"
            >
              <Upload className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Name + meta — always below the banner */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-xl font-bold text-slate-900 leading-tight truncate">
                {fullName || "New Employee"}
              </h2>
              <div className="flex flex-wrap items-center gap-2 mt-1.5">
                {draft.employeeNo ? (
                  <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs font-mono font-medium text-slate-600">
                    <Hash className="h-3 w-3" />{draft.employeeNo}
                  </span>
                ) : (
                  <span className="text-xs text-muted-foreground">No employee number</span>
                )}
                {draft.companyRole && (
                  <span className="inline-flex items-center gap-1 rounded-md bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700 border border-violet-100">
                    <Briefcase className="h-3 w-3" />{draft.companyRole}
                  </span>
                )}
              </div>
            </div>

            {/* Status badge */}
            <span className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold ring-4",
              statusMeta.badge,
            )}>
              <span className={cn("h-1.5 w-1.5 rounded-full", statusMeta.dot)} />
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

          <FormField label="First Name" required>
            <IconInput
              icon={<User className="h-4 w-4" />}
              disabled={!editing}
              value={draft.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="Enter first name"
            />
          </FormField>

          <FormField label="Last Name" required>
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
              onChange={(e) => set("gender", e.target.value as EmpProfile["gender"])}
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
              onChange={(e) => set("maritalStatus", e.target.value as EmpProfile["maritalStatus"])}
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

          <FormField label="Employment Status">
            <StyledSelect
              disabled={!editing}
              value={draft.status ?? "Active"}
              onChange={(e) => set("status", e.target.value)}
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </StyledSelect>
          </FormField>

          <FormField label="Role">
            {isAdmin ? (
              <StyledSelect
                disabled={!editing}
                value={draft.companyRoleId ? String(draft.companyRoleId) : ""}
                onChange={(e) => {
                  const selectedId = Number(e.target.value) || null;
                  const selectedOption = companyRoleOptions.find((r) => r.id === selectedId);
                  set("companyRoleId", selectedId);
                  set("companyRole", selectedOption?.label ?? "");
                }}
              >
                <option value="">Select role</option>
                {companyRoleOptions.map((r) => (
                  <option key={r.id} value={r.id}>{r.label}</option>
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
            <IconInput
              icon={<Globe className="h-4 w-4" />}
              disabled={!editing}
              value={draft.nationality ?? ""}
              onChange={(e) => set("nationality", e.target.value)}
              placeholder="Enter nationality"
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
          const file = e.target.files?.[0];
          if (file) {
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
        }}
      />
    </div>
  );
}
