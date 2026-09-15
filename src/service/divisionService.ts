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

export const fetchDivisionsByDepartment = async (
  departmentId: number,
): Promise<Division[]> => {
  try {
    const res = await apiClient.get<Division[]>(
      `/divisions/department/${departmentId}`,
    );
    return res.data ?? [];
  } catch (error) {
    console.error("Error loading divisions for department:", error);
    return [];
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

export const DIVISION_CSV_CANONICAL_FIELDS = [
  "code",
  "name",
  "description",
  "departmentName",
] as const;

export type DivisionCsvPreview = {
  headers: string[];
  fieldMapping: Record<string, string | null>;
  aiMapped: boolean;
  dataRowCount: number;
  sampleRows: Record<string, string>[];
  warnings?: string[];
};

export type DivisionCsvImportResult = {
  created: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: { row: number; code?: string | null; message: string }[];
};

export async function previewDivisionsCsv(file: File): Promise<DivisionCsvPreview> {
  const formData = new FormData();
  formData.append("file", file);
  const res = await apiClient.post<DivisionCsvPreview>(
    "/divisions/import-csv/preview",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}

export async function importDivisionsCsv(
  file: File,
  mapping?: Record<string, string | null>,
): Promise<DivisionCsvImportResult> {
  const formData = new FormData();
  formData.append("file", file);
  if (mapping) formData.append("mapping", JSON.stringify(mapping));
  const res = await apiClient.post<DivisionCsvImportResult>(
    "/divisions/import-csv",
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
  return res.data;
}
