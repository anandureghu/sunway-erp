import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Eye } from "lucide-react";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";
import { isValidDate } from "@/modules/hr/utils/validation";
import type { Dependent, Gender, MaritalStatus } from "@/types/hr";
import { useParams, useNavigate } from "react-router-dom";
import { dependentService } from "@/service/dependentService";
import { toast } from "sonner";

interface ValidationErrors {
  [key: string]: string | undefined;
}

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
  relationship: undefined
};

const GENDERS = ["Male", "Female", "Other"] as const;
const MARITALS = ["Single", "Married", "Divorced", "Widowed"] as const;
const RELATIONSHIPS = [
  { value: "Spouse", label: "Spouse" },
  { value: "Son", label: "Son" },
  { value: "Daughter", label: "Daughter" },
  { value: "Father", label: "Father" },
  { value: "Mother", label: "Mother" },
  { value: "Other", label: "Other" }
] as const;

function validateDependent(dependent: Dependent): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!dependent.firstName?.trim()) errors.firstName = "First name is required";
  if (!dependent.lastName?.trim()) errors.lastName = "Last name is required";
  if (!dependent.gender) errors.gender = "Gender is required";
  if (!dependent.relationship) errors.relationship = "Relationship is required";
  if (dependent.dob && !isValidDate(dependent.dob)) errors.dob = "Invalid date format";

  return errors;
}

export function DependentsForm() {
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
        }))
      );
    } catch (err: any) {
      console.error("DependentsForm -> failed to load dependents:", err?.response?.data ?? err);
      toast.error(dependentService.extractErrorMessage(err));
    }
  }, [empId]);

  useEffect(() => {
    reloadFromBackend();
  }, [reloadFromBackend]);

  const handleAdd = useCallback(() => {
    const newDependent = { ...INITIAL_DEPENDENT, id: "" };
    setDependents(current => [...current, newDependent]);
    setEditingId("");
  }, []);

  const handleEdit = useCallback((dependent: Dependent) => {
    setEditingId(dependent.id);
  }, []);

  const navigate = useNavigate();

  const handleSave = useCallback(
    async (dependent: Dependent) => {
      setDependents((current) => current.map((d) => (d.id === dependent.id ? dependent : d)));

      if (!empId) return;

      try {
        const payload = {
          firstName: dependent.firstName,
          middleName: dependent.middleName || undefined,
          lastName: dependent.lastName,
          dateOfBirth: dependent.dob
            ? new Date(dependent.dob).toISOString().slice(0, 10)
            : undefined,
          gender: dependent.gender,
          nationality: dependent.nationality || undefined,
          nationalId: dependent.nationalId || undefined,
          maritalStatus: dependent.maritalStatus || undefined,
          relationship: dependent.relationship,
        } as any;

        if (dependent.id) {
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
    [empId, reloadFromBackend, navigate]
  );

  const handleCancel = useCallback(() => {
    setDependents(current =>
      current.filter(d => {
        if (d.id !== editingId) return true;
        const isEmpty =
          !(d.firstName?.trim() ||
            d.lastName?.trim() ||
            d.relationship ||
            d.gender ||
            d.nationalId ||
            d.nationality ||
            d.dob);
        return !isEmpty;
      })
    );
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback(
    async (id: string) => {
      if (!window.confirm("Are you sure you want to delete this dependent?")) return;
      if (!empId) {
        return;
      }

      try {
        await dependentService.remove(empId, Number(id));
        toast.success("Dependent deleted");
        setEditingId(null);
        await reloadFromBackend();
      } catch (err: any) {
        console.error("DependentsForm -> delete failed:", err?.response?.data ?? err);
        toast.error(dependentService.extractErrorMessage(err));
      }
    },
    [empId, reloadFromBackend]
  );

    const updateDependent = useCallback((id: string, changes: Partial<Dependent>) => {
      setDependents((current) => current.map((d) => (d.id === id ? { ...d, ...changes } : d)));
    }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Employee Dependents</h2>
        <Button onClick={handleAdd} size="sm" className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Add Dependent
        </Button>
      </div>

      <div className="grid gap-4">
        {dependents.map(dependent => (
          <Card key={dependent.id}>
            <CardContent className="p-4">
              {editingId === dependent.id ? (
                <FormSection title="Add Dependent">
                  <FormRow columns={3}>
                    <FormField label="First Name" required error={validateDependent(dependent).firstName}>
                      <Input
                        value={dependent.firstName}
                        onChange={e => updateDependent(dependent.id, { firstName: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Middle Name">
                      <Input
                        value={dependent.middleName}
                        onChange={e => updateDependent(dependent.id, { middleName: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Last Name" required error={validateDependent(dependent).lastName}>
                      <Input
                        value={dependent.lastName}
                        onChange={e => updateDependent(dependent.id, { lastName: e.target.value })}
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField label="Date of Birth" error={validateDependent(dependent).dob}>
                      <Input
                        type="date"
                        value={dependent.dob}
                        onChange={e => updateDependent(dependent.id, { dob: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Gender" required error={validateDependent(dependent).gender}>
                      <select
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        value={dependent.gender ?? ""}
                        onChange={e => updateDependent(dependent.id, { gender: (e.target.value as Gender) || undefined })}
                      >
                        <option value="">Select Gender</option>
                        {GENDERS.map(g => (
                          <option key={g} value={g}>
                            {g}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField label="National ID">
                      <Input
                        value={dependent.nationalId}
                        onChange={e => updateDependent(dependent.id, { nationalId: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Nationality">
                      <Input
                        value={dependent.nationality}
                        onChange={e => updateDependent(dependent.id, { nationality: e.target.value })}
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField label="Marital Status">
                      <select
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        value={dependent.maritalStatus ?? ""}
                        onChange={e =>
                          updateDependent(dependent.id, {
                            maritalStatus: (e.target.value as MaritalStatus) || undefined
                          })
                        }
                      >
                        <option value="">Select Status</option>
                        {MARITALS.map(m => (
                          <option key={m} value={m}>
                            {m}
                          </option>
                        ))}
                      </select>
                    </FormField>

                    <FormField label="Relationship" required error={validateDependent(dependent).relationship}>
                      <select
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        value={dependent.relationship ?? ""}
                        onChange={e =>
                          updateDependent(dependent.id, {
                            relationship: ((e.target.value || undefined) as typeof RELATIONSHIPS[number]["value"]) ||
                              undefined
                          })
                        }
                      >
                        <option value="">Select Relationship</option>
                        {RELATIONSHIPS.map(r => (
                          <option key={r.value} value={r.value}>
                            {r.label}
                          </option>
                        ))}
                      </select>
                    </FormField>
                  </FormRow>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button
                      disabled={Object.keys(validateDependent(dependent)).length > 0}
                      onClick={async () => {
                        await handleSave(dependent);
                        setEditingId(null);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </FormSection>
              ) : (
                <div className="space-y-4">
                  {viewingId !== dependent.id && (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {dependent.firstName} {dependent.middleName} {dependent.lastName}
                        </h3>
                        <div className="text-sm text-gray-500 mt-1">
                          <p>
                            {dependent.relationship} • {dependent.gender}
                          </p>
                          {dependent.dob && <p>DOB: {new Date(dependent.dob).toLocaleDateString()}</p>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setViewingId(dependent.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(dependent)}>
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(dependent.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {viewingId === dependent.id && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">First Name</p>
                          <p className="text-sm mt-1">{dependent.firstName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Middle Name</p>
                          <p className="text-sm mt-1">{dependent.middleName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Last Name</p>
                          <p className="text-sm mt-1">{dependent.lastName || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Date of Birth</p>
                          <p className="text-sm mt-1">
                            {dependent.dob ? new Date(dependent.dob).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Gender</p>
                          <p className="text-sm mt-1">{dependent.gender || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">National ID</p>
                          <p className="text-sm mt-1">{dependent.nationalId || "—"}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Nationality</p>
                          <p className="text-sm mt-1">{dependent.nationality || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Marital Status</p>
                          <p className="text-sm mt-1">{dependent.maritalStatus || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Relationship</p>
                          <p className="text-sm mt-1">{dependent.relationship || "—"}</p>
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button variant="outline" size="sm" onClick={() => setViewingId(null)}>
                          Close
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            setViewingId(null);
                            handleEdit(dependent);
                          }}
                        >
                          Edit
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dependents.length === 0 && (
        <div className="text-center p-8 text-gray-500">No dependents added yet. Click "Add Dependent" to add one.</div>
      )}
    </div>
  );
}