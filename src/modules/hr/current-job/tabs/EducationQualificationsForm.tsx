import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Eye, GraduationCap, School, Award, FileText } from "lucide-react";
import { generateId } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { educationService } from "@/service/educationService";

/* ================= TYPES ================= */

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

interface ValidationErrors {
  [key: string]: string | undefined;
}

/* ================= VALIDATION ================= */

function validateEducation(e: Education): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!e.schoolName?.trim()) errors.schoolName = "School name is required";
  if (!e.degreeEarned?.trim()) errors.degreeEarned = "Degree earned is required";
  if (!e.yearGraduated?.trim()) errors.yearGraduated = "Year graduated is required";
  return errors;
}

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

/* ================= COMPONENT ================= */

export default function EducationQualificationsForm() {
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [educations, setEducations] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  /* ================= API ================= */

  async function listEducations(empId: number) {
    return educationService.getAll(empId);
  }

  async function createEducation(empId: number, body: any) {
    return educationService.create(empId, body);
  }

  async function updateEducation(empId: number, eduId: number, body: any) {
    return educationService.update(empId, eduId, body);
  }

  async function deleteEducationApi(empId: number, eduId: number) {
    return educationService.remove(empId, eduId);
  }

  /* ================= MAPPERS ================= */

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

  /* ================= LOAD ================= */

  useEffect(() => {
    if (!employeeId) return;
    let mounted = true;

    (async () => {
      try {
        const data = await listEducations(employeeId);
        if (!mounted) return;
        setEducations((data || []).map(mapApiToForm));
      } catch (err: any) {
        toast.error("Failed to load educations");
      }
    })();

    return () => {
      mounted = false;
    };
  }, [employeeId]);

  /* ================= HANDLERS ================= */

  const handleAdd = useCallback(() => {
    const edu = { ...INITIAL_EDUCATION, id: generateId() };
    setEducations((c) => [...c, edu]);
    setEditingId(edu.id);
  }, []);

  const handleEdit = (edu: Education) => setEditingId(edu.id);

  const handleLocalChange = (id: string, patch: Partial<Education>) => {
    setEducations((c) =>
      c.map((e) => (e.id === id ? { ...e, ...patch } : e))
    );
  };

  const handleSave = async (edu: Education) => {
    if (!employeeId) return;

    const errors = validateEducation(edu);
    if (Object.values(errors).some(Boolean)) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const body = mapFormToApi(edu);

      if (Number(edu.id)) {
        await updateEducation(employeeId, Number(edu.id), body);
        toast.success("Education updated");
      } else {
        await createEducation(employeeId, body);
        toast.success("Education created");
      }

      const refreshed = await listEducations(employeeId);
      setEducations((refreshed || []).map(mapApiToForm));
      setEditingId(null);
    } catch {
      toast.error("Failed to save education");
    }
  };

  const handleCancel = () => {
    setEducations((c) =>
      c.filter(
        (e) =>
          e.id !== editingId ||
          e.schoolName ||
          e.degreeEarned ||
          e.yearGraduated
      )
    );
    setEditingId(null);
  };

  const handleDelete = async (eduId: string) => {
    if (!employeeId) return;
    if (!confirm("Delete this education record?")) return;

    try {
      if (Number(eduId)) await deleteEducationApi(employeeId, Number(eduId));
      setEducations((c) => c.filter((e) => e.id !== eduId));
      toast.success("Education deleted");
    } catch {
      toast.error("Failed to delete education");
    }
  };

  const calculateYearsAgo = (yearGraduated: string) => {
    if (!yearGraduated) return null;
    const currentYear = new Date().getFullYear();
    const yearsAgo = currentYear - Number(yearGraduated);
    
    if (yearsAgo < 0) {
      return `Expected in ${Math.abs(yearsAgo)} year${Math.abs(yearsAgo) > 1 ? 's' : ''}`;
    } else if (yearsAgo === 0) {
      return 'Graduated this year';
    } else {
      return `${yearsAgo} year${yearsAgo > 1 ? 's' : ''} ago`;
    }
  };

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6 p-6 bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl">
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              Education & Qualifications
            </h2>
            <p className="text-sm text-slate-500 mt-1">Manage educational background</p>
          </div>
          <Button
            onClick={handleAdd}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2 px-6 py-3 rounded-xl"
          >
            <Plus className="h-5 w-5" />
            Add Education
          </Button>
        </div>
      </div>

      {/* Education Details Section */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <School className="h-4 w-4 text-blue-600" />
          Education Details
        </h3>

        {/* EDUCATIONS */}
        {educations.map((edu) => {
          const errors = validateEducation(edu);
          const editing = editingId === edu.id;
          const viewing = viewingId === edu.id;
          const yearsAgoText = calculateYearsAgo(edu.yearGraduated);

          return (
            <div key={edu.id} className="border border-slate-200 rounded-lg p-4 mb-4">

                {/* EDIT MODE */}
                {editing ? (
                  <div className="p-6 bg-gradient-to-br from-white to-slate-50">
                    
                    {/* Education Summary */}
                    {(edu.schoolName || edu.degreeEarned || edu.yearGraduated) && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-5 mb-6">
                        <div className="flex items-start gap-4">
                          <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl text-white shadow-lg">
                            <GraduationCap className="h-6 w-6" />
                          </div>
                          <div className="flex-1">
                            <h3 className="text-lg font-bold text-slate-800 mb-1">Education Record</h3>
                            <p className="text-sm text-slate-600">
                              {[edu.degreeEarned, edu.schoolName, edu.yearGraduated ? `(${edu.yearGraduated})` : ''].filter(Boolean).join(' - ') || 'Complete education information'}
                              {edu.awards && ' • Awards & Certifications included'}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* School Information Section */}
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200 flex items-center gap-2">
                        <School className="h-5 w-5 text-cyan-600" />
                        School Information
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <Field label="School Name" error={errors.schoolName} required>
                          <Input
                            value={edu.schoolName}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                schoolName: e.target.value,
                              })
                            }
                            placeholder="Enter school/university name"
                            className="rounded-lg border-slate-300"
                          />
                        </Field>

                        <Field label="Year Graduated" error={errors.yearGraduated} required>
                          <Input
                            value={edu.yearGraduated}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                yearGraduated: e.target.value,
                              })
                            }
                            placeholder="e.g., 2020"
                            className="rounded-lg border-slate-300"
                          />
                          {yearsAgoText && (
                            <div className="inline-block mt-2 px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
                              {yearsAgoText}
                            </div>
                          )}
                        </Field>

                        <Field label="School Address" containerClassName="md:col-span-2">
                          <Input
                            value={edu.schoolAddress}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                schoolAddress: e.target.value,
                              })
                            }
                            placeholder="Enter school address"
                            className="rounded-lg border-slate-300"
                          />
                        </Field>
                      </div>
                    </div>

                    {/* Academic Details Section */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 shadow-sm border border-blue-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-blue-200 flex items-center gap-2">
                        <GraduationCap className="h-5 w-5 text-blue-600" />
                        Academic Details
                      </h3>

                      <div className="grid md:grid-cols-2 gap-6">
                        <Field label="Degree Earned" error={errors.degreeEarned} required>
                          <Input
                            value={edu.degreeEarned}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                degreeEarned: e.target.value,
                              })
                            }
                            placeholder="e.g., Bachelor's, Master's"
                            className="rounded-lg border-slate-300 bg-white"
                          />
                        </Field>

                        <Field label="Major">
                          <Input
                            value={edu.major}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                major: e.target.value,
                              })
                            }
                            placeholder="e.g., Computer Science"
                            className="rounded-lg border-slate-300 bg-white"
                          />
                          <p className="text-xs text-slate-500 mt-1">Field of study or specialization</p>
                        </Field>
                      </div>
                    </div>

                    {/* Awards & Notes Section */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 shadow-sm border border-purple-100">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-purple-200 flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-600" />
                        Awards & Additional Information
                      </h3>

                      <div className="space-y-6">
                        <Field label="Awards and Certificates">
                          <Textarea
                            value={edu.awards}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                awards: e.target.value,
                              })
                            }
                            placeholder="List any honors, awards, certifications, or special achievements"
                            className="min-h-[80px] rounded-lg border-slate-300 bg-white"
                            maxLength={500}
                          />
                          <p className="text-xs text-slate-500 mt-2 text-right">
                            {edu.awards.length} / 500 characters
                          </p>
                        </Field>

                        <Field label="Notes / Remarks">
                          <Textarea
                            value={edu.notes}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                notes: e.target.value,
                              })
                            }
                            placeholder="Add any additional notes or relevant information"
                            className="min-h-[80px] rounded-lg border-slate-300 bg-white"
                            maxLength={1000}
                          />
                          <p className="text-xs text-slate-500 mt-2 text-right">
                            {edu.notes.length} / 1000 characters
                          </p>
                        </Field>
                      </div>
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
                        onClick={() => handleSave(edu)}
                        disabled={Object.values(errors).some(Boolean)}
                        className="px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg shadow-lg"
                      >
                        Save Education
                      </Button>
                    </div>
                  </div>
                ) : (
                  /* VIEW MODE */
                  <div className="p-6">
                    {!viewing ? (
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-xl font-bold text-slate-800">
                              {edu.schoolName || "Unnamed School"}
                            </h3>
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-gradient-to-br from-cyan-50 to-blue-50 p-3 rounded-lg border border-cyan-100">
                              <p className="text-xs text-slate-600 mb-1">Degree</p>
                              <p className="text-sm font-semibold text-cyan-700">{edu.degreeEarned || "No degree"}</p>
                            </div>
                            {edu.major && (
                              <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-3 rounded-lg border border-indigo-100">
                                <p className="text-xs text-slate-600 mb-1">Major</p>
                                <p className="text-sm font-semibold text-indigo-700">{edu.major}</p>
                              </div>
                            )}
                            {edu.yearGraduated && (
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                                <p className="text-xs text-slate-600 mb-1">Year</p>
                                <p className="text-sm font-semibold text-emerald-700">{edu.yearGraduated}</p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2 ml-4">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setViewingId(edu.id)}
                            className="hover:bg-blue-50 rounded-lg"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(edu)}
                            className="hover:bg-indigo-50 rounded-lg"
                          >
                            Edit
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(edu.id)}
                            className="hover:bg-red-50 text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-slate-800">{edu.schoolName || "Education Details"}</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <InfoCard icon={School} label="School" value={edu.schoolName || "—"} color="cyan" />
                          <InfoCard icon={GraduationCap} label="Degree" value={edu.degreeEarned || "—"} color="blue" />
                          <InfoCard icon={Award} label="Year" value={edu.yearGraduated || "—"} color="emerald" />
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">Academic Information</h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Detail label="Major" value={edu.major || "—"} />
                            <Detail label="School Address" value={edu.schoolAddress || "—"} />
                          </div>
                        </div>

                        {edu.awards && (
                          <div className="bg-purple-50 rounded-xl p-6 border border-purple-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <Award className="h-5 w-5 text-purple-600" />
                              Awards & Certificates
                            </h4>
                            <p className="text-slate-700 whitespace-pre-wrap">{edu.awards}</p>
                          </div>
                        )}

                        {edu.notes && (
                          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-amber-600" />
                              Notes / Remarks
                            </h4>
                            <p className="text-slate-700 whitespace-pre-wrap">{edu.notes}</p>
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
                              handleEdit(edu);
                            }}
                            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white rounded-lg"
                          >
                            Edit Education
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
            </div>
          );
        })}

        {educations.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-cyan-100 to-blue-100 rounded-full mb-4">
              <GraduationCap className="h-12 w-12 text-cyan-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">No education records added yet</h3>
            <p className="text-slate-600 mb-6">Click "Add Education" to create your first education record</p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white shadow-lg rounded-xl px-6"
            >
              <Plus className="h-5 w-5 mr-2" />
              Add Your First Education
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================= HELPERS ================= */

function Field({
  label,
  error,
  children,
  required,
  containerClassName = "",
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
  required?: boolean;
  containerClassName?: string;
}) {
  return (
    <div className={`space-y-2 ${containerClassName}`}>
      <Label className="text-sm font-medium text-slate-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
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

function InfoCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  const colorClasses = {
    cyan: 'from-cyan-500 to-blue-600',
    blue: 'from-blue-500 to-indigo-600',
    emerald: 'from-emerald-500 to-teal-600',
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