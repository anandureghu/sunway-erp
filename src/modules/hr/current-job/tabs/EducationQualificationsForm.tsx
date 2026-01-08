import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Eye } from "lucide-react";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";
import { generateId } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { educationService } from "@/service/educationService";

interface ValidationErrors {
  [key: string]: string | undefined;
}

function validateEducation(education: Education): ValidationErrors {
  const errors: ValidationErrors = {};
  
  if (!education.schoolName?.trim()) {
    errors.schoolName = "School name is required";
  }
  
  if (!education.degreeEarned?.trim()) {
    errors.degreeEarned = "Degree earned is required";
  }
  
  if (!education.yearGraduated?.trim()) {
    errors.yearGraduated = "Year graduated is required";
  }
  
  return errors;
}

type Education = {
  id: string;
  schoolName: string;
  schoolAddress: string;
  yearGraduated: string;
  degreeEarned: string;
  major: string;
  awards: string;
  notes: string;
};

const INITIAL_EDUCATION: Education = {
  id: "",
  schoolName: "",
  schoolAddress: "",
  yearGraduated: "",
  degreeEarned: "",
  major: "",
  awards: "",
  notes: "",
};

export default function EducationQualificationsForm() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [educations, setEducations] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  async function listEducations(employeeId: number) {
    const res = await educationService.getAll(employeeId);
    return res;
  }

  async function createEducation(employeeId: number, body: any) {
    const res = await educationService.create(employeeId, body);
    return res;
  }

  async function updateEducation(employeeId: number, educationId: number, body: any) {
    const res = await educationService.update(employeeId, educationId, body);
    return res;
  }

  async function deleteEducationApi(employeeId: number, educationId: number) {
    await educationService.remove(employeeId, educationId);
  }

  
  const mapApiToForm = (api: any): Education => ({
    id: String(api.id),
    schoolName: api.schoolName ?? "",
    schoolAddress: api.schoolAddress ?? "",
    yearGraduated: api.yearGraduated ? String(api.yearGraduated) : "",
    degreeEarned: api.degreeEarned ?? "",
    major: api.major ?? "",
    awards: api.awards ?? "",
    notes: api.notes ?? "",
  });

  const mapFormToApi = (form: Education) => ({
    schoolName: form.schoolName,
    schoolAddress: form.schoolAddress || undefined,
    degreeEarned: form.degreeEarned,
    major: form.major || undefined,
    yearGraduated: form.yearGraduated ? Number(form.yearGraduated) : null,
    awards: form.awards || undefined,
    notes: form.notes || undefined,
  });

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;
    (async () => {
      try {
        const data = await listEducations(employeeId);
        if (!mounted) return;
        setEducations((data || []).map(mapApiToForm));
      } catch (err: any) {
        console.error("Failed to load educations", err);
        toast.error(err?.response?.data?.message || "Failed to load educations");
      }
    })();
    return () => { mounted = false; };
  }, [employeeId]);

  const handleAdd = useCallback(() => {
    const newEducation = {
      ...INITIAL_EDUCATION,
      id: generateId()
    };
    setEducations(current => [...current, newEducation]);
    setEditingId(newEducation.id);
  }, []);

  const handleEdit = useCallback((education: Education) => {
    setEditingId(education.id);
  }, []);

  const handleLocalChange = useCallback((id: string, patch: Partial<Education>) => {
    setEducations((cur) => cur.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }, []);

  const handleSave = useCallback(
    async (education: Education) => {
      if (!employeeId) return;

      const errors = validateEducation(education);
      const firstErr = Object.values(errors).find(Boolean);
      if (firstErr) {
        toast.error(String(firstErr));
        return;
      }

      try {
        const body = mapFormToApi(education);
        if (education.id && Number(education.id)) {
          await updateEducation(employeeId, Number(education.id), body);
          toast.success("Education updated");
        } else {
          await createEducation(employeeId, body);
          toast.success("Education created");
        }
        const refreshed = await listEducations(employeeId);
        setEducations((refreshed || []).map(mapApiToForm));
        setEditingId(null);
      } catch (err: any) {
        console.error("Failed to save education", err);
        toast.error(err?.response?.data?.message || "Failed to save education");
      }
    },
    [employeeId]
  );


  const handleCancel = useCallback(() => {
    setEducations(current => current.filter(e => {
      if (e.id !== editingId) return true;
      const isEmpty = !(e.schoolName?.trim() || e.schoolAddress?.trim() || e.yearGraduated || e.degreeEarned || e.major || e.awards || e.notes);
      return !isEmpty;
    }));
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback(
    async (idToDelete: string) => {
      if (!employeeId) return;
      if (!window.confirm('Are you sure you want to delete this education record?')) return;
      try {
        if (Number(idToDelete)) {
          await deleteEducationApi(employeeId, Number(idToDelete));
        }
        setEducations((current) => current.filter((e) => e.id !== idToDelete));
        toast.success("Education deleted");
        setEditingId(null);
      } catch (err: any) {
        console.error("Failed to delete education", err);
        toast.error(err?.response?.data?.message || "Failed to delete education");
      }
    },
    [employeeId]
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Education & Qualifications</h2>
        <Button
          onClick={handleAdd}
          size="sm"
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Add Education
        </Button>
      </div>

      <div className="grid gap-4">
        {educations.map((education) => (
          <Card key={education.id}>
            <CardContent className="p-4">
              {editingId === education.id ? (
                <FormSection title="Edit Education">
                  <FormRow columns={2}>
                    <FormField 
                      label="School Name"
                      required
                      error={validateEducation(education).schoolName}
                    >
                      <Input
                        value={education.schoolName}
                        onChange={e => handleLocalChange(education.id, { schoolName: e.target.value })}
                        placeholder="Enter school name"
                      />
                    </FormField>

                    <FormField label="School Address">
                      <Input
                        value={education.schoolAddress}
                        onChange={e => handleLocalChange(education.id, { schoolAddress: e.target.value })}
                        placeholder="Enter school address"
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField 
                      label="Year Graduated"
                      required
                      error={validateEducation(education).yearGraduated}
                    >
                      <Input
                        value={education.yearGraduated}
                        onChange={e => handleLocalChange(education.id, { yearGraduated: e.target.value })}
                        placeholder="Enter year"
                      />
                    </FormField>

                    <FormField 
                      label="Degree Earned"
                      required
                      error={validateEducation(education).degreeEarned}
                    >
                      <Input
                        value={education.degreeEarned}
                        onChange={e => handleLocalChange(education.id, { degreeEarned: e.target.value })}
                        placeholder="Enter degree"
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={2}>
                    <FormField label="Major">
                      <Input
                        value={education.major}
                        onChange={e => handleLocalChange(education.id, { major: e.target.value })}
                        placeholder="Enter major"
                      />
                    </FormField>

                    <FormField label="Awards and Certificates">
                      <Input
                        value={education.awards}
                        onChange={e => handleLocalChange(education.id, { awards: e.target.value })}
                        placeholder="Enter awards"
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={1}>
                    <FormField label="Notes/Remarks">
                      <Input
                        value={education.notes}
                        onChange={e => handleLocalChange(education.id, { notes: e.target.value })}
                        placeholder="Enter notes"
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
                      disabled={Object.keys(validateEducation(education)).length > 0}
                      onClick={() => handleSave(education)}
                    >
                      Save
                    </Button>
                  </div>
                </FormSection>
              ) : (
                <div className="space-y-4">
                  {/* Summary View */}
                  {viewingId !== education.id && (
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-medium">
                          {education.schoolName || "Unnamed School"}
                        </h3>
                        <div className="text-sm text-gray-500 mt-1">
                          <p>{education.degreeEarned || "No degree"} in {education.major || "Unknown major"}</p>
                          {education.yearGraduated && (
                            <p>Graduated: {education.yearGraduated}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setViewingId(education.id)}
                          className="flex items-center gap-1"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleEdit(education)}
                        >
                          Edit
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => handleDelete(education.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Full Details View */}
                  {viewingId === education.id && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">School Name</p>
                          <p className="text-sm mt-1">{education.schoolName || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">School Address</p>
                          <p className="text-sm mt-1">{education.schoolAddress || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Year Graduated</p>
                          <p className="text-sm mt-1">{education.yearGraduated || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Degree Earned</p>
                          <p className="text-sm mt-1">{education.degreeEarned || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Major</p>
                          <p className="text-sm mt-1">{education.major || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-gray-600 uppercase">Awards & Certificates</p>
                          <p className="text-sm mt-1">{education.awards || "—"}</p>
                        </div>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-gray-600 uppercase">Notes/Remarks</p>
                        <p className="text-sm mt-1">{education.notes || "—"}</p>
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
                            handleEdit(education);
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
