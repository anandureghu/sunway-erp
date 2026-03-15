import { toast } from "sonner";
import { apiClient } from "./apiClient";

// ── existing — untouched ──────────────────────────────────────────────────────

export const fetchUsers = async () => {
  try {
    const res = await apiClient.get(`/users`);
    return res.data;
  } catch (error) {
    console.error("Error loading users:", error);
    toast.error("Failed to load users");
  }
};

// ── existing interface — untouched ────────────────────────────────────────────

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// ── new interface ─────────────────────────────────────────────────────────────

export interface ProfileResponse {
  userId: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  companyRole: string | null;
  createdAt: string;
  // employee (nullable — user may not have an employee record)
  employeeId: number | null;
  employeeNo: string | null;
  firstName: string | null;
  lastName: string | null;
  phoneNo: string | null;
  // company
  companyId: number | null;
  companyName: string | null;
  // department
  departmentId: number | null;
  departmentName: string | null;
}

// ── new function ──────────────────────────────────────────────────────────────

export const getProfile = async (userId: number): Promise<ProfileResponse> => {
  try {
    const res = await apiClient.get(`/users/${userId}/profile`);
    console.log('raw response:', res.data);
    return res.data;  // ← backend returns { success, message, data: {...} }
  } catch (error: any) {
    console.error("Failed to load profile:", error);
    toast.error(error?.response?.data?.message || "Failed to load profile");
    throw error;
  }
};

// ── modified: POST → PUT to match Spring Boot endpoint ───────────────────────

export const changePassword = async (
  userId: number,
  payload: ChangePasswordPayload
): Promise<void> => {
  try {
    await apiClient.put(`/users/${userId}/password`, payload);  // ← PUT, not POST
    // ✅ toast moved to UserProfilePage — don't double-toast
  } catch (error: any) {
    console.error("Password change failed:", error);
    toast.error(error?.response?.data?.message || "Failed to change password");
    throw error;
  }
};