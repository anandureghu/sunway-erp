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

export interface ApplyLeavePayload {
  leaveType: string;
  startDate: string;
  endDate: string;
  includeWeekends?: boolean;
  /** Optional same-department colleague who covers duties during the leave. */
  delegateId?: number | null;
  /** Optional date the employee heads back to the office after the leave. */
  returnDate?: string;
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
    availableBalance: pickNumber(
      "availableBalance",
      "available_balance",
      "available",
      "balance",
      "currentBalance",
      "current_balance"
    ),
    remainingAfter: pickNumber(
      "remainingAfter",
      "remaining_after",
      "remaining",
      "balanceAfter",
      "balance_after",
      "remaining_balance"
    ),
  };
}

function normalizeArrayResponse<T = any>(data: any, keys: string[] = []): T[] {
  if (Array.isArray(data)) return data;

  for (const key of keys) {
    if (Array.isArray(data?.[key])) {
      return data[key];
    }
  }

  if (Array.isArray(data?.data)) return data.data;

  return [];
}

export const leaveService = {
  async fetchAvailableLeaveTypes(employeeId: number): Promise<LeaveServiceResponse<string[]>> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID", data: [] };
    }

    try {
      const response = await apiClient.get(`/employees/${employeeId}/leaves/available-types`);

      const leaveTypes = normalizeArrayResponse<string>(response.data, ["leaveTypes"]);

      return { success: true, data: leaveTypes };
    } catch (error: unknown) {
      console.error("fetchAvailableLeaveTypes error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to fetch leave types"),
        data: [],
      };
    }
  },

  async previewLeave(
    employeeId: number,
    leaveType: string,
    startDate: string,
    endDate: string,
    includeWeekends = false
  ): Promise<LeaveServiceResponse<LeavePreview>> {
    if (!employeeId || employeeId <= 0) {
      return {
        success: false,
        message: "Invalid employee ID",
        data: { totalDays: 0, availableBalance: 0, remainingAfter: 0 },
      };
    }

    try {
      const response = await apiClient.get(`/employees/${employeeId}/leaves/preview`, {
        params: { leaveType, startDate, endDate, includeWeekends },
      });

      return { success: true, data: normalizePreview(response.data) };
    } catch (error: unknown) {
      console.error("previewLeave error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to preview leave"),
        data: { totalDays: 0, availableBalance: 0, remainingAfter: 0 },
      };
    }
  },

  async applyLeave(
    employeeId: number,
    payload: ApplyLeavePayload
  ): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID" };
    }

    try {
      const response = await apiClient.post(`/employees/${employeeId}/leaves`, payload);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("applyLeave error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to apply leave"),
      };
    }
  },

  async applyLeaveWithDocument(
    employeeId: number,
    payload: ApplyLeavePayload,
    supportingDocument?: File
  ): Promise<LeaveServiceResponse> {
    // Note: backend expects multipart body with `data` and optional `supportingDocument`.

    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID" };
    }

    try {
      const form = new FormData();

      form.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );

      if (supportingDocument) {
        form.append("supportingDocument", supportingDocument);
      }

      const response = await apiClient.post(`/employees/${employeeId}/leaves`, form, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("applyLeaveWithDocument error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to apply leave with document"),
      };
    }
  },

  async fetchCanApprove(): Promise<boolean> {
    try {
      const response = await apiClient.get<{ canApprove: boolean }>(
        `/leaves/approvals/can-approve`,
      );
      return !!response.data?.canApprove;
    } catch (error: unknown) {
      console.error("fetchCanApprove error:", error);
      return false;
    }
  },

  async fetchPendingApprovals(): Promise<LeaveServiceResponse> {
    try {
      const response = await apiClient.get(`/leaves/approvals/pending`);
      return {
        success: true,
        data: normalizeArrayResponse(response.data, ["approvals"]),
      };
    } catch (error: unknown) {
      console.error("fetchPendingApprovals error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to load leave approvals"),
        data: [],
      };
    }
  },

  /** Company-wide history of decided leaves (approved / completed / rejected). */
  async fetchLeaveApprovalsHistory(): Promise<LeaveServiceResponse> {
    try {
      const response = await apiClient.get(`/leaves/approvals/history`);
      return {
        success: true,
        data: normalizeArrayResponse(response.data, ["approvals"]),
      };
    } catch (error: unknown) {
      console.error("fetchLeaveApprovalsHistory error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to load leave approvals"),
        data: [],
      };
    }
  },

  async approveLeave(leaveId: number): Promise<LeaveServiceResponse> {
    if (!leaveId || leaveId <= 0) {
      return { success: false, message: "Invalid leave ID" };
    }

    try {
      const response = await apiClient.post(`/leaves/${leaveId}/approve`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("approveLeave error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to approve leave"),
      };
    }
  },

  async rejectLeave(leaveId: number): Promise<LeaveServiceResponse> {
    if (!leaveId || leaveId <= 0) {
      return { success: false, message: "Invalid leave ID" };
    }

    try {
      const response = await apiClient.post(`/leaves/${leaveId}/reject`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("rejectLeave error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to reject leave"),
      };
    }
  },

  async fetchLeaveHistory(employeeId: number): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID", data: [] };
    }

    try {
      const response = await apiClient.get(`/employees/${employeeId}/leaves`);

      return {
        success: true,
        data: normalizeArrayResponse(response.data, ["leaves", "history"]),
      };
    } catch (error: unknown) {
      console.error("fetchLeaveHistory error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to fetch leave history"),
        data: [],
      };
    }
  },

  async updateLeave(
    employeeId: number,
    leaveId: number,
    payload: ApplyLeavePayload
  ): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID" };
    }

    if (!leaveId || leaveId <= 0) {
      return { success: false, message: "Invalid leave ID" };
    }

    try {
      const response = await apiClient.put(`/employees/${employeeId}/leaves/${leaveId}`, payload);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("updateLeave error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to update leave"),
      };
    }
  },

  async updateLeaveWithDocument(
    employeeId: number,
    leaveId: number,
    payload: ApplyLeavePayload,
    supportingDocument?: File
  ): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID" };
    }

    if (!leaveId || leaveId <= 0) {
      return { success: false, message: "Invalid leave ID" };
    }

    try {
      const form = new FormData();

      form.append(
        "data",
        new Blob([JSON.stringify(payload)], { type: "application/json" })
      );

      if (supportingDocument) {
        form.append("supportingDocument", supportingDocument);
      }

      const response = await apiClient.put(
        `/employees/${employeeId}/leaves/${leaveId}`,
        form
      );

      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("updateLeaveWithDocument error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to update leave with document"),
      };
    }
  },

  /**
   * Confirm an employee's return to office for an approved leave. The backend
   * deducts the actual days taken (start → day before `reportedDate`) and moves
   * the leave to COMPLETED. `reportedDate` is an ISO date string (yyyy-MM-dd).
   */
  async confirmReturn(
    employeeId: number,
    leaveId: number,
    reportedDate: string
  ): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID" };
    }
    if (!leaveId || leaveId <= 0) {
      return { success: false, message: "Invalid leave ID" };
    }
    if (!reportedDate) {
      return { success: false, message: "Reported-to-office date is required" };
    }

    try {
      const response = await apiClient.post(
        `/employees/${employeeId}/leaves/${leaveId}/return`,
        { reportedDate }
      );
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("confirmReturn error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to confirm return"),
      };
    }
  },

  async cancelLeave(employeeId: number, leaveId: number): Promise<LeaveServiceResponse> {
    if (!employeeId || employeeId <= 0) {
      return { success: false, message: "Invalid employee ID" }; 
    }

    if (!leaveId || leaveId <= 0) {
      return { success: false, message: "Invalid leave ID" };
    }

    try {
      const response = await apiClient.delete(`/employees/${employeeId}/leaves/${leaveId}`);
      return { success: true, data: response.data };
    } catch (error: unknown) {
      console.error("cancelLeave error:", error);
      return {
        success: false,
        message: getErrorMessage(error, "Failed to cancel leave"),
      };
    }
  },
};