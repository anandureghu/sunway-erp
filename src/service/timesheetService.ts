import { apiClient } from "./apiClient";

export interface TimesheetEntry {
  id?: number;
  employeeId: number;
  date: string;                  // yyyy-MM-dd
  checkInTime: string | null;    // ISO datetime
  checkOutTime?: string | null;  // ISO datetime, absent when still checked in
  workedMinutes?: number | null;
  status: "CHECKED_IN" | "CHECKED_OUT" | "NOT_CHECKED_IN";
  notes?: string;
}

export interface MonthlySummary {
  daysRecorded: number;
  daysPresent: number; // "Total Days Worked" — days with >= 6 hours
  totalHours: number;
  avgHoursPerDay: number;
}

// One employee's monthly attendance rollup (HR "Employee Time Sheets" tab).
export interface EmployeeMonthlyAttendance {
  employeeId: number;
  employeeNo: string | null;
  employeeName: string | null;
  department: string | null;
  daysRecorded: number;
  daysPresent: number; // worked days (>= 6h) that feed payroll
  totalHours: number;
  // Today's live status (meaningful only when viewing the current month).
  todayStatus: "CHECKED_IN" | "CHECKED_OUT" | "NOT_CHECKED_IN" | string;
  todayCheckIn: string | null;
  todayCheckOut: string | null;
  todayHours: number;
}

// One day's check-in/out row for a single employee.
export interface AttendanceHistoryItem {
  attendanceDate: string; // yyyy-MM-dd
  checkInTime: string | null;
  checkOutTime: string | null;
  workedMinutes: number | null;
  workedDuration: string | null;
  status: "CHECKED_IN" | "CHECKED_OUT" | "NOT_CHECKED_IN" | string;
}

// A server page of the HR attendance-history view for one month.
export interface AttendanceHistoryPage {
  content: EmployeeMonthlyAttendance[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  archived: boolean;
}

// One archived monthly attendance snapshot row.
export interface AttendanceArchiveRow {
  id: number;
  employeeId: number;
  employeeNo: string | null;
  employeeName: string | null;
  department: string | null;
  periodYear: number;
  periodMonth: number;
  daysRecorded: number;
  daysPresent: number;
  totalHours: number;
  archivedAt: string;
}

const BASE = (id: number) => `/employees/${id}/timesheet`;

export const timesheetService = {
  checkIn(employeeId: number): Promise<TimesheetEntry> {
    return apiClient.post(`${BASE(employeeId)}/checkin`).then((r) => r.data);
  },

  checkOut(employeeId: number): Promise<TimesheetEntry> {
    return apiClient.post(`${BASE(employeeId)}/checkout`).then((r) => r.data);
  },

  getToday(employeeId: number): Promise<TimesheetEntry | null> {
    return apiClient
      .get(`${BASE(employeeId)}/today`)
      .then((r) => r.data ?? null)
      .catch(() => null);
  },

  getHistory(
    employeeId: number,
    params?: { month?: number; year?: number }
  ): Promise<TimesheetEntry[]> {
    // The daily records live at /history (a list); the bare /timesheet route
    // returns the dashboard object, so map the history items to TimesheetEntry.
    return apiClient
      .get(`${BASE(employeeId)}/history`, { params })
      .then((r) =>
        Array.isArray(r.data)
          ? (r.data as AttendanceHistoryItem[]).map((it) => ({
              employeeId,
              date: it.attendanceDate,
              checkInTime: it.checkInTime,
              checkOutTime: it.checkOutTime,
              workedMinutes: it.workedMinutes,
              status: (it.status as TimesheetEntry["status"]) ?? "NOT_CHECKED_IN",
            }))
          : [],
      )
      .catch(() => []);
  },

  getMonthlySummary(
    employeeId: number,
    year: number,
    month: number,
  ): Promise<MonthlySummary | null> {
    return apiClient
      .get(`${BASE(employeeId)}/month-summary`, { params: { year, month } })
      .then((r) => (r.data as MonthlySummary) ?? null)
      .catch(() => null);
  },

  // Daily check-in/out rows for one employee in a month (drill-down view).
  getDailyHistory(
    employeeId: number,
    year: number,
    month: number,
  ): Promise<AttendanceHistoryItem[]> {
    return apiClient
      .get(`${BASE(employeeId)}/history`, { params: { year, month } })
      .then((r) => (Array.isArray(r.data) ? r.data : []))
      .catch(() => []);
  },

  // Company-wide monthly attendance rollup — scoped server-side to the caller's
  // HR_REPORTS grant (all employees) or just their own attendance otherwise.
  getCompanyMonthlySummary(
    year: number,
    month: number,
  ): Promise<EmployeeMonthlyAttendance[]> {
    return apiClient
      .get(`/hr/attendance/monthly-summary`, { params: { year, month } })
      .then((r) => (Array.isArray(r.data) ? r.data : []))
      .catch(() => []);
  },

  // Snapshot a month's worked-days into the archive (errors surface to caller).
  archiveMonth(
    year: number,
    month: number,
  ): Promise<{ archivedCount: number }> {
    return apiClient
      .post(`/hr/attendance/archive`, null, { params: { year, month } })
      .then((r) => r.data);
  },

  unarchiveMonth(year: number, month: number): Promise<void> {
    return apiClient
      .delete(`/hr/attendance/archive`, { params: { year, month } })
      .then(() => undefined);
  },

  // Server-paged worked-days history for a month (archived snapshot or live).
  getMonthlyHistoryPage(
    year: number,
    month: number,
    employeeCode: string,
    page: number,
    size: number,
  ): Promise<AttendanceHistoryPage> {
    return apiClient
      .get(`/hr/attendance/history`, {
        params: { year, month, employeeCode: employeeCode || undefined, page, size },
      })
      .then((r) => r.data as AttendanceHistoryPage)
      .catch(() => ({
        content: [],
        page: 0,
        size,
        totalElements: 0,
        totalPages: 1,
        archived: false,
      }));
  },

  // Archived monthly snapshots, filterable by month and/or employee code/name.
  listArchived(
    year?: number,
    month?: number,
    employeeCode?: string,
  ): Promise<AttendanceArchiveRow[]> {
    return apiClient
      .get(`/hr/attendance/archive`, {
        params: { year, month, employeeCode: employeeCode || undefined },
      })
      .then((r) => (Array.isArray(r.data) ? r.data : []))
      .catch(() => []);
  },
};
