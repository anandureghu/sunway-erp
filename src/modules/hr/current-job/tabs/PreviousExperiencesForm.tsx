import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Plus, Trash2, Eye } from "lucide-react";
import { FormRow, FormField, FormSection } from "@/modules/hr/components/form-components";
import { generateId } from "@/lib/utils";

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
  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  const handleAdd = useCallback(() => {
    const newExperience = {
      ...INITIAL_EXPERIENCE,
      id: generateId()
    };
    setExperiences(current => [...current, newExperience]);
    setEditingId(newExperience.id);
  }, []);

  const handleEdit = useCallback((experience: Experience) => {
    setEditingId(experience.id);
  }, []);

  const handleSave = useCallback((experience: Experience) => {
    setExperiences(current => 
      current.map(e => e.id === experience.id ? experience : e)
    );
  }, []);

  const handleDone = useCallback((experience: Experience) => {
    setExperiences(current => 
      current.map(e => e.id === experience.id ? experience : e)
    );
    setEditingId(null);
  }, []);

  const handleCancel = useCallback(() => {
    // If we're cancelling while adding a new experience (empty fields), remove that placeholder
    setExperiences(current => current.filter(e => {
      if (e.id !== editingId) return true;
      // if the experience is essentially empty, drop it
      const isEmpty = !(e.companyName?.trim() || e.jobTitle?.trim() || e.lastDateWorked || e.numberOfYears || e.companyAddress || e.notes);
      return !isEmpty;
    }));
    setEditingId(null);
  }, [editingId]);

  const handleDelete = useCallback((id: string) => {
    if (window.confirm('Are you sure you want to delete this experience?')) {
      setExperiences(current => current.filter(e => e.id !== id));
      setEditingId(null);
    }
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-semibold">Previous Experiences</h2>
        <Button 
          onClick={handleAdd}
          variant="outline"
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
                        onChange={e => handleSave({ ...experience, companyName: e.target.value })}
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
                        onChange={e => handleSave({ ...experience, jobTitle: e.target.value })}
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
                        onChange={e => handleSave({ ...experience, lastDateWorked: e.target.value })}
                      />
                    </FormField>

                    <FormField label="Number of Years">
                      <Input
                        value={experience.numberOfYears}
                        onChange={e => handleSave({ ...experience, numberOfYears: e.target.value })}
                        placeholder="Enter years"
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={1}>
                    <FormField label="Company Address">
                      <Input
                        value={experience.companyAddress}
                        onChange={e => handleSave({ ...experience, companyAddress: e.target.value })}
                        placeholder="Enter company address"
                      />
                    </FormField>
                  </FormRow>

                  <FormRow columns={1}>
                    <FormField label="Notes/Remarks">
                      <Input
                        value={experience.notes}
                        onChange={e => handleSave({ ...experience, notes: e.target.value })}
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
                      onClick={() => handleDone(experience)}
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
