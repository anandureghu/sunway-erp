import { useCallback, useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Eye, Users, User, Calendar, Globe } from "lucide-react";
import { FormRow, } from "@/modules/hr/components/form-components";
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

const getRelationshipColor = (relationship: string) => {
  switch (relationship?.toLowerCase()) {
    case 'spouse': return 'bg-rose-50 text-rose-700 border-rose-200';
    case 'son':
    case 'daughter': return 'bg-blue-50 text-blue-700 border-blue-200';
    case 'father':
    case 'mother': return 'bg-purple-50 text-purple-700 border-purple-200';
    default: return 'bg-gray-50 text-gray-700 border-gray-200';
  }
};

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

  const calculateAge = (dob: string) => {
    if (!dob) return null;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age >= 0 ? age : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8 mb-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full opacity-20 blur-3xl -mr-32 -mt-32"></div>
          <div className="relative">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-slate-800 mb-2">Employee Dependents</h1>
                <p className="text-slate-600">Manage employee dependent information</p>
              </div>
              <Button
                onClick={handleAdd}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-6 py-3 rounded-xl"
              >
                <Plus className="h-5 w-5" />
                Add Dependent
              </Button>
            </div>
          </div>
        </div>

        {/* Dependents Grid */}
        <div className="grid gap-6">
          {dependents.map(dependent => (
            <Card key={dependent.id} className="border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden">
              <CardContent className="p-0">
                {editingId === dependent.id ? (
                  <div className="p-6 bg-gradient-to-br from-white to-slate-50">
                    {/* Info Banner */}
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Users className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-1">Dependent Information</h4>
                          <p className="text-sm text-slate-600">
                            Please provide accurate information about the employee's dependent. This information is used for benefits, insurance, and emergency contact purposes.
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Personal Information Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">Personal Information</h3>
                      
                      <FormRow columns={3}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            First Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={dependent.firstName}
                            onChange={e => updateDependent(dependent.id, { firstName: e.target.value })}
                            className="rounded-lg border-slate-300"
                            placeholder="Enter first name"
                          />
                          {validateDependent(dependent).firstName && (
                            <p className="text-xs text-red-500">{validateDependent(dependent).firstName}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Middle Name</Label>
                          <Input
                            value={dependent.middleName}
                            onChange={e => updateDependent(dependent.id, { middleName: e.target.value })}
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
                            onChange={e => updateDependent(dependent.id, { lastName: e.target.value })}
                            className="rounded-lg border-slate-300"
                            placeholder="Enter last name"
                          />
                          {validateDependent(dependent).lastName && (
                            <p className="text-xs text-red-500">{validateDependent(dependent).lastName}</p>
                          )}
                        </div>
                      </FormRow>

                      <FormRow columns={2}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Gender <span className="text-red-500">*</span>
                          </Label>
                          <select
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                          {validateDependent(dependent).gender && (
                            <p className="text-xs text-red-500">{validateDependent(dependent).gender}</p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Date of Birth</Label>
                          <Input
                            type="date"
                            value={dependent.dob}
                            onChange={e => updateDependent(dependent.id, { dob: e.target.value })}
                            className="rounded-lg border-slate-300"
                          />
                          {dependent.dob && calculateAge(dependent.dob) !== null && (
                            <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
                              Age: {calculateAge(dependent.dob)} years old
                            </div>
                          )}
                          {validateDependent(dependent).dob && (
                            <p className="text-xs text-red-500">{validateDependent(dependent).dob}</p>
                          )}
                        </div>
                      </FormRow>

                      <FormRow columns={1}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Relationship <span className="text-red-500">*</span>
                          </Label>
                          <select
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                          {validateDependent(dependent).relationship && (
                            <p className="text-xs text-red-500">{validateDependent(dependent).relationship}</p>
                          )}
                        </div>
                      </FormRow>
                    </div>

                    {/* Identification Section */}
                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 shadow-sm border border-blue-100">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">Identification</h3>
                      
                      <FormRow columns={2}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">National ID</Label>
                          <Input
                            value={dependent.nationalId}
                            onChange={e => updateDependent(dependent.id, { nationalId: e.target.value })}
                            className="rounded-lg border-slate-300"
                            placeholder="Enter national ID number"
                          />
                          <p className="text-xs text-slate-500">Passport number, SSN, or other ID</p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Nationality</Label>
                          <Input
                            value={dependent.nationality}
                            onChange={e => updateDependent(dependent.id, { nationality: e.target.value })}
                            className="rounded-lg border-slate-300"
                            placeholder="Enter nationality"
                          />
                        </div>
                      </FormRow>

                      <FormRow columns={1}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">Marital Status</Label>
                          <select
                            className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
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
                        </div>
                      </FormRow>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                      <Button 
                        variant="outline" 
                        onClick={handleCancel}
                        className="px-6 rounded-lg border-slate-300 hover:bg-slate-50"
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={Object.keys(validateDependent(dependent)).length > 0}
                        onClick={async () => {
                          await handleSave(dependent);
                          setEditingId(null);
                        }}
                        className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg shadow-lg"
                      >
                        Save Dependent
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    {/* Summary View */}
                    {viewingId !== dependent.id && (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-slate-800">
                              {dependent.firstName} {dependent.middleName} {dependent.lastName}
                            </h3>
                            {dependent.relationship && (
                              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getRelationshipColor(dependent.relationship)}`}>
                                {dependent.relationship}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                              <p className="text-xs text-slate-600 mb-1">Gender</p>
                              <p className="text-sm font-semibold text-blue-700">{dependent.gender || "N/A"}</p>
                            </div>
                            {dependent.dob && (
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                                <p className="text-xs text-slate-600 mb-1">Age</p>
                                <p className="text-sm font-semibold text-emerald-700">{calculateAge(dependent.dob)} years</p>
                              </div>
                            )}
                            {dependent.nationality && (
                              <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                                <p className="text-xs text-slate-600 mb-1">Nationality</p>
                                <p className="text-sm font-semibold text-violet-700">{dependent.nationality}</p>
                              </div>
                            )}
                            {dependent.maritalStatus && (
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                                <p className="text-xs text-slate-600 mb-1">Status</p>
                                <p className="text-sm font-semibold text-amber-700">{dependent.maritalStatus}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingId(dependent.id)}
                            className="flex items-center gap-1 hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(dependent)}
                            className="hover:bg-indigo-50 rounded-lg"
                          >
                            Edit
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleDelete(dependent.id)}
                            className="hover:bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Full Details View */}
                    {viewingId === dependent.id && (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-slate-800">
                            {dependent.firstName} {dependent.middleName} {dependent.lastName}
                          </h3>
                          {dependent.relationship && (
                            <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getRelationshipColor(dependent.relationship)}`}>
                              {dependent.relationship}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <InfoCard icon={User} label="Gender" value={dependent.gender || "—"} color="blue" />
                          <InfoCard icon={Calendar} label="Date of Birth" value={dependent.dob ? new Date(dependent.dob).toLocaleDateString() : "—"} color="emerald" />
                          <InfoCard icon={Globe} label="Nationality" value={dependent.nationality || "—"} color="violet" />
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">Personal Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem label="First Name" value={dependent.firstName || "—"} />
                            <DetailItem label="Middle Name" value={dependent.middleName || "—"} />
                            <DetailItem label="Last Name" value={dependent.lastName || "—"} />
                            <DetailItem label="Marital Status" value={dependent.maritalStatus || "—"} />
                          </div>
                        </div>

                        {dependent.nationalId && (
                          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4">Identification</h4>
                            <DetailItem label="National ID" value={dependent.nationalId} />
                          </div>
                        )}

                        {dependent.dob && calculateAge(dependent.dob) !== null && (
                          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2">Age Information</h4>
                            <p className="text-slate-700">
                              <span className="font-semibold">{calculateAge(dependent.dob)} years old</span> (Born: {new Date(dependent.dob).toLocaleDateString()})
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
                              handleEdit(dependent);
                            }}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-lg"
                          >
                            Edit Dependent
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
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <Users className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No dependents added yet</h3>
            <p className="text-slate-600 mb-6">Click "Add Dependent" to create your first employee dependent</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg rounded-xl px-6"
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

function InfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorClasses = {
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
    violet: 'from-violet-500 to-purple-600',
  };
  
  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} rounded-xl p-5 text-white shadow-lg`}>
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2 bg-white/20 rounded-lg">
          <Icon className="h-5 w-5" />
        </div>
        <span className="text-sm font-medium opacity-90">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">{label}</p>
      <p className="text-base text-slate-800 font-medium">{value}</p>
    </div>
  );
}