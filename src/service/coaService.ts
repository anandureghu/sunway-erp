import { toast } from "sonner";
import { apiClient } from "./apiClient";

export const fetchCOAAccounts = async (companyId: string) => {
  try {
    const res = await apiClient.get(
      `/finance/chart-of-accounts/company/${companyId}`
    );
    return res.data;
  } catch (error) {
    console.error("Error loading accounts:", error);
    toast.error("Failed to load Chart of Accounts");
  }
};
