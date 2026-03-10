import { apiClient } from "@/service/apiClient";
import type { LeavePolicy } from "@/types/hr";

const BASE = "/companies";

export interface LeaveTypeResponse {
  id?: number;
  code: string;
  name: string;
  days: number;
  paid: boolean;
  carryOver: boolean;
  maxCarry: number;
}

export const leavePolicyService = {
  getPolicies(companyId: number) {
    return apiClient.get(`${BASE}/${companyId}/leave-policies`);
  },

  savePolicies(companyId: number, policies: LeavePolicy[]) {
    return apiClient.post(
      `${BASE}/${companyId}/leave-policies/bulk`,
      policies
    );
  },

  // Leave Types API
  getLeaveTypes(companyId: number) {
    return apiClient.get<LeaveTypeResponse[]>(`${BASE}/${companyId}/leave-types`);
  },

  createLeaveType(companyId: number, data: Partial<LeaveTypeResponse>) {
    return apiClient.post<LeaveTypeResponse>(`${BASE}/${companyId}/leave-types`, data);
  },

  updateLeaveType(companyId: number, leaveTypeId: number, data: Partial<LeaveTypeResponse>) {
    return apiClient.put<LeaveTypeResponse>(`${BASE}/${companyId}/leave-types/${leaveTypeId}`, data);
  },

  deleteLeaveType(companyId: number, leaveTypeId: number) {
    return apiClient.delete(`${BASE}/${companyId}/leave-types/${leaveTypeId}`);
  },
};
