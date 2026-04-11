import { apiClient } from "@/service/apiClient";

const BASE = "/employees";

export interface LeavePreview {
  totalDays: number;
  availableBalance: number;
  remainingAfter: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  details?: string;
  data: T;
}

/**
 * Leave Service - Handles all leave-related API calls
 * 
 * IMPORTANT: This service wraps all responses in a structured format
 * so the frontend can consistently handle success/error cases.
 */
export const leaveService = {
  /**
   * Fetch available leave types for an employee
   * Returns: { success: true, data: ["Annual Leave", ...] }
   *       OR { success: false, message: "...", data: [] }
   */
  async fetchAvailableLeaveTypes(employeeId: number) {
    try {
      const response = await apiClient.get(
        `${BASE}/${employeeId}/leaves/available-types`
      );

      // Handle different response formats from backend
      let leaveTypes: string[] = [];
      
      if (Array.isArray(response.data)) {
        // Direct array response: ["Annual Leave", "Sick Leave", ...]
        leaveTypes = response.data;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        // Nested response: { data: ["Annual Leave", ...], ... }
        leaveTypes = response.data.data;
      } else if (response.data?.leaveTypes && Array.isArray(response.data.leaveTypes)) {
        // Other nested: { leaveTypes: [...], ... }
        leaveTypes = response.data.leaveTypes;
      }

      return {
        success: true,
        message: "Leave types fetched successfully",
        data: leaveTypes
      };
    } catch (error: any) {
      // Extract error details from response
      const errorMessage = 
        error.response?.data?.message || 
        error.response?.data?.error || 
        "Failed to fetch leave types";
      
      const errorDetails = 
        error.response?.data?.details || 
        error.message || 
        "Unknown error";

      console.error(`Error fetching leave types: ${errorMessage}`, errorDetails);

      return {
        success: false,
        message: errorMessage,
        details: errorDetails,
        data: [] // Always return empty array for consistency
      };
    }
  },

  /**
   * Preview a leave application
   * Shows how many days will be used and remaining balance
   */
  async previewLeave(
    employeeId: number,
    leaveType: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const response = await apiClient.get<LeavePreview>(
        `${BASE}/${employeeId}/leaves/preview`,
        {
          params: { leaveType, startDate, endDate },
        }
      );
      return {
        success: true,
        message: "Preview generated",
        data: response.data
      };
    } catch (error: any) {
      console.error("Error previewing leave:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to preview leave",
        details: error.response?.data?.details || error.message,
        data: {
          totalDays: 0,
          availableBalance: 0,
          remainingAfter: 0
        }
      };
    }
  },

  /**
   * Apply for a leave
   * Creates a new leave request
   */
  async applyLeave(
    employeeId: number,
    payload: { leaveType: string; startDate: string; endDate: string }
  ) {
    try {
      const response = await apiClient.post(
        `${BASE}/${employeeId}/leaves`,
        payload
      );
      return {
        success: true,
        message: "Leave applied successfully",
        data: response.data
      };
    } catch (error: any) {
      console.error("Error applying leave:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to apply leave",
        details: error.response?.data?.details || error.message,
        data: null
      };
    }
  },

  /**
   * Fetch leave history
   * Gets all past and current leave records
   */
  async fetchLeaveHistory(employeeId: number) {
    try {
      const response = await apiClient.get(
        `${BASE}/${employeeId}/leaves/history`
      );
      return {
        success: true,
        message: "Leave history fetched",
        data: response.data
      };
    } catch (error: any) {
      console.error("Error fetching leave history:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch leave history",
        details: error.response?.data?.details || error.message,
        data: []
      };
    }
  },

  /**
   * Fetch all leaves (GET /api/employees/{id}/leaves)
   */
  async fetchLeaves(employeeId: number) {
    try {
      const response = await apiClient.get(`${BASE}/${employeeId}/leaves`);
      return {
        success: true,
        message: "Leaves fetched",
        data: response.data
      };
    } catch (error: any) {
      console.error("Error fetching leaves:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to fetch leaves",
        details: error.response?.data?.details || error.message,
        data: []
      };
    }
  },
};
