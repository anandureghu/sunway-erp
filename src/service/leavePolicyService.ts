import { apiClient } from "@/service/apiClient";
import type { LeavePolicy } from "@/types/hr";

const BASE = "/companies";

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
};
