import type { Company } from "./company";

export interface Department {
  id: number;
  departmentCode: string;
  departmentName: string;
  managerId?: number | null;
  company: Company;
  createdAt: string;
}
