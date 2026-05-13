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
    return apiClient
      .get(BASE(employeeId), { params })
      .then((r) => (Array.isArray(r.data) ? r.data : []))
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
};
