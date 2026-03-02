import type { Company } from "./company";

export interface Department {
  id: number;
  departmentCode: string;
  departmentName: string;
  managerId?: number | null;
  companyId?: number;
  company?: Company;
  createdAt: string;
}
