import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { useParams, useOutletContext } from "react-router-dom";
import { currentJobService } from "@/service/currentJobService";
import { toast } from "sonner";

const EMPTY_FORM = {
  jobCode: "",
  jobTitle: "",
  jobLevel: "",
  departmentCode: "",
  departmentName: "",
  salaryGrade: "",
  startDate: "",
  expectedEndDate: "",
  effectiveFrom: "",
  workLocation: "",
  workCity: "",
  workCountry: "",
};

// IDs pulled from the GET response so the PUT can re-send the existing job &
// department without forcing the user to re-pick them in this tab. (For
// changing the job/department itself, the dedicated Current Job form should
// be used.)
interface RefIds {
  jobCodeId: number | null;
  departmentId: number | null;
}

interface ProfileCtx {
  editing: boolean;
  setEditing?: (v: boolean) => void;
}

export default function CurrentJobTab() {
  const { id } = useParams<{ id: string }>();
  const { editing, setEditing } = useOutletContext<ProfileCtx>();
  const [form, setForm] = useState(EMPTY_FORM);
  const [refIds, setRefIds] = useState<RefIds>({
    jobCodeId: null,
    departmentId: null,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Load current job data when id is available
  useEffect(() => {
    if (!id) return; // Guard - don't call until employeeId is available

    const employeeId = Number(id);

    currentJobService.get(employeeId)
      .then((job) => {
        if (job) {
          // Cast to any to access nested API response structure
          const jobData = job as any;
          setForm({
            jobCode: jobData.job?.code ?? "",
            jobTitle: jobData.job?.title ?? "",
            jobLevel: jobData.job?.level ?? "",
            departmentCode: jobData.department?.code ?? "",
            departmentName: jobData.department?.name ?? "",
            salaryGrade: jobData.job?.salaryGrade ?? "",
            startDate: jobData.startDate ?? "",
            expectedEndDate: jobData.expectedEndDate ?? "",
            effectiveFrom: jobData.effectiveFrom ?? "",
            workLocation: jobData.workLocation ?? "",
            workCity: jobData.workCity ?? "",
            workCountry: jobData.workCountry ?? "",
          });
          setRefIds({
            jobCodeId: jobData.job?.id ?? jobData.jobCodeId ?? null,
            departmentId:
              jobData.department?.id ?? jobData.departmentId ?? null,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load current job:", err);
        toast.error("Failed to load current job info");
      })
      .finally(() => setLoading(false));
  }, [id]);

  const onChange =
    (k: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((s) => ({ ...s, [k]: e.target.value }));

  const handleSave = async () => {
    if (!id) return;
    const employeeId = Number(id);

    if (!refIds.jobCodeId || !refIds.departmentId) {
      toast.error(
        "Set the job and department in the Current Job form first — this tab only updates dates and locations.",
      );
      return;
    }
    if (!form.effectiveFrom || !form.startDate) {
      toast.error("Effective From and Start Date are required.");
      return;
    }

    setSaving(true);
    try {
      await currentJobService.update(employeeId, {
        jobCodeId: refIds.jobCodeId,
        departmentId: refIds.departmentId,
        effectiveFrom: form.effectiveFrom,
        startDate: form.startDate,
        expectedEndDate: form.expectedEndDate || undefined,
        workLocation: form.workLocation || undefined,
        workCity: form.workCity || undefined,
        workCountry: form.workCountry || undefined,
      });
      toast.success("Current job updated");
      setEditing?.(false);
    } catch (err: any) {
      console.error("Failed to save current job:", err);
      toast.error(currentJobService.extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="text-sm text-gray-500 p-4">Loading current job...</div>;
  }

  return (
    <div className="space-y-6">
      {/* ROW 1: Job identity */}
      <Row>
        <Field label="Job Code *">
          <Input value={form.jobCode} onChange={onChange("jobCode")} disabled={!editing} />
        </Field>

        <Field label="Job Title *">
          <Input value={form.jobTitle} onChange={onChange("jobTitle")} disabled={!editing} />
        </Field>

        <Field label="Job Level">
          <Input value={form.jobLevel} onChange={onChange("jobLevel")} disabled={!editing} />
        </Field>
      </Row>

      {/* ROW 2: Department */}
      <Row>
        <Field label="Department Code *">
          <Input value={form.departmentCode} onChange={onChange("departmentCode")} disabled={!editing} />
        </Field>

        <Field label="Department Name">
          <Input value={form.departmentName} onChange={onChange("departmentName")} disabled={!editing} />
        </Field>

        <Field label="Salary Grade">
          <Input value={form.salaryGrade} onChange={onChange("salaryGrade")} disabled={!editing} />
        </Field>
      </Row>

      {/* ROW 3: Dates */}
      <Row>
        <Field label="Effective From *">
          <Input
            type="date"
            value={form.effectiveFrom}
            onChange={onChange("effectiveFrom")}
            disabled={!editing}
          />
        </Field>

        <Field label="Start Date *">
          <Input
            type="date"
            value={form.startDate}
            onChange={onChange("startDate")}
            disabled={!editing}
          />
        </Field>

        <Field label="Expected End Date">
          <Input
            type="date"
            value={form.expectedEndDate}
            onChange={onChange("expectedEndDate")}
            disabled={!editing}
          />
        </Field>
      </Row>

      <div className="flex gap-2">
        {!editing ? (
          <Button onClick={() => setEditing?.(true)}>Edit / Update</Button>
        ) : (
          <>
            <Button
              variant="secondary"
              onClick={() => setEditing?.(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-3 gap-6">
      {children}
    </div>
  );
}


function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}
