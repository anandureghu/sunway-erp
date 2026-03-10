import { apiClient } from "./apiClient";

/* =======================
   TYPES
======================= */

export interface RatingScaleItem {
  score: number;
  label: string;
  definition: string;
}

export interface GoalItem {
  id?: number;
  kpi: string;
  description?: string;
  weight: number;
  active?: boolean;
}

export interface GoalsByRole {
  roleName: string;
  goals: GoalItem[];
}

export interface PhaseItem {
  id: string;
  label: string;
  icon: string;
  defaultStart?: string;
  defaultEnd?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  enabled: boolean;
}

export interface AppraisalConfigPayload {
  year: number;
  cycleName: string;
  startMonth: string;
  endMonth: string;
  minGoals: number;
  maxGoals: number;
  enableSelfAssessment: boolean;
  enableMidYear: boolean;
  enablePIP: boolean;
  roles: GoalsByRole[];
  ratingScale?: RatingScaleItem[];
  phases?: PhaseItem[];
}

export interface AppraisalConfigResponse extends AppraisalConfigPayload {
  id: number;
  status: "DRAFT" | "ACTIVE" | "CLOSED";
  createdDate?: string;
  updatedDate?: string;
}

// Default/empty config for initialization
export const DEFAULT_APPRAISAL_CONFIG: AppraisalConfigPayload = {
  year: new Date().getFullYear(),
  cycleName: "",
  startMonth: "January",
  endMonth: "December",
  minGoals: 3,
  maxGoals: 7,
  enableSelfAssessment: true,
  enableMidYear: true,
  enablePIP: true,
  roles: [],
  ratingScale: [],
  phases: [],
};

/* =======================
   API CALLS
======================= */

/**
 * Get appraisal configuration by year
 * Returns null if no config exists for the year
 */
async function getByYear(year: number): Promise<AppraisalConfigResponse | null> {
  try {
    const res = await apiClient.get<AppraisalConfigResponse>(
      `/appraisal-config/year/${year}`
    );
    return res.data;
  } catch (error: any) {
    // Return null if config not found (404)
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Get the active appraisal configuration
 * Returns null if no active config exists
 */
async function getActive(): Promise<AppraisalConfigResponse | null> {
  try {
    const res = await apiClient.get<AppraisalConfigResponse>(
      "/appraisal-config/active"
    );
    return res.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
}

/**
 * Create new appraisal configuration
 */
async function create(payload: AppraisalConfigPayload): Promise<AppraisalConfigResponse> {
  const res = await apiClient.post<AppraisalConfigResponse>(
    "/appraisal-config",
    payload
  );
  return res.data;
}

/**
 * Update existing appraisal configuration by year
 * Uses POST instead of PUT since backend doesn't support PUT method
 */
async function updateByYear(
  year: number,
  payload: AppraisalConfigPayload
): Promise<AppraisalConfigResponse> {
  // Use POST for update since PUT is not supported by backend
  const res = await apiClient.post<AppraisalConfigResponse>(
    `/appraisal-config/year/${year}`,
    payload
  );
  return res.data;
}

/**
 * Save (create or update) appraisal configuration
 * Automatically determines if it should create or update
 */
async function save(
  payload: AppraisalConfigPayload
): Promise<AppraisalConfigResponse> {
  // First try to get existing config to determine if we should update or create
  const existing = await getByYear(payload.year);
  
  if (existing) {
    // Use PUT /{id} — the only update route that exists in your controller
    const res = await apiClient.put<AppraisalConfigResponse>(
      `/appraisal-config/${existing.id}`,
      payload
    );
    return res.data;
  }
  
  return create(payload);
}

/**
 * Save as draft
 */
async function saveDraft(
  payload: AppraisalConfigPayload
): Promise<AppraisalConfigResponse> {
  const res = await apiClient.post<AppraisalConfigResponse>(
    "/appraisal-config/draft",
    payload
  );
  return res.data;
}

/**
 * Save AND activate in one call
 */
async function saveAndActivate(
  payload: AppraisalConfigPayload
): Promise<AppraisalConfigResponse> {
  const res = await apiClient.post<AppraisalConfigResponse>(
    "/appraisal-config/save-and-activate",
    payload
  );
  return res.data;
}

/**
 * Activate appraisal configuration by ID
 */
async function activate(id: number): Promise<AppraisalConfigResponse> {
  const res = await apiClient.put<AppraisalConfigResponse>(
    `/appraisal-config/${id}/activate`
  );
  return res.data;
}

/**
 * Deactivate appraisal configuration by ID
 */
async function deactivate(id: number): Promise<AppraisalConfigResponse> {
  const res = await apiClient.put<AppraisalConfigResponse>(
    `/appraisal-config/${id}/deactivate`
  );
  return res.data;
}

/**
 * Close appraisal configuration by ID
 */
async function close(id: number): Promise<AppraisalConfigResponse> {
  const res = await apiClient.put<AppraisalConfigResponse>(
    `/appraisal-config/${id}/close`
  );
  return res.data;
}

/**
 * Get configuration by year and role (for filling appraisal forms)
 */
async function getByYearAndRole(
  year: number,
  role: string
): Promise<{ role: string; goals: GoalItem[] }> {
  const res = await apiClient.get<{ role: string; goals: GoalItem[] }>(
    `/appraisal-config/year/${year}/role/${encodeURIComponent(role)}`
  );
  return res.data;
}

/**
 * Convenience method to get KPIs for a specific role and year
 * Used by manager view to auto-fill KPI fields
 */
async function getKpisForRole(
  year: number,
  role: string
): Promise<{ kpis: { kpi: string; description: string; weight: number }[] }> {
  try {
    const data = await getByYearAndRole(year, role);
    return {
      kpis: data.goals.map(g => ({
        kpi: g.kpi,
        description: g.description || "",
        weight: g.weight,
      })),
    };
  } catch (error) {
    // Return empty KPIs if not configured
    return { kpis: [] };
  }
}

/**
 * Get all roles configuration for a year
 */
async function getRolesByYear(year: number): Promise<GoalsByRole[]> {
  const res = await apiClient.get<GoalsByRole[]>(
    `/appraisal-config/year/${year}/roles`
  );
  return res.data;
}

/**
 * Close appraisal configuration by year
 * First gets the config by year to get its ID, then closes using PUT
 */
async function removeByYear(year: number): Promise<{ message: string; status: string }> {
  const existing = await getByYear(year);
  
  if (!existing) {
    throw new Error("Config not found");
  }

  const res = await apiClient.put(
    `/appraisal-config/${existing.id}/close`
  );

  return res.data;
}

/**
 * Duplicate configuration from one year to another
 */
async function duplicate(
  fromYear: number,
  toYear: number
): Promise<AppraisalConfigResponse> {
  const res = await apiClient.post<AppraisalConfigResponse>(
    `/appraisal-config/year/${fromYear}/duplicate`,
    { toYear }
  );
  return res.data;
}

/* =======================
   ERROR HANDLING
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

export const appraisalConfigService = {
  // Getters
  getByYear,
  getActive,
  getByYearAndRole,
  getRolesByYear,
  getKpisForRole,
  
  // Create/Update
  create,
  updateByYear,
  save,
  saveDraft,
  saveAndActivate,
  
  // Status changes
  activate,
  deactivate,
  close,
  
  // Utility
  removeByYear,
  duplicate,
  extractErrorMessage,
  
  // Constants
  DEFAULT_APPRAISAL_CONFIG,
};

export default appraisalConfigService;

