import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Eye } from "lucide-react";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";
import { generateId } from "@/lib/utils";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { useParams } from "react-router-dom";
import { toInputDate, toIsoDate } from "@/lib/date";

interface ValidationErrors {
  [key: string]: string | undefined;
}

function validateExperience(experience: Experience): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!experience.companyName?.trim()) {
    errors.companyName = "Company name is required";
  }
  
  if (!experience.jobTitle?.trim()) {
    errors.jobTitle = "Job title is required";
  }
  
  if (!experience.lastDateWorked) {
    errors.lastDateWorked = "Last date worked is required";
  }
  
  return errors;
}

type Experience = {
  id: string;
  companyName: string;
  jobTitle: string;
  lastDateWorked: string;
  numberOfYears: string;
  companyAddress: string;
  notes: string;
};

const INITIAL_EXPERIENCE: Experience = {
  id: "",
  companyName: "",
  jobTitle: "",
  lastDateWorked: "",
  numberOfYears: "",
  companyAddress: "",
  notes: "",
};

export default function PreviousExperiencesForm() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  
  async function listExperiences(employeeId: number) {
    const res = await apiClient.get(`/employees/${employeeId}/experiences`);
    return res.data;
  }

  async function createExperience(employeeId: number, body: any) {
    const res = await apiClient.post(`/employees/${employeeId}/experiences`, body);
    return res.data;
  }

  async function updateExperience(employeeId: number, id: number, body: any) {
    const res = await apiClient.put(`/employees/${employeeId}/experiences/${id}`, body);
    return res.data;
  }

  async function deleteExperienceApi(employeeId: number, id: number) {
    await apiClient.delete(`/employees/${employeeId}/experiences/${id}`);
  }

  
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

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    (async () => {
      try {
        const data = await listExperiences(employeeId);
        if (!mounted) return;
        setExperiences((data || []).map(mapApiToForm));
      } catch (err: any) {
        console.error("Failed to load experiences", err);
        toast.error(err?.response?.data?.message || "Failed to load experiences");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [employeeId]);

  const handleAdd = useCallback(() => {
    const newExperience = {
      ...INITIAL_EXPERIENCE,
      id: generateId(),
    };
    setExperiences((current) => [...current, newExperience]);
    setEditingId(newExperience.id);
  }, []);

  const handleEdit = useCallback((experience: Experience) => {
    setEditingId(experience.id);
  }, []);

  const handleLocalChange = useCallback((id: string, patch: Partial<Experience>) => {
    setExperiences((cur) => cur.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const handleSave = useCallback(
    async (experience: Experience) => {
      if (!employeeId) return;

      const errors = validateExperience(experience);
      const firstErr = Object.values(errors).find(Boolean);
      if (firstErr) {
        toast.error(String(firstErr));
        return;
      }

      try {
        const body = mapFormToApi(experience);
        if (experience.id && Number(experience.id)) {
          await updateExperience(employeeId, Number(experience.id), body);
          toast.success("Experience updated");
        } else {
          await createExperience(employeeId, body);
          toast.success("Experience created");
        }
        const refreshed = await listExperiences(employeeId);
        setExperiences((refreshed || []).map(mapApiToForm));
        setEditingId(null);
      } catch (err: any) {
        console.error("Failed to save experience", err);
        toast.error(err?.response?.data?.message || "Failed to save experience");
      }
    },
    [employeeId]
  );

  const handleCancel = useCallback(() => {
    setExperiences((current) =>
      current.filter((e) => {
        if (e.id !== editingId) return true;
        const isEmpty = !(e.companyName?.trim() || e.jobTitle?.trim() || e.lastDateWorked || e.numberOfYears || e.companyAddress || e.notes);
        return !isEmpty;
      })
    );
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback(
    async (idToDelete: string) => {
      if (!employeeId) return;
      if (!window.confirm("Are you sure you want to delete this experience?")) return;
      try {
        if (Number(idToDelete)) {
          await deleteExperienceApi(employeeId, Number(idToDelete));
        }
        setExperiences((current) => current.filter((e) => e.id !== idToDelete));
        toast.success("Experience deleted");
        setEditingId(null);
      } catch (err: any) {
        console.error("Failed to delete experience", err);
        toast.error(err?.response?.data?.message || "Failed to delete");
      }
    },
    [employeeId]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Previous Experiences</h2>
        <Button
          onClick={handleAdd}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Experience
        </Button>
      </div>

      <div className="grid gap-4">
        {experiences.map((experience) => (
          <Card key={experience.id}>
            <CardContent className="p-4">
              {editingId === experience.id ? (
                <FormSection title="Edit Experience">
                  <FormRow columns={2}>
                    <FormField 
                      label="Company Name"
                      required
                      error={validateExperience(experience).companyName}
                    >
                      <Input
                        value={experience.companyName}
                        onChange={e => handleLocalChange(experience.id, { companyName: e.target.value })}
                        placeholder="Enter company name"
                      />
                    </FormField>

                    <FormField 
                      label="Job Title"
                      required
                      error={validateExperience(experience).jobTitle}
                    >
                      <Input
                        value={experience.jobTitle}
                        onChange={e => handleLocalChange(experience.id, { jobTitle: e.target.value })}
                        placeholder="Enter job title"
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField 
                      label="Last Date Worked"
                      required
                      error={validateExperience(experience).lastDateWorked}
                    >
                      <Input
                        type="date"
                        value={experience.lastDateWorked}
                        onChange={e => handleLocalChange(experience.id, { lastDateWorked: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Number of Years">
                      <Input
                        value={experience.numberOfYears}
                        onChange={e => handleLocalChange(experience.id, { numberOfYears: e.target.value })}
                        placeholder="Enter years"
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={1}>
                    <FormField label="Company Address">
                      <Input
                        value={experience.companyAddress}
                        onChange={e => handleLocalChange(experience.id, { companyAddress: e.target.value })}
                        placeholder="Enter company address"
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={1}>
                    <FormField label="Notes/Remarks">
                      <Input
                        value={experience.notes}
                        onChange={e => handleLocalChange(experience.id, { notes: e.target.value })}
                        placeholder="Enter notes or remarks"
                      />
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
                      disabled={Object.keys(validateExperience(experience)).length > 0}
                      onClick={() => handleSave(experience)}
                    >
                      Save
                    </Button>
                  </div>
                </FormSection>
              ) : (
                <div className="space-y-4">
                  {/* Summary View */}
                  {viewingId !== experience.id && (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {experience.companyName || "Unnamed Company"}
                        </h3>
                        <div className="text-sm text-gray-500 mt-1">
                          <p>{experience.jobTitle || "No title"}</p>
                          {experience.lastDateWorked && (
                            <p>Worked until: {new Date(experience.lastDateWorked).toLocaleDateString()}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewingId(experience.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(experience)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(experience.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Full Details View */}
                  {viewingId === experience.id && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Company Name</p>
                          <p className="text-sm mt-1">{experience.companyName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Job Title</p>
                          <p className="text-sm mt-1">{experience.jobTitle || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Last Date Worked</p>
                          <p className="text-sm mt-1">
                            {experience.lastDateWorked ? new Date(experience.lastDateWorked).toLocaleDateString() : "—"}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Number of Years</p>
                          <p className="text-sm mt-1">{experience.numberOfYears || "—"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Company Address</p>
                        <p className="text-sm mt-1">{experience.companyAddress || "—"}</p>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Notes/Remarks</p>
                        <p className="text-sm mt-1">{experience.notes || "—"}</p>
                      </div>
                      <div className="flex justify-end gap-2 pt-4 border-t">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setViewingId(null)}
                        >
                          Close
                        </Button>
                        <Button 
                          size="sm"
                          onClick={() => {
                            setViewingId(null);
                            handleEdit(experience);
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
    </div>
  );
}
