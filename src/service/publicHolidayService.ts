import { apiClient } from "./apiClient";

export type PublicHolidayCategory = "NATIONAL" | "RELIGIOUS" | "COMPANY";

/** A company public holiday (HR Settings → Policies → Public Holidays). */
export interface PublicHoliday {
  id: number;
  name: string;
  /** yyyy-MM-dd */
  startDate: string;
  /** yyyy-MM-dd (same as startDate for a one-day holiday) */
  endDate: string;
  category: PublicHolidayCategory;
  /** Same calendar date every year — copied unchanged to the next year. */
  recurring: boolean;
  /** False while the dates are an estimate (e.g. Eid before the official announcement). */
  confirmed: boolean;
  notes?: string | null;
  /** Calendar days the holiday spans. */
  totalDays?: number;
  /** Working days (Sun–Thu) — the paid days off. */
  workingDays?: number;
}

export type PublicHolidayInput = Omit<PublicHoliday, "id" | "totalDays" | "workingDays">;

const BASE = "/hr/public-holidays";

export const publicHolidayService = {
  async list(year: number): Promise<PublicHoliday[]> {
    const res = await apiClient.get<PublicHoliday[]>(BASE, { params: { year } });
    return Array.isArray(res.data) ? res.data : [];
  },

  async create(input: PublicHolidayInput): Promise<PublicHoliday> {
    return (await apiClient.post<PublicHoliday>(BASE, input)).data;
  },

  async update(id: number, input: PublicHolidayInput): Promise<PublicHoliday> {
    return (await apiClient.put<PublicHoliday>(`${BASE}/${id}`, input)).data;
  },

  async remove(id: number): Promise<void> {
    await apiClient.delete(`${BASE}/${id}`);
  },

  /** Adds Qatar's official holidays for the year (Eid dates estimated, flagged unconfirmed). */
  async loadQatar(year: number): Promise<PublicHoliday[]> {
    const res = await apiClient.post<PublicHoliday[]>(`${BASE}/load-qatar`, null, {
      params: { year },
    });
    return Array.isArray(res.data) ? res.data : [];
  },

  /** Copies one year's holidays into another (moving holidays re-estimated, flagged for review). */
  async copyYear(fromYear: number, toYear: number): Promise<PublicHoliday[]> {
    const res = await apiClient.post<PublicHoliday[]>(`${BASE}/copy`, null, {
      params: { fromYear, toYear },
    });
    return Array.isArray(res.data) ? res.data : [];
  },
};
