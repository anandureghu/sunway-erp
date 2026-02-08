import { toast } from "sonner";
import { apiClient } from "./apiClient";

export const fetchCurrency = async () => {
  try {
    const res = await apiClient.get(`/currencies`);
    return res.data;
  } catch (error) {
    console.error("Error loading currencies:", error);
    toast.error("Failed to load currencies");
  }
};
