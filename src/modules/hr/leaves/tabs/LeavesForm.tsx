import { useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import { useOutletContext } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useParams } from "react-router-dom";
import { leaveService } from "@/service/leaveService";
import { toast } from "sonner";
import type { LeavePreview } from "@/service/leaveService";

type Ctx = { editing: boolean; setEditing?: (b: boolean) => void };

type LeaveStatus = "Pending" | "Approved" | "Rejected";
type LeaveType =
  | "Annual Leave"
  | "Sick Leave"
  | "Emergency Leave"
  | "Unpaid Leave";

const STATUS: LeaveStatus[] = ["Pending", "Approved", "Rejected"];
const TYPES: LeaveType[] = [
  "Annual Leave",
  "Sick Leave",
  "Emergency Leave",
  "Unpaid Leave",
];

type LeaveRecord = {
  leaveCode: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  dateReported: string;
  leaveBalance: string;
  leaveStatus: LeaveStatus;
  totalDays: number;
};

function validateLeave(leave: LeaveRecord): boolean {
  return (
    leave.leaveCode.trim() !== "" &&
    leave.leaveType.trim() !== "" &&
    leave.startDate.trim() !== "" &&
    leave.endDate.trim() !== "" &&
    leave.leaveStatus.trim() !== ""
  );
}

const SEED: LeaveRecord = {
  leaveCode: "L001",
  leaveType: "Annual Leave",
  startDate: "2025-10-22",
  endDate: "2025-10-31",
  dateReported: "2025-10-22",
  leaveBalance: "",
  leaveStatus: "Pending",
  totalDays: 8,
};

export default function LeavesForm(): ReactElement {
  const { editing } = useOutletContext<Ctx>();
  const { id } = useParams<{ id: string }>();
  const employeeId = id ? Number(id) : undefined;

  const [draft, setDraft] = useState<LeaveRecord>({
    ...SEED,
    startDate: "",
    endDate: "",
    dateReported: new Date().toISOString().slice(0, 10),
    totalDays: 0,
  });
  const [saved, setSaved] = useState<LeaveRecord | null>(null);
  const [preview, setPreview] = useState<LeavePreview | null>(null);

  useEffect(() => {
    if (!preview) return;
    setDraft((d) =>
      d.leaveBalance === String(preview.currentBalance)
        ? d
        : { ...d, leaveBalance: String(preview.currentBalance) }
    );
  }, [preview]);

  useEffect(() => {
    if (!editing) return;
    const sd = Date.parse(draft.startDate);
    const ed = Date.parse(draft.endDate);
    let days = 0;
    if (!Number.isNaN(sd) && !Number.isNaN(ed) && ed >= sd) {
      days = Math.floor((ed - sd) / (1000 * 60 * 60 * 24)) + 1;
    }
    setDraft((prev) => (prev.totalDays === days ? prev : { ...prev, totalDays: days }));
  }, [draft.startDate, draft.endDate, editing]);

  useEffect(() => {
    if (!employeeId) return;
    if (!draft.leaveType || !draft.startDate || !draft.endDate) {
      setPreview(null);
      return;
    }
    let mounted = true;
    leaveService
      .previewLeave(employeeId, draft.leaveType, draft.startDate, draft.endDate)
      .then((res) => mounted && setPreview(res.data))
      .catch((err) => {
        console.error("Preview error", err);
        setPreview(null);
        toast.error(err?.response?.data?.message || "Preview failed");
      });
    return () => {
      mounted = false;
    };
  }, [draft.leaveType, draft.startDate, draft.endDate, employeeId]);

  const patch = useCallback(<K extends keyof LeaveRecord>(k: K, v: LeaveRecord[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const handleSave = useCallback(() => {
    if (!employeeId) return;
    const payload = {
      leaveType: draft.leaveType,
      startDate: draft.startDate,
      endDate: draft.endDate,
    };
    leaveService
      .applyLeave(employeeId, payload)
      .then(() => {
        toast.success("Leave applied successfully");
        setPreview(null);
        setSaved(draft);
      })
      .catch((err) => {
        console.error("Apply leave failed", err);
        toast.error(err?.response?.data?.message || "Failed to apply leave");
      });
  }, [draft, employeeId]);

  const handleCancel = useCallback(() => {
    if (saved) setDraft(saved);
    else setDraft(SEED);
  }, [saved]);

  return (
    <div className="p-4 space-y-4">
      <Row>
        <Field label="Leave Code:" required>
          <Input
            disabled={!editing}
            value={draft.leaveCode}
            onChange={(e) => patch("leaveCode", e.target.value)}
            aria-label="Leave Code"
            required
          />
        </Field>

        <Field label="Start Date:" required>
          <Input
            type="date"
            disabled={!editing}
            value={draft.startDate}
            onChange={(e) => patch("startDate", e.target.value)}
            aria-label="Start Date"
            required
          />
        </Field>

        <Field label="Date Reported:">
          <Input
            type="date"
            disabled={!editing}
            value={draft.dateReported}
            onChange={(e) => patch("dateReported", e.target.value)}
            aria-label="Date Reported"
          />
        </Field>
      </Row>

      <Row>
        <Field label="Leave Type:" required>
          <select
            disabled={!editing}
            className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
            value={draft.leaveType}
            onChange={(e) => patch("leaveType", e.target.value as LeaveType)}
            aria-label="Leave Type"
            required
          >
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field label="End Date:" required>
          <Input
            type="date"
            disabled={!editing}
            value={draft.endDate}
            onChange={(e) => patch("endDate", e.target.value)}
            aria-label="End Date"
            required
          />
        </Field>

        <Field label="Leave Balance:">
          <Input
            disabled={!editing}
            value={draft.leaveBalance}
            onChange={(e) => patch("leaveBalance", e.target.value)}
            aria-label="Leave Balance"
          />
        </Field>
      </Row>

      <Row>
        <Field label="Leave Status:" required>
          <select
            disabled={!editing}
            className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
            value={draft.leaveStatus}
            onChange={(e) => patch("leaveStatus", e.target.value as LeaveStatus)}
            aria-label="Leave Status"
            required
          >
            {STATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </Field>

        <Field label="Total Days on Vacation:">
          <Input disabled value={String(draft.totalDays)} aria-label="Total Days" />
        </Field>

        <div />
      </Row>

      {preview && (
        <div className="p-3 rounded-md border bg-muted/20">
          <p>Total Days: {preview.totalDays}</p>
          <p>Current Balance: {preview.currentBalance}</p>
          <p>Balance After Leave: {preview.balanceAfterLeave}</p>
        </div>
      )}

      {editing && (
        <div className="flex justify-end gap-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button disabled={!validateLeave(draft) || !preview || preview.balanceAfterLeave < 0} onClick={handleSave}>
            Save
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>;
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      {children}
    </div>
  );
}
