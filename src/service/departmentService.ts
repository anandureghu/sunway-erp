import { toast } from "sonner";
import { apiClient } from "./apiClient";

/**
 * Fetch departments by companyId
 * All requests now require companyId as per backend changes
 */
export const fetchDepartments = async (companyId: number) => {
  try {
    const res = await apiClient.get(`/companies/${companyId}/departments`);
    return res.data;
  } catch (error) {
    console.error("Error loading Departments:", error);
    toast.error("Failed to load Departments");
  }
};

/**
 * Create department - requires companyId
 */
export const createDepartment = async (companyId: number, data: any) => {
  try {
    const res = await apiClient.post(`/companies/${companyId}/departments`, data);
    return res.data;
  } catch (error) {
    console.error("Error creating Department:", error);
    toast.error("Failed to create Department");
    throw error;
  }
};

/**
 * Update department - requires companyId
 */
export const updateDepartment = async (companyId: number, departmentId: number, data: any) => {
  try {
    const res = await apiClient.put(`/companies/${companyId}/departments/${departmentId}`, data);
    return res.data;
  } catch (error) {
    console.error("Error updating Department:", error);
    toast.error("Failed to update Department");
    throw error;
  }
};

/**
 * Delete department - requires companyId
 */
export const deleteDepartment = async (companyId: number, departmentId: number) => {
  try {
    await apiClient.delete(`/companies/${companyId}/departments/${departmentId}`);
    return true;
  } catch (error) {
    console.error("Error deleting Department:", error);
    toast.error("Failed to delete Department");
    throw error;
  }
};
