import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Eye,
  GraduationCap,
  School,
  Award,
  FileText,
  Calendar,
  MapPin,
  Sparkles,
} from "lucide-react";
import { generateId } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { educationService } from "@/service/educationService";
import { FormRow } from "@/modules/hr/components/form-components";
import { SummaryCard } from "@/modules/hr/components/summary-card";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

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
  if (!e.degreeEarned?.trim())
    errors.degreeEarned = "Degree earned is required";
  if (!e.yearGraduated?.trim())
    errors.yearGraduated = "Year graduated is required";
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
  const { confirm } = useConfirmDialog();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [educations, setEducations] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

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
        const data = await educationService.getAll(employeeId);
        if (!mounted) return;
        setEducations((data || []).map(mapApiToForm));
      } catch {
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

  const handleLocalChange = (id: string, patch: Partial<Education>) => {
    setEducations((c) => c.map((e) => (e.id === id ? { ...e, ...patch } : e)));
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
        await educationService.update(employeeId, Number(edu.id), body);
        toast.success("Education updated");
      } else {
        await educationService.create(employeeId, body);
        toast.success("Education created");
      }

      const refreshed = await educationService.getAll(employeeId);
      setEducations((refreshed || []).map(mapApiToForm));
      setEditingId(null);
    } catch {
      toast.error("Failed to save education");
    }
  };

  const handleCancel = () => {
    setEducations((c) =>
      c.filter((e) => {
        if (e.id !== editingId) return true;
        const isPersisted = Number(e.id);
        if (isPersisted) return true;
        const hasContent =
          e.schoolName?.trim() ||
          e.degreeEarned?.trim() ||
          e.yearGraduated?.trim() ||
          e.major?.trim() ||
          e.schoolAddress?.trim() ||
          e.awards?.trim() ||
          e.notes?.trim();
        return !!hasContent;
      }),
    );
    setEditingId(null);
  };

  const handleDelete = async (eduId: string) => {
    if (!employeeId) return;
    if (!(await confirm("Delete this education record?"))) return;

    try {
      if (Number(eduId))
        await educationService.remove(employeeId, Number(eduId));
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

    if (Number.isNaN(yearsAgo)) return null;
    if (yearsAgo < 0) {
      return `Expected in ${Math.abs(yearsAgo)} year${Math.abs(yearsAgo) > 1 ? "s" : ""}`;
    } else if (yearsAgo === 0) {
      return "Graduated this year";
    } else {
      return `${yearsAgo} year${yearsAgo > 1 ? "s" : ""} ago`;
    }
  };

  /* ================= SUMMARY METRICS ================= */

  const stats = useMemo(() => {
    const total = educations.length;
    const latestYear = educations
      .map((e) => Number(e.yearGraduated))
      .filter((n) => !Number.isNaN(n) && n > 0)
      .reduce<number | null>((max, y) => (max == null || y > max ? y : max), null);
    const uniqueDegrees = new Set(
      educations.map((e) => e.degreeEarned?.trim()).filter(Boolean),
    ).size;
    const withAwards = educations.filter((e) => e.awards?.trim()).length;
    return { total, latestYear, uniqueDegrees, withAwards };
  }, [educations]);

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6 rounded-xl">
      <SecondaryPageHeader
        title="Education & Qualifications"
        description="Manage educational background"
        icon={<GraduationCap className="h-5 w-5 text-white" />}
        actions={
          <Button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 rounded-xl px-5"
          >
            <Plus className="h-4 w-4" />
            Add Education
          </Button>
        }
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Records"
          value={stats.total}
          description="Educations on file"
          icon={<GraduationCap className="h-5 w-5" />}
          color="blue"
        />
        <SummaryCard
          label="Latest Year"
          value={stats.latestYear ?? "—"}
          description="Most recent graduation"
          icon={<Calendar className="h-5 w-5" />}
          color="emerald"
        />
        <SummaryCard
          label="Degrees"
          value={stats.uniqueDegrees}
          description="Distinct qualifications"
          icon={<School className="h-5 w-5" />}
          color="violet"
        />
        <SummaryCard
          label="With Awards"
          value={stats.withAwards}
          description="Records with honors"
          icon={<Award className="h-5 w-5" />}
          color="amber"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <GraduationCap className="h-4 w-4 text-blue-600" />
          Education Details
        </h3>

        <div className="grid gap-6">
          {educations.map((edu) => {
            const errors = validateEducation(edu);
            const editing = editingId === edu.id;
            const viewing = viewingId === edu.id;
            const yearsAgoText = calculateYearsAgo(edu.yearGraduated);

            return (
              <div
                key={edu.id}
                className="border border-slate-200 rounded-lg p-6 mb-6"
              >
                {editing ? (
                  <div className="p-6 bg-gradient-to-br from-white to-slate-50">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <GraduationCap className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-1">
                            Education Information
                          </h4>
                          <p className="text-sm text-slate-600">
                            Record the school, degree, year graduated, and any
                            additional honors for this qualification.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                        School Information
                      </h3>

                      <FormRow columns={2}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            School Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={edu.schoolName}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                schoolName: e.target.value,
                              })
                            }
                            className="rounded-lg border-slate-300"
                            placeholder="Enter school/university name"
                          />
                          {errors.schoolName && (
                            <p className="text-xs text-red-500">
                              {errors.schoolName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Year Graduated{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={edu.yearGraduated}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                yearGraduated: e.target.value,
                              })
                            }
                            className="rounded-lg border-slate-300"
                            placeholder="e.g., 2020"
                          />
                          {yearsAgoText && (
                            <div className="inline-block px-3 py-1 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-xs font-medium">
                              {yearsAgoText}
                            </div>
                          )}
                          {errors.yearGraduated && (
                            <p className="text-xs text-red-500">
                              {errors.yearGraduated}
                            </p>
                          )}
                        </div>
                      </FormRow>

                      <FormRow columns={1}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            School Address
                          </Label>
                          <Input
                            value={edu.schoolAddress}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                schoolAddress: e.target.value,
                              })
                            }
                            className="rounded-lg border-slate-300"
                            placeholder="Enter school address"
                          />
                        </div>
                      </FormRow>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 shadow-sm border border-blue-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Academic Details
                      </h3>

                      <FormRow columns={2}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Degree Earned{" "}
                            <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={edu.degreeEarned}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                degreeEarned: e.target.value,
                              })
                            }
                            className="rounded-lg border-slate-300"
                            placeholder="e.g., Bachelor's, Master's"
                          />
                          {errors.degreeEarned && (
                            <p className="text-xs text-red-500">
                              {errors.degreeEarned}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Major
                          </Label>
                          <Input
                            value={edu.major}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                major: e.target.value,
                              })
                            }
                            className="rounded-lg border-slate-300"
                            placeholder="e.g., Computer Science"
                          />
                        </div>
                      </FormRow>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 shadow-sm border border-cyan-100">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Award className="h-5 w-5 text-cyan-600" />
                        Awards & Additional Information
                      </h3>

                      <div className="space-y-6">
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Awards and Certificates
                          </Label>
                          <Textarea
                            value={edu.awards}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                awards: e.target.value,
                              })
                            }
                            placeholder="List any honors, awards, certifications, or special achievements"
                            className="min-h-[80px] rounded-lg border-slate-300 resize-none bg-white"
                            maxLength={500}
                          />
                          <p className="text-xs text-slate-500 text-right">
                            {edu.awards.length} / 500 characters
                          </p>
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Notes / Remarks
                          </Label>
                          <Textarea
                            value={edu.notes}
                            onChange={(e) =>
                              handleLocalChange(edu.id, {
                                notes: e.target.value,
                              })
                            }
                            placeholder="Add any additional notes or relevant information"
                            className="min-h-[80px] rounded-lg border-slate-300 resize-none bg-white"
                            maxLength={1000}
                          />
                          <p className="text-xs text-slate-500 text-right">
                            {edu.notes.length} / 1000 characters
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200">
                      <Button
                        variant="outline"
                        onClick={handleCancel}
                        className="px-6 rounded-lg border-slate-300"
                      >
                        Cancel
                      </Button>
                      <Button
                        disabled={Object.values(errors).some(Boolean)}
                        onClick={() => handleSave(edu)}
                        className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg"
                      >
                        Save Education
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    {viewing ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-slate-800">
                            {edu.schoolName || "Education Details"}
                          </h3>
                          {edu.degreeEarned && (
                            <span className="px-4 py-2 rounded-full text-sm font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                              {edu.degreeEarned}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <School className="h-5 w-5 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-blue-700">
                                School
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-blue-800">
                              {edu.schoolName || "—"}
                            </p>
                          </div>
                          <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <GraduationCap className="h-5 w-5 text-emerald-600" />
                              </div>
                              <span className="text-sm font-medium text-emerald-700">
                                Degree
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-800">
                              {edu.degreeEarned || "—"}
                            </p>
                          </div>
                          <div className="bg-violet-50 p-5 rounded-lg border border-violet-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-violet-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-violet-600" />
                              </div>
                              <span className="text-sm font-medium text-violet-700">
                                Year
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-violet-800">
                              {edu.yearGraduated || "—"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">
                            Academic Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem
                              label="Major"
                              value={edu.major || "—"}
                            />
                            <DetailItem
                              label="Degree"
                              value={edu.degreeEarned || "—"}
                            />
                            <DetailItem
                              label="Year Graduated"
                              value={edu.yearGraduated || "—"}
                            />
                            <DetailItem
                              label="School"
                              value={edu.schoolName || "—"}
                            />
                          </div>
                        </div>

                        {edu.schoolAddress && (
                          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-indigo-600" />
                              School Address
                            </h4>
                            <p className="text-slate-700">
                              {edu.schoolAddress}
                            </p>
                          </div>
                        )}

                        {edu.awards && (
                          <div className="bg-cyan-50 rounded-xl p-6 border border-cyan-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <Award className="h-5 w-5 text-cyan-600" />
                              Awards & Certificates
                            </h4>
                            <p className="text-slate-700 whitespace-pre-wrap">
                              {edu.awards}
                            </p>
                          </div>
                        )}

                        {edu.notes && (
                          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-amber-600" />
                              Notes / Remarks
                            </h4>
                            <p className="text-slate-700 whitespace-pre-wrap">
                              {edu.notes}
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
                        </div>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="pr-36">
                          <div className="flex items-center gap-3 mb-3">
                            <h3 className="text-xl font-bold text-slate-800">
                              {edu.schoolName || "Unnamed School"}
                            </h3>
                            {edu.degreeEarned && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                                {edu.degreeEarned}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                              <p className="text-xs text-slate-600 mb-1">
                                Degree
                              </p>
                              <p className="text-sm font-semibold text-blue-700">
                                {edu.degreeEarned || "—"}
                              </p>
                            </div>
                            {edu.major && (
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                                <p className="text-xs text-slate-600 mb-1">
                                  Major
                                </p>
                                <p className="text-sm font-semibold text-emerald-700">
                                  {edu.major}
                                </p>
                              </div>
                            )}
                            {edu.yearGraduated && (
                              <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                                <p className="text-xs text-slate-600 mb-1">
                                  Year
                                </p>
                                <p className="text-sm font-semibold text-violet-700">
                                  {edu.yearGraduated}
                                </p>
                              </div>
                            )}
                            {edu.awards && (
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                                <p className="text-xs text-slate-600 mb-1 flex items-center gap-1">
                                  <Sparkles className="h-3 w-3" />
                                  Awards
                                </p>
                                <p className="text-sm font-semibold text-amber-700 truncate">
                                  {edu.awards}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 flex gap-2 w-32">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingId(edu.id)}
                            className="flex items-center gap-1 rounded-lg flex-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(edu.id)}
                            className="text-red-600 rounded-lg flex-1"
                          >
                            <Trash2 className="h-4 w-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {educations.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <GraduationCap className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No education records added yet
            </h3>
            <p className="text-slate-600 mb-6">
              Click "Add Education" to create your first education record
            </p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg rounded-xl px-6"
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

function DetailItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold text-slate-600 uppercase mb-1">
        {label}
      </p>
      <p className="text-base text-slate-800 font-medium">{value}</p>
    </div>
  );
}
