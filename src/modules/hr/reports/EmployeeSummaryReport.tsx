import { useEffect, useMemo, useState, type ReactNode } from "react";
import { ExternalLink, Loader2, Lock, Search, UserRound, X } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { cn } from "@/lib/utils";
import {
  contractLabel,
  employeeReportService,
  fmtReportDate,
  humanizeEnum,
  reportStatusMeta,
  type EmployeeReportRow,
  type EmployeeSummaryReport as Summary,
} from "@/service/employeeReportService";

/**
 * HR Reports → Employee Summary. Filter by last name and/or employee code, pick an
 * employee, and see their personal & contact details, current job (department,
 * division, designation, grade), contract and current total salary on one sheet.
 */

const NAVY = "#1F3A6E";
const NAVY_DARK = "#16294E";

const money = (n?: number | null) =>
  n == null
    ? "—"
    : Number(n).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function EmployeeSummaryReport({
  employeeId,
  onSelectEmployee,
}: {
  employeeId: number | null;
  onSelectEmployee: (id: number | null) => void;
}) {
  const navigate = useNavigate();
  const [people, setPeople] = useState<EmployeeReportRow[]>([]);
  const [loadingPeople, setLoadingPeople] = useState(true);
  const [lastName, setLastName] = useState("");
  const [code, setCode] = useState("");

  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    employeeReportService
      .register()
      .then((r) => setPeople(r.rows))
      .catch((err) => toast.error(getApiErrorMessage(err, "Could not load employees.")))
      .finally(() => setLoadingPeople(false));
  }, []);

  useEffect(() => {
    if (!employeeId) {
      setSummary(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    employeeReportService
      .summary(employeeId)
      .then((s) => !cancelled && setSummary(s))
      .catch((err) => {
        if (!cancelled) {
          toast.error(getApiErrorMessage(err, "Could not load the employee summary."));
          setSummary(null);
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [employeeId]);

  const matches = useMemo(() => {
    const ln = lastName.trim().toLowerCase();
    const c = code.trim().toLowerCase();
    if (!ln && !c) return [];
    return people
      .filter(
        (p) =>
          (!ln || (p.lastName ?? "").toLowerCase().includes(ln)) &&
          (!c || (p.employeeNo ?? "").toLowerCase().includes(c)),
      )
      .slice(0, 12);
  }, [people, lastName, code]);

  const pick = (id: number) => {
    onSelectEmployee(id);
    setLastName("");
    setCode("");
  };

  return (
    <div className="space-y-4">
      {/* ── Filter ── */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm print:hidden">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Last name
            </label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="e.g. Al Naimi"
                className="h-9 w-56 rounded-md border border-slate-300 bg-white pl-8 pr-2 text-[13px] outline-none focus:border-[#1F3A6E]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block font-mono text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Employee code
            </label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="e.g. 1004"
              className="h-9 w-40 rounded-md border border-slate-300 bg-white px-2.5 font-mono text-[13px] outline-none focus:border-[#1F3A6E]"
            />
          </div>
          {summary && (
            <div className="ml-auto flex gap-2">
              <button
                type="button"
                onClick={() => navigate(`/hr/employees/${summary.id}/profile`)}
                className="inline-flex h-9 items-center gap-1.5 rounded-md border border-slate-300 px-3 text-[12.5px] text-slate-600 hover:border-[#1F3A6E] hover:text-[#1F3A6E]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open profile
              </button>
              <button
                type="button"
                onClick={() => onSelectEmployee(null)}
                title="Clear"
                className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-slate-300 text-slate-500 hover:text-rose-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {(lastName.trim() || code.trim()) && (
          <div className="mt-3 overflow-hidden rounded-lg border border-slate-200">
            {loadingPeople ? (
              <p className="flex items-center gap-2 px-3 py-3 text-sm text-slate-400">
                <Loader2 className="h-4 w-4 animate-spin" /> Loading…
              </p>
            ) : matches.length === 0 ? (
              <p className="px-3 py-3 text-sm text-slate-400">No employee matches.</p>
            ) : (
              matches.map((p) => {
                const meta = reportStatusMeta(p.status);
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => pick(p.id)}
                    className="flex w-full items-center gap-3 border-b border-slate-100 px-3 py-2 text-left last:border-0 hover:bg-[#EEF2F9]"
                  >
                    <span className="font-mono text-[11.5px] text-slate-400">{p.employeeNo}</span>
                    <span className="text-[13px] font-semibold text-slate-800">{p.fullName}</span>
                    <span className="text-[12px] text-slate-500">
                      {[p.designation, p.departmentName].filter(Boolean).join(" · ")}
                    </span>
                    <span
                      className={cn(
                        "ml-auto rounded border px-1.5 py-0.5 font-mono text-[9.5px] uppercase",
                        meta.cls,
                      )}
                    >
                      {meta.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

      {/* ── Sheet ── */}
      {loading ? (
        <div className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white py-20 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Loading employee summary…
        </div>
      ) : summary ? (
        <SummarySheet s={summary} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <UserRound className="mx-auto mb-2 h-8 w-8 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">Select an employee</p>
          <p className="mt-1 text-xs text-slate-400">
            Search by last name or employee code above, or click an employee in the Employee Register.
          </p>
        </div>
      )}
    </div>
  );
}

function SummarySheet({ s }: { s: Summary }) {
  const meta = reportStatusMeta(s.status);
  const initials =
    ((s.firstName?.trim()[0] ?? "") + (s.lastName?.trim()[0] ?? "")).toUpperCase() || "?";
  const today = new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const contract = contractLabel(s.contractType, s.employmentCategory);
  const tags: [string, string][] = [
    [meta.label, "border-white/40 bg-white/10 text-white"],
    ...(s.contractStatus
      ? ([[`Contract ${humanizeEnum(s.contractStatus)}`, "border-white/30 text-[#B9C7E2]"]] as [
          string,
          string,
        ][])
      : []),
    ...(s.probationEndDate && String(s.status).toUpperCase() === "UNDER_PROBATION"
      ? ([[`Probation ends ${fmtReportDate(s.probationEndDate)}`, "border-[#F0C98A]/60 text-[#F0C98A]"]] as [
          string,
          string,
        ][])
      : []),
  ];

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm print:rounded-none print:border-0 print:shadow-none">
      {/* Masthead */}
      <div className="px-6 pt-5 text-white sm:px-8" style={{ background: NAVY }}>
        <div className="flex flex-wrap gap-x-5 gap-y-1 font-mono text-[10px] uppercase tracking-[0.16em] text-[#9FB4D8]">
          <span>HR Reports · Employee Summary</span>
          <span>{s.companyName ?? ""}</span>
          <span>Generated {today}</span>
        </div>
        <div className="flex flex-wrap items-end gap-5 pb-5 pt-5">
          <div className="grid h-[72px] w-[72px] shrink-0 place-items-center rounded-md border border-white/25 bg-white/15 font-mono text-2xl font-semibold">
            {initials}
          </div>
          <div className="min-w-0">
            <h2 className="font-serif text-[28px] font-bold leading-tight tracking-tight">
              {[s.prefix, s.fullName].filter(Boolean).join(" ")}
            </h2>
            <p className="text-[14px] text-[#C9D7EE]">
              {[s.designation, s.departmentName].filter(Boolean).join(" · ") || "No current job"}
            </p>
            <p className="mt-1.5 font-mono text-[11.5px] tracking-wide text-[#9FB4D8]">
              {[
                s.employeeNo && `Code ${s.employeeNo}`,
                s.gradeCode && `Grade ${s.gradeCode}`,
                s.divisionName,
              ]
                .filter(Boolean)
                .join("  ·  ")}
            </p>
          </div>
          <div className="ml-auto flex max-w-xs flex-wrap justify-end gap-1.5">
            {tags.map(([t, cls]) => (
              <span key={t} className={cn("rounded border px-2 py-0.5 font-mono text-[10px] tracking-wide", cls)}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Key strip */}
      <div className="flex flex-wrap text-white" style={{ background: NAVY_DARK }}>
        {[
          ["Length of service", s.serviceLabel || "—"],
          ["Status", meta.label],
          ["Contract", contract],
          ["Reports to", s.reportingManager || "—"],
          ["Joined", fmtReportDate(s.joinDate)],
        ].map(([label, value]) => (
          <div key={label} className="min-w-[140px] flex-1 border-r border-white/10 px-5 py-3">
            <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.13em] text-[#8FA5CC]">{label}</p>
            <p className="text-[15px] font-semibold">{value}</p>
          </div>
        ))}
      </div>

      <div className="space-y-7 px-6 py-6 sm:px-8">
        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Section title="Employee information">
            <Dl>
              <Row label="Full name">{s.fullName}</Row>
              <Row label="Employee code" mono>{s.employeeNo}</Row>
              <Row label="Status">
                <span className={cn("rounded border px-1.5 py-0.5 font-mono text-[10px] uppercase", meta.cls)}>
                  {meta.label}
                </span>
              </Row>
              <Row label="Gender">{s.gender}</Row>
              <Row label="Date of birth" mono>
                {s.dateOfBirth ? `${fmtReportDate(s.dateOfBirth)}${s.age != null ? `  (${s.age} yrs)` : ""}` : null}
              </Row>
              <Row label="Marital status">{s.maritalStatus}</Row>
              <Row label="Nationality">{s.nationality}</Row>
              <Row label="QID / ID no." mono>{s.identification}</Row>
              <Row label="Religion">{s.religion}</Row>
            </Dl>
          </Section>

          <Section title="Contact details">
            <Dl>
              <Row label="Phone" mono>{s.phone}</Row>
              <Row label="Alternate phone" mono>{s.altPhone}</Row>
              <Row label="Email">{s.email}</Row>
              {s.addresses.length === 0 ? (
                <Row label="Address">{null}</Row>
              ) : (
                s.addresses.map((a, i) => (
                  <Row
                    key={i}
                    label={`${a.type ? humanizeEnum(a.type) : "Address"}${a.primary ? " (primary)" : ""}`}
                  >
                    {a.text}
                  </Row>
                ))
              )}
            </Dl>
          </Section>
        </div>

        <div className="grid grid-cols-1 gap-7 lg:grid-cols-2">
          <Section title="Current job">
            <Dl>
              <Row label="Designation">{s.designation}</Row>
              <Row label="Job code" mono>{s.jobCode}</Row>
              <Row label="Grade" mono>{s.gradeCode}</Row>
              <Row label="Department">{s.departmentName}</Row>
              <Row label="Division">{s.divisionName}</Row>
              <Row label="Employment type">{humanizeEnum(s.employmentType)}</Row>
              <Row label="Work location">{s.workLocation}</Row>
              <Row label="Reports to">{s.reportingManager}</Row>
              <Row label="System role">{s.companyRole}</Row>
            </Dl>
          </Section>

          <Section title="Employment & contract">
            <Dl>
              <Row label="Date joined" mono>{fmtReportDate(s.joinDate)}</Row>
              <Row label="Years of service">
                {s.serviceLabel
                  ? `${s.serviceLabel}${s.yearsOfService != null ? `  (${s.yearsOfService.toFixed(1)} yrs)` : ""}`
                  : null}
              </Row>
              <Row label="Contract type">{contract === "—" ? null : contract}</Row>
              <Row label="Contract code" mono>{s.contractCode}</Row>
              <Row label="Contract period" mono>
                {s.contractStartDate || s.contractEndDate
                  ? `${fmtReportDate(s.contractStartDate)} → ${s.contractEndDate ? fmtReportDate(s.contractEndDate) : "Open-ended"}`
                  : null}
              </Row>
              <Row label="Notice period">
                {s.noticePeriodDays != null ? `${s.noticePeriodDays} days` : null}
              </Row>
              {s.probationEndDate && <Row label="Probation ends" mono>{fmtReportDate(s.probationEndDate)}</Row>}
              {s.expectedEndDate && (
                <Row label="Last working day" mono>{fmtReportDate(s.expectedEndDate)}</Row>
              )}
            </Dl>
          </Section>
        </div>

        <Section title="Current salary" note="Total monthly package">
          {s.salaryVisible ? (
            <div className="flex flex-wrap items-baseline gap-3">
              <span className="font-mono text-2xl font-semibold text-[#1F3A6E]">
                {s.grossSalary != null ? `${s.currencyCode ?? ""} ${money(s.grossSalary)}`.trim() : "—"}
              </span>
              <span className="text-xs text-slate-400">
                {s.grossSalary != null ? "Gross monthly total (basic + allowances)" : "No active salary on record"}
              </span>
            </div>
          ) : (
            <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-center text-[12.5px] text-slate-500">
              <Lock className="mx-auto mb-1.5 h-4 w-4 text-slate-400" />
              <b className="block text-slate-700">Salary withheld</b>
              Salary figures require the Salary or Payroll view-all permission.
            </div>
          )}
        </Section>

        <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-3 font-mono text-[10px] uppercase tracking-wider text-slate-400">
          <span>HR Reports · Employee Summary</span>
          <span>Confidential — HR use</span>
          <span className="ml-auto">
            Generated {today} · {s.salaryVisible ? "Includes salary" : "Salary withheld"}
          </span>
        </div>
      </div>
    </div>
  );
}

function Section({ title, note, children }: { title: string; note?: string; children: ReactNode }) {
  return (
    <section className="break-inside-avoid">
      <h3 className="mb-3 flex items-center gap-2 border-b-[1.5px] border-[#1F3A6E] pb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.15em] text-[#1F3A6E]">
        {title}
        {note && (
          <span className="ml-auto font-sans text-[11px] normal-case tracking-normal text-slate-400">{note}</span>
        )}
      </h3>
      {children}
    </section>
  );
}

function Dl({ children }: { children: ReactNode }) {
  return <dl className="grid grid-cols-[140px_1fr] gap-x-3 gap-y-2 text-[13px]">{children}</dl>;
}

function Row({ label, mono, children }: { label: string; mono?: boolean; children: ReactNode }) {
  const empty = children == null || children === "" || children === "—";
  return (
    <>
      <dt className="text-slate-500">{label}</dt>
      <dd className={cn("m-0 break-words font-medium", mono && "font-mono text-[12.5px] font-normal", empty && "text-slate-300")}>
        {empty ? "—" : children}
      </dd>
    </>
  );
}
