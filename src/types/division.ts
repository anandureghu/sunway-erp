import type { Company } from "./company";
import type { Department } from "./department";
import type { User } from "./hr";

export interface Division {
  id: number;
  code: string;
  name: string;
  manager: User;
  company: Company;
  department: Department;
  createdAt: string;
  description?: string;
}

export interface DivisionResponseDTO {
  id: number;
  code: string;
  name: string;
  managerId: number;
  managerFirstName: string;
  managerLastName: string;

  companyId: number;
  companyName: string;
  companyCode: string;

  departmentId: number;
  departmentName: string;
  departmentCode: string;

  createdAt: string;
  description?: string;
}
