import { apiClient } from "./apiClient";

export type BenefitsScope =
  | "GRADE_CODE"
  | "DEPARTMENT"
  | "EMPLOYEE"
  | "ALL_EMPLOYEES";

/** Pay-component keys the adjustment can raise. */
export type BenefitsComponent =
  | "BASIC"
  | "HOUSING"
  | "TRANSPORT"
  | "FOOD"
  | "TRAVEL"
  | "OTHER";

/** Sub-type when adjusting the OTHER allowance component. */
export type OtherBenefitType =
  | "ANNUAL_TICKET"
  | "BONUS"
  | "ADVANCE_SALARY"
  | "REIMBURSEMENT";

export interface BenefitsAdjustmentRequest {
  scope: BenefitsScope;
  gradeCode?: string | null;
  departmentId?: number | null;
  employeeId?: number | null;
  percentage: number;
  components: BenefitsComponent[];
  /** Required when components includes OTHER. */
  otherBenefitType?: OtherBenefitType | null;
}

export interface BenefitsAdjustmentResult {
  matched: number;
  adjusted: number;
  adjustedEmployees: string[];
}

export const benefitsAdjustmentService = {
  /** Distinct salary-grade codes for the current company. */
  gradeCodes(): Promise<string[]> {
    return apiClient
      .get<string[]>("/hr/benefits-adjustment/grade-codes")
      .then((r) => (Array.isArray(r.data) ? r.data : []))
      .catch(() => []);
  },

  adjust(payload: BenefitsAdjustmentRequest): Promise<BenefitsAdjustmentResult> {
    return apiClient
      .post<BenefitsAdjustmentResult>("/hr/benefits-adjustment", payload)
      .then((r) => r.data);
  },
};
