import { apiClient } from "./apiClient";
import type { PerformanceGoal, Appraisal } from "@/types/hr";

/* =======================
   TYPES
======================= */

export interface GoalPayload {
  role: string;
  kpi: string;
  description: string;
  weight: number;
  targetDate?: string;
  active?: boolean;
}

export interface AppraisalPayload {
  employeeId: number;
  year: number;
  month?: string;
  status?: string;
  goals?: {
    goalId: number;
    selfRating?: number;
    managerRating?: number;
    selfComment?: string;
    managerComment?: string;
  }[];
  selfComment?: string;
  managerComment?: string;
  employeeAcknowledge?: "agree" | "disagree";
  employeeRebuttal?: string;
}

export interface EmployeeGoalPayload {
  goalId: number;
  selfRating?: number;
  managerRating?: number;
  selfComment?: string;
  managerComment?: string;
}

/* =======================
   GOAL CRUD OPERATIONS
======================= */

/* -------- LIST ALL GOALS -------- */
async function listGoals(companyId?: number) {
  const params = companyId ? { companyId } : {};
  const res = await apiClient.get<PerformanceGoal[]>("/goals", { params });
  return res.data;
}

/* -------- GET GOALS BY ROLE -------- */
async function getGoalsByRole(role: string, companyId?: number) {
  const params: Record<string, string | number> = { role };
  if (companyId) params.companyId = companyId;
  const res = await apiClient.get<PerformanceGoal[]>("/goals", { params });
  return res.data.filter(g => g.active !== false);
}

/* -------- GET GOALS BY COMPANY -------- */
async function getGoalsByCompany(companyId: number) {
  const res = await apiClient.get<PerformanceGoal[]>(`/companies/${companyId}/goals`);
  return res.data;
}

/* -------- CREATE GOAL -------- */
async function createGoal(payload: GoalPayload) {
  const res = await apiClient.post<PerformanceGoal>("/goals", payload);
  return res.data;
}

/* -------- UPDATE GOAL -------- */
async function updateGoal(goalId: number, payload: Partial<GoalPayload>) {
  const res = await apiClient.put<PerformanceGoal>(`/goals/${goalId}`, payload);
  return res.data;
}

/* -------- DELETE GOAL -------- */
async function deleteGoal(goalId: number) {
  await apiClient.delete(`/goals/${goalId}`);
}

/* -------- TOGGLE GOAL STATUS -------- */
async function toggleGoalStatus(goalId: number, active: boolean) {
  const res = await apiClient.patch<PerformanceGoal>(`/goals/${goalId}`, { active });
  return res.data;
}

/* =======================
   APPRAISAL OPERATIONS
======================= */

/* -------- LIST APPRAISALS FOR EMPLOYEE -------- */
async function listAppraisals(employeeId: number) {
  const res = await apiClient.get<Appraisal[]>(`/employees/${employeeId}/appraisals`);
  return res.data;
}

/* -------- GET APPRAISAL BY YEAR -------- */
async function getAppraisalByYear(employeeId: number, year: number) {
  const res = await apiClient.get<Appraisal>(`/employees/${employeeId}/appraisals`, {
    params: { year }
  });
  return res.data;
}

/* -------- CREATE APPRAISAL -------- */
async function createAppraisal(employeeId: number, year: number, payload: Partial<AppraisalPayload> = {}) {
  // Default to current month if not provided (format: YYYY-MM)
  const month = payload.month || new Date().toISOString().slice(0, 7);
  
  const res = await apiClient.post<Appraisal>(`/employees/${employeeId}/appraisals`, {
    year,
    month,
    ...payload
  });
  return res.data;
}

/* -------- UPDATE APPRAISAL -------- */
async function updateAppraisal(appraisalId: number, payload: Partial<AppraisalPayload>) {
  const res = await apiClient.put<Appraisal>(`/appraisals/${appraisalId}`, payload);
  return res.data;
}

/* -------- SUBMIT SELF-ASSESSMENT -------- */
async function submitSelfAssessment(
  appraisalId: number,
  goals: EmployeeGoalPayload[],
  selfComment?: string
) {
  const res = await apiClient.put<Appraisal>(`/appraisals/${appraisalId}/self-assessment`, {
    goals,
    selfComment
  });
  return res.data;
}

/* -------- SUBMIT MANAGER REVIEW -------- */
async function submitManagerReview(
  appraisalId: number,
  goals: EmployeeGoalPayload[],
  managerComment?: string
) {
  const res = await apiClient.put<Appraisal>(`/appraisals/${appraisalId}/manager-review`, {
    goals,
    managerComment
  });
  return res.data;
}

/* -------- EMPLOYEE ACKNOWLEDGMENT -------- */
async function acknowledgeAppraisal(
  appraisalId: number,
  acknowledge: "agree" | "disagree",
  rebuttal?: string
) {
  const res = await apiClient.put<Appraisal>(`/appraisals/${appraisalId}/acknowledge`, {
    employeeAcknowledge: acknowledge,
    employeeRebuttal: rebuttal
  });
  return res.data;
}

/* -------- LOCK/SIGN APPRAISAL -------- */
async function lockAppraisal(appraisalId: number) {
  const res = await apiClient.put<Appraisal>(`/appraisals/${appraisalId}/lock`, {
    status: "completed",
    signedDate: new Date().toISOString().split('T')[0]
  });
  return res.data;
}

/* =======================
   HELPER FUNCTIONS
======================= */

function extractErrorMessage(err: any): string {
  return (
    err?.response?.data?.message ||
    err?.response?.data?.error ||
    err?.message ||
    "Something went wrong"
  );
}

/* =======================
   EXPORT
======================= */

export const goalService = {
  // Goal CRUD
  listGoals,
  getGoalsByRole,
  getGoalsByCompany,
  createGoal,
  updateGoal,
  deleteGoal,
  toggleGoalStatus,
  
  // Appraisal operations
  listAppraisals,
  getAppraisalByYear,
  createAppraisal,
  updateAppraisal,
  submitSelfAssessment,
  submitManagerReview,
  acknowledgeAppraisal,
  lockAppraisal,
  
  // Helper
  extractErrorMessage,
};

export default goalService;

