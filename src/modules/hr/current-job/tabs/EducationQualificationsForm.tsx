import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Plus,
  GraduationCap,
  School,
  Award,
  FileText,
  Calendar,
  MapPin,
  BookOpen,
} from "lucide-react";
import { generateId } from "@/lib/utils";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { useConfirmDialog } from "@/context/ConfirmDialogContext";
import { educationService } from "@/service/educationService";
import { FormRow } from "@/modules/hr/components/form-components";
import {
  RecordActions,
  RecordAvatar,
  SectionCard,
  SectionHeading,
  ViewField,
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

// A graduation year may be a few years ahead (expected graduation), not more.
const MAX_FUTURE_YEARS = 6;

function validateEducation(e: Education): ValidationErrors {
  const errors: ValidationErrors = {};
  if (!e.schoolName?.trim()) errors.schoolName = "School name is required";
  if (!e.degreeEarned?.trim())
    errors.degreeEarned = "Degree earned is required";
  const year = e.yearGraduated?.trim();
  if (!year) {
    errors.yearGraduated = "Year graduated is required";
  } else if (!/^\d{4}$/.test(year)) {
    errors.yearGraduated = "Enter a 4-digit year, e.g. 2020";
  } else {
    const n = Number(year);
    const current = new Date().getFullYear();
    if (n < 1950 || n > current + MAX_FUTURE_YEARS)
      errors.yearGraduated = `Year must be between 1950 and ${current + MAX_FUTURE_YEARS}`;
  }
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

const initialsOf = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("")
    .toUpperCase() || "?";

/* ================= COMPONENT ================= */

export default function EducationQualificationsForm() {
  const { confirm } = useConfirmDialog();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [educations, setEducations] = useState<Education[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewingId, setViewingId] = useState<string | null>(null);
  // Copy of a saved record taken when its edit starts, so Cancel can restore it.
  const [editSnapshot, setEditSnapshot] = useState<Education | null>(null);
  // Field errors are shown only after the user tries to save (like Add Employee).
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);

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
    setViewingId(null);
    setEditSnapshot(null);
    setEditingId(edu.id);
  }, []);

  const handleLocalChange = (id: string, patch: Partial<Education>) => {
    setEducations((c) => c.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  };

  const handleSave = async (edu: Education) => {
    if (!employeeId) return;

    const errors = validateEducation(edu);
    if (Object.values(errors).some(Boolean)) {
      toast.error("Please fix the highlighted fields");
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
      setEditSnapshot(null);
    } catch {
      toast.error("Failed to save education");
    }
  };

  const handleStartEdit = (edu: Education) => {
    setViewingId(null);
    setEditSnapshot({ ...edu });
    setEditingId(edu.id);
  };

  const handleCancel = () => {
    setEducations((c) =>
      c
        // Cancelling the pop-up discards an unsaved new education record.
        .filter((e) => e.id !== editingId || !!Number(e.id))
        // Undo unsaved changes to an existing record.
        .map((e) =>
          editSnapshot && e.id === editSnapshot.id ? editSnapshot : e,
        ),
    );
    setEditSnapshot(null);
    setEditingId(null);
  };

  const handleDelete = async (eduId: string) => {
    if (!employeeId) return;
    if (!(await confirm("Delete this education record?"))) return;

    try {
      if (Number(eduId))
        await educationService.remove(employeeId, Number(eduId));
      setEducations((c) => c.filter((e) => e.id !== eduId));
      setViewingId(null);
      toast.success("Education deleted");
    } catch {
      toast.error("Failed to delete education");
    }
  };

  const calculateYearsAgo = (yearGraduated: string) => {
    if (!/^\d{4}$/.test(yearGraduated?.trim() ?? "")) return null;
    const currentYear = new Date().getFullYear();
    const yearsAgo = currentYear - Number(yearGraduated);

    if (yearsAgo < 0) {
      return `Expected in ${Math.abs(yearsAgo)} year${Math.abs(yearsAgo) > 1 ? "s" : ""}`;
    } else if (yearsAgo === 0) {
      return "Graduated this year";
    } else {
      return `${yearsAgo} year${yearsAgo > 1 ? "s" : ""} ago`;
    }
  };

  /* ================= SUMMARY METRICS ================= */

  // Saved records only — an unsaved draft lives in the pop-up, not the list.
  const savedEducations = useMemo(
    () => educations.filter((e) => !!Number(e.id)),
    [educations],
  );

  const stats = useMemo(() => {
    const educations = savedEducations;
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
  }, [savedEducations]);

  /* ================= RENDER ================= */

  const editingEducation = editingId
    ? (educations.find((e) => e.id === editingId) ?? null)
    : null;
  const viewingEducation = viewingId
    ? (savedEducations.find((e) => e.id === viewingId) ?? null)
    : null;

  const renderEditorDialog = () => {
    const edu = editingEducation;
    if (!edu) return null;
    const all = validateEducation(edu);
    const errors: ValidationErrors = showErrors ? all : {};
    const yearsAgoText = all.yearGraduated
      ? null
      : calculateYearsAgo(edu.yearGraduated);
    const isNew = !Number(edu.id);

    const submit = async () => {
      setShowErrors(true);
      if (Object.values(all).some(Boolean)) {
        toast.error("Please complete the highlighted fields");
        return;
      }
      setSaving(true);
      try {
        await handleSave(edu);
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
        title={isNew ? "Add education" : `Edit ${edu.schoolName || "education"}`}
        subtitle={
          isNew
            ? "Fill in the details of the employee's qualification"
            : "Update the details of this qualification"
        }
        badge={
          edu.schoolName.trim() ? initialsOf(edu.schoolName) : <GraduationCap className="h-5 w-5" />
        }
        badgeClassName="bg-amber-100 text-amber-700"
        saveLabel={isNew ? "Save education" : "Update education"}
        onSave={submit}
        saving={saving}
      >
        {/* ── Academic details ── */}
        <DialogSection
          icon={<GraduationCap className="h-3.5 w-3.5 text-slate-600" />}
          iconBg="bg-slate-100"
          title="Academic details"
        >
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <DField label="School / university" required error={errors.schoolName}>
              <DInput
                placeholder="e.g., Qatar University"
                value={edu.schoolName}
                onChange={(e) =>
                  handleLocalChange(edu.id, { schoolName: e.target.value })
                }
                invalid={!!errors.schoolName}
              />
            </DField>
            <DField label="Degree earned" required error={errors.degreeEarned}>
              <DInput
                placeholder="e.g., Bachelor's, Master's"
                value={edu.degreeEarned}
                onChange={(e) =>
                  handleLocalChange(edu.id, { degreeEarned: e.target.value })
                }
                invalid={!!errors.degreeEarned}
              />
            </DField>
            <DField label="Major">
              <DInput
                placeholder="e.g., Computer Science"
                value={edu.major}
                onChange={(e) =>
                  handleLocalChange(edu.id, { major: e.target.value })
                }
              />
            </DField>
            <DField
              label="Year graduated"
              required
              error={errors.yearGraduated}
              hint={yearsAgoText ?? undefined}
            >
              <DInput
                inputMode="numeric"
                maxLength={4}
                placeholder="e.g., 2020"
                value={edu.yearGraduated}
                onChange={(e) =>
                  handleLocalChange(edu.id, {
                    yearGraduated: e.target.value.replace(/\D/g, "").slice(0, 4),
                  })
                }
                invalid={!!errors.yearGraduated}
              />
            </DField>
            <DField label="School address" className="sm:col-span-2">
              <DInput
                placeholder="City, country"
                value={edu.schoolAddress}
                onChange={(e) =>
                  handleLocalChange(edu.id, { schoolAddress: e.target.value })
                }
              />
            </DField>
          </div>
        </DialogSection>

        {/* ── Awards & additional information ── */}
        <DialogSection
          icon={<Award className="h-3.5 w-3.5 text-amber-600" />}
          iconBg="bg-amber-50"
          title="Awards & additional information"
        >
          <div className="grid grid-cols-1 gap-4">
            <DField label="Awards and certificates">
              <DTextarea
                placeholder="Honours, awards, certifications or special achievements"
                value={edu.awards}
                onChange={(e) =>
                  handleLocalChange(edu.id, { awards: e.target.value })
                }
                maxLength={500}
              />
            </DField>
            <DField label="Notes / remarks">
              <DTextarea
                placeholder="Any additional notes or relevant information"
                value={edu.notes}
                onChange={(e) =>
                  handleLocalChange(edu.id, { notes: e.target.value })
                }
                maxLength={1000}
              />
            </DField>
          </div>
        </DialogSection>
      </RecordFormDialog>
    );
  };

  const renderViewDialog = () => {
    const edu = viewingEducation;
    if (!edu) return null;
    const ago = calculateYearsAgo(edu.yearGraduated);
    return (
      <RecordViewDialog
        open
        onClose={() => setViewingId(null)}
        title={edu.schoolName || "Education"}
        subtitle={[edu.degreeEarned, edu.major].filter((x) => x?.trim()).join(" · ") || "Qualification"}
        badge={edu.schoolName.trim() ? initialsOf(edu.schoolName) : <GraduationCap className="h-6 w-6" />}
        badgeClassName="bg-amber-100 text-amber-700"
        headerExtra={
          <>
            {edu.yearGraduated && <DHeaderTag>Class of {edu.yearGraduated}</DHeaderTag>}
            {edu.awards?.trim() && (
              <DHeaderTag className="border-amber-300/60 bg-amber-400/25 text-amber-50">
                <Award className="h-3 w-3" /> Awards
              </DHeaderTag>
            )}
          </>
        }
        onEdit={() => handleStartEdit(edu)}
        editLabel="Edit education"
      >
        <DHighlights
          items={[
            {
              label: "Degree",
              value: edu.degreeEarned,
              className: "border-blue-100 bg-blue-50 text-blue-800",
            },
            {
              label: "Major",
              value: edu.major,
              className: "border-emerald-100 bg-emerald-50 text-emerald-800",
            },
            {
              label: "Graduated",
              value: edu.yearGraduated,
              className: "border-violet-100 bg-violet-50 text-violet-800",
            },
            {
              label: "Since graduating",
              value: ago ?? "",
              className: "border-amber-100 bg-amber-50 text-amber-800",
            },
          ]}
        />

        <DialogSection
          icon={<GraduationCap className="h-3.5 w-3.5 text-slate-600" />}
          iconBg="bg-slate-100"
          title="Academic details"
        >
          <DFactGrid columns={2}>
            <DFact icon={<School className="h-3.5 w-3.5" />} label="School / university" value={edu.schoolName} />
            <DFact icon={<GraduationCap className="h-3.5 w-3.5" />} label="Degree earned" value={edu.degreeEarned} />
            <DFact icon={<BookOpen className="h-3.5 w-3.5" />} label="Major" value={edu.major} />
            <DFact icon={<Calendar className="h-3.5 w-3.5" />} label="Year graduated" value={edu.yearGraduated} mono />
            <DFact icon={<MapPin className="h-3.5 w-3.5" />} label="School address" value={edu.schoolAddress} wide multiline />
          </DFactGrid>
        </DialogSection>

        <DialogSection
          icon={<Award className="h-3.5 w-3.5 text-amber-600" />}
          iconBg="bg-amber-50"
          title="Awards & additional information"
        >
          <DFactGrid columns={2}>
            <DFact icon={<Award className="h-3.5 w-3.5" />} label="Awards & certificates" value={edu.awards} wide multiline />
            <DFact icon={<FileText className="h-3.5 w-3.5" />} label="Notes / remarks" value={edu.notes} wide multiline />
          </DFactGrid>
        </DialogSection>
      </RecordViewDialog>
    );
  };

  const renderRow = (edu: Education) => (
    <div className="rounded-xl border border-slate-200 bg-white p-4 transition-shadow hover:shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <RecordAvatar accent="from-amber-500 to-orange-500">
            {initialsOf(edu.schoolName)}
          </RecordAvatar>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="truncate text-sm font-bold text-slate-800">
                {edu.schoolName || "Unnamed school"}
              </h4>
              {edu.degreeEarned && (
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold text-blue-700">
                  {edu.degreeEarned}
                </span>
              )}
            </div>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              {[edu.major, edu.schoolAddress].filter((s) => s?.trim()).join(" · ") ||
                "No major or address recorded"}
            </p>
          </div>
        </div>
        <RecordActions
          onView={() => {
            setEditingId(null);
            setViewingId(edu.id);
          }}
          onEdit={() => handleStartEdit(edu)}
          onDelete={() => handleDelete(edu.id)}
        />
      </div>
      <FormRow columns={3} className="mt-4 border-t border-slate-100 pt-3">
        <ViewField
          icon={<Calendar className="h-4 w-4" />}
          label="Year Graduated"
          value={edu.yearGraduated}
        />
        <ViewField icon={<BookOpen className="h-4 w-4" />} label="Major" value={edu.major} />
        <ViewField icon={<Award className="h-4 w-4" />} label="Awards" value={edu.awards} />
      </FormRow>
    </div>
  );

  return (
    <div className="space-y-4 rounded-xl">
      <SecondaryPageHeader
        title="Education & Qualifications"
        description="Manage educational background"
        icon={<GraduationCap className="h-5 w-5 text-white" />}
        actions={
          <Button
            onClick={() => {
              setShowErrors(false);
              handleAdd();
            }}
            disabled={!!editingEducation}
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

      {renderEditorDialog()}

      {renderViewDialog()}

      <SectionCard>
        <SectionHeading
          icon={<GraduationCap className="h-4 w-4" />}
          label="Education Details"
          description={
            stats.total
              ? `${stats.total} qualification${stats.total === 1 ? "" : "s"} on record`
              : "Schools, degrees and certifications"
          }
        />
        {savedEducations.length > 0 ? (
          <div className="space-y-3">
            {savedEducations.map((edu) => (
              <div key={edu.id}>{renderRow(edu)}</div>
            ))}
          </div>
        ) : (
          <div className="py-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-100 to-blue-100">
              <GraduationCap className="h-7 w-7 text-violet-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-800">
              No education records added yet
            </h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Click "Add Education" to record the employee's qualifications.
            </p>
            <Button
              onClick={handleAdd}
              className="mt-4 h-9 rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-white"
            >
              <Plus className="mr-1.5 h-4 w-4" />
              Add Education
            </Button>
          </div>
        )}
      </SectionCard>
    </div>
  );
}
