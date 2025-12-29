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
