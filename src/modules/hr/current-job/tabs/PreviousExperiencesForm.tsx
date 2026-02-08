import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";  
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, Briefcase, Building, FileText } from "lucide-react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { generateId } from "@/lib/utils";
import { toInputDate, toIsoDate } from "@/lib/date";

/* ================= TYPES ================= */

type Experience = {
  id: string;
  companyName: string;
  jobTitle: string;
  lastDateWorked: string;
  numberOfYears: string;
  companyAddress: string;
  notes: string;
};

interface ValidationErrors {
  [key: string]: string | undefined;
}

/* ================= VALIDATION ================= */

function validateExperience(exp: Experience): ValidationErrors {
  const errors: ValidationErrors = {};

  if (!exp.companyName?.trim()) errors.companyName = "Company name is required";
  if (!exp.jobTitle?.trim()) errors.jobTitle = "Job title is required";
  if (!exp.lastDateWorked) errors.lastDateWorked = "Last date worked is required";

  return errors;
}

const INITIAL_EXPERIENCE: Experience = {
  id: "",
  companyName: "",
  jobTitle: "",
  lastDateWorked: "",
  numberOfYears: "",
  companyAddress: "",
  notes: "",
};

/* ================= HELPERS ================= */

function Field({
  label,
  error,
  children,
  required,
  containerClassName = "",
  icon,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
  icon?: React.ReactElement;
}) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      <Label className="text-sm font-medium text-slate-700 flex items-center gap-2">
        {icon && <span className="text-slate-400">{icon}</span>}
        {label}
        {required && <span className="text-red-500">*</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}

function Detail({ label, value }: { label: string; value?: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">{label}</p>
      <p className="text-base text-slate-800 font-medium">{value || "—"}</p>
    </div>
  );
}

/* ================= COMPONENT ================= */

export default function PreviousExperiencesForm() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  /* ================= API ================= */

  async function listExperiences(empId: number) {
    const res = await apiClient.get(`/employees/${empId}/experiences`);
    return res.data;
  }

  async function createExperience(empId: number, body: any) {
    return apiClient.post(`/employees/${empId}/experiences`, body);
  }

  async function updateExperience(empId: number, expId: number, body: any) {
    return apiClient.put(`/employees/${empId}/experiences/${expId}`, body);
  }

  async function deleteExperienceApi(empId: number, expId: number) {
    return apiClient.delete(`/employees/${empId}/experiences/${expId}`);
  }

  /* ================= MAPPERS ================= */

  const mapApiToForm = (api: any): Experience => ({
    id: String(api.id),
    companyName: api.companyName ?? "",
    jobTitle: api.jobTitle ?? "",
    lastDateWorked: toInputDate(api.lastDateWorked),
    numberOfYears: api.numberOfYears?.toString() ?? "",
    companyAddress: api.companyAddress ?? "",
    notes: api.notes ?? "",
  });

  const mapFormToApi = (form: Experience) => ({
    companyName: form.companyName,
    jobTitle: form.jobTitle,
    lastDateWorked: toIsoDate(form.lastDateWorked),
    numberOfYears: form.numberOfYears ? Number(form.numberOfYears) : null,
    companyAddress: form.companyAddress,
    notes: form.notes,
  });

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!employeeId) return;

    (async () => {
      try {
        const data = await listExperiences(employeeId);
        setExperiences((data || []).map(mapApiToForm));
      } catch (err: any) {
        toast.error("Failed to load experiences");
      }
    })();
  }, [employeeId]);

  /* ================= HANDLERS ================= */

  const handleAdd = () => {
    const exp = { ...INITIAL_EXPERIENCE, id: generateId() };
    setExperiences((c) => [...c, exp]);
    setEditingId(exp.id);
  };

  const handleEdit = (exp: Experience) => setEditingId(exp.id);

  const handleLocalChange = (id: string, patch: Partial<Experience>) => {
    setExperiences((c) =>
      c.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const handleSave = async (exp: Experience) => {
    if (!employeeId) return;

    const errors = validateExperience(exp);
    if (Object.values(errors).some(Boolean)) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const body = mapFormToApi(exp);

      if (Number(exp.id)) {
        await updateExperience(employeeId, Number(exp.id), body);
        toast.success("Experience updated");
      } else {
        await createExperience(employeeId, body);
        toast.success("Experience created");
      }

      const refreshed = await listExperiences(employeeId);
      setExperiences((refreshed || []).map(mapApiToForm));
      setEditingId(null);
    } catch {
      toast.error("Failed to save experience");
    }
  };

  const handleCancel = () => {
    setExperiences((c) =>
      c.filter((e) =>
        e.id !== editingId ||
        Number(e.id) ||
        e.companyName ||
        e.jobTitle ||
        e.lastDateWorked
      )
    );
    setEditingId(null);
  };

  const handleDelete = async (expId: string) => {
    if (!employeeId) return;
    if (!confirm("Delete this experience?")) return;

    try {
      if (Number(expId)) await deleteExperienceApi(employeeId, Number(expId));
      setExperiences((c) => c.filter((e) => e.id !== expId));
      toast.success("Experience deleted");
    } catch {
      toast.error("Failed to delete experience");
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <Briefcase className="h-5 w-5 text-blue-600" />
              Work Experience
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage previous employment history</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-6 py-3 rounded-xl"
          >
            <Plus className="h-5 w-5" />
            Add Experience
          </Button>
        </div>
      </div>

      {/* Employment Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Building className="h-4 w-4 text-blue-600" />
          Employment Details
        </h3>

        {/* EXPERIENCES */}
        {experiences.map((exp) => {
          const errors = validateExperience(exp);
          const editing = editingId === exp.id;
          const viewing = viewingId === exp.id;

          return (
            <div key={exp.id} className="border border-slate-200 rounded-lg p-6 mb-6">
              {/* EDIT MODE */}
              {editing ? (
                <div className="space-y-6">
                  {/* Employment Details Section */}
                  <div className="bg-white rounded-lg p-6 shadow-sm border border-slate-100">
                    <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
                      <Building className="h-5 w-5 text-orange-600" />
                      Employment Details
                    </h3>

                    <div className="grid md:grid-cols-2 gap-6">
                      <Field label="Company Name" error={errors.companyName} required>
                        <Input
                          value={exp.companyName}
                          onChange={(e) =>
                            handleLocalChange(exp.id, {
                              companyName: e.target.value,
                            })
                          }
                          placeholder="Enter company name"
                          className="rounded-lg border-slate-300"
                        />
                      </Field>

                      <Field label="Job Title" error={errors.jobTitle} required>
                        <Input
                          value={exp.jobTitle}
                          onChange={(e) =>
                            handleLocalChange(exp.id, {
                              jobTitle: e.target.value,
                            })
                          }
                          placeholder="e.g., Senior Software Engineer"
                          className="rounded-lg border-slate-300"
                        />
                      </Field>

                      <Field label="Last Date Worked" error={errors.lastDateWorked} required>
                        <Input
                          type="date"
                          value={exp.lastDateWorked}
                          onChange={(e) =>
                            handleLocalChange(exp.id, {
                              lastDateWorked: e.target.value,
                            })
                          }
                          className="rounded-lg border-slate-300"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Date when employment ended (or current date if still employed)
                        </p>
                      </Field>

                      <Field label="Number of Years">
                        <Input
                          type="number"
                          step="0.1"
                          min="0"
                          value={exp.numberOfYears}
                          onChange={(e) =>
                            handleLocalChange(exp.id, {
                              numberOfYears: e.target.value,
                            })
                          }
                          placeholder="Enter number of years"
                          className="rounded-lg border-slate-300"
                        />
                        <p className="text-xs text-slate-500 mt-1">
                          Enter the total number of years worked at this company
                        </p>
                      </Field>

                      <Field label="Company Address" containerClassName="md:col-span-2">
                        <Input
                          value={exp.companyAddress}
                          onChange={(e) =>
                            handleLocalChange(exp.id, {
                              companyAddress: e.target.value,
                            })
                          }
                          placeholder="Enter company address"
                          className="rounded-lg border-slate-300"
                        />
                      </Field>
                    </div>
                  </div>

                  {/* Notes Section */}
                  <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg border border-slate-200 p-6">
                    <Field label="Notes / Remarks" icon={<FileText className="h-4 w-4" />}>
                      <Textarea
                        value={exp.notes}
                        onChange={(e) =>
                          handleLocalChange(exp.id, {
                            notes: e.target.value,
                          })
                        }
                        placeholder="Add any additional notes, achievements, or responsibilities"
                        className="min-h-[100px] rounded-lg border-slate-300 resize-none bg-white"
                        maxLength={1000}
                      />
                    </Field>
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
                      onClick={() => handleSave(exp)}
                      disabled={Object.values(errors).some(Boolean)}
                      className="px-6 bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg shadow-lg"
                    >
                      Save Experience
                    </Button>
                  </div>
                </div>
              ) : (
                /* VIEW MODE */
                <div className="space-y-6">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-xl font-bold text-slate-800">
                          {exp.companyName || "Unnamed Company"}
                        </h3>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-100">
                          <p className="text-xs text-slate-600 mb-1">Job Title</p>
                          <p className="text-sm font-semibold text-orange-700">{exp.jobTitle || "No title"}</p>
                        </div>
                        {exp.lastDateWorked && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                            <p className="text-xs text-slate-600 mb-1">Last Date</p>
                            <p className="text-sm font-semibold text-blue-700">
                              {new Date(exp.lastDateWorked).toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        {exp.numberOfYears && (
                          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                            <p className="text-xs text-slate-600 mb-1">Duration</p>
                            <p className="text-sm font-semibold text-emerald-700">{exp.numberOfYears} yrs</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setViewingId(exp.id)}
                        className="hover:bg-blue-50 rounded-lg"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleEdit(exp)}
                        className="hover:bg-indigo-50 rounded-lg"
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(exp.id)}
                        className="hover:bg-red-50 text-red-600 rounded-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                        Delete
                      </Button>
                    </div>
                  </div>

                  {viewing && (
                    <div className="space-y-6">
                      <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-lg p-6 border border-blue-100">
                        <h4 className="text-lg font-semibold text-slate-800 mb-4">Employment Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <Detail label="Last Date Worked" value={exp.lastDateWorked ? new Date(exp.lastDateWorked).toLocaleDateString() : "—"} />
                          <Detail label="Company Address" value={exp.companyAddress || "—"} />
                        </div>
                      </div>

                      {exp.notes && (
                        <div className="bg-amber-50 rounded-lg p-6 border border-amber-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-2">Notes / Remarks</h4>
                          <p className="text-slate-700 whitespace-pre-wrap">{exp.notes}</p>
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
                            handleEdit(exp);
                          }}
                          className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg"
                        >
                          Edit Experience
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}

        {experiences.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-16 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-orange-100 to-amber-100 rounded-full mb-4">
              <Briefcase className="h-12 w-12 text-orange-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No work experience added yet</h3>
            <p className="text-slate-600 mb-6">Click "Add Experience" to create your first work experience entry</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white rounded-lg px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Experience
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
