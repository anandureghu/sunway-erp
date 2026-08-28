import type { AppraisalResponse } from "@/service/appraisalService";
import type { Employee } from "@/types/hr";
import type { HrDashboard, HrLeaveSummaryThisMonth } from "@/types/hrDashboard";

export const QATARIZATION_TARGET_PERCENT = 20;

export type CountSlice = { name: string; value: number };

export type HrAppraisalCycleInsight = {
  year: number;
  cycleLabel: string;
  finalized: number;
  inProgress: number;
  notStarted: number;
  totalAssigned: number;
  finalizedPercent: number;
  averageRating: number | null;
  topDepartment: string | null;
};

export type HrProbationInsight = {
  onProbation: number;
  dueOrOverdue: number;
  confirmedYtd: number;
  extended: number;
};

export type HrQatarizationInsight = {
  qatariCount: number;
  totalWorkforce: number;
  currentPercent: number;
  targetPercent: number;
  gapPositions: number;
  progressToTargetPercent: number;
  deadlineLabel: string;
};

export type HrLeaveUtilizationRow = {
  id: string;
  label: string;
  percent: number;
  days: number;
};

export type HrLeaveUtilizationInsight = {
  monthLabel: string;
  rows: HrLeaveUtilizationRow[];
  onLeaveToday: number;
  totalEmployees: number;
};

export type HrDashboardInsights = {
  appraisalCycle: HrAppraisalCycleInsight;
  probation: HrProbationInsight;
  qatarization: HrQatarizationInsight;
  workforceByNationality: CountSlice[];
  contractTypes: CountSlice[];
  leaveUtilization: HrLeaveUtilizationInsight;
};

type LeaveHistoryRow = {
  leaveType?: string;
  totalDays?: number;
  startDate?: string;
  endDate?: string;
  leaveStatus?: string;
};

const LEFT_EMPLOYEE_STATUSES = new Set(["resigned", "terminated", "retired"]);

function normalizeEmployeeStatus(status?: string): string {
  return (status ?? "Active").trim();
}

/** Active headcount for HR dashboard analytics (matches nationality / contract charts). */
function isHrWorkforceEmployee(employee: Employee): boolean {
  const status = normalizeEmployeeStatus(employee.status).toLowerCase();
  return !LEFT_EMPLOYEE_STATUSES.has(status);
}

function isActiveEmployee(employee: Employee): boolean {
  const status = normalizeEmployeeStatus(employee.status).toLowerCase();
  return status === "active" || status === "on leave";
}

function isOnLeaveEmployee(employee: Employee): boolean {
  return normalizeEmployeeStatus(employee.status).toLowerCase() === "on leave";
}

function overlapsToday(start?: string, end?: string): boolean {
  if (!start) return false;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : startDate;
  if (Number.isNaN(startDate.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const dayEnd = new Date(today);
  dayEnd.setHours(23, 59, 59, 999);
  return startDate <= dayEnd && endDate >= today;
}

function countOnLeaveToday(
  employees: Employee[],
  leaves: LeaveHistoryRow[],
  leaveSummary: HrLeaveSummaryThisMonth | null,
): number {
  const fromStatus = employees.filter(isOnLeaveEmployee).length;
  if (fromStatus > 0) return fromStatus;

  if (leaveSummary?.onLeaveToday != null && leaveSummary.onLeaveToday > 0) {
    return leaveSummary.onLeaveToday;
  }

  return leaves.filter((leave) => {
    const status = (leave.leaveStatus ?? "").toUpperCase();
    return (
      (status.includes("APPROVED") || status.includes("COMPLETED")) &&
      overlapsToday(leave.startDate, leave.endDate)
    );
  }).length;
}

function hrWorkforceEmployees(employees: Employee[]): Employee[] {
  return employees.filter(isHrWorkforceEmployee);
}

function countBy<T>(arr: T[], key: (item: T) => string): CountSlice[] {
  const map: Record<string, number> = {};
  arr.forEach((item) => {
    const k = key(item).trim() || "Unknown";
    map[k] = (map[k] || 0) + 1;
  });
  return Object.entries(map)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function isQatariNationality(nationality?: string): boolean {
  const n = (nationality ?? "").trim().toLowerCase();
  return n === "qatari" || n === "qatar" || n.includes("qatari");
}

function isProbationOverdue(probationEndDate?: string): boolean {
  if (!probationEndDate) return false;
  const end = new Date(probationEndDate);
  if (Number.isNaN(end.getTime())) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return end <= today;
}

function isCurrentYear(iso?: string): boolean {
  if (!iso) return false;
  const d = new Date(iso);
  return !Number.isNaN(d.getTime()) && d.getFullYear() === new Date().getFullYear();
}

function overlapsCurrentMonth(start?: string, end?: string): boolean {
  if (!start) return false;
  const startDate = new Date(start);
  const endDate = end ? new Date(end) : startDate;
  if (Number.isNaN(startDate.getTime())) return false;
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return startDate <= monthEnd && endDate >= monthStart;
}

function normalizeLeaveBucket(leaveType?: string): string {
  const t = (leaveType ?? "").toLowerCase();
  if (t.includes("annual")) return "Annual leave";
  if (t.includes("sick")) return "Sick leave";
  if (t.includes("maternity")) return "Maternity";
  if (t.includes("unpaid")) return "Unpaid";
  return leaveType?.trim() || "Other";
}

function contractBucket(
  employee: Employee,
  probationIds: Set<string>,
): string {
  const id = employee.id != null ? String(employee.id) : "";
  if (probationIds.has(id)) return "Probation";

  const category = (employee.employmentCategory ?? "").toUpperCase();
  if (category === "PERMANENT") return "Indefinite";
  if (category === "CONTRACT") return "Fixed 2yr";
  if (category === "TEMPORARY") return "Fixed 3yr";
  if (category === "INTERN") return "Probation";
  if (category === "CONSULTANT") return "Fixed 2yr";
  return "Indefinite";
}

function employeeDepartment(employee: Employee): string {
  return (
    employee.departmentName?.trim() ||
    employee.department?.trim() ||
    "Unassigned"
  );
}

function buildAppraisalInsight(
  appraisals: AppraisalResponse[],
  employees: Employee[],
  year: number,
): HrAppraisalCycleInsight {
  const finalized = appraisals.filter((a) => a.status === "LOCKED").length;
  const inProgress = appraisals.filter((a) =>
    ["DRAFT", "SELF_SUBMITTED", "MANAGER_REVIEWED"].includes(a.status),
  ).length;
  const totalAssigned = appraisals.length;
  const activeEmployees = hrWorkforceEmployees(employees).filter(isActiveEmployee)
    .length;
  const notStarted = Math.max(0, activeEmployees - totalAssigned);

  const scores = appraisals
    .filter((a) => a.status === "LOCKED" && a.overallScore != null)
    .map((a) => Number(a.overallScore));
  const averageRating =
    scores.length > 0
      ? Math.round((scores.reduce((s, v) => s + v, 0) / scores.length) * 10) /
        10
      : null;

  const deptByEmployeeId = new Map<number, string>();
  employees.forEach((e) => {
    const empId = Number(e.id);
    if (!Number.isNaN(empId)) {
      deptByEmployeeId.set(empId, employeeDepartment(e));
    }
  });

  const deptScores = new Map<string, { sum: number; count: number }>();
  appraisals
    .filter((a) => a.status === "LOCKED" && a.overallScore != null)
    .forEach((a) => {
      const dept =
        deptByEmployeeId.get(a.employeeId) ||
        a.employeeRole?.trim() ||
        "Unassigned";
      const cur = deptScores.get(dept) ?? { sum: 0, count: 0 };
      cur.sum += Number(a.overallScore);
      cur.count += 1;
      deptScores.set(dept, cur);
    });

  let topDepartment: string | null = null;
  let topAvg = -1;
  deptScores.forEach((stats, dept) => {
    const avg = stats.sum / stats.count;
    if (avg > topAvg) {
      topAvg = avg;
      topDepartment = dept;
    }
  });

  const cycleName = appraisals.find((a) => a.cycleName)?.cycleName;

  return {
    year,
    cycleLabel: cycleName || `FY${year}`,
    finalized,
    inProgress,
    notStarted,
    totalAssigned,
    finalizedPercent:
      totalAssigned > 0 ? Math.round((finalized / totalAssigned) * 100) : 0,
    averageRating,
    topDepartment,
  };
}

function buildProbationInsight(
  underProbation: Employee[],
  employees: Employee[],
  probationMonths = 3,
): HrProbationInsight {
  const dueOrOverdue = underProbation.filter((e) =>
    isProbationOverdue(e.probationEndDate),
  ).length;

  const confirmedYtd = employees.filter(
    (e) =>
      isActiveEmployee(e) &&
      isCurrentYear(e.joinDate) &&
      !underProbation.some((p) => String(p.id) === String(e.id)),
  ).length;

  const extended = underProbation.filter((e) => {
    if (!e.joinDate || !e.probationEndDate) return false;
    const join = new Date(e.joinDate);
    const end = new Date(e.probationEndDate);
    if (Number.isNaN(join.getTime()) || Number.isNaN(end.getTime())) return false;
    const defaultEnd = new Date(join);
    defaultEnd.setMonth(defaultEnd.getMonth() + probationMonths);
    return end > defaultEnd;
  }).length;

  return {
    onProbation: underProbation.length,
    dueOrOverdue,
    confirmedYtd,
    extended,
  };
}

function buildQatarizationInsight(employees: Employee[]): HrQatarizationInsight {
  const active = hrWorkforceEmployees(employees);
  const totalWorkforce = active.length;
  const qatariCount = active.filter((e) =>
    isQatariNationality(e.nationality),
  ).length;
  const currentPercent =
    totalWorkforce > 0
      ? Math.round((qatariCount / totalWorkforce) * 1000) / 10
      : 0;
  const target = QATARIZATION_TARGET_PERCENT;
  const targetHeadcount = Math.ceil((target / 100) * totalWorkforce);
  const gapPositions = Math.max(0, targetHeadcount - qatariCount);
  const progressToTargetPercent =
    target > 0
      ? Math.min(100, Math.round((currentPercent / target) * 1000) / 10)
      : 0;
  const year = new Date().getFullYear();

  return {
    qatariCount,
    totalWorkforce,
    currentPercent,
    targetPercent: target,
    gapPositions,
    progressToTargetPercent,
    deadlineLabel: `Deadline: 31 Dec ${year} · MoL reporting Q${Math.ceil((new Date().getMonth() + 1) / 3)}`,
  };
}

function buildNationalitySlices(employees: Employee[]): CountSlice[] {
  const active = hrWorkforceEmployees(employees);
  const grouped = countBy(active, (e) => e.nationality || "Unknown");
  const top = grouped.slice(0, 6);
  const otherCount = grouped.slice(6).reduce((s, g) => s + g.value, 0);
  if (otherCount > 0) top.push({ name: "Other", value: otherCount });
  return top;
}

function buildContractSlices(
  employees: Employee[],
  probationIds: Set<string>,
): CountSlice[] {
  const active = hrWorkforceEmployees(employees);
  return countBy(active, (e) => contractBucket(e, probationIds));
}

function buildLeaveUtilization(
  leaves: LeaveHistoryRow[],
  leaveSummary: HrLeaveSummaryThisMonth | null,
  employees: Employee[],
): HrLeaveUtilizationInsight {
  const monthLabel = new Date().toLocaleDateString(undefined, {
    month: "short",
  });
  const approved = leaves.filter((l) => {
    const status = (l.leaveStatus ?? "").toUpperCase();
    return (
      (status.includes("APPROVED") || status.includes("COMPLETED")) &&
      overlapsCurrentMonth(l.startDate, l.endDate)
    );
  });

  const byType = new Map<string, number>();
  approved.forEach((l) => {
    const bucket = normalizeLeaveBucket(l.leaveType);
    byType.set(bucket, (byType.get(bucket) ?? 0) + Number(l.totalDays || 0));
  });

  const totalDays = [...byType.values()].reduce((s, v) => s + v, 0);
  const preferredOrder = [
    "Annual leave",
    "Sick leave",
    "Maternity",
    "Unpaid",
    "Other",
  ];
  const rows: HrLeaveUtilizationRow[] = preferredOrder
    .filter((label) => (byType.get(label) ?? 0) > 0)
    .map((label) => {
      const days = byType.get(label) ?? 0;
      return {
        id: label,
        label,
        percent: totalDays > 0 ? Math.round((days / totalDays) * 100) : 0,
        days,
      };
    });

  if (rows.length === 0 && (leaveSummary?.approved ?? 0) > 0) {
    rows.push({
      id: "approved",
      label: "Approved leave",
      percent: 100,
      days: leaveSummary?.approved ?? 0,
    });
  }

  const workforce = hrWorkforceEmployees(employees);

  return {
    monthLabel,
    rows,
    onLeaveToday: countOnLeaveToday(employees, leaves, leaveSummary),
    totalEmployees: workforce.length,
  };
}

export function buildHrDashboardInsights(input: {
  employees: Employee[];
  underProbation: Employee[];
  appraisals: AppraisalResponse[];
  leaveHistory: LeaveHistoryRow[];
  dashboard: HrDashboard | null;
  probationMonths?: number;
}): HrDashboardInsights {
  const year = new Date().getFullYear();
  const probationIds = new Set(
    input.underProbation
      .map((e) => (e.id != null ? String(e.id) : ""))
      .filter(Boolean),
  );

  return {
    appraisalCycle: buildAppraisalInsight(
      input.appraisals,
      input.employees,
      year,
    ),
    probation: buildProbationInsight(
      input.underProbation,
      input.employees,
      input.probationMonths,
    ),
    qatarization: buildQatarizationInsight(input.employees),
    workforceByNationality: buildNationalitySlices(input.employees),
    contractTypes: buildContractSlices(input.employees, probationIds),
    leaveUtilization: buildLeaveUtilization(
      input.leaveHistory,
      input.dashboard?.leaveSummaryThisMonth ?? null,
      input.employees,
    ),
  };
}

export function percentOfTotal(slices: CountSlice[]): (value: number) => string {
  const total = slices.reduce((s, row) => s + row.value, 0);
  return (value: number) =>
    total > 0 ? `${Math.round((value / total) * 100)}%` : "0%";
}
