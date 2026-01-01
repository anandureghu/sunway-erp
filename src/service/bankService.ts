import { apiClient } from "@/service/apiClient";

const BASE = "/employees";

export const bankService = {
  get(employeeId: number) {
    return apiClient.get(`${BASE}/${employeeId}/salary/bank`);
  },

  create(employeeId: number, payload: any) {
    return apiClient.post(`${BASE}/${employeeId}/salary/bank`, payload);
  },

  update(employeeId: number, payload: any) {
    return apiClient.put(`${BASE}/${employeeId}/salary/bank`, payload);
  },
};
