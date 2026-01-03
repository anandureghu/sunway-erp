import { apiClient } from "@/service/apiClient";

const BASE = "/employees";

export type LeavePreview = {
  totalDays: number;
  currentBalance: number;
  balanceAfterLeave: number;
};

export const leaveService = {
  previewLeave(employeeId: number, leaveType: string, startDate: string, endDate: string) {
    return apiClient.get(`${BASE}/${employeeId}/leaves/preview`, {
      params: { leaveType, startDate, endDate },
    });
  },

  applyLeave(employeeId: number, payload: { leaveType: string; startDate: string; endDate: string }) {
    return apiClient.post(`${BASE}/${employeeId}/leaves`, payload);
  },

  fetchLeaveHistory(employeeId: number) {
    return apiClient.get(`${BASE}/${employeeId}/leaves/history`);
  },
};
