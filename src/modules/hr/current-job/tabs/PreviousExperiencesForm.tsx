import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Trash2,
  Eye,
  Briefcase,
  Building,
  Calendar,
  Clock,
  FileText,
  MapPin,
} from "lucide-react";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { useParams } from "react-router-dom";
import { generateId } from "@/lib/utils";
import { toInputDate, toIsoDate } from "@/lib/date";
import { FormRow } from "@/modules/hr/components/form-components";
import { SummaryCard } from "@/modules/hr/components/summary-card";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";

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
  if (!exp.lastDateWorked)
    errors.lastDateWorked = "Last date worked is required";
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

/* ================= COMPONENT ================= */

export default function PreviousExperiencesForm() {
  const { confirm } = useConfirmDialog();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);

  /* ================= API ================= */

  const listExperiences = useCallback(async (empId: number) => {
    const res = await apiClient.get(`/employees/${empId}/experiences`);
    return res.data;
  }, []);

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
    let mounted = true;
    (async () => {
      try {
        const data = await listExperiences(employeeId);
        if (!mounted) return;
        setExperiences((data || []).map(mapApiToForm));
      } catch {
        toast.error("Failed to load experiences");
      }
    })();
    return () => {
      mounted = false;
    };
  }, [employeeId, listExperiences]);

  /* ================= HANDLERS ================= */

  const handleAdd = () => {
    const exp = { ...INITIAL_EXPERIENCE, id: generateId() };
    setExperiences((c) => [...c, exp]);
    setEditingId(exp.id);
  };

  const handleLocalChange = (id: string, patch: Partial<Experience>) => {
    setExperiences((c) => c.map((e) => (e.id === id ? { ...e, ...patch } : e)));
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
      c.filter((e) => {
        if (e.id !== editingId) return true;
        const isPersisted = Number(e.id);
        if (isPersisted) return true;
        const hasContent =
          e.companyName?.trim() ||
          e.jobTitle?.trim() ||
          e.lastDateWorked ||
          e.numberOfYears ||
          e.companyAddress?.trim() ||
          e.notes?.trim();
        return !!hasContent;
      }),
    );
    setEditingId(null);
  };

  const handleDelete = async (expId: string) => {
    if (!employeeId) return;
    if (!(await confirm("Delete this experience?"))) return;

    try {
      if (Number(expId)) await deleteExperienceApi(employeeId, Number(expId));
      setExperiences((c) => c.filter((e) => e.id !== expId));
      toast.success("Experience deleted");
    } catch {
      toast.error("Failed to delete experience");
    }
  };

  /* ================= SUMMARY METRICS ================= */

  const stats = useMemo(() => {
    const total = experiences.length;
    const totalYears = experiences.reduce(
      (sum, e) => sum + (Number(e.numberOfYears) || 0),
      0,
    );
    const uniqueCompanies = new Set(
      experiences.map((e) => e.companyName?.trim()).filter(Boolean),
    ).size;
    const latestDate = experiences
      .map((e) => e.lastDateWorked)
      .filter(Boolean)
      .sort()
      .pop();
    return { total, totalYears, uniqueCompanies, latestDate };
  }, [experiences]);

  /* ================= RENDER ================= */

  return (
    <div className="space-y-6 rounded-xl">
      <SecondaryPageHeader
        title="Previous Experiences"
        description="Manage previous employment history"
        icon={<Briefcase className="h-5 w-5 text-white" />}
        actions={
          <Button
            onClick={handleAdd}
            className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg flex items-center gap-2 rounded-xl px-5"
          >
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        }
      />

      {/* Summary metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <SummaryCard
          label="Total Experiences"
          value={stats.total}
          description="Records on file"
          icon={<Briefcase className="h-5 w-5" />}
          color="blue"
        />
        <SummaryCard
          label="Total Years"
          value={
            stats.totalYears > 0
              ? Number.isInteger(stats.totalYears)
                ? stats.totalYears
                : stats.totalYears.toFixed(1)
              : 0
          }
          description="Combined tenure"
          icon={<Clock className="h-5 w-5" />}
          color="emerald"
        />
        <SummaryCard
          label="Companies"
          value={stats.uniqueCompanies}
          description="Distinct employers"
          icon={<Building className="h-5 w-5" />}
          color="violet"
        />
        <SummaryCard
          label="Latest Date"
          value={
            stats.latestDate
              ? new Date(stats.latestDate).toLocaleDateString()
              : "—"
          }
          description="Most recent role"
          icon={<Calendar className="h-5 w-5" />}
          color="amber"
        />
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
          <Briefcase className="h-4 w-4 text-blue-600" />
          Experience Details
        </h3>

        <div className="grid gap-6">
          {experiences.map((exp) => {
            const errors = validateExperience(exp);
            const editing = editingId === exp.id;
            const viewing = viewingId === exp.id;

            return (
              <div
                key={exp.id}
                className="border border-slate-200 rounded-lg p-6 mb-6"
              >
                {editing ? (
                  <div className="p-6 bg-gradient-to-br from-white to-slate-50">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 mb-6">
                      <div className="flex items-start gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <Briefcase className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-800 mb-1">
                            Experience Information
                          </h4>
                          <p className="text-sm text-slate-600">
                            Capture the company, role, dates worked and any
                            additional context for this previous engagement.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 pb-3 border-b border-slate-200">
                        Employment Details
                      </h3>

                      <FormRow columns={2}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Company Name <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={exp.companyName}
                            onChange={(e) =>
                              handleLocalChange(exp.id, {
                                companyName: e.target.value,
                              })
                            }
                            className="rounded-lg border-slate-300"
                            placeholder="Enter company name"
                          />
                          {errors.companyName && (
                            <p className="text-xs text-red-500">
                              {errors.companyName}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Job Title <span className="text-red-500">*</span>
                          </Label>
                          <Input
                            value={exp.jobTitle}
                            onChange={(e) =>
                              handleLocalChange(exp.id, {
                                jobTitle: e.target.value,
                              })
                            }
                            className="rounded-lg border-slate-300"
                            placeholder="e.g., Senior Software Engineer"
                          />
                          {errors.jobTitle && (
                            <p className="text-xs text-red-500">
                              {errors.jobTitle}
                            </p>
                          )}
                        </div>
                      </FormRow>

                      <FormRow columns={2}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Last Date Worked{" "}
                            <span className="text-red-500">*</span>
                          </Label>
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
                          {errors.lastDateWorked && (
                            <p className="text-xs text-red-500">
                              {errors.lastDateWorked}
                            </p>
                          )}
                        </div>

                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Number of Years
                          </Label>
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
                            className="rounded-lg border-slate-300"
                            placeholder="Total years at this company"
                          />
                        </div>
                      </FormRow>
                    </div>

                    <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 shadow-sm border border-blue-100 mb-4">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4">
                        Company Location
                      </h3>

                      <FormRow columns={1}>
                        <div className="space-y-2">
                          <Label className="text-sm font-medium text-slate-700">
                            Company Address
                          </Label>
                          <Input
                            value={exp.companyAddress}
                            onChange={(e) =>
                              handleLocalChange(exp.id, {
                                companyAddress: e.target.value,
                              })
                            }
                            className="rounded-lg border-slate-300"
                            placeholder="Enter company address"
                          />
                        </div>
                      </FormRow>
                    </div>

                    <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-6 shadow-sm border border-cyan-100">
                      <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <FileText className="h-5 w-5 text-cyan-600" />
                        Notes / Remarks
                      </h3>
                      <Textarea
                        value={exp.notes}
                        onChange={(e) =>
                          handleLocalChange(exp.id, { notes: e.target.value })
                        }
                        placeholder="Add achievements, responsibilities, or context about this role"
                        className="min-h-[100px] rounded-lg border-slate-300 resize-none bg-white"
                        maxLength={1000}
                      />
                      <p className="text-xs text-slate-500 mt-2 text-right">
                        {exp.notes.length} / 1000 characters
                      </p>
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
                        onClick={() => handleSave(exp)}
                        className="px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg shadow-lg"
                      >
                        Save Experience
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6">
                    {viewing ? (
                      <div className="space-y-6">
                        <div className="flex items-center justify-between mb-6">
                          <h3 className="text-2xl font-bold text-slate-800">
                            {exp.companyName || "Unnamed Company"}
                          </h3>
                          {exp.jobTitle && (
                            <span className="px-4 py-2 rounded-full text-sm font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                              {exp.jobTitle}
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="bg-blue-50 p-5 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Briefcase className="h-5 w-5 text-blue-600" />
                              </div>
                              <span className="text-sm font-medium text-blue-700">
                                Job Title
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-blue-800">
                              {exp.jobTitle || "—"}
                            </p>
                          </div>
                          <div className="bg-emerald-50 p-5 rounded-lg border border-emerald-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-emerald-100 rounded-lg">
                                <Calendar className="h-5 w-5 text-emerald-600" />
                              </div>
                              <span className="text-sm font-medium text-emerald-700">
                                Last Date Worked
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-emerald-800">
                              {exp.lastDateWorked
                                ? new Date(
                                    exp.lastDateWorked,
                                  ).toLocaleDateString()
                                : "—"}
                            </p>
                          </div>
                          <div className="bg-violet-50 p-5 rounded-lg border border-violet-200">
                            <div className="flex items-center gap-3 mb-2">
                              <div className="p-2 bg-violet-100 rounded-lg">
                                <Clock className="h-5 w-5 text-violet-600" />
                              </div>
                              <span className="text-sm font-medium text-violet-700">
                                Duration
                              </span>
                            </div>
                            <p className="text-2xl font-bold text-violet-800">
                              {exp.numberOfYears
                                ? `${exp.numberOfYears} yrs`
                                : "—"}
                            </p>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-slate-50 to-blue-50 rounded-xl p-6 border border-blue-100">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4">
                            Employment Information
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem
                              label="Company"
                              value={exp.companyName || "—"}
                            />
                            <DetailItem
                              label="Job Title"
                              value={exp.jobTitle || "—"}
                            />
                            <DetailItem
                              label="Last Date Worked"
                              value={
                                exp.lastDateWorked
                                  ? new Date(
                                      exp.lastDateWorked,
                                    ).toLocaleDateString()
                                  : "—"
                              }
                            />
                            <DetailItem
                              label="Years"
                              value={exp.numberOfYears || "—"}
                            />
                          </div>
                        </div>

                        {exp.companyAddress && (
                          <div className="bg-indigo-50 rounded-xl p-6 border border-indigo-200">
                            <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                              <MapPin className="h-5 w-5 text-indigo-600" />
                              Company Address
                            </h4>
                            <p className="text-slate-700">
                              {exp.companyAddress}
                            </p>
                          </div>
                        )}

                        {exp.notes && (
                          <div className="bg-amber-50 rounded-xl p-6 border border-amber-100">
                            <h4 className="text-lg font-semibold text-slate-800 mb-2 flex items-center gap-2">
                              <FileText className="h-5 w-5 text-amber-600" />
                              Notes / Remarks
                            </h4>
                            <p className="text-slate-700 whitespace-pre-wrap">
                              {exp.notes}
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
                              {exp.companyName || "Unnamed Company"}
                            </h3>
                            {exp.jobTitle && (
                              <span className="px-3 py-1 rounded-full text-xs font-semibold border bg-blue-50 text-blue-700 border-blue-200">
                                {exp.jobTitle}
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-100">
                              <p className="text-xs text-slate-600 mb-1">
                                Job Title
                              </p>
                              <p className="text-sm font-semibold text-blue-700">
                                {exp.jobTitle || "—"}
                              </p>
                            </div>
                            {exp.lastDateWorked && (
                              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 p-3 rounded-lg border border-emerald-100">
                                <p className="text-xs text-slate-600 mb-1">
                                  Last Date
                                </p>
                                <p className="text-sm font-semibold text-emerald-700">
                                  {new Date(
                                    exp.lastDateWorked,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                            )}
                            {exp.numberOfYears && (
                              <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-3 rounded-lg border border-violet-100">
                                <p className="text-xs text-slate-600 mb-1">
                                  Duration
                                </p>
                                <p className="text-sm font-semibold text-violet-700">
                                  {exp.numberOfYears} yrs
                                </p>
                              </div>
                            )}
                            {exp.companyAddress && (
                              <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-3 rounded-lg border border-amber-100">
                                <p className="text-xs text-slate-600 mb-1">
                                  Location
                                </p>
                                <p className="text-sm font-semibold text-amber-700 truncate">
                                  {exp.companyAddress}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="absolute top-0 right-0 flex gap-2 w-32">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setViewingId(exp.id)}
                            className="flex items-center gap-1 rounded-lg flex-1"
                          >
                            <Eye className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(exp.id)}
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

        {experiences.length === 0 && (
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-16 text-center">
            <div className="inline-block p-4 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-4">
              <Briefcase className="h-12 w-12 text-blue-600" />
            </div>
            <h3 className="text-xl font-semibold text-slate-800 mb-2">
              No work experience added yet
            </h3>
            <p className="text-slate-600 mb-6">
              Click "Add Experience" to create your first work experience entry
            </p>
            <Button
              onClick={handleAdd}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg rounded-xl px-6"
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
