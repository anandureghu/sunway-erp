import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Users,
  User,
  Calendar,
  Globe,
  Heart,
  Baby,
  UserCog,
  ShieldCheck,
  MapPin,
  Phone,
  Flag,
  UserPlus,
  Hash,
  Building2,
} from "lucide-react";
import { FormRow } from "@/modules/hr/components/form-components";
import {
  RecordActions,
  RecordAvatar,
  SectionCard,
  SectionHeading,
  ViewField,
  todayIso,
} from "@/modules/hr/components/profile-form-ui";
import {
  DFact,
  DFactGrid,
  DField,
  DHeaderTag,
  DHighlights,
  DInput,
  DSelect,
  DialogSection,
  RecordFormDialog,
  RecordViewDialog,
  dInputCls,
} from "@/modules/hr/components/record-form-dialog";
import { SummaryCard } from "@/modules/hr/components/summary-card";
import CountrySelect from "@/components/country-select";
import CountryFlag from "@/components/CountryFlag";
import PhoneInput from "@/components/PhoneInput";
import { formatDisplayDate } from "@/lib/format-date";
import {
  normalizePhone,
  validatePhone,
  getCountryByName,
} from "@/lib/countries";
import { isValidDate } from "@/modules/hr/utils/validation";
import { cn, generateId } from "@/lib/utils";
import type { Dependent, Gender, MaritalStatus } from "@/types/hr";
import { useParams, useNavigate } from "react-router-dom";
import { dependentService } from "@/service/dependentService";
import { toast } from "sonner";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";

/** Red flag shown next to a dependent's name when they are the emergency contact. */
const EmergencyFlag = () => (
  <span
    title="Emergency contact"
    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600"
  >
    <Flag className="h-3 w-3 fill-red-500 text-red-500" />
    Emergency Contact
  </span>
);

interface ValidationErrors {
  [key: string]: string | undefined;
}

// Format an ISO / yyyy-mm-dd date string as DD/MM/YYYY for read-only display.
const formatDMY = (value?: string) => {
  if (!value) return "—";
  return formatDisplayDate(value) || value;
};

// Default initial state for a new dependent
const INITIAL_DEPENDENT: Dependent = {
  id: "",
  firstName: "",
  middleName: "",
  lastName: "",
  dob: "",
  gender: undefined,
  nationalId: "",
  nationality: "",
  maritalStatus: undefined,
  relationship: undefined,
  phoneNo: "",
  address: "",
  address2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  emergencyContact: false,
};

// Function to create initial dependent from provided data (for demo/testing)
export function createInitialDependentFromData(data: {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string;
  gender?: string;
  nationalId?: string;
  nationality?: string;
  maritalStatus?: string;
  relationship?: string;
  phoneNumber?: string;
  addressLine1?: string;
  addressLine2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}): Dependent {
  return {
    id: "",
    firstName: data.firstName || "",
    middleName: data.middleName || "",
    lastName: data.lastName || "",
    dob: data.dateOfBirth || "",
    gender: (data.gender as Gender) || undefined,
    nationalId: data.nationalId || "",
    nationality: data.nationality || "",
    maritalStatus: (data.maritalStatus as MaritalStatus) || undefined,
    relationship: (data.relationship as Dependent["relationship"]) || undefined,
    phoneNo: normalizePhone(data.phoneNumber),
    address: data.addressLine1 || "",
    address2: data.addressLine2 || "",
    city: data.city || "",
    state: data.state || "",
    postalCode: data.postalCode || "",
    country: data.country || "",
  };
}

const GENDERS = ["Male", "Female", "Other"] as const;
const MARITALS = ["Single", "Married", "Divorced", "Widowed"] as const;
const RELATIONSHIPS = [
  { value: "Spouse", label: "Spouse" },
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Other", label: "Other" },
] as const;

function validateDependent(dependent: Dependent): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!dependent.firstName?.trim()) errors.firstName = "First name is required";
  if (!dependent.lastName?.trim()) errors.lastName = "Last name is required";
  if (!dependent.gender) errors.gender = "Gender is required";
  if (!dependent.relationship) errors.relationship = "Relationship is required";
  if (dependent.dob && !isValidDate(dependent.dob))
    errors.dob = "Invalid date format";
  else if (dependent.dob && dependent.dob > todayIso())
    errors.dob = "Date of birth cannot be in the future";

  return errors;
}

const getRelationshipColor = (relationship: string) => {
  switch (relationship?.toLowerCase()) {
    case "spouse":
      return "bg-rose-50 text-rose-700 border-rose-200";
    case "son":
    case "daughter":
      return "bg-blue-50 text-blue-700 border-blue-200";
    case "father":
    case "mother":
      return "bg-purple-50 text-purple-700 border-purple-200";
    default:
      return "bg-gray-50 text-gray-700 border-gray-200";
  }
};

const initialsOf = (d: Dependent) =>
  (
    (d.firstName?.trim()[0] ?? "") + (d.lastName?.trim()[0] ?? "")
  ).toUpperCase() || "?";

const fullNameOf = (d: Dependent) =>
  [d.firstName, d.middleName, d.lastName].filter((s) => s?.trim()).join(" ");

const countryIcon = (name?: string) => {
  const iso2 = getCountryByName(name)?.iso2;
  return iso2 ? (
    <CountryFlag iso2={iso2} className="text-base leading-none" />
  ) : (
    <Globe className="h-4 w-4" />
  );
};

export function DependentsForm() {
  const { confirm } = useConfirmDialog();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  // Copy of a saved record taken when its edit starts, so Cancel can restore it.
  const [editSnapshot, setEditSnapshot] = useState<Dependent | null>(null);
  // Field errors are shown only after the user tries to save (like Add Employee).
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : undefined;

  const reloadFromBackend = useCallback(async () => {
    if (!empId) return;
    try {
      const data = await dependentService.getAll(empId);
      setDependents(
        (data || []).map((d) => ({
          id: String((d as any).id ?? ""),
          firstName: d.firstName ?? "",
          middleName: d.middleName ?? "",
          lastName: d.lastName ?? "",
          dob: (d as any).dateOfBirth ?? "",
          gender: d.gender as Gender | undefined,
          nationalId: (d as any).nationalId ?? "",
          nationality: d.nationality ?? "",
          maritalStatus: d.maritalStatus as MaritalStatus | undefined,
          relationship: d.relationship as any,
          phoneNo: normalizePhone(d.phoneNo),
          address: d.address ?? "",
          address2: d.address2 ?? "",
          city: d.city ?? "",
          state: d.state ?? "",
          postalCode: d.postalCode ?? "",
          country: d.country ?? "",
          emergencyContact: d.emergencyContact ?? false,
        })),
      );
    } catch (err: any) {
      console.error(
        "DependentsForm -> failed to load dependents:",
        err?.response?.data ?? err,
      );
      toast.error(dependentService.extractErrorMessage(err));
    }
  }, [empId]);

  useEffect(() => {
    reloadFromBackend();
  }, [reloadFromBackend]);

  const handleAdd = useCallback(() => {
    // Give each new row a unique client id so multiple unsaved dependents don't
    // collide on an empty id (duplicate React keys / cross-row edits). Persisted
    // rows use numeric ids, so this non-numeric id keeps the save path on create.
    const newDependent = { ...INITIAL_DEPENDENT, id: generateId() };
    setDependents((current) => [...current, newDependent]);
    setViewingId(null);
    setEditSnapshot(null);
    setEditingId(newDependent.id);
  }, []);

  const navigate = useNavigate();

  const handleSave = useCallback(
    async (dependent: Dependent): Promise<boolean> => {
      setDependents((current) =>
        current.map((d) => (d.id === dependent.id ? dependent : d)),
      );

      if (!empId) return false;

      const phoneCheck = validatePhone(dependent.phoneNo, { required: true });
      if (!phoneCheck.valid) {
        toast.error(phoneCheck.message ?? "Invalid phone number");
        return false;
      }

      try {
        const payload = {
          firstName: dependent.firstName,
          middleName: dependent.middleName || undefined,
          lastName: dependent.lastName,
          // dob is already a yyyy-mm-dd string; sending it raw avoids the
          // new Date(...).toISOString() UTC round-trip that shifted the day by
          // one in negative-UTC timezones.
          dateOfBirth: dependent.dob || undefined,
          gender: dependent.gender,
          nationality: dependent.nationality || undefined,
          nationalId: dependent.nationalId || undefined,
          maritalStatus: dependent.maritalStatus || undefined,
          relationship: dependent.relationship,
          phoneNo: normalizePhone(dependent.phoneNo) || undefined,
          address: dependent.address || undefined,
          address2: dependent.address2 || undefined,
          city: dependent.city || undefined,
          state: dependent.state || undefined,
          postalCode: dependent.postalCode || undefined,
          country: dependent.country || undefined,
          emergencyContact: dependent.emergencyContact ?? false,
        } as any;

        // Numeric id ⇒ persisted record (update); non-numeric client id ⇒ new draft (create).
        if (/^\d+$/.test(dependent.id)) {
          await dependentService.update(empId, Number(dependent.id), payload);
          toast.success("Dependent updated");
        } else {
          await dependentService.create(empId, payload);
          toast.success("Dependent created");
        }

        await reloadFromBackend();
        navigate(`/hr/employees/${empId}/dependents`);
        return true;
      } catch (err: any) {
        toast.error(dependentService.extractErrorMessage(err));
        return false;
      }
    },
    [empId, reloadFromBackend, navigate],
  );

  const handleStartEdit = useCallback((dependent: Dependent) => {
    setViewingId(null);
    setEditSnapshot({ ...dependent });
    setEditingId(dependent.id);
  }, []);

  const handleCancel = useCallback(() => {
    setDependents((current) =>
      current
        // Cancelling the pop-up discards an unsaved new dependent.
        .filter((d) => d.id !== editingId || /^\d+$/.test(d.id))
        // Undo unsaved changes to an existing record.
        .map((d) =>
          editSnapshot && d.id === editSnapshot.id ? editSnapshot : d,
        ),
    );
    setEditSnapshot(null);
    setEditingId(null);
  }, [editingId, editSnapshot]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!(await confirm("Are you sure you want to delete this dependent?")))
        return;
      if (!empId) {
        return;
      }

      try {
        await dependentService.remove(empId, Number(id));
        toast.success("Dependent deleted");
        setEditingId(null);
        setViewingId(null);
        await reloadFromBackend();
      } catch (err: any) {
        console.error(
          "DependentsForm -> delete failed:",
          err?.response?.data ?? err,
        );
        toast.error(dependentService.extractErrorMessage(err));
      }
    },
    [empId, reloadFromBackend, confirm],
  );

  const updateDependent = useCallback(
    (id: string, changes: Partial<Dependent>) => {
      setDependents((current) =>
        current.map((d) => (d.id === id ? { ...d, ...changes } : d)),
      );
    },
    [],
  );

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  // Saved records only — an unsaved draft lives in the pop-up, not the list.
  const savedDependents = dependents.filter((d) => /^\d+$/.test(d.id));
  const totalDependents = savedDependents.length;
  const spouseCount = savedDependents.filter(
    (d) => d.relationship === "Spouse",
  ).length;
  const childrenCount = savedDependents.filter(
    (d) => d.relationship === "Son" || d.relationship === "Daughter",
  ).length;
  const parentsCount = savedDependents.filter(
    (d) => d.relationship === "Father" || d.relationship === "Mother",
  ).length;

  const editingDependent = editingId
    ? (dependents.find((d) => d.id === editingId) ?? null)
    : null;

  /* ================= EDIT FORM (pop-up, like Add Employee) ================= */

  const renderEditorDialog = () => {
    const dependent = editingDependent;
    if (!dependent) return null;
    const all = validateDependent(dependent);
    const errors: ValidationErrors = showErrors ? all : {};
    const age = dependent.dob && !all.dob ? calculateAge(dependent.dob) : null;
    const phoneCheck = validatePhone(dependent.phoneNo, { required: true });
    const phoneError =
      showErrors && !phoneCheck.valid
        ? (phoneCheck.message ?? "Enter a valid phone number")
        : undefined;
    const isNew = !/^\d+$/.test(dependent.id);
    const name = fullNameOf(dependent);

    const submit = async () => {
      setShowErrors(true);
      if (Object.keys(all).length > 0 || !phoneCheck.valid) {
        toast.error("Please complete the highlighted fields");
        return;
      }
      setSaving(true);
      try {
        const ok = await handleSave(dependent);
        if (ok) {
          setEditSnapshot(null);
          setEditingId(null);
          setShowErrors(false);
        }
      } finally {
        setSaving(false);
      }
    };

    return (
      <RecordFormDialog
        open
        onClose={() => {
          setShowErrors(false);
          handleCancel();
        }}
        title={isNew ? "Add new dependent" : `Edit ${name || "dependent"}`}
        subtitle={
          isNew
            ? "Fill in the details to add a dependent for this employee"
            : "Update the dependent's details"
        }
        badge={initialsOf(dependent)}
        badgeClassName="bg-blue-100 text-blue-700"
        saveLabel={isNew ? "Save dependent" : "Update dependent"}
        saveIcon={<UserPlus className="h-3.5 w-3.5" />}
        onSave={submit}
        saving={saving}
      >
        {/* ── Personal information ── */}
        <DialogSection
          icon={<User className="h-3.5 w-3.5 text-slate-600" />}
          iconBg="bg-slate-100"
          title="Personal information"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <DField label="First name" required error={errors.firstName}>
              <DInput
                placeholder="John"
                value={dependent.firstName}
                onChange={(e) =>
                  updateDependent(dependent.id, { firstName: e.target.value })
                }
                invalid={!!errors.firstName}
              />
            </DField>
            <DField label="Middle name">
              <DInput
                placeholder="(optional)"
                value={dependent.middleName ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, { middleName: e.target.value })
                }
              />
            </DField>
            <DField label="Last name" required error={errors.lastName}>
              <DInput
                placeholder="Doe"
                value={dependent.lastName}
                onChange={(e) =>
                  updateDependent(dependent.id, { lastName: e.target.value })
                }
                invalid={!!errors.lastName}
              />
            </DField>
            <DField label="Relationship" required error={errors.relationship}>
              <DSelect
                value={dependent.relationship ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, {
                    relationship:
                      ((e.target.value ||
                        undefined) as (typeof RELATIONSHIPS)[number]["value"]) ||
                      undefined,
                  })
                }
                invalid={!!errors.relationship}
              >
                <option value="">Select</option>
                {RELATIONSHIPS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </DSelect>
            </DField>
            <DField label="Gender" required error={errors.gender}>
              <DSelect
                value={dependent.gender ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, {
                    gender: (e.target.value as Gender) || undefined,
                  })
                }
                invalid={!!errors.gender}
              >
                <option value="">Select</option>
                {GENDERS.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </DSelect>
            </DField>
            <DField
              label="Date of birth"
              error={errors.dob}
              hint={age !== null ? `Age: ${age} ${age === 1 ? "year" : "years"}` : undefined}
            >
              <DInput
                type="date"
                max={todayIso()}
                value={dependent.dob}
                onChange={(e) =>
                  updateDependent(dependent.id, { dob: e.target.value })
                }
                invalid={!!errors.dob}
              />
            </DField>
            <DField label="Marital status">
              <DSelect
                value={dependent.maritalStatus ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, {
                    maritalStatus:
                      (e.target.value as MaritalStatus) || undefined,
                  })
                }
              >
                <option value="">Select</option>
                {MARITALS.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </DSelect>
            </DField>
          </div>
        </DialogSection>

        {/* ── Identification ── */}
        <DialogSection
          icon={<ShieldCheck className="h-3.5 w-3.5 text-blue-600" />}
          iconBg="bg-blue-50"
          title="Identification"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DField label="National ID">
              <DInput
                placeholder="QID / Passport / National ID"
                value={dependent.nationalId ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, { nationalId: e.target.value })
                }
              />
            </DField>
            <DField label="Nationality">
              <CountrySelect
                value={dependent.nationality ?? ""}
                onChange={(v) =>
                  updateDependent(dependent.id, { nationality: v })
                }
                placeholder="Select country"
                className={dInputCls}
              />
            </DField>
          </div>

          <label
            htmlFor={`emergency-${dependent.id}`}
            className={cn(
              "mt-4 flex cursor-pointer items-start gap-3 rounded-xl border px-3 py-2.5 transition-colors",
              dependent.emergencyContact
                ? "border-rose-200 bg-rose-50/70"
                : "border-slate-200 bg-slate-50/60 hover:bg-slate-50",
            )}
          >
            <input
              type="checkbox"
              id={`emergency-${dependent.id}`}
              checked={dependent.emergencyContact ?? false}
              onChange={(e) =>
                updateDependent(dependent.id, {
                  emergencyContact: e.target.checked,
                })
              }
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
            />
            <span>
              <span className="flex items-center gap-1.5 text-[13px] font-semibold text-slate-700">
                <Flag
                  className={cn(
                    "h-3.5 w-3.5",
                    dependent.emergencyContact
                      ? "fill-rose-500 text-rose-500"
                      : "text-slate-400",
                  )}
                />
                Emergency contact
              </span>
              <span className="mt-0.5 block text-[11px] text-slate-500">
                {dependent.emergencyContact
                  ? "This dependent's name, relationship and phone number are used as the employee's emergency contact."
                  : "Tick to use this dependent as the employee's emergency contact."}
              </span>
            </span>
          </label>
        </DialogSection>

        {/* ── Contact information ── */}
        <DialogSection
          icon={<Phone className="h-3.5 w-3.5 text-amber-600" />}
          iconBg="bg-amber-50"
          title="Contact information"
        >
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DField label="Phone number" required error={phoneError} className="sm:col-span-2">
              <PhoneInput
                value={dependent.phoneNo ?? ""}
                onChange={(v) => updateDependent(dependent.id, { phoneNo: v })}
                invalid={!!phoneError}
                placeholder="Phone number"
              />
            </DField>
            <DField label="Address line 1">
              <DInput
                placeholder="Building, street, zone"
                value={dependent.address ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, { address: e.target.value })
                }
              />
            </DField>
            <DField label="Address line 2">
              <DInput
                placeholder="(optional)"
                value={dependent.address2 ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, { address2: e.target.value })
                }
              />
            </DField>
            <DField label="City">
              <DInput
                placeholder="City"
                value={dependent.city ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, { city: e.target.value })
                }
              />
            </DField>
            <DField label="State / province">
              <DInput
                placeholder="State / province"
                value={dependent.state ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, { state: e.target.value })
                }
              />
            </DField>
            <DField label="Postal code">
              <DInput
                placeholder="(optional)"
                value={dependent.postalCode ?? ""}
                onChange={(e) =>
                  updateDependent(dependent.id, { postalCode: e.target.value })
                }
              />
            </DField>
            <DField label="Country">
              <CountrySelect
                value={dependent.country ?? ""}
                onChange={(v) => updateDependent(dependent.id, { country: v })}
                placeholder="Select country"
                className={dInputCls}
              />
            </DField>
          </div>
        </DialogSection>
      </RecordFormDialog>
    );
  };

  /* ================= VIEW (pop-up, read-only) ================= */

  const renderViewDialog = () => {
    const dependent = viewingId
      ? savedDependents.find((d) => d.id === viewingId)
      : undefined;
    if (!dependent) return null;
    const age = dependent.dob ? calculateAge(dependent.dob) : null;
    const name = fullNameOf(dependent) || "Unnamed dependent";

    return (
      <RecordViewDialog
        open
        onClose={() => setViewingId(null)}
        title={name}
        subtitle="Dependent details"
        badge={initialsOf(dependent)}
        badgeClassName="bg-blue-100 text-blue-700"
        headerExtra={
          <>
            {dependent.relationship && <DHeaderTag>{dependent.relationship}</DHeaderTag>}
            {dependent.emergencyContact && (
              <DHeaderTag className="border-rose-300/60 bg-rose-500/25 text-rose-50">
                <Flag className="h-3 w-3 fill-rose-300 text-rose-300" /> Emergency contact
              </DHeaderTag>
            )}
          </>
        }
        onEdit={() => {
          setViewingId(null);
          handleStartEdit(dependent);
        }}
        editLabel="Edit dependent"
      >
        {dependent.emergencyContact && (
          <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-500 text-white shadow-sm">
              <Phone className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="text-[13px] font-semibold text-rose-800">Emergency contact</p>
              <p className="text-[12.5px] text-rose-700">
                Call{" "}
                <span className="font-mono font-semibold">
                  {dependent.phoneNo || "— no phone number recorded"}
                </span>
                {dependent.relationship ? ` · ${dependent.relationship}` : ""}
              </p>
            </div>
          </div>
        )}

        <DHighlights
          items={[
            {
              label: "Relationship",
              value: dependent.relationship,
              className: "border-blue-100 bg-blue-50 text-blue-800",
            },
            {
              label: "Age",
              value: age !== null ? `${age} ${age === 1 ? "year" : "years"}` : "",
              className: "border-emerald-100 bg-emerald-50 text-emerald-800",
            },
            {
              label: "Gender",
              value: dependent.gender,
              className: "border-violet-100 bg-violet-50 text-violet-800",
            },
            {
              label: "Marital status",
              value: dependent.maritalStatus,
              className: "border-amber-100 bg-amber-50 text-amber-800",
            },
          ]}
        />

        <DialogSection
          icon={<User className="h-3.5 w-3.5 text-slate-600" />}
          iconBg="bg-slate-100"
          title="Personal information"
        >
          <DFactGrid>
            <DFact icon={<User className="h-3.5 w-3.5" />} label="First name" value={dependent.firstName} />
            <DFact icon={<User className="h-3.5 w-3.5" />} label="Middle name" value={dependent.middleName} />
            <DFact icon={<User className="h-3.5 w-3.5" />} label="Last name" value={dependent.lastName} />
            <DFact icon={<Calendar className="h-3.5 w-3.5" />} label="Date of birth" value={dependent.dob ? formatDMY(dependent.dob) : ""} mono />
            <DFact icon={countryIcon(dependent.nationality)} label="Nationality" value={dependent.nationality} />
            <DFact icon={<ShieldCheck className="h-3.5 w-3.5" />} label="National ID" value={dependent.nationalId} mono />
          </DFactGrid>
        </DialogSection>

        <DialogSection
          icon={<Phone className="h-3.5 w-3.5 text-amber-600" />}
          iconBg="bg-amber-50"
          title="Contact information"
        >
          <DFactGrid>
            <DFact
              icon={<Phone className="h-3.5 w-3.5" />}
              label="Phone number"
              value={dependent.phoneNo}
              mono
              tone={dependent.emergencyContact ? "text-rose-600" : undefined}
            />
            <DFact icon={<Building2 className="h-3.5 w-3.5" />} label="City" value={dependent.city} />
            <DFact icon={countryIcon(dependent.country)} label="Country" value={dependent.country} />
            <DFact
              icon={<MapPin className="h-3.5 w-3.5" />}
              label="Address"
              value={[dependent.address, dependent.address2].filter((x) => x?.trim()).join(", ")}
              wide
              multiline
            />
            <DFact icon={<MapPin className="h-3.5 w-3.5" />} label="State / province" value={dependent.state} />
            <DFact icon={<Hash className="h-3.5 w-3.5" />} label="Postal code" value={dependent.postalCode} mono />
          </DFactGrid>
        </DialogSection>
      </RecordViewDialog>
    );
  };

  /* ================= LIST ROW ================= */

  const renderRow = (dependent: Dependent) => {
    const age = dependent.dob ? calculateAge(dependent.dob) : null;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <RecordAvatar>{initialsOf(dependent)}</RecordAvatar>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h4 className="truncate text-sm font-bold text-slate-800">
                  {fullNameOf(dependent) || "Unnamed dependent"}
                </h4>
                {dependent.relationship && (
                  <span
                    className={cn(
                      "rounded-full border px-2.5 py-0.5 text-[11px] font-semibold",
                      getRelationshipColor(dependent.relationship),
                    )}
                  >
                    {dependent.relationship}
                  </span>
                )}
                {dependent.emergencyContact && <EmergencyFlag />}
              </div>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {[dependent.gender, age !== null ? `${age} yrs` : null, dependent.nationality]
                  .filter(Boolean)
                  .join(" · ") || "No details yet"}
              </p>
            </div>
          </div>
          <RecordActions
            onView={() => {
              setEditingId(null);
              setViewingId(dependent.id);
            }}
            onEdit={() => handleStartEdit(dependent)}
            onDelete={() => handleDelete(dependent.id)}
          />
        </div>
        <FormRow columns={4} className="mt-4 border-t border-slate-100 pt-3">
          <ViewField icon={<Calendar className="h-4 w-4" />} label="Date of Birth" value={formatDMY(dependent.dob)} />
          <ViewField icon={countryIcon(dependent.nationality)} label="Nationality" value={dependent.nationality} />
          <ViewField icon={<Phone className="h-4 w-4" />} label="Phone" value={dependent.phoneNo} mono />
          <ViewField icon={<Heart className="h-4 w-4" />} label="Marital Status" value={dependent.maritalStatus} />
        </FormRow>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-xl">
      <SecondaryPageHeader
        title="Employee Dependents"
        description="Manage dependent information"
        icon={<Users className="h-5 w-5 text-white" />}
        actions={
          <Button
            onClick={() => {
              setShowErrors(false);
              handleAdd();
            }}
            disabled={!!editingDependent}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 rounded-xl px-5"
          >
            <Plus className="h-4 w-4" />
            Add Dependent
          </Button>
        }
      />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Dependents"
          value={totalDependents}
          description="Dependents on record"
          icon={<Users className="h-5 w-5" />}
          color="blue"
        />
        <SummaryCard
          label="Spouse"
          value={spouseCount}
          description="Married partner"
          icon={<Heart className="h-5 w-5" />}
          color="rose"
        />
        <SummaryCard
          label="Children"
          value={childrenCount}
          description="Sons & daughters"
          icon={<Baby className="h-5 w-5" />}
          color="emerald"
        />
        <SummaryCard
          label="Parents"
          value={parentsCount}
          description="Father & mother"
          icon={<UserCog className="h-5 w-5" />}
          color="violet"
        />
      </div>

      {renderEditorDialog()}

      {renderViewDialog()}

      <SectionCard>
        <SectionHeading
          icon={<Users className="h-4 w-4" />}
          label="Dependents Details"
          description={
            totalDependents
              ? `${totalDependents} dependent${totalDependents === 1 ? "" : "s"} on record`
              : "Spouse, children, parents and other dependents"
          }
        />
        {savedDependents.length > 0 ? (
          <div className="space-y-3">
            {savedDependents.map((dependent) => (
              <div key={dependent.id}>{renderRow(dependent)}</div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100">
              <Users className="h-7 w-7 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              No dependents added yet
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Click "Add Dependent" to record the employee's first dependent.
            </p>
            <Button
              onClick={handleAdd}
              className="mt-4 h-9 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Dependent
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
