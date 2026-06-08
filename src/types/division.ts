import type { Company } from "./company";
import type { User } from "./hr";

export interface Division {
  id: number;
  code: string;
  name: string;
  description?: string;
  manager?: User;
  managerId?: number | null;
  managerFirstName?: string;
  managerLastName?: string;
  company?: Company;
  companyId: number;
  companyName?: string;
  companyCode?: string;
  createdAt?: string;
}

export interface DivisionPayload {
  code: string;
  name: string;
  description?: string;
  managerId?: number | null;
  departmentId?: number | null;
  companyId?: number;
}

export interface DivisionResponseDTO {
  id: number;
  code: string;
  name: string;
  description?: string;
  managerId?: number | null;
  managerFirstName?: string;
  managerLastName?: string;
  departmentId?: number | null;
  departmentCode?: string;
  departmentName?: string;
  companyId: number;
  companyName?: string;
  companyCode?: string;
}
