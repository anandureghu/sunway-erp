import { useOutletContext, useParams } from "react-router-dom";
import {
  useState,
  useCallback,
  useEffect,
  type ReactElement,
  useRef,
} from "react";
import { useEmployeeSelection } from "@/context/employee-selection";
import { Input } from "@/components/ui/input";
import type { ProfileCtx } from "./ProfileShell";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  FormRow,
  FormField,
  FormSection,
} from "@/modules/hr/components/form-components";

type ProfileEvent = "profile:save" | "profile:cancel" | "profile:edit";

type Prefix = "" | "Mr." | "Mrs." | "Ms." | "Miss" | "Dr.";

type EmpProfile = {
  employeeNo: string;
  prefix: Prefix;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  joinDate: string; // yyyy-mm-dd
  dateOfBirth: string; // yyyy-mm-dd
  gender: "Male" | "Female" | "Other" | "";
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed" | "";
  status?: string;
};

const SEED: EmpProfile = {
  employeeNo: "1001",
  prefix: "",
  firstName: "Aisha",
  lastName: "Rahman",
  joinDate: "2024-01-15",
  dateOfBirth: "1998-09-05",
  gender: "",
  maritalStatus: "",
  status: "Active",
};

export default function EmployeeProfileForm(): ReactElement {
  const { editing } = useOutletContext<ProfileCtx>();
  const { id } = useParams<{ id: string }>();
  const { setSelected } = useEmployeeSelection();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [saved, setSaved] = useState<EmpProfile>(SEED);
  const [draft, setDraft] = useState<EmpProfile>(SEED);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      const emp = await import("@/service/hr.service").then((m) => m.hrService.getEmployee(id));
      if (!mounted) return;
      if (emp) {
        const fromBackendStatus = (s?: string | null) => {
          if (!s) return SEED.status;
          const up = String(s).toUpperCase();
          if (up === "ACTIVE") return "Active";
          if (up === "INACTIVE") return "Inactive";
          if (up === "ON_LEAVE") return "On Leave";
          return String(s);
        };

        const merged = { ...SEED, ...emp, status: fromBackendStatus((emp as any).status) } as EmpProfile;
        setSaved(merged);
        setDraft(merged);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const set = useCallback(
    <K extends keyof EmpProfile>(k: K, v: EmpProfile[K]) =>
      setDraft((d) => ({ ...d, [k]: v })),
    []
  );

  const persistChanges = useCallback(
    async (updated: EmpProfile) => {
      const toBackendStatus = (s?: string | null) => {
        if (!s) return null;
        const low = String(s).toLowerCase();
        if (low === "active") return "ACTIVE";
        if (low === "inactive") return "INACTIVE";
        if (low === "on leave" || low === "on_leave" || low === "on-leave") return "ON_LEAVE";
        return String(s).toUpperCase();
      };

      const statusVal = toBackendStatus(updated.status ?? null);

      const payload: any = {
        employeeNo: updated.employeeNo,
        firstName: updated.firstName,
        lastName: updated.lastName,

        gender: updated.gender || null,
        prefix: updated.prefix || null,
        maritalStatus: updated.maritalStatus || null,

        dateOfBirth: updated.dateOfBirth || null,
        joinDate: updated.joinDate || null,
      };

      if (statusVal != null) payload.status = statusVal;

      try {
        const { hrService } = await import("@/service/hr.service");
        if (id) {
          await hrService.updateEmployee(Number(id), payload);
        }
      } catch (err) {
        console.error("Failed to persist employee changes to server:", err);
      }

      const fullName = `${updated.prefix ? `${updated.prefix} ` : ""}${
        updated.firstName
      } ${updated.lastName}`.trim();

      setSelected({
        id: id ?? "",
        no: updated.employeeNo,
        name: fullName,
        firstName: updated.firstName,
        lastName: updated.lastName,
        status: updated.status ?? "Active",
        dateOfBirth: updated.dateOfBirth,
        gender: updated.gender,
        joinDate: updated.joinDate,
        maritalStatus: updated.maritalStatus,
      });

      try {
        window.dispatchEvent(new CustomEvent("employee:updated", { detail: { id } }));
      } catch {
        /* ignore */
      }
    },
    [id, setSelected]
  );

  const handleSave = useCallback(async () => {
    setSaved(draft);
    await persistChanges(draft);
  }, [draft, persistChanges]);

  const handleCancel = useCallback(() => setDraft(saved), [saved]);
  const handleEdit = useCallback(() => setDraft(saved), [saved]);

  useEffect(() => {
    const eventHandlers: Record<ProfileEvent, () => void> = {
      "profile:save": handleSave,
      "profile:cancel": handleCancel,
      "profile:edit": handleEdit,
    };

    Object.entries(eventHandlers).forEach(([event, handler]) => {
      document.addEventListener(event, handler);
    });

    return () => {
      Object.entries(eventHandlers).forEach(([event, handler]) => {
        document.removeEventListener(event, handler);
      });
    };
  }, [handleSave, handleCancel, handleEdit]);

  const uploadImage = async (file: File): Promise<string> => {
    const { hrService } = await import("@/service/hr.service");
    return hrService.uploadImage(file);
  };

  return (
    <div className="space-y-6" role="form">
      {/* Avatar and header */}
      <div className="flex items-center gap-4 pb-2 border-b mb-4">
        <Avatar className="h-16 w-16">
          {draft.photoUrl ? (
            <AvatarImage
              src={draft.photoUrl}
              alt={draft.firstName + " " + draft.lastName}
            />
          ) : (
            <AvatarFallback>
              {draft.firstName?.[0] ?? "?"}
              {draft.lastName?.[0] ?? ""}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="font-semibold text-lg">Employee</div>
          <div className="text-muted-foreground text-sm">Profile details</div>
        </div>
        {editing && (
          <div className="flex flex-col gap-2">
            <button
              type="button"
              className="text-xs px-2 py-1 rounded bg-primary text-white hover:bg-primary/90"
              onClick={() => fileInputRef.current?.click()}
            >
              Upload photo
            </button>
            {draft.photoUrl && (
              <button
                type="button"
                className="text-xs px-2 py-1 rounded bg-destructive text-white hover:bg-destructive/90"
                onClick={() => set("photoUrl", "")}
              >
                Remove
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await uploadImage(file);
                  set("photoUrl", url);
                }
              }}
            />
          </div>
        )}
      </div>

      <FormSection title="Personal Information">
        <FormRow columns={3}>
          <FormField label="Employee No" required>
            <Input
              type="text"
              disabled
              readOnly
              value={draft.employeeNo}
              aria-label="Employee number"
              aria-readonly="true"
            />
          </FormField>

          <FormField label="Gender">
            <select
              disabled={!editing}
              className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40"
              value={draft.gender}
              onChange={(e) =>
                set("gender", e.target.value as EmpProfile["gender"])
              }
              aria-label="Gender"
            >
              <option value="" hidden>
                Select…
              </option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Other">Other</option>
            </select>
          </FormField>

          <FormField label="Status" required>
            <select
              disabled={!editing}
              className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40"
              value={draft.status ?? "Active"}
              onChange={(e) =>
                set("status", e.target.value as EmpProfile["status"])
              }
              aria-label="Status"
            >
              <option value="Active">Active</option>
              <option value="On Leave">On Leave</option>
              <option value="Inactive">Inactive</option>
            </select>
          </FormField>
        </FormRow>

        <FormRow columns={3}>
          <FormField label="Prefix">
            <select
              disabled={!editing}
              className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40"
              value={draft.prefix}
              onChange={(e) =>
                set("prefix", e.target.value as EmpProfile["prefix"])
              }
              aria-label="Prefix"
            >
              <option value="">Select…</option>
              <option value="Mr.">Mr.</option>
              <option value="Mrs.">Mrs.</option>
              <option value="Ms.">Ms.</option>
              <option value="Miss">Miss</option>
              <option value="Dr.">Dr.</option>
            </select>
          </FormField>

          <FormField label="First Name" required>
            <Input
              type="text"
              disabled={!editing}
              value={draft.firstName}
              onChange={(e) => set("firstName", e.target.value)}
              placeholder="Enter first name"
              aria-label="First name"
              aria-required="true"
            />
          </FormField>

          <FormField label="Last Name" required>
            <Input
              type="text"
              disabled={!editing}
              value={draft.lastName}
              onChange={(e) => set("lastName", e.target.value)}
              placeholder="Enter last name"
              aria-label="Last name"
              aria-required="true"
            />
          </FormField>
        </FormRow>

        <FormRow columns={3}>
          <FormField label="Date of Birth">
            <Input
              type="date"
              disabled={!editing}
              value={draft.dateOfBirth}
              onChange={(e) => set("dateOfBirth", e.target.value)}
              aria-label="Date of birth"
            />
          </FormField>

          <FormField label="Marital Status">
            <select
              disabled={!editing}
              className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40"
              value={draft.maritalStatus ?? ""}
              onChange={(e) =>
                set(
                  "maritalStatus",
                  e.target.value as EmpProfile["maritalStatus"]
                )
              }
              aria-label="Marital status"
            >
              <option value="" hidden>
                Select…
              </option>
              <option value="Single">Single</option>
              <option value="Married">Married</option>
              <option value="Divorced">Divorced</option>
              <option value="Widowed">Widowed</option>
            </select>
          </FormField>

          <FormField label="Join Date">
            <Input
              type="date"
              disabled={!editing}
              value={draft.joinDate}
              onChange={(e) => set("joinDate", e.target.value)}
              aria-label="Join date"
            />
          </FormField>
        </FormRow>
      </FormSection>
    </div>
  );
}
