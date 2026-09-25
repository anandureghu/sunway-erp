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

export interface BenefitsAdjustmentRequest {
  scope: BenefitsScope;
  gradeCode?: string | null;
  departmentId?: number | null;
  employeeId?: number | null;
  percentage: number;
  components: BenefitsComponent[];
}

export interface BenefitsAdjustmentResult {
  matched: number;
  adjusted: number;
  adjustedEmployees: string[];
}

/** One-off benefits granted to an employee and paid through payroll. */
export type BenefitGrantType = "ANNUAL_TICKET" | "BONUS" | "REIMBURSEMENT";

export interface BenefitGrant {
  id: number;
  employeeId: number;
  employeeNo?: string | null;
  employeeName?: string | null;
  benefitType: BenefitGrantType;
  benefitTypeLabel?: string | null;
  amount: number;
  /** yyyy-MM-01 */
  payMonth: string;
  description?: string | null;
  documentUrl?: string | null;
  status: "PENDING" | "PAID";
  payrollId?: number | null;
  createdAt?: string | null;
}

export interface BenefitGrantRequest {
  employeeId: number;
  benefitType: BenefitGrantType;
  amount: number;
  /** yyyy-MM */
  payMonth: string;
  description?: string | null;
}

export interface AnnualTicketCheck {
  alreadyGranted: boolean;
  existing?: BenefitGrant;
}

export const benefitGrantService = {
  list(): Promise<BenefitGrant[]> {
    return apiClient
      .get<BenefitGrant[]>("/hr/benefit-grants")
      .then((r) => (Array.isArray(r.data) ? r.data : []));
  },

  annualTicketCheck(
    employeeId: number,
    payMonth: string,
  ): Promise<AnnualTicketCheck> {
    return apiClient
      .get<AnnualTicketCheck>("/hr/benefit-grants/annual-ticket-check", {
        params: { employeeId, payMonth },
      })
      .then((r) => r.data);
  },

  create(payload: BenefitGrantRequest, document?: File | null): Promise<BenefitGrant> {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
    if (document) formData.append("document", document, document.name);
    return apiClient
      .post<BenefitGrant>("/hr/benefit-grants", formData)
      .then((r) => r.data);
  },

  remove(id: number): Promise<void> {
    return apiClient.delete(`/hr/benefit-grants/${id}`).then(() => undefined);
  },
};

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
