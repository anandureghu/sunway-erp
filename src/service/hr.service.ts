  import type { Employee } from "@/types/hr";
  import { apiClient } from "./apiClient";
  import { jobCodeService, type JobCode } from "./jobCodeService";

  /** An existing employee that matches a new hire (see checkDuplicateEmployee). */
  export interface DuplicateEmployeeMatch {
    id: number;
    employeeNo?: string | null;
    fullName: string;
    /** Backend enum name: ACTIVE, INACTIVE, RESIGNED, … */
    status?: string | null;
    archived: boolean;
    identification?: string | null;
    departmentName?: string | null;
    matchedBy: "IDENTIFICATION" | "FULL_NAME";
  }

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

    // personal information
    birthplace?: string;
    hometown?: string;
    nationality?: string;
    religion?: string;
    identification?: string;

    departmentId?: number;
    companyId?: number;
    role?: string;
    companyRole?: string | null;      // Company role name (for display)
    companyRoleId?: number | null;    // Company role ID (FK to CompanyRole table)
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

    // personal information
    birthplace?: string;
    hometown?: string;
    nationality?: string;
    religion?: string;
    identification?: string;

    phoneNo?: string;
    altPhone?: string;
    email?: string;

    departmentId?: number;
    notes?: string;
    imageUrl?: string;
    role?: string;
    companyRole?: string | null;      // Company role name (for display)
    companyRoleId?: number | null;    // Company role ID (FK to CompanyRole table)
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
    ARCHIVE LIFECYCLE (inactive employees)
  ===================================================== */
  async function listArchivedEmployees(): Promise<Employee[]> {
    const res = await apiClient.get<Employee[]>("/employees/archived");
    return res.data ?? [];
  }
  async function listInactiveEmployees(): Promise<Employee[]> {
    const res = await apiClient.get<Employee[]>("/employees/inactive");
    return res.data ?? [];
  }
  async function archiveEmployee(employeeId: number): Promise<void> {
    await apiClient.put(`/employees/${employeeId}/archive`);
  }
  async function unarchiveEmployee(employeeId: number): Promise<void> {
    await apiClient.put(`/employees/${employeeId}/unarchive`);
  }
  /** Re-hire an INACTIVE employee: status → ACTIVE and restored to the directory. */
  async function reactivateEmployee(employeeId: number): Promise<Employee> {
    const res = await apiClient.put<Employee>(`/employees/${employeeId}/reactivate`);
    return res.data;
  }

  /**
   * Existing employees (any status, archived included) that are the same person as a
   * new hire: same identification number, or the exact same first + middle + last name.
   */
  async function checkDuplicateEmployee(params: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    identification?: string;
  }): Promise<DuplicateEmployeeMatch[]> {
    const res = await apiClient.get<DuplicateEmployeeMatch[]>(
      "/employees/duplicate-check",
      {
        params: {
          firstName: params.firstName?.trim() || undefined,
          middleName: params.middleName?.trim() || undefined,
          lastName: params.lastName?.trim() || undefined,
          identification: params.identification?.trim() || undefined,
        },
      },
    );
    return Array.isArray(res.data) ? res.data : [];
  }

  /* =====================================================
    UPLOAD EMPLOYEE IMAGE (optional)
  ===================================================== */
  async function uploadImage(employeeId: number, file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);

    // The endpoint returns the updated employee; its imageUrl is the public URL.
    const res = await apiClient.post<{ imageUrl?: string; url?: string }>(
      `/employees/${employeeId}/upload-image`,
      form,
      {
        headers: { "Content-Type": "multipart/form-data" },
      }
    );

    return res.data.imageUrl ?? res.data.url ?? "";
  }

  /* =====================================================
    GET ACTIVE JOB CODES
  ===================================================== */
  async function getActiveJobCodes(): Promise<JobCode[]> {
    return jobCodeService.getActive();
  }

  /* =====================================================
    ADMIN RESET EMPLOYEE PASSWORD
  ===================================================== */

  /**
   * Admin password reset - for when an employee forgets their password.
   * Only ADMIN and SUPER_ADMIN can perform this action.
   * No current password verification required.
   *
   * @param employeeId - The ID of the employee to reset password for
   * @param newPassword - The new password to set
   * @throws Error if not authorized or password doesn't meet requirements
   */
  async function resetEmployeePassword(
    employeeId: number,
    payload: { newPassword: string; confirmPassword: string }
  ): Promise<void> {
    await apiClient.put(`/users/${employeeId}/admin-reset-password`, payload);
  }

  /** Employees still under probation in the caller's company (for the Confirm tab). */
  async function listUnderProbation(): Promise<Employee[]> {
    const res = await apiClient.get<Employee[]>("/employees/under-probation");
    return res.data ?? [];
  }

  /** Confirm a probationary employee — they become active. */
  async function confirmEmployee(employeeId: number): Promise<Employee> {
    const res = await apiClient.put<Employee>(
      `/employees/${employeeId}/confirm`
    );
    return res.data;
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
    listArchivedEmployees,
    listInactiveEmployees,
    archiveEmployee,
    unarchiveEmployee,
    checkDuplicateEmployee,
    reactivateEmployee,
    uploadImage,
    getActiveJobCodes,
    resetEmployeePassword,
    listUnderProbation,
    confirmEmployee,
  };

  export default hrService;

export const EMPLOYEE_CSV_CANONICAL_FIELDS = [
  "employeeNo",
  "firstName",
  "middleName",
  "lastName",
  "gender",
  "prefix",
  "maritalStatus",
  "dateOfBirth",
  "joinDate",
  "probationEndDate",
  "status",
  "birthplace",
  "hometown",
  "nationality",
  "religion",
  "identification",
  "phoneNo",
  "altPhone",
  "email",
  "departmentName",
  "companyRole",
  "designation",
  "workLocation",
  "reportingManagerNo",
  "bankName",
  "iban",
  "basicSalary",
  "housingAllowance",
  "transportAllowance",
  "otherAllowance",
] as const;

export type EmployeeCsvPreview = {
  headers: string[];
  fieldMapping: Record<string, string | null>;
  aiMapped: boolean;
  dataRowCount: number;
  sampleRows: Record<string, string>[];
  warnings?: string[];
};

export type EmployeeCsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { row: number; employeeNo?: string | null; message: string }[];
};

export async function previewEmployeesCsv(file: File): Promise<EmployeeCsvPreview> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<EmployeeCsvPreview>(
    "/employees/import-csv/preview",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importEmployeesCsv(
  file: File,
  mapping?: Record<string, string | null>,
): Promise<EmployeeCsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (mapping) formData.append("mapping", JSON.stringify(mapping));
  const res = await apiClient.post<EmployeeCsvImportResult>(
    "/employees/import-csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}
