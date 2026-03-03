import type { Company } from "@/types/company";

export interface Department {
  id: number;
  departmentCode: string;
  departmentName: string;
  managerId?: number | null;
  managerFirstName?: string;
  managerLastName?: string;
  companyCode: string;
  companyId: number;
  companyName: string;
  company?: Company;
  createdAt: string;
}
