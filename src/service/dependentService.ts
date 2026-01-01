import { apiClient } from "./apiClient";

export interface DependentPayload {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth?: string; // YYYY-MM-DD
  gender?: string;
  nationality?: string;
  nationalId?: string;
  maritalStatus?: string;
  relationship?: string;
}

async function getAll(employeeId: number) {
  const res = await apiClient.get<DependentPayload[]>(`/employees/${employeeId}/dependents`);
  return res.data;
}

async function create(employeeId: number, payload: DependentPayload) {
  const res = await apiClient.post<DependentPayload>(`/employees/${employeeId}/dependents`, payload);
  return res.data;
}

async function update(employeeId: number, dependentId: number, payload: DependentPayload) {
  const res = await apiClient.put<DependentPayload>(`/employees/${employeeId}/dependents/${dependentId}`, payload);
  return res.data;
}

async function remove(employeeId: number, dependentId: number) {
  await apiClient.delete(`/employees/${employeeId}/dependents/${dependentId}`);
}

// Helper to extract backend message (UI code can call this)
function extractErrorMessage(err: any): string {
  return err?.response?.data?.message || err?.response?.data?.error || err?.message || String(err);
}

export const dependentService = {
  getAll,
  create,
  update,
  remove,
  extractErrorMessage,
};

export default dependentService;
