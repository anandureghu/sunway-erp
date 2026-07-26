import { apiClient } from "./apiClient";

export interface JobCode {
  id: number;
  code: string;
  title: string;
  level: string;
  salaryGrade: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  active: boolean;
}

export interface JobCodePayload {
  code: string;
  title: string;
  level: string;
  salaryGrade: string;
  minSalary?: number | null;
  maxSalary?: number | null;
  active: boolean;
}

async function getAll(): Promise<JobCode[]> {
  const res = await apiClient.get<JobCode[]>("/hr/job-codes");
  return res.data;
}

async function getActive(): Promise<JobCode[]> {
  const res = await apiClient.get<JobCode[]>("/hr/job-codes/active");
  return res.data;
}

/**
 * Active job codes still assignable to this employee — the active list minus codes
 * already held by another still-employed person (a code frees up when its holder
 * exits). The employee's own current code stays in the list so editing works.
 */
async function getAssignable(employeeId?: number): Promise<JobCode[]> {
  const res = await apiClient.get<JobCode[]>("/hr/job-codes/assignable", {
    params: employeeId != null ? { employeeId } : undefined,
  });
  return res.data;
}

async function getById(id: number): Promise<JobCode> {
  const res = await apiClient.get<JobCode>(`/hr/job-codes/${id}`);
  return res.data;
}

async function create(payload: JobCodePayload): Promise<JobCode> {
  const res = await apiClient.post<JobCode>("/hr/job-codes", payload);
  return res.data;
}

async function update(id: number, payload: JobCodePayload): Promise<JobCode> {
  const res = await apiClient.put<JobCode>(`/hr/job-codes/${id}`, payload);
  return res.data;
}

async function remove(id: number): Promise<void> {
  await apiClient.delete(`/hr/job-codes/${id}`);
}

export const jobCodeService = {
  getAll,
  getActive,
  getAssignable,
  getById,
  create,
  update,
  delete: remove,
};
