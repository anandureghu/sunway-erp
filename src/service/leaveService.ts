import { apiClient } from "@/service/apiClient";
import axios from "axios";

export interface LeavePreview {
  totalDays: number;
  availableBalance: number;
  remainingAfter: number;
}

export interface LeaveServiceResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
}

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError(error)) {
    return (
      error.response?.data?.error ||
      error.response?.data?.message ||
      error.message ||
      fallback
    );
  }

  if (error instanceof Error) {
    return error.message;
  }

  return fallback;
};

/**
 * Leave Service for HR Manager and Department Manager leave approvals.
 * 
 * These endpoints allow managers to view and approve their subordinates' leave requests.
 * The backend uses the authenticated user's session to determine the manager,
 * so the employeeId in the URL identifies whose subordinates' requests to fetch/approve.
 */
export const leaveService = {
  /**
   * Fetch available leave types for an employee.
   * Endpoint: GET /api/employees/{employeeId}/leaves/available-types
   */
  async fetchAvailableLeaveTypes(employeeId: number): Promise<LeaveServiceResponse<string[]>> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID", data: [] };
    }

    try {
      const response = await apiClient.get(`/employees/${employeeId}/leaves/available-types`);
      let leaveTypes: string[] = [];

      // Handle various response formats from the API
      if (Array.isArray(response.data)) {
        leaveTypes = response.data;
      } else if (response.data?.leaveTypes && Array.isArray(response.data.leaveTypes)) {
        leaveTypes = response.data.leaveTypes;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        leaveTypes = response.data.data;
      }

      return { success: true, data: leaveTypes };
    } catch (error: unknown) {
      console.error("fetchAvailableLeaveTypes error:", error);
      return { success: false, message: getErrorMessage(error, "Failed to fetch leave types"), data: [] };
    }
  },

  /**
   * Preview a leave application.
   * Endpoint: GET /api/employees/{employeeId}/leaves/preview
   */
  async previewLeave(
    employeeId: number,
    leaveType: string,
    startDate: string,
    endDate: string
  ): Promise<LeaveServiceResponse<LeavePreview>> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID", data: { totalDays: 0, availableBalance: 0, remainingAfter: 0 } };
    }

    try {
      const response = await apiClient.get(
        `/employees/${employeeId}/leaves/preview`,
        { params: { leaveType, startDate, endDate } }
      );

      const preview = normalizePreview(response.data);
      return { success: true, data: preview };
    } catch (error: unknown) {
      console.error("previewLeave error:", error);
      return { success: false, message: getErrorMessage(error, "Failed to preview leave"), data: { totalDays: 0, availableBalance: 0, remainingAfter: 0 } };
    }
  },

  /**
   * Apply for a leave.
   * Endpoint: POST /api/employees/{employeeId}/leaves
   */
  async applyLeave(
    employeeId: number,
    payload: {
      leaveType: string;
      startDate: string;
      endDate: string;
      dateReported?: string;
      leaveCode?: string;
      leaveBalance?: number;
    }
  ): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID" };
    }

    try {
      const response = await apiClient.post(`/employees/${employeeId}/leaves`, payload);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("applyLeave error:", error);
      return { success: false, message: getErrorMessage(error, "Failed to apply leave") };
    }
  },

  /**
   * Upload a supporting document for a leave.
   * Endpoint: POST /api/employees/{employeeId}/leaves/{leaveCode}/document
   */
  async uploadLeaveDocument(employeeId: number, leaveCode: string, file: File): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID" };
    }

    if (!leaveCode) {
      return { success: false, message: "Invalid leave code" };
    }

    try {
      const form = new FormData();
      form.append("file", file);
      const response = await apiClient.post(`/employees/${employeeId}/leaves/${leaveCode}/document`, form, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("uploadLeaveDocument error:", error);
      return { success: false, message: getErrorMessage(error, "Failed to upload document") };
    }
  },

  /**
   * Fetch pending leave approvals for a manager's subordinates.
   * Endpoint: GET /api/employees/{employeeId}/leaves/pending-approvals
   */
  async fetchPendingApprovals(employeeId: number): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return {
        success: false,
        message: "Invalid manager employee ID. Please ensure you are logged in as an employee with approval permissions.",
      };
    }

    try {
      const response = await apiClient.get(`/employees/${employeeId}/leaves/pending-approvals`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("fetchPendingApprovals error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to load leave approvals"),
      };
    }
  },

  /**
   * Approve a leave request for an employee.
   * Endpoint: POST /api/employees/{employeeId}/leaves/{leaveId}/approve
   */
  async approveLeave(employeeId: number, leaveId: number): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return {
        success: false,
        message: "Invalid employee ID",
      };
    }

    if (!leaveId || leaveId <= 0) {
      return {
        success: false,
        message: "Invalid leave ID",
      };
    }

    try {
      const response = await apiClient.post(`/employees/${employeeId}/leaves/${leaveId}/approve`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("approveLeave error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to approve leave"),
      };
    }
  },

/**
 * Reject a leave request for an employee.
   * Endpoint: POST /api/employees/{employeeId}/leaves/{leaveId}/reject
   */
  async rejectLeave(employeeId: number, leaveId: number): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return {
        success: false,
        message: "Invalid employee ID",
      };
    }

    if (!leaveId || leaveId <= 0) {
      return {
        success: false,
        message: "Invalid leave ID",
      };
    }

    try {
      const response = await apiClient.post(`/employees/${employeeId}/leaves/${leaveId}/reject`);
      return {
        success: true,
        data: response.data,
      };
    } catch (error: unknown) {
      console.error("rejectLeave error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to reject leave"),
      };
    }
  },

  /**
   * Fetch leave history for an employee.
   * Endpoint: GET /api/employees/{employeeId}/leaves
   */
  async fetchLeaveHistory(employeeId: number): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID", data: [] };
    }

    try {
      const response = await apiClient.get(`/employees/${employeeId}/leaves`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("fetchLeaveHistory error:", error);
      return { success: false, message: getErrorMessage(error, "Failed to fetch leave history"), data: [] };
    }
  },
};

/**
 * Normalize preview response from API
 */
function normalizePreview(data: any): LeavePreview {
  const pickNumber = (...keys: string[]) => {
    for (const k of keys) {
      if (data == null) break;
      const v = data[k];
      if (v !== undefined && v !== null && v !== "") {
        return Number(v);
      }
    }
    return 0;
  };

  return {
    totalDays: pickNumber("totalDays", "total_days", "total", "days", "daysRequested"),
    availableBalance: pickNumber("availableBalance", "available_balance", "available", "balance", "currentBalance", "current_balance"),
    remainingAfter: pickNumber("remainingAfter", "remaining_after", "remaining", "balanceAfter", "balance_after", "remaining_balance"),
  };
}
