import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { Loader2, Save, CheckCircle2, LogOut, Lock, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  exitInterviewService,
  type ExitInterview,
} from "@/service/exitInterviewService";

// ── form content (schema-driven) ──────────────────────────────────────────────
const SEPARATION_TYPES = [
  "Resignation",
  "Termination",
  "End of Contract",
  "Retirement",
  "Mutual Agreement",
];

const REASONS = [
  "Better compensation / salary elsewhere",
  "Career advancement / promotion opportunity",
  "Relocation / personal / family reasons",
  "Dissatisfaction with management / supervisor",
  "Limited growth or development opportunities",
  "Work-life balance / excessive workload",
  "Company culture / work environment",
  "Job role did not match expectations",
  "Lack of recognition or appreciation",
  "End of fixed-term contract",
  "Health or medical reasons",
  "Pursuing further education",
  "Better benefits package elsewhere",
  "Retirement",
  "Commute / work location issues",
  "Other (specify below)",
];

const SATISFACTION = [
  "My job responsibilities were clearly defined",
  "I had the resources and tools to do my job effectively",
  "My workload was manageable and fairly distributed",
  "I received adequate training and development opportunities",
  "I had opportunities for career growth within the company",
  "My work was recognised and appreciated",
  "I felt my compensation was fair for my role",
  "The benefits package met my needs",
  "I had a good work-life balance",
  "I would recommend this company as a good place to work",
];

const LEADERSHIP = [
  "My direct manager provided clear expectations",
  "My manager was approachable and supportive",
  "I received regular and constructive feedback",
  "My manager treated me with respect and fairness",
  "Decisions were communicated transparently",
  "Senior leadership had a clear vision for the company",
  "I felt comfortable raising concerns with management",
];

const ENVIRONMENT = [
  "The physical work environment was safe and comfortable",
  "Team collaboration and cooperation were strong",
  "The company culture was positive and inclusive",
  "There was open communication across departments",
  "Company policies were clear and fairly applied",
  "Diversity and equal opportunity were respected",
];

const OPEN_FEEDBACK = [
  "What did you enjoy most about working here?",
  "What did you enjoy least about working here?",
  "What could the company do to improve as a workplace?",
  "Did any specific event or situation influence your decision to leave?",
  "Would you consider returning to the company in the future? Under what conditions?",
  "Anything you would like to say to senior management?",
];

const HANDOVER = [
  { key: "handoverPrepared", label: "Handover document prepared?", opts: ["Yes", "No", "In Progress"] },
  { key: "successorIdentified", label: "Successor identified?", opts: ["Yes", "No", "N/A"] },
  { key: "clientNotified", label: "Client/stakeholder notifications sent?", opts: ["Yes", "No", "N/A"] },
  { key: "accessDocumented", label: "System access/credentials documented?", opts: ["Yes", "No", "N/A"] },
];

const HANDOVER_NOTES = [
  "Key ongoing projects or tasks that require transition",
  "Critical contacts, relationships, or institutional knowledge to transfer",
  "Pending issues or risks the successor should be aware of",
];

const PROPERTY_ITEMS = [
  "Laptop / Computer",
  "Mobile Phone",
  "ID Badge / Access Card",
  "Office Keys",
  "Company Vehicle",
  "Uniform / PPE",
  "Tools / Equipment",
  "Company Credit Card",
  "Parking Card",
  "Other",
];

const CLEARANCE_DEPTS = [
  "HR Department",
  "Finance / Accounts",
  "IT Department",
  "Operations / Line Manager",
  "Administration / PRO",
  "Inventory / Assets (SIMS)",
];

const EXIT_STATUSES = ["RESIGNED", "TERMINATED", "RETIRED"];

const humanizeStatus = (s?: string | null) =>
  s
    ? s
        .toLowerCase()
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ")
    : "—";

const keyFor = (prefix: string, statement: string) =>
  `${prefix}:${statement.slice(0, 40).replace(/[^a-zA-Z0-9]+/g, "_")}`;

// ── small building blocks ─────────────────────────────────────────────────────
function SectionCard({
  n,
  title,
  children,
}: {
  n: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <header className="flex items-center gap-2.5 border-b border-slate-100 px-4 py-3">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 text-[11px] font-bold text-white">
          {n}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600">
          {title}
        </h3>
      </header>
      <div className="space-y-4 p-4">{children}</div>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      {children}
    </div>
  );
}

const inputCls =
  "h-9 w-full rounded-lg border border-slate-300 px-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200 disabled:bg-slate-50";
const textareaCls =
  "w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200";

function Rating({
  value,
  onChange,
  disabled,
}: {
  value?: number;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          disabled={disabled}
          onClick={() => onChange(n)}
          className={cn(
            "h-7 w-7 rounded-md border text-xs font-semibold transition-colors",
            value === n
              ? "border-violet-500 bg-violet-600 text-white"
              : "border-slate-300 bg-white text-slate-600 hover:border-violet-300",
          )}
        >
          {n}
        </button>
      ))}
    </div>
  );
}

function Pills({
  options,
  value,
  onChange,
  disabled,
}: {
  options: string[];
  value?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          disabled={disabled}
          onClick={() => onChange(o)}
          className={cn(
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
            value === o
              ? "border-violet-500 bg-violet-50 text-violet-700"
              : "border-slate-300 bg-white text-slate-600 hover:border-violet-300",
          )}
        >
          {o}
        </button>
      ))}
    </div>
  );
}

// ── the form ──────────────────────────────────────────────────────────────────
export default function ExitInterviewForm() {
  const { id } = useParams<{ id: string }>();
  const empId = id ? Number(id) : null;
  const location = useLocation();
  const navigate = useNavigate();
  // Set when opened from HR Reports → Exit Interviews, so a reviewer can go back.
  const fromReports = (location.state as { fromReports?: boolean } | null)
    ?.fromReports;

  const [ctx, setCtx] = useState<ExitInterview | null>(null);
  const [r, setR] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const set = (key: string, value: unknown) =>
    setR((prev) => ({ ...prev, [key]: value }));

  const toggleFactor = (reason: string) =>
    setR((prev) => {
      const list: string[] = Array.isArray(prev.contributingFactors)
        ? prev.contributingFactors
        : [];
      return {
        ...prev,
        contributingFactors: list.includes(reason)
          ? list.filter((x) => x !== reason)
          : [...list, reason],
      };
    });

  useEffect(() => {
    if (empId == null) return;
    let mounted = true;
    setLoading(true);
    exitInterviewService
      .get(empId)
      .then((data) => {
        if (!mounted) return;
        setCtx(data);
        setR((data.responses as Record<string, any>) ?? {});
      })
      .catch((err) => {
        if (mounted) toast.error(getApiErrorMessage(err, "Failed to load exit interview"));
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [empId]);

  const isExit = useMemo(
    () => !!ctx?.employeeStatus && EXIT_STATUSES.includes(ctx.employeeStatus),
    [ctx],
  );

  const persist = useCallback(
    async (status: "DRAFT" | "SUBMITTED") => {
      if (empId == null) return;
      setSaving(true);
      try {
        const payload: ExitInterview = {
          separationType: (r.separationType as string) || null,
          lastWorkingDay: (r.lastWorkingDay as string) || null,
          primaryReason: (r.primaryReason as string) || null,
          status,
          responses: r,
        };
        const saved = await exitInterviewService.save(empId, payload);
        setCtx(saved);
        setR((saved.responses as Record<string, any>) ?? r);
        toast.success(
          status === "SUBMITTED" ? "Exit interview submitted" : "Draft saved",
        );
      } catch (err) {
        toast.error(getApiErrorMessage(err, "Failed to save exit interview"));
      } finally {
        setSaving(false);
      }
    },
    [empId, r],
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-slate-400">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!isExit) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <Lock className="mx-auto mb-3 h-10 w-10 text-slate-300" />
        <h3 className="mb-1 text-lg font-semibold text-slate-800">
          Exit interview not available
        </h3>
        <p className="text-sm text-slate-500">
          This form becomes available once the employee's status is{" "}
          <strong>Resigned</strong>, <strong>Terminated</strong>, or{" "}
          <strong>Retired</strong>. Current status:{" "}
          <strong>{humanizeStatus(ctx?.employeeStatus)}</strong>.
        </p>
      </div>
    );
  }

  const submitted = ctx?.status === "SUBMITTED";

  return (
    <div className="space-y-5 pb-8">
      {/* Back to the HR Reports list — only when a reviewer opened this from there. */}
      {fromReports && (
        <button
          type="button"
          onClick={() => navigate("/hr/reports?tab=exit-interviews")}
          className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50"
        >
          <ArrowLeft className="h-4 w-4" /> Back to Exit Interviews
        </button>
      )}

      {/* header */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-gradient-to-r from-slate-50 to-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white">
            <LogOut className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">Exit Interview</h2>
            <p className="text-xs text-slate-500">
              {ctx?.employeeName} · {humanizeStatus(ctx?.employeeStatus)}
            </p>
          </div>
        </div>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold",
            submitted
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-amber-200 bg-amber-50 text-amber-700",
          )}
        >
          {submitted ? <CheckCircle2 className="h-3.5 w-3.5" /> : null}
          {submitted ? "Submitted" : "Draft"}
        </span>
      </div>

      {/* 1. Employee information (read-only) */}
      <SectionCard n={1} title="Employee Information">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {[
            ["Employee ID", ctx?.employeeNo],
            ["Employee Name", ctx?.employeeName],
            ["Department", ctx?.department],
            ["Position / Job Title", ctx?.designation],
            ["Date of Joining", ctx?.dateOfJoining],
            ["Nationality", ctx?.nationality],
          ].map(([label, val]) => (
            <div key={label as string}>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                {label}
              </p>
              <p className="text-sm font-medium text-slate-800">
                {(val as string) || "—"}
              </p>
            </div>
          ))}
          <Field label="Reporting Manager">
            <input
              className={inputCls}
              value={r.reportingManager ?? ""}
              onChange={(e) => set("reportingManager", e.target.value)}
            />
          </Field>
          <Field label="Work Location">
            <input
              className={inputCls}
              value={r.workLocation ?? ""}
              onChange={(e) => set("workLocation", e.target.value)}
            />
          </Field>
          <Field label="Length of Service">
            <input
              className={inputCls}
              value={r.lengthOfService ?? ""}
              onChange={(e) => set("lengthOfService", e.target.value)}
            />
          </Field>
        </div>
      </SectionCard>

      {/* 2. Separation details */}
      <SectionCard n={2} title="Separation Details">
        <Field label="Type of Separation">
          <Pills
            options={SEPARATION_TYPES}
            value={r.separationType}
            onChange={(v) => set("separationType", v)}
          />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Last Working Day">
            <input
              type="date"
              className={inputCls}
              value={r.lastWorkingDay ?? ""}
              onChange={(e) => set("lastWorkingDay", e.target.value)}
            />
          </Field>
          <Field label="Notice Period Served">
            <input
              className={inputCls}
              value={r.noticePeriodServed ?? ""}
              onChange={(e) => set("noticePeriodServed", e.target.value)}
            />
          </Field>
          <Field label="EOSB Amount (QAR)">
            <input
              type="number"
              className={inputCls}
              value={r.eosbAmount ?? ""}
              onChange={(e) => set("eosbAmount", e.target.value)}
            />
          </Field>
        </div>
        <Field label="Was notice period waived?">
          <Pills
            options={["Yes", "No"]}
            value={r.noticeWaived}
            onChange={(v) => set("noticeWaived", v)}
          />
        </Field>
      </SectionCard>

      {/* 3. Primary reason */}
      <SectionCard n={3} title="Primary Reason for Leaving">
        <Field label="Primary reason">
          <select
            className={inputCls}
            value={r.primaryReason ?? ""}
            onChange={(e) => set("primaryReason", e.target.value)}
          >
            <option value="">Select a reason…</option>
            {REASONS.map((reason) => (
              <option key={reason} value={reason}>
                {reason}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Contributing factors (select any)">
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {REASONS.map((reason) => {
              const checked =
                Array.isArray(r.contributingFactors) &&
                r.contributingFactors.includes(reason);
              return (
                <label
                  key={reason}
                  className="flex cursor-pointer items-center gap-2 text-sm text-slate-700"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggleFactor(reason)}
                    className="h-4 w-4 rounded border-slate-300 text-violet-600 focus:ring-violet-400"
                  />
                  {reason}
                </label>
              );
            })}
          </div>
        </Field>
        <Field label="If 'Other', please specify">
          <input
            className={inputCls}
            value={r.otherReason ?? ""}
            onChange={(e) => set("otherReason", e.target.value)}
          />
        </Field>
      </SectionCard>

      {/* 4/5/6. Rating sections */}
      {(
        [
          [4, "Job Satisfaction Assessment", "sat", SATISFACTION],
          [5, "Management & Leadership Feedback", "lead", LEADERSHIP],
          [6, "Work Environment & Culture", "env", ENVIRONMENT],
        ] as const
      ).map(([n, title, prefix, statements]) => (
        <SectionCard key={prefix} n={n} title={title}>
          <p className="text-xs text-slate-400">
            Rate each from 1 (Strongly Disagree) to 5 (Strongly Agree).
          </p>
          <div className="space-y-3">
            {statements.map((s) => {
              const k = keyFor(prefix, s);
              return (
                <div
                  key={k}
                  className="flex flex-col gap-2 border-b border-slate-50 pb-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <span className="text-sm text-slate-700">{s}</span>
                  <Rating value={r[k]} onChange={(v) => set(k, v)} />
                </div>
              );
            })}
          </div>
        </SectionCard>
      ))}

      {/* 7. Open feedback */}
      <SectionCard n={7} title="Open Feedback">
        {OPEN_FEEDBACK.map((q, i) => {
          const k = `open:${i}`;
          return (
            <Field key={k} label={q}>
              <textarea
                rows={2}
                className={textareaCls}
                value={r[k] ?? ""}
                onChange={(e) => set(k, e.target.value)}
              />
            </Field>
          );
        })}
      </SectionCard>

      {/* 8. Knowledge transfer */}
      <SectionCard n={8} title="Knowledge Transfer & Handover">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {HANDOVER.map((h) => (
            <Field key={h.key} label={h.label}>
              <Pills
                options={h.opts}
                value={r[h.key]}
                onChange={(v) => set(h.key, v)}
              />
            </Field>
          ))}
        </div>
        {HANDOVER_NOTES.map((q, i) => {
          const k = `handoverNote:${i}`;
          return (
            <Field key={k} label={q}>
              <textarea
                rows={2}
                className={textareaCls}
                value={r[k] ?? ""}
                onChange={(e) => set(k, e.target.value)}
              />
            </Field>
          );
        })}
      </SectionCard>

      {/* 9. Property checklist */}
      <SectionCard n={9} title="Company Property Return Checklist">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 text-left text-[11px] uppercase tracking-wider text-slate-400">
                <th className="py-2 pr-3 font-semibold">Item</th>
                <th className="py-2 pr-3 font-semibold">Status</th>
                <th className="py-2 font-semibold">Notes / Asset ID</th>
              </tr>
            </thead>
            <tbody>
              {PROPERTY_ITEMS.map((item) => {
                const sk = `prop:${item}`;
                const nk = `propNote:${item}`;
                return (
                  <tr key={item} className="border-b border-slate-50">
                    <td className="py-2 pr-3 text-slate-700">{item}</td>
                    <td className="py-2 pr-3">
                      <Pills
                        options={["Returned", "N/A", "Pending"]}
                        value={r[sk]}
                        onChange={(v) => set(sk, v)}
                      />
                    </td>
                    <td className="py-2">
                      <input
                        className={inputCls}
                        value={r[nk] ?? ""}
                        onChange={(e) => set(nk, e.target.value)}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </SectionCard>

      {/* 10. Final clearance */}
      <SectionCard n={10} title="Final Clearance & Sign-off">
        <div className="space-y-3">
          {CLEARANCE_DEPTS.map((dept) => {
            const sk = `clear:${dept}`;
            const ak = `clearBy:${dept}`;
            return (
              <div
                key={dept}
                className="flex flex-col gap-2 border-b border-slate-50 pb-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <span className="w-52 text-sm text-slate-700">{dept}</span>
                <Pills
                  options={["Cleared", "Pending"]}
                  value={r[sk]}
                  onChange={(v) => set(sk, v)}
                />
                <input
                  className={cn(inputCls, "sm:w-48")}
                  placeholder="Authorised by"
                  value={r[ak] ?? ""}
                  onChange={(e) => set(ak, e.target.value)}
                />
              </div>
            );
          })}
        </div>
      </SectionCard>

      {/* 11. Signatures */}
      <SectionCard n={11} title="Signatures">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Employee — Name">
            <input
              className={inputCls}
              value={r.empSignName ?? ctx?.employeeName ?? ""}
              onChange={(e) => set("empSignName", e.target.value)}
            />
          </Field>
          <Field label="Employee — Date">
            <input
              type="date"
              className={inputCls}
              value={r.empSignDate ?? ""}
              onChange={(e) => set("empSignDate", e.target.value)}
            />
          </Field>
          <Field label="HR Representative — Name">
            <input
              className={inputCls}
              value={r.hrSignName ?? ""}
              onChange={(e) => set("hrSignName", e.target.value)}
            />
          </Field>
          <Field label="HR Representative — Date">
            <input
              type="date"
              className={inputCls}
              value={r.hrSignDate ?? ""}
              onChange={(e) => set("hrSignDate", e.target.value)}
            />
          </Field>
        </div>
        <p className="rounded-lg bg-slate-50 p-3 text-[11px] leading-relaxed text-slate-500">
          Confidential — HR Department use only. Responses are used solely to improve
          workplace conditions, inform retention strategies, and fulfil final-settlement
          obligations.
        </p>
      </SectionCard>

      {/* actions */}
      <div className="sticky bottom-0 flex items-center justify-end gap-3 rounded-xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur">
        <Button
          variant="outline"
          disabled={saving}
          onClick={() => persist("DRAFT")}
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
          Save draft
        </Button>
        <Button
          disabled={saving}
          onClick={() => persist("SUBMITTED")}
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700"
        >
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
          Submit interview
        </Button>
      </div>
    </div>
  );
}
