import { apiClient } from "./apiClient";

/** One row of HR Reports → Employee Register. */
export interface EmployeeReportRow {
  id: number;
  employeeNo?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName: string;
  /** ACTIVE, UNDER_PROBATION, ON_LEAVE, RESIGNED, TERMINATED, RETIRED, INACTIVE */
  status?: string | null;
  nationality?: string | null;
  departmentName?: string | null;
  divisionName?: string | null;
  designation?: string | null;
  jobCode?: string | null;
  gradeCode?: string | null;
  joinDate?: string | null;
  yearsOfService?: number | null;
  serviceLabel?: string | null;
  contractType?: string | null;
  employmentCategory?: string | null;
  /** Monthly gross; null when the caller cannot see salaries. */
  grossSalary?: number | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  probationEndDate?: string | null;
  /** Last working day of an exiting employee. */
  expectedEndDate?: string | null;
  contractEndDate?: string | null;
}

export interface EmployeeRegister {
  rows: EmployeeReportRow[];
  salaryVisible: boolean;
}

/** HR Reports → Employee Summary (one employee). */
export interface EmployeeSummaryReport {
  id: number;
  employeeNo?: string | null;
  prefix?: string | null;
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  fullName: string;
  status?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  age?: number | null;
  maritalStatus?: string | null;
  nationality?: string | null;
  religion?: string | null;
  identification?: string | null;
  birthplace?: string | null;
  hometown?: string | null;
  email?: string | null;
  phone?: string | null;
  altPhone?: string | null;
  addresses: { type?: string | null; primary: boolean; text: string }[];
  departmentName?: string | null;
  divisionName?: string | null;
  designation?: string | null;
  jobCode?: string | null;
  gradeCode?: string | null;
  employmentType?: string | null;
  employmentCategory?: string | null;
  workLocation?: string | null;
  reportingManager?: string | null;
  companyRole?: string | null;
  joinDate?: string | null;
  probationEndDate?: string | null;
  expectedEndDate?: string | null;
  yearsOfService?: number | null;
  serviceLabel?: string | null;
  contractCode?: string | null;
  contractType?: string | null;
  contractStatus?: string | null;
  contractStartDate?: string | null;
  contractEndDate?: string | null;
  noticePeriodDays?: number | null;
  grossSalary?: number | null;
  salaryVisible: boolean;
  currencyCode?: string | null;
  companyName?: string | null;
}

export const employeeReportService = {
  async register(): Promise<EmployeeRegister> {
    const res = await apiClient.get<EmployeeRegister>("/hr/reports/employees");
    return {
      rows: Array.isArray(res.data?.rows) ? res.data.rows : [],
      salaryVisible: !!res.data?.salaryVisible,
    };
  },

  async summary(employeeId: number): Promise<EmployeeSummaryReport> {
    const res = await apiClient.get<EmployeeSummaryReport>(
      `/hr/reports/employees/${employeeId}`,
    );
    return { ...res.data, addresses: res.data?.addresses ?? [] };
  },
};

// ── shared formatting ─────────────────────────────────────────────────────────

/** "UNDER_PROBATION" → "Under probation" */
export const humanizeEnum = (v?: string | null) =>
  v ? v.charAt(0) + v.slice(1).toLowerCase().replace(/_/g, " ") : "";

/** yyyy-mm-dd → "06 May 2018" */
export const fmtReportDate = (iso?: string | null) => {
  if (!iso) return "—";
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  if (!y || !m || !d) return iso;
  return new Date(y, m - 1, d).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

/** Status → label + Tailwind pill classes. */
export const REPORT_STATUS_META: Record<string, { label: string; cls: string }> = {
  ACTIVE: { label: "Active", cls: "text-emerald-700 border-emerald-200 bg-emerald-50" },
  UNDER_PROBATION: { label: "Probation", cls: "text-amber-700 border-amber-200 bg-amber-50" },
  ON_LEAVE: { label: "On leave", cls: "text-sky-700 border-sky-200 bg-sky-50" },
  RESIGNED: { label: "Resigned", cls: "text-rose-700 border-rose-200 bg-rose-50" },
  TERMINATED: { label: "Terminated", cls: "text-rose-700 border-rose-200 bg-rose-50" },
  RETIRED: { label: "Retired", cls: "text-indigo-700 border-indigo-200 bg-indigo-50" },
  INACTIVE: { label: "Inactive", cls: "text-slate-600 border-slate-300 bg-slate-50" },
};

export const reportStatusMeta = (s?: string | null) =>
  REPORT_STATUS_META[String(s ?? "").toUpperCase()] ?? {
    label: humanizeEnum(s) || "—",
    cls: "text-slate-600 border-slate-200 bg-slate-50",
  };

/** Contract type label, falling back to the job's employment category. */
export const contractLabel = (
  contractType?: string | null,
  employmentCategory?: string | null,
) => humanizeEnum(contractType) || humanizeEnum(employmentCategory) || "—";
