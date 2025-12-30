import { toast } from "sonner";
import { apiClient } from "./apiClient";

export const fetchDepartments = async () => {
  try {
    const res = await apiClient.get(`/departments`);
    return res.data;
  } catch (error) {
    console.error("Error loading Departments:", error);
    toast.error("Failed to load Departments");
  }
};
