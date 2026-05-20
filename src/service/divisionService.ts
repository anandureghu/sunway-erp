import { toast } from "sonner";
import { apiClient } from "./apiClient";
import type { Division, DivisionPayload } from "@/types/division";

/**
 * Backend: `/api/divisions` is the catch-all list/CRUD endpoint and is
 * scoped to the JWT's company by default. `GET /api/divisions/company/{id}`
 * is the explicit company-scoped lookup mirroring departmentService.
 */

export const fetchDivisions = async (companyId?: number): Promise<Division[]> => {
  try {
    const url = companyId != null
      ? `/divisions/company/${companyId}`
      : "/divisions";
    const res = await apiClient.get<Division[]>(url);
    return res.data ?? [];
  } catch (error) {
    console.error("Error loading Divisions:", error);
    toast.error("Failed to load Divisions");
    return [];
  }
};

export const createDivision = async (payload: DivisionPayload): Promise<Division> => {
  try {
    const clean = Object.fromEntries(
      Object.entries(payload).filter(([, v]) => v !== undefined),
    );
    const res = await apiClient.post<Division>("/divisions", clean);
    return res.data;
  } catch (error) {
    console.error("Error creating Division:", error);
    toast.error("Failed to create Division");
    throw error;
  }
};

export const deleteDivision = async (id: number): Promise<boolean> => {
  try {
    await apiClient.delete(`/divisions/${id}`);
    return true;
  } catch (error) {
    console.error("Error deleting Division:", error);
    toast.error("Failed to delete Division");
    throw error;
  }
};
