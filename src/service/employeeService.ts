import { toast } from "sonner";
import { apiClient } from "./apiClient";

export const fetchEmployees = async () => {
  try {
    const res = await apiClient.get(`/employees`);
    return res.data;
  } catch (error) {
    console.error("Error loading employees:", error);
    toast.error("Failed to load employees");
  }
};

/* =====================================================
   FETCH EMPLOYEES WITH MANAGER JOB TITLE
   (for department manager selection)
===================================================== */
export const fetchManagers = async (companyId?: number) => {
  try {
    if (!companyId) {
      toast.error("Company ID is required");
      return [];
    }

    const res = await apiClient.get(
      `/employees/managers?companyId=${companyId}`
    );

    return res.data;
  } catch (error) {
    console.error("Error loading managers:", error);
    toast.error("Failed to load managers");
    return [];
  }
};
