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
  /** COMPLETED grants are closed off and never listed. */
  status: "PENDING" | "PAID" | "COMPLETED";
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

/** Grant one benefit to a group, selected like Benefits Adjustment. */
export interface BenefitGrantBulkRequest {
  scope: BenefitsScope;
  gradeCode?: string | null;
  departmentId?: number | null;
  employeeId?: number | null;
  benefitType: Exclude<BenefitGrantType, "REIMBURSEMENT">;
  amount: number;
  /** yyyy-MM */
  payMonth: string;
  description?: string | null;
}

export interface BenefitGrantBulkResult {
  matched: number;
  created: number;
  skipped: { employeeId: number; employeeName: string; reason: string }[];
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

  /** Grant the same benefit to everyone in a grade / department / the company. */
  createBulk(payload: BenefitGrantBulkRequest): Promise<BenefitGrantBulkResult> {
    return apiClient
      .post<BenefitGrantBulkResult>("/hr/benefit-grants/bulk", payload)
      .then((r) => ({ ...r.data, skipped: r.data?.skipped ?? [] }));
  },

  /** Edit a grant. Pending: everything; paid: description and document only. */
  update(id: number, payload: BenefitGrantRequest, document?: File | null): Promise<BenefitGrant> {
    const formData = new FormData();
    formData.append(
      "data",
      new Blob([JSON.stringify(payload)], { type: "application/json" }),
    );
    if (document) formData.append("document", document, document.name);
    return apiClient
      .put<BenefitGrant>(`/hr/benefit-grants/${id}`, formData)
      .then((r) => r.data);
  },

  /**
   * Opens a grant's supporting document through the API (never expires): PDFs and
   * images open in a new tab, other files (e.g. Word) download.
   */
  async openDocument(id: number): Promise<void> {
    // Open the tab now (inside the click) so popup blockers allow it.
    const tab = window.open("", "_blank");
    try {
      const res = await apiClient.get<Blob>(`/hr/benefit-grants/${id}/document`, {
        responseType: "blob",
      });
      const blob = res.data;
      const type = blob.type || String(res.headers?.["content-type"] ?? "");
      const disposition = String(res.headers?.["content-disposition"] ?? "");
      const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? `benefit-document-${id}`;
      const url = URL.createObjectURL(blob);
      if (type.startsWith("image/") || type === "application/pdf") {
        if (tab) tab.location.href = url;
        else window.open(url, "_blank");
      } else {
        tab?.close();
        const a = document.createElement("a");
        a.href = url;
        a.download = name;
        a.click();
      }
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      tab?.close();
      throw err;
    }
  },

  /** Close off a paid grant — it disappears from the benefits page. */
  complete(id: number): Promise<void> {
    return apiClient.put(`/hr/benefit-grants/${id}/complete`).then(() => undefined);
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
