import { apiClient } from "./apiClient";

export interface JobCode {
  id: number;
  code: string;
  title: string;
  level: string;
  grade: string;
  active: boolean;
}

export interface JobCodePayload {
  code: string;
  title: string;
  level: string;
  grade: string;
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
  getById,
  create,
  update,
  delete: remove,
};
