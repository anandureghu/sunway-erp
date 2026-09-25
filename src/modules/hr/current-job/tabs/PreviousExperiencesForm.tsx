import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
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
import {
  RecordActions,
  RecordAvatar,
  SectionCard,
  SectionHeading,
  ViewField,
  todayIso,
} from "@/modules/hr/components/profile-form-ui";
import {
  DFact,
  DFactGrid,
  DField,
  DHeaderTag,
  DHighlights,
  DInput,
  DTextarea,
  DialogSection,
  RecordFormDialog,
  RecordViewDialog,
} from "@/modules/hr/components/record-form-dialog";
import { SummaryCard } from "@/modules/hr/components/summary-card";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { formatDisplayDate } from "@/lib/format-date";

const formatViewDate = formatDisplayDate;

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
  else if (exp.lastDateWorked > todayIso())
    errors.lastDateWorked = "Last date worked cannot be in the future";
  if (exp.numberOfYears) {
    const years = Number(exp.numberOfYears);
    if (Number.isNaN(years) || years < 0 || years > 60)
      errors.numberOfYears = "Enter years between 0 and 60";
  }
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

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";

/* ================= COMPONENT ================= */

export default function PreviousExperiencesForm() {
  const { confirm } = useConfirmDialog();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [experiences, setExperiences] = useState<Experience[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  // Copy of a saved record taken when its edit starts, so Cancel can restore it.
  const [editSnapshot, setEditSnapshot] = useState<Experience | null>(null);
  // Field errors are shown only after the user tries to save (like Add Employee).
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setViewingId(null);
    setEditSnapshot(null);
    setEditingId(exp.id);
  };

  const handleLocalChange = (id: string, patch: Partial<Experience>) => {
    setExperiences((c) => c.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const handleSave = async (exp: Experience) => {
    if (!employeeId) return;

    const errors = validateExperience(exp);
    if (Object.values(errors).some(Boolean)) {
      toast.error("Please fix the highlighted fields");
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
      setEditSnapshot(null);
    } catch {
      toast.error("Failed to save experience");
    }
  };

  const handleStartEdit = (exp: Experience) => {
    setViewingId(null);
    setEditSnapshot({ ...exp });
    setEditingId(exp.id);
  };

  const handleCancel = () => {
    setExperiences((c) =>
      c
        // Cancelling the pop-up discards an unsaved new experience.
        .filter((e) => e.id !== editingId || !!Number(e.id))
        // Undo unsaved changes to an existing record.
        .map((e) =>
          editSnapshot && e.id === editSnapshot.id ? editSnapshot : e,
        ),
    );
    setEditSnapshot(null);
    setEditingId(null);
  };

  const handleDelete = async (expId: string) => {
    if (!employeeId) return;
    if (!(await confirm("Delete this experience?"))) return;

    try {
      if (Number(expId)) await deleteExperienceApi(employeeId, Number(expId));
      setExperiences((c) => c.filter((e) => e.id !== expId));
      setViewingId(null);
      toast.success("Experience deleted");
    } catch {
      toast.error("Failed to delete experience");
    }
  };

  /* ================= SUMMARY METRICS ================= */

  // Saved records only — an unsaved draft lives in the pop-up, not the list.
  const savedExperiences = useMemo(
    () => experiences.filter((e) => !!Number(e.id)),
    [experiences],
  );

  const stats = useMemo(() => {
    const experiences = savedExperiences;
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
  }, [savedExperiences]);

  /* ================= RENDER ================= */

  const editingExperience = editingId
    ? (experiences.find((e) => e.id === editingId) ?? null)
    : null;
  const viewingExperience = viewingId
    ? (savedExperiences.find((e) => e.id === viewingId) ?? null)
    : null;

  const yearsLabel = (value: string) => {
    const n = Number(value);
    if (!value || Number.isNaN(n)) return "";
    return `${value} ${n === 1 ? "yr" : "yrs"}`;
  };

  const renderEditorDialog = () => {
    const exp = editingExperience;
    if (!exp) return null;
    const all = validateExperience(exp);
    const errors: ValidationErrors = showErrors ? all : {};
    const isNew = !Number(exp.id);

    const submit = async () => {
      setShowErrors(true);
      if (Object.values(all).some(Boolean)) {
        toast.error("Please complete the highlighted fields");
        return;
      }
      setSaving(true);
      try {
        await handleSave(exp);
      } finally {
        setSaving(false);
      }
    };

    return (
      <RecordFormDialog
        open
        onClose={() => {
          setShowErrors(false);
          handleCancel();
        }}
        title={isNew ? "Add previous experience" : `Edit ${exp.companyName || "experience"}`}
        subtitle={
          isNew
            ? "Fill in the details of the employee's previous role"
            : "Update the details of this previous role"
        }
        badge={
          exp.companyName.trim() ? initialsOf(exp.companyName) : <Briefcase className="h-5 w-5" />
        }
        badgeClassName="bg-emerald-100 text-emerald-700"
        saveLabel={isNew ? "Save experience" : "Update experience"}
        onSave={submit}
        saving={saving}
      >
        {/* ── Employment details ── */}
        <DialogSection
          icon={<Briefcase className="h-3.5 w-3.5 text-slate-600" />}
          iconBg="bg-slate-100"
          title="Employment details"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DField label="Company name" required error={errors.companyName}>
              <DInput
                placeholder="e.g., Qatar Airways"
                value={exp.companyName}
                onChange={(e) =>
                  handleLocalChange(exp.id, { companyName: e.target.value })
                }
                invalid={!!errors.companyName}
              />
            </DField>
            <DField label="Job title" required error={errors.jobTitle}>
              <DInput
                placeholder="e.g., Senior Accountant"
                value={exp.jobTitle}
                onChange={(e) =>
                  handleLocalChange(exp.id, { jobTitle: e.target.value })
                }
                invalid={!!errors.jobTitle}
              />
            </DField>
            <DField label="Last date worked" required error={errors.lastDateWorked}>
              <DInput
                type="date"
                max={todayIso()}
                value={exp.lastDateWorked}
                onChange={(e) =>
                  handleLocalChange(exp.id, { lastDateWorked: e.target.value })
                }
                invalid={!!errors.lastDateWorked}
              />
            </DField>
            <DField
              label="Number of years"
              error={errors.numberOfYears}
              hint="Total time at this company, e.g. 3.5"
            >
              <DInput
                type="number"
                step="0.1"
                min="0"
                max="60"
                placeholder="e.g., 3.5"
                value={exp.numberOfYears}
                onChange={(e) =>
                  handleLocalChange(exp.id, { numberOfYears: e.target.value })
                }
                invalid={!!errors.numberOfYears}
              />
            </DField>
          </div>
        </DialogSection>

        {/* ── Location & notes ── */}
        <DialogSection
          icon={<MapPin className="h-3.5 w-3.5 text-blue-600" />}
          iconBg="bg-blue-50"
          title="Company location & notes"
        >
          <div className="grid grid-cols-1 gap-4">
            <DField label="Company address">
              <DInput
                placeholder="City, country"
                value={exp.companyAddress}
                onChange={(e) =>
                  handleLocalChange(exp.id, { companyAddress: e.target.value })
                }
              />
            </DField>
            <DField label="Notes / remarks">
              <DTextarea
                placeholder="Achievements, responsibilities, or reason for leaving"
                value={exp.notes}
                onChange={(e) =>
                  handleLocalChange(exp.id, { notes: e.target.value })
                }
                maxLength={1000}
              />
            </DField>
          </div>
        </DialogSection>
      </RecordFormDialog>
    );
  };

  /** "2 years 3 months ago" since the last day worked. */
  const sinceLabel = (iso: string) => {
    if (!iso) return "";
    const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
    if (!y || !m || !d) return "";
    const then = new Date(y, m - 1, d);
    const now = new Date();
    let months = (now.getFullYear() - then.getFullYear()) * 12 + (now.getMonth() - then.getMonth());
    if (now.getDate() < then.getDate()) months--;
    if (months < 1) return "This month";
    const yy = Math.floor(months / 12);
    const mm = months % 12;
    return [yy && `${yy} ${yy === 1 ? "year" : "years"}`, mm && `${mm} ${mm === 1 ? "month" : "months"}`]
      .filter(Boolean)
      .join(" ") + " ago";
  };

  const renderViewDialog = () => {
    const exp = viewingExperience;
    if (!exp) return null;
    return (
      <RecordViewDialog
        open
        onClose={() => setViewingId(null)}
        title={exp.companyName || "Previous experience"}
        subtitle={exp.jobTitle || "Previous employment"}
        badge={exp.companyName.trim() ? initialsOf(exp.companyName) : <Briefcase className="h-6 w-6" />}
        badgeClassName="bg-emerald-100 text-emerald-700"
        headerExtra={
          <>
            {exp.numberOfYears && <DHeaderTag>{yearsLabel(exp.numberOfYears)}</DHeaderTag>}
            {exp.lastDateWorked && (
              <DHeaderTag>Left {formatViewDate(exp.lastDateWorked)}</DHeaderTag>
            )}
          </>
        }
        onEdit={() => handleStartEdit(exp)}
        editLabel="Edit experience"
      >
        <DHighlights
          items={[
            {
              label: "Job title",
              value: exp.jobTitle,
              className: "border-blue-100 bg-blue-50 text-blue-800",
            },
            {
              label: "Time at company",
              value: yearsLabel(exp.numberOfYears),
              className: "border-emerald-100 bg-emerald-50 text-emerald-800",
            },
            {
              label: "Last day worked",
              value: exp.lastDateWorked ? formatViewDate(exp.lastDateWorked) : "",
              className: "border-violet-100 bg-violet-50 text-violet-800",
            },
            {
              label: "Since leaving",
              value: sinceLabel(exp.lastDateWorked),
              className: "border-amber-100 bg-amber-50 text-amber-800",
            },
          ]}
        />

        <DialogSection
          icon={<Briefcase className="h-3.5 w-3.5 text-slate-600" />}
          iconBg="bg-slate-100"
          title="Employment details"
        >
          <DFactGrid columns={2}>
            <DFact icon={<Building className="h-3.5 w-3.5" />} label="Company" value={exp.companyName} />
            <DFact icon={<Briefcase className="h-3.5 w-3.5" />} label="Job title" value={exp.jobTitle} />
            <DFact
              icon={<Calendar className="h-3.5 w-3.5" />}
              label="Last date worked"
              value={exp.lastDateWorked ? formatViewDate(exp.lastDateWorked) : ""}
              mono
            />
            <DFact icon={<Clock className="h-3.5 w-3.5" />} label="Number of years" value={yearsLabel(exp.numberOfYears)} />
          </DFactGrid>
        </DialogSection>

        <DialogSection
          icon={<MapPin className="h-3.5 w-3.5 text-blue-600" />}
          iconBg="bg-blue-50"
          title="Company location & notes"
        >
          <DFactGrid columns={2}>
            <DFact icon={<MapPin className="h-3.5 w-3.5" />} label="Company address" value={exp.companyAddress} wide multiline />
            <DFact icon={<FileText className="h-3.5 w-3.5" />} label="Notes / remarks" value={exp.notes} wide multiline />
          </DFactGrid>
        </DialogSection>
      </RecordViewDialog>
    );
  };

  const renderRow = (exp: Experience) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RecordAvatar accent="from-emerald-500 to-teal-600">
            {initialsOf(exp.companyName)}
          </RecordAvatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-sm font-bold text-slate-800">
                {exp.companyName || "Unnamed company"}
              </h4>
              {exp.jobTitle && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                  {exp.jobTitle}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {exp.companyAddress || "No address recorded"}
            </p>
          </div>
        </div>
        <RecordActions
          onView={() => {
            setEditingId(null);
            setViewingId(exp.id);
          }}
          onEdit={() => handleStartEdit(exp)}
          onDelete={() => handleDelete(exp.id)}
        />
      </div>
      <FormRow columns={3} className="mt-4 border-t border-slate-100 pt-3">
        <ViewField icon={<Calendar className="h-4 w-4" />} label="Last Date Worked" value={formatViewDate(exp.lastDateWorked)} />
        <ViewField icon={<Clock className="h-4 w-4" />} label="Duration" value={yearsLabel(exp.numberOfYears)} />
        <ViewField icon={<FileText className="h-4 w-4" />} label="Notes" value={exp.notes} />
      </FormRow>
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl">
      <SecondaryPageHeader
        title="Previous Experiences"
        description="Manage previous employment history"
        icon={<Briefcase className="h-5 w-5 text-white" />}
        actions={
          <Button
            onClick={() => {
              setShowErrors(false);
              handleAdd();
            }}
            disabled={!!editingExperience}
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
          value={stats.latestDate ? formatViewDate(stats.latestDate) : "—"}
          description="Most recent role"
          icon={<Calendar className="h-5 w-5" />}
          color="amber"
        />
      </div>

      {renderEditorDialog()}

      {renderViewDialog()}

      <SectionCard>
        <SectionHeading
          icon={<Briefcase className="h-4 w-4" />}
          label="Experience Details"
          description={
            stats.total
              ? `${stats.total} previous role${stats.total === 1 ? "" : "s"} on record`
              : "Employment history before joining the company"
          }
        />
        {savedExperiences.length > 0 ? (
          <div className="space-y-3">
            {savedExperiences.map((exp) => (
              <div key={exp.id}>{renderRow(exp)}</div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100">
              <Briefcase className="h-7 w-7 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              No work experience added yet
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Click "Add Experience" to record the employee's previous roles.
            </p>
            <Button
              onClick={handleAdd}
              className="mt-4 h-9 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Experience
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
