import { toast } from "sonner";
import { apiClient } from "./apiClient";

export const fetchEmployees = async () => {
  try {
    const res = await apiClient.get(`/users`);
    return res.data;
  } catch (error) {
    console.error("Error loading users:", error);
    toast.error("Failed to load users");
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
      `/employees/company/${companyId}/managers`
    );

    return res.data;
  } catch (error) {
    console.error("Error loading managers:", error);
    toast.error("Failed to load managers");
    return [];
  }
};
