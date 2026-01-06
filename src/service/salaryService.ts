import { apiClient } from "@/service/apiClient";

const BASE = "/employees";

export const salaryService = {
  async get(employeeId: number) {
    return apiClient.get(`${BASE}/${employeeId}/salary`);
  },

  async create(employeeId: number, payload: any) {
    return apiClient.post(`${BASE}/${employeeId}/salary`, payload);
  },

  async update(employeeId: number, payload: any) {
    return apiClient.put(`${BASE}/${employeeId}/salary`, payload);
  },
};
