import { useEffect, useState, useCallback } from "react";
import type { ReactElement } from "react";
import { useParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import EditUpdateButton from "@/components/EditUpdateButton";

/* -------------------- types & constants -------------------- */

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
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  dateReported: string; // yyyy-mm-dd
  leaveBalance: string;
  leaveStatus: LeaveStatus;
  totalDays: number;
};

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

/* -------------------- component -------------------- */

export default function LeavesForm(): ReactElement {
  const { id: employeeId } = useParams<{ id: string }>();

  const [saved, setSaved] = useState<LeaveRecord>(SEED);
  const [draft, setDraft] = useState<LeaveRecord>(SEED);
  const [editing, setEditing] = useState(false);

  // Optional legacy hook to allow shell to toggle via event
  useEffect(() => {
    const handler = () => setEditing((prev) => !prev);
    // event is optional; typed as EventListener for safety
    document.addEventListener("leaves:toggle-edit", handler as EventListener);
    return () => document.removeEventListener("leaves:toggle-edit", handler as EventListener);
  }, []);

  // Auto-calc total days (inclusive) when editing dates
  useEffect(() => {
    if (!editing) return;
    const sd = Date.parse(draft.startDate);
    const ed = Date.parse(draft.endDate);
    let days = 0;
    if (!Number.isNaN(sd) && !Number.isNaN(ed) && ed >= sd) {
      days = Math.floor((ed - sd) / (1000 * 60 * 60 * 24)) + 1;
    }
    // update totalDays only when changed to avoid unnecessary renders
    setDraft((prev) => (prev.totalDays === days ? prev : { ...prev, totalDays: days }));
  }, [draft.startDate, draft.endDate, editing]);

  const patch = useCallback(<K extends keyof LeaveRecord>(k: K, v: LeaveRecord[K]) => {
    setDraft((d) => ({ ...d, [k]: v }));
  }, []);

  const startEdit = useCallback(() => {
    setDraft(saved);
    setEditing(true);
  }, [saved]);

  const cancelEdit = useCallback(() => {
    setDraft(saved);
    setEditing(false);
  }, [saved]);

  const save = useCallback(() => {
    setSaved(draft);
    setEditing(false);

    // Store/update a simple history list for the History tab
    const key = `leaves-history-${employeeId ?? "unknown"}`;
    const prev: LeaveRecord[] = JSON.parse(localStorage.getItem(key) || "[]");
    const idx = prev.findIndex((r) => r.leaveCode === draft.leaveCode);
    if (idx >= 0) prev[idx] = draft;
    else prev.unshift(draft);
    localStorage.setItem(key, JSON.stringify(prev));
  }, [draft, employeeId]);

  return (
    <div className="rounded-xl border bg-white overflow-hidden">
      {/* Edit/Update toolbar (same position as Current Job) */}
      <div className="px-4 pt-3 flex justify-end">
        <EditUpdateButton editing={editing} onEdit={startEdit} onSave={save} onCancel={cancelEdit} />
      </div>

      {/* Form body */}
      <div className="p-4 space-y-4">
        <Row>
          <Field label="Leave Code:">
              <Input
                disabled={!editing}
                value={draft.leaveCode}
                onChange={(e) => patch("leaveCode", e.target.value)}
                aria-label="Leave Code"
              />
          </Field>

          <Field label="Start Date:">
            <Input
              type="date"
              disabled={!editing}
              value={draft.startDate}
              onChange={(e) => patch("startDate", e.target.value)}
              aria-label="Start Date"
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
          <Field label="Leave Type:">
            <select
              disabled={!editing}
              className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
              value={draft.leaveType}
              onChange={(e) => patch("leaveType", e.target.value as LeaveType)}
              aria-label="Leave Type"
            >
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </Field>

          <Field label="End Date:">
            <Input
              type="date"
              disabled={!editing}
              value={draft.endDate}
              onChange={(e) => patch("endDate", e.target.value)}
              aria-label="End Date"
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
          <Field label="Leave Status:">
            <select
              disabled={!editing}
              className="h-9 w-full rounded-md border px-3 text-sm disabled:bg-muted/40 disabled:text-muted-foreground"
              value={draft.leaveStatus}
              onChange={(e) => patch("leaveStatus", e.target.value as LeaveStatus)}
              aria-label="Leave Status"
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
      </div>
    </div>
  );
}

/* -------------------- small layout helpers -------------------- */

function Row({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{children}</div>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-sm">{label}</Label>
      {children}
    </div>
  );
}
