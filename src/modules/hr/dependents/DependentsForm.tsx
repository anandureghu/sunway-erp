import { useCallback, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Plus,
  Trash2,
  Eye,
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
} from "lucide-react";
import { FormRow } from "@/modules/hr/components/form-components";
import { SummaryCard } from "@/modules/hr/components/summary-card";
import CountrySelect from "@/components/country-select";
import CountryFlag from "@/components/CountryFlag";
import PhoneInput from "@/components/PhoneInput";
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

interface ValidationErrors {
  [key: string]: string | undefined;
}

const ViewField = ({
  icon,
  label,
  value,
  mono,
}: {
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  mono?: boolean;
}) => {
  const empty = value == null || value === "" || value === "—";
  return (
    <div className="flex items-start gap-2.5">
      <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium text-slate-400">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-semibold",
            empty ? "text-slate-300" : "text-slate-700",
            mono && "font-mono",
          )}
        >
          {empty ? "—" : value}
        </p>
      </div>
    </div>
  );
};

// Format an ISO / yyyy-mm-dd date string as dd-mm-yyyy for read-only display.
const formatDMY = (value?: string) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
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

export function DependentsForm() {
  const { confirm } = useConfirmDialog();
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
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
    setEditingId(newDependent.id);
  }, []);

  const navigate = useNavigate();

  const handleSave = useCallback(
    async (dependent: Dependent) => {
      setDependents((current) =>
        current.map((d) => (d.id === dependent.id ? dependent : d)),
      );

      if (!empId) return;

      const phoneCheck = validatePhone(dependent.phoneNo, { required: true });
      if (!phoneCheck.valid) {
        toast.error(phoneCheck.message ?? "Invalid phone number");
        return;
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
      } catch (err: any) {
        toast.error(dependentService.extractErrorMessage(err));
      }
    },
    [empId, reloadFromBackend, navigate],
  );

  const handleCancel = useCallback(() => {
    setDependents((current) =>
      current.filter((d) => {
        if (d.id !== editingId) return true;
        const isEmpty = !(
          d.firstName?.trim() ||
          d.lastName?.trim() ||
          d.relationship ||
          d.gender ||
          d.nationalId ||
          d.nationality ||
          d.dob
        );
        return !isEmpty;
      }),
    );
    setEditingId(null);
  }, [editingId]);

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

  const totalDependents = dependents.length;
  const spouseCount = dependents.filter(
    (d) => d.relationship === "Spouse",
  ).length;
  const childrenCount = dependents.filter(
    (d) => d.relationship === "Son" || d.relationship === "Daughter",
  ).length;
  const parentsCount = dependents.filter(
    (d) => d.relationship === "Father" || d.relationship === "Mother",
  ).length;

  const editingDependent = editingId
    ? (dependents.find((d) => d.id === editingId) ?? null)
    : null;

  return (
    <div className="space-y-4 rounded-xl">
      <SecondaryPageHeader
        title="Employee Dependents"
        description="Manage dependent information"
        icon={<Users className="h-5 w-5 text-white" />}
        actions={
          editingDependent ? (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleCancel}
                className="rounded-xl px-5"
              >
                Cancel
              </Button>
              <Button
                disabled={
                  Object.keys(validateDependent(editingDependent)).length > 0
                }
                onClick={async () => {
                  await handleSave(editingDependent);
                  setEditingId(null);
                }}
                className="rounded-xl bg-orange-500 hover:bg-orange-600 text-white shadow-lg px-5"
              >
                Save Dependent
              </Button>
            </div>
          ) : (
            <Button
              onClick={handleAdd}
              className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 rounded-xl px-5"
            >
              <Plus className="h-4 w-4" />
              Add Dependent
            </Button>
          )
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

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <User className="h-4 w-4 text-blue-600" />
          Dependents Details
        </h3>

        <div className="grid gap-4">
          {dependents.map((dependent) => (
            <div
              key={dependent.id}
              className="border border-slate-200 rounded-lg p-4 mb-6"
            >
              {editingId === dependent.id ? (
                <div className="p-4 bg-gradient-to-br from-white to-slate-50">
                  <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Users className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 mb-1">
                          Dependent Information
                        </h4>
                        <p className="text-sm text-slate-600">
                          Please provide accurate information about the
                          employee's dependent. This information is used for
                          benefits, insurance, and emergency contact purposes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-4 shadow-sm border border-slate-100 mb-4">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                      Personal Information
                    </h3>

                    <FormRow columns={4}>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          First Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={dependent.firstName}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              firstName: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter first name"
                        />
                        {validateDependent(dependent).firstName && (
                          <p className="text-xs text-red-500">
                            {validateDependent(dependent).firstName}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Middle Name
                        </Label>
                        <Input
                          value={dependent.middleName}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              middleName: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter middle name"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Last Name <span className="text-red-500">*</span>
                        </Label>
                        <Input
                          value={dependent.lastName}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              lastName: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter last name"
                        />
                        {validateDependent(dependent).lastName && (
                          <p className="text-xs text-red-500">
                            {validateDependent(dependent).lastName}
                          </p>
                        )}
                      </div>
                    </FormRow>

                    <FormRow columns={3}>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Gender <span className="text-red-500">*</span>
                        </Label>
                        <select
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          value={dependent.gender ?? ""}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              gender: (e.target.value as Gender) || undefined,
                            })
                          }
                        >
                          <option value="">Select Gender</option>
                          {GENDERS.map((g) => (
                            <option key={g} value={g}>
                              {g}
                            </option>
                          ))}
                        </select>
                        {validateDependent(dependent).gender && (
                          <p className="text-xs text-red-500">
                            {validateDependent(dependent).gender}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Date of Birth
                        </Label>
                        <Input
                          type="date"
                          value={dependent.dob}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              dob: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                        />
                        {dependent.dob &&
                          calculateAge(dependent.dob) !== null && (
                            <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
                              Age: {calculateAge(dependent.dob)} years old
                            </div>
                          )}
                        {validateDependent(dependent).dob && (
                          <p className="text-xs text-red-500">
                            {validateDependent(dependent).dob}
                          </p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Relationship <span className="text-red-500">*</span>
                        </Label>
                        <select
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          value={dependent.relationship ?? ""}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              relationship:
                                ((e.target.value ||
                                  undefined) as (typeof RELATIONSHIPS)[number]["value"]) ||
                                undefined,
                            })
                          }
                        >
                          <option value="">Select Relationship</option>
                          {RELATIONSHIPS.map((r) => (
                            <option key={r.value} value={r.value}>
                              {r.label}
                            </option>
                          ))}
                        </select>
                        {validateDependent(dependent).relationship && (
                          <p className="text-xs text-red-500">
                            {validateDependent(dependent).relationship}
                          </p>
                        )}
                      </div>
                    </FormRow>
                  </div>

                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 shadow-sm border border-blue-100 mb-6">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      Identification
                    </h3>

                    <FormRow columns={3}>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          National ID
                        </Label>
                        <Input
                          value={dependent.nationalId}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              nationalId: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter national ID number"
                        />
                        <p className="text-xs text-slate-500">
                          Passport number, SSN, or other ID
                        </p>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Nationality
                        </Label>
                        <CountrySelect
                          value={dependent.nationality}
                          onChange={(v) =>
                            updateDependent(dependent.id, { nationality: v })
                          }
                          placeholder="Select country..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Marital Status
                        </Label>
                        <select
                          className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
                          value={dependent.maritalStatus ?? ""}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              maritalStatus:
                                (e.target.value as MaritalStatus) || undefined,
                            })
                          }
                        >
                          <option value="">Select Status</option>
                          {MARITALS.map((m) => (
                            <option key={m} value={m}>
                              {m}
                            </option>
                          ))}
                        </select>
                      </div>
                    </FormRow>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 shadow-sm border border-cyan-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4">
                      Contact Information
                    </h3>

                    <FormRow columns={3}>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Phone Number <span className="text-red-500">*</span>
                        </Label>
                        <PhoneInput
                          value={dependent.phoneNo ?? ""}
                          onChange={(v) =>
                            updateDependent(dependent.id, {
                              phoneNo: v,
                            })
                          }
                          invalid={
                            !!dependent.phoneNo &&
                            !validatePhone(dependent.phoneNo, { required: true })
                              .valid
                          }
                          placeholder="Phone number"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Address Line 1
                        </Label>
                        <Input
                          value={dependent.address}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              address: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter address line 1"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Address Line 2
                        </Label>
                        <Input
                          value={dependent.address2}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              address2: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter address line 2 (optional)"
                        />
                      </div>
                    </FormRow>

                    <FormRow columns={4}>
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          City
                        </Label>
                        <Input
                          value={dependent.city}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              city: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter city"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          State/Province
                        </Label>
                        <Input
                          value={dependent.state}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              state: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter state/province"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Postal Code{" "}
                          <span className="text-slate-400 text-xs font-normal">
                            (optional)
                          </span>
                        </Label>
                        <Input
                          value={dependent.postalCode}
                          onChange={(e) =>
                            updateDependent(dependent.id, {
                              postalCode: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                          placeholder="Enter postal code"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-slate-700">
                          Country
                        </Label>
                        <CountrySelect
                          value={dependent.country}
                          onChange={(v) =>
                            updateDependent(dependent.id, { country: v })
                          }
                          placeholder="Select country..."
                        />
                      </div>
                    </FormRow>
                  </div>

                </div>
              ) : (
                <div className="p-4">
                  {/* Summary View */}
                  {viewingId !== dependent.id && (
                    <div className="relative">
                      <div className="pr-52">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-slate-800">
                            {dependent.firstName} {dependent.middleName}{" "}
                            {dependent.lastName}
                          </h3>
                          {dependent.relationship && (
                            <span
                              className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRelationshipColor(dependent.relationship)}`}
                            >
                              {dependent.relationship}
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-slate-600 mb-1">
                              Gender
                            </p>
                            <p className="text-sm font-semibold text-blue-700">
                              {dependent.gender || "N/A"}
                            </p>
                          </div>
                          {dependent.dob && (
                            <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                              <p className="text-xs text-slate-600 mb-1">Age</p>
                              <p className="text-sm font-semibold text-emerald-700">
                                {calculateAge(dependent.dob)} years
                              </p>
                            </div>
                          )}
                          {dependent.nationality && (
                            <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                              <p className="text-xs text-slate-600 mb-1">
                                Nationality
                              </p>
                              <p className="text-sm font-semibold text-violet-700">
                                {dependent.nationality}
                              </p>
                            </div>
                          )}
                          {dependent.maritalStatus && (
                            <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                              <p className="text-xs text-slate-600 mb-1">
                                Status
                              </p>
                              <p className="text-sm font-semibold text-amber-700">
                                {dependent.maritalStatus}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="absolute top-0 right-0 flex gap-2 w-48">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingId(dependent.id)}
                          className="flex items-center gap-1 rounded-lg flex-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-lg flex-1"
                          onClick={() => setEditingId(dependent.id)}
                        >
                          Edit
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(dependent.id)}
                          className="text-red-600 rounded-lg flex-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </Button>
                      </div>
                    </div>
                  )}

                  {viewingId === dependent.id && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-2xl font-bold text-slate-800">
                          {dependent.firstName} {dependent.middleName}{" "}
                          {dependent.lastName}
                        </h3>
                        {dependent.relationship && (
                          <span
                            className={`px-4 py-2 rounded-full text-sm font-semibold border ${getRelationshipColor(dependent.relationship)}`}
                          >
                            {dependent.relationship}
                          </span>
                        )}
                      </div>

                      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                        <ViewField
                          icon={<User className="h-4 w-4" />}
                          label="Gender"
                          value={dependent.gender || "—"}
                        />
                        <ViewField
                          icon={<Calendar className="h-4 w-4" />}
                          label="Date of Birth"
                          value={formatDMY(dependent.dob)}
                        />
                        <ViewField
                          icon={
                            getCountryByName(dependent.nationality)?.iso2 ? (
                              <CountryFlag
                                iso2={
                                  getCountryByName(dependent.nationality)?.iso2
                                }
                                className="text-base leading-none"
                              />
                            ) : (
                              <Globe className="h-4 w-4" />
                            )
                          }
                          label="Nationality"
                          value={dependent.nationality || "—"}
                        />
                      </div>

                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-4 border border-blue-100">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">
                          Personal Information
                        </h4>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                          <ViewField
                            icon={<User className="h-4 w-4" />}
                            label="First Name"
                            value={dependent.firstName || "—"}
                          />
                          <ViewField
                            icon={<User className="h-4 w-4" />}
                            label="Middle Name"
                            value={dependent.middleName || "—"}
                          />
                          <ViewField
                            icon={<User className="h-4 w-4" />}
                            label="Last Name"
                            value={dependent.lastName || "—"}
                          />
                          <ViewField
                            icon={<Heart className="h-4 w-4" />}
                            label="Marital Status"
                            value={dependent.maritalStatus || "—"}
                          />
                        </div>
                      </div>

                      {dependent.nationalId && (
                        <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">
                            Identification
                          </h4>
                          <ViewField
                            icon={<ShieldCheck className="h-4 w-4" />}
                            label="National ID"
                            value={dependent.nationalId}
                            mono
                          />
                        </div>
                      )}

                      {(dependent.phoneNo ||
                        dependent.address ||
                        dependent.city ||
                        dependent.state ||
                        dependent.postalCode ||
                        dependent.country) && (
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">
                            Contact Information
                          </h4>
                          {dependent.phoneNo && (
                            <ViewField
                              icon={<Phone className="h-4 w-4" />}
                              label="Phone Number"
                              value={dependent.phoneNo}
                              mono
                            />
                          )}
                          {dependent.address && (
                            <ViewField
                              icon={<MapPin className="h-4 w-4" />}
                              label="Address Line 1"
                              value={dependent.address}
                            />
                          )}
                          {dependent.address2 && (
                            <ViewField
                              icon={<MapPin className="h-4 w-4" />}
                              label="Address Line 2"
                              value={dependent.address2}
                            />
                          )}
                          {dependent.city && (
                            <ViewField
                              icon={<MapPin className="h-4 w-4" />}
                              label="City"
                              value={dependent.city}
                            />
                          )}
                          {dependent.state && (
                            <ViewField
                              icon={<MapPin className="h-4 w-4" />}
                              label="State/Province"
                              value={dependent.state}
                            />
                          )}
                          {dependent.postalCode && (
                            <ViewField
                              icon={<MapPin className="h-4 w-4" />}
                              label="Postal Code"
                              value={dependent.postalCode}
                            />
                          )}
                          {dependent.country && (
                            <ViewField
                              icon={
                                getCountryByName(dependent.country)?.iso2 ? (
                                  <CountryFlag
                                    iso2={
                                      getCountryByName(dependent.country)?.iso2
                                    }
                                    className="text-base leading-none"
                                  />
                                ) : (
                                  <Globe className="h-4 w-4" />
                                )
                              }
                              label="Country"
                              value={dependent.country}
                            />
                          )}
                        </div>
                      )}

                      {dependent.dob &&
                        calculateAge(dependent.dob) !== null && (
                          <div className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2">
                              Age Information
                            </h4>
                            <p className="text-slate-700">
                              <span className="font-semibold">
                                {calculateAge(dependent.dob)} years old
                              </span>{" "}
                              (Born:{" "}
                              {new Date(dependent.dob).toLocaleDateString()})
                            </p>
                          </div>
                        )}

                      <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setViewingId(null)}
                          className="rounded-lg border-slate-300"
                        >
                          Close
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setViewingId(null);
                            setEditingId(dependent.id);
                          }}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg"
                        >
                          Edit Dependent
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>

        {dependents.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No dependents added yet
            </h3>
            <p className="text-slate-600 mb-6">
              Click "Add Dependent" to create your first employee dependent
            </p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg rounded-xl px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Dependent
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
