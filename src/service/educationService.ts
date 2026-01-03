import { apiClient } from "@/service/apiClient";

/* ================= TYPES ================= */

export type EmployeeEducationPayload = {
  schoolName: string;
  schoolAddress?: string;
  degreeEarned: string;
  major?: string;
  yearGraduated: number | null;
  awards?: string;
  notes?: string;
};

export type EmployeeEducationResponse = EmployeeEducationPayload & {
  id: number;
  employeeId: number;
};

/* ================= SERVICE ================= */

export const educationService = {
  // -------- GET ALL --------
  async getAll(employeeId: number): Promise<EmployeeEducationResponse[]> {
    const res = await apiClient.get(
      `/employees/${employeeId}/educations`
    );
    return res.data ?? [];
  },

  // -------- CREATE --------
  async create(
    employeeId: number,
    payload: EmployeeEducationPayload
  ): Promise<EmployeeEducationResponse> {
    const res = await apiClient.post(
      `/employees/${employeeId}/educations`,
      payload
    );
    return res.data;
  },

  // -------- UPDATE --------
  async update(
    employeeId: number,
    educationId: number,
    payload: EmployeeEducationPayload
  ): Promise<EmployeeEducationResponse> {
    const res = await apiClient.put(
      `/employees/${employeeId}/educations/${educationId}`,
      payload
    );
    return res.data;
  },

  // -------- DELETE --------
  async remove(
    employeeId: number,
    educationId: number
  ): Promise<void> {
    await apiClient.delete(
      `/employees/${employeeId}/educations/${educationId}`
    );
  },

  // -------- ERROR MESSAGE HELPER --------
  extractErrorMessage(err: any): string {
    return (
      err?.response?.data?.message ||
      err?.message ||
      "Something went wrong"
    );
  },
};
