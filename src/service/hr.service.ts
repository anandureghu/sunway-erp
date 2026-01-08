import type { Employee } from "@/types/hr";
import { apiClient } from "./apiClient";

/* =====================================================
   LIST EMPLOYEES (current company)
===================================================== */
async function listEmployees(): Promise<Employee[]> {
  const res = await apiClient.get<Employee[]>("/employees");
  return res.data;
}

/* =====================================================
   GET EMPLOYEE BY ID
===================================================== */
async function getEmployee(
  id: number | string
): Promise<Employee> {
  const res = await apiClient.get<Employee>(`/employees/${id}`);
  return res.data;
}

/* =====================================================
   GET EMPLOYEE ADDRESSES
===================================================== */
async function getEmployeeAddresses(employeeId: number) {
  const res = await apiClient.get(`/employees/${employeeId}/addresses`);
  return res.data;
}

/* =====================================================
   CREATE EMPLOYEE
===================================================== */
export interface CreateEmployeePayload {
  firstName?: string;
  lastName?: string;

  // contact / profile
  phoneNo?: string;
  altPhone?: string;
  gender?: string;
  prefix?: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  joinDate?: string;

  departmentId?: number;
  role?: string;
}

async function createEmployee(
  payload: CreateEmployeePayload
): Promise<Employee> {
  const res = await apiClient.post<Employee>("/employees", payload);
  return res.data;
}

/* =====================================================
   UPDATE EMPLOYEE (PROFILE + CONTACT INFO)
===================================================== */
export interface UpdateEmployeePayload {
  employeeNo?: string;
  firstName?: string;
  lastName?: string;
  gender?: string;
  prefix?: string;
  status?: string;
  maritalStatus?: string;

  dateOfBirth?: string;
  joinDate?: string;

  phoneNo?: string;
  altPhone?: string;
  email?: string;

  departmentId?: number;
  notes?: string;
}

async function updateEmployee(
  employeeId: number,
  payload: UpdateEmployeePayload
): Promise<Employee> {
  const res = await apiClient.put<Employee>(
    `/employees/${employeeId}`,
    payload
  );
  return res.data;
}

/* =====================================================
   DELETE EMPLOYEE
===================================================== */
async function deleteEmployee(employeeId: number): Promise<void> {
  await apiClient.delete(`/employees/${employeeId}`);
}

/* =====================================================
   UPLOAD EMPLOYEE IMAGE (optional)
===================================================== */
async function uploadImage(employeeId: number, file: File): Promise<string> {
  const form = new FormData();
  form.append("file", file);

  const res = await apiClient.post<{ url: string }>(
    `/employees/${employeeId}/upload-image`,
    form,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );

  return res.data.url;
}

/* =====================================================
   EXPORT SERVICE
===================================================== */
export const hrService = {
  listEmployees,
  getEmployee,
  getEmployeeAddresses,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  uploadImage,
};

export default hrService;
