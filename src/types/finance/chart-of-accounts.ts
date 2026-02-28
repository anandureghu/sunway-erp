import type { CoaType } from "@/types/coa";

export interface ChartOfAccounts {
  id: number;
  accountNo: string;
  accountCode: string;
  accountName: string;
  description: string;
  type: CoaType;
  balance: number;
  companyId: number;

  parentId: number | null;
  parentName: string | null;
  parentType: string | null;
  parentCode: string | null;
  parentAccountNo: string | null;
  interCompanyNumber: string | null;

  asOfDate: string | null;
  createdAt: string;
  updatedAt: string;
  createdById: number | null;
  createdByName: string | null;
  updatedById: number | null;
  updatedByName: string | null;

  departmentId: number | null;
  departmentName: string | null;
  departmentCode: string | null;

  projectCode: string | null;
}
