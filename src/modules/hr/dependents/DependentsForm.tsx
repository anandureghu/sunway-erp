import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";
import { isValidDate } from "@/modules/hr/utils/validation";
import { generateId } from "@/lib/utils";
import type { Dependent, Gender, MaritalStatus } from "@/types/hr";

// Types
interface ValidationErrors {
  [key: string]: string | undefined;
}

// Constants
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

// Helper function
function validateDependent(dependent: Dependent): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!dependent.firstName?.trim()) {
    errors.firstName = "First name is required";
  }

  if (!dependent.lastName?.trim()) {
    errors.lastName = "Last name is required";
  }

  if (!dependent.gender) {
    errors.gender = "Gender is required";
  }

  if (!dependent.relationship) {
    errors.relationship = "Relationship is required";
  }

  if (dependent.dob && !isValidDate(dependent.dob)) {
    errors.dob = "Invalid date format";
  }

  return errors;
}

export function DependentsForm() {
  const [dependents, setDependents] = useState<Dependent[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    const newDependent = {
      ...INITIAL_DEPENDENT,
      id: generateId()
    };
    setDependents(current => [...current, newDependent]);
    setEditingId(newDependent.id);
  }, []);

  const handleEdit = useCallback((dependent: Dependent) => {
    setEditingId(dependent.id);
  }, []);

  const handleSave = useCallback((dependent: Dependent) => {
    setDependents(current => 
      current.map(d => d.id === dependent.id ? dependent : d)
    );
  }, []);

  const handleCancel = useCallback(() => {
    // If we're cancelling while adding a new dependent (empty fields), remove that placeholder
    setDependents(current => current.filter(d => {
      if (d.id !== editingId) return true;
      // if the dependent is essentially empty, drop it
      const isEmpty = !(d.firstName?.trim() || d.lastName?.trim() || d.relationship || d.gender || d.nationalId || d.nationality || d.dob);
      return !isEmpty;
    }));
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this dependent?')) {
      setDependents(current => current.filter(d => d.id !== id));
      setEditingId(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Employee Dependents</h2>
        <Button 
          onClick={handleAdd}
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Dependent
        </Button>
      </div>

      <div className="grid gap-4">
        {dependents.map((dependent) => (
          <Card key={dependent.id}>
            <CardContent className="p-4">
              {editingId === dependent.id ? (
                <FormSection title="Edit Dependent">
                  <FormRow columns={3}>
                    <FormField 
                      label="First Name"
                      required
                      error={validateDependent(dependent).firstName}
                    >
                      <Input
                        value={dependent.firstName}
                        onChange={e => handleSave({ ...dependent, firstName: e.target.value })}
                      />
                    </FormField>

                    <FormField 
                      label="Middle Name"
                    >
                      <Input
                        value={dependent.middleName}
                        onChange={e => handleSave({ ...dependent, middleName: e.target.value })}
                      />
                    </FormField>

                    <FormField 
                      label="Last Name"
                      required
                      error={validateDependent(dependent).lastName}
                    >
                      <Input
                        value={dependent.lastName}
                        onChange={e => handleSave({ ...dependent, lastName: e.target.value })}
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField 
                      label="Date of Birth"
                      error={validateDependent(dependent).dob}
                    >
                      <Input
                        type="date"
                        value={dependent.dob}
                        onChange={e => handleSave({ ...dependent, dob: e.target.value })}
                      />
                    </FormField>

                    <FormField 
                      label="Gender"
                      required
                      error={validateDependent(dependent).gender}
                    >
                      <select
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        value={dependent.gender ?? ""}
                        onChange={e => handleSave({ 
                          ...dependent, 
                          gender: e.target.value as Gender || undefined
                        })}
                      >
                        <option value="">Select Gender</option>
                        {GENDERS.map(g => (
                          <option key={g} value={g}>{g}</option>
                        ))}
                      </select>
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField 
                      label="National ID"
                    >
                      <Input
                        value={dependent.nationalId}
                        onChange={e => handleSave({ ...dependent, nationalId: e.target.value })}
                      />
                    </FormField>

                    <FormField 
                      label="Nationality"
                    >
                      <Input
                        value={dependent.nationality}
                        onChange={e => handleSave({ ...dependent, nationality: e.target.value })}
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField 
                      label="Marital Status"
                    >
                      <select
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        value={dependent.maritalStatus ?? ""}
                        onChange={e => handleSave({ 
                          ...dependent, 
                          maritalStatus: e.target.value as MaritalStatus || undefined
                        })}
                      >
                        <option value="">Select Status</option>
                        {MARITALS.map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </FormField>

                    <FormField 
                      label="Relationship"
                      required
                      error={validateDependent(dependent).relationship}
                    >
                      <select
                        className="h-9 w-full rounded-md border px-3 text-sm"
                        value={dependent.relationship ?? ""}
                        onChange={e => handleSave({ 
                          ...dependent, 
                          relationship: (e.target.value || undefined) as typeof RELATIONSHIPS[number]["value"] | undefined
                        })}
                      >
                        <option value="">Select Relationship</option>
                        {RELATIONSHIPS.map(r => (
                          <option key={r.value} value={r.value}>{r.label}</option>
                        ))}
                      </select>
                    </FormField>
                  </FormRow>

                  <div className="flex justify-end gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={handleCancel}
                    >
                      Cancel
                    </Button>
                    <Button 
                      disabled={Object.keys(validateDependent(dependent)).length > 0}
                      onClick={() => {
                        handleSave(dependent);
                        setEditingId(null);
                      }}
                    >
                      Save
                    </Button>
                  </div>
                </FormSection>
              ) : (
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-medium">
                      {dependent.firstName} {dependent.middleName} {dependent.lastName}
                    </h3>
                    <div className="text-sm text-gray-500 mt-1">
                      <p>{dependent.relationship} • {dependent.gender}</p>
                      {dependent.dob && (
                        <p>DOB: {new Date(dependent.dob).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(dependent)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(dependent.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {dependents.length === 0 && (
        <div className="text-center p-8 text-gray-500">
          No dependents added yet. Click "Add Dependent" to add one.
        </div>
      )}
    </div>
  );
}