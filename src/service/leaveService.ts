import { apiClient } from "@/service/apiClient";

// ── CORRECTED base paths ──────────────────────────────────────────────────
// GET  /api/employees/{employeeId}/leaves/available-types  → available leave types
// GET  /api/employees/{employeeId}/leaves/preview          → preview leave
// POST /api/employees/{employeeId}/leaves                  → apply leave
// GET  /api/employees/{employeeId}/leaves                  → fetch all leaves (history)
// ────────────────────────────────────────────────────────────────────────────

export interface LeavePreview {
  totalDays: number;
  availableBalance: number;
  remainingAfter: number;
}

export interface LeaveHistoryItem {
  leaveCode: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  dateReported: string;
  totalDays: number;
  leaveStatus: string;
  leaveBalance: number | string;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  details?: string;
  data: T;
}

export const leaveService = {
  /**
   * ✅ FIXED: Fetch available leave types for an employee
   * Endpoint: GET /api/employees/{employeeId}/leaves/available-types
   */
  async fetchAvailableLeaveTypes(employeeId: number) {
    try {
      const response = await apiClient.get(
        `/employees/${employeeId}/leaves/available-types`
      );

      let leaveTypes: string[] = [];

      // Handle various response formats from the API
      if (Array.isArray(response.data)) {
        leaveTypes = response.data;
      } else if (response.data?.leaveTypes && Array.isArray(response.data.leaveTypes)) {
        leaveTypes = response.data.leaveTypes;
      } else if (response.data?.data && Array.isArray(response.data.data)) {
        leaveTypes = response.data.data;
      }

      console.log("✅ Leave types fetched:", leaveTypes);
      return { 
        success: true, 
        message: "Leave types fetched successfully", 
        data: leaveTypes 
      };
    } catch (error: any) {
      console.error("❌ Error fetching leave types:", error?.response?.data ?? error.message);
      return {
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || "Failed to fetch leave types",
        data: [] as string[],
      };
    }
  },

  /**
   * ✅ FIXED: Preview a leave application
   * Endpoint: GET /api/employees/{employeeId}/leaves/preview?leaveType=X&startDate=Y&endDate=Z
   */
  async previewLeave(
    employeeId: number,
    leaveType: string,
    startDate: string,
    endDate: string
  ) {
    try {
      const response = await apiClient.get(
        `/employees/${employeeId}/leaves/preview`,
        { 
          params: { 
            leaveType, 
            startDate, 
            endDate 
          } 
        }
      );

      // Normalize response data
      const preview = normalizePreview(response.data);

      console.log("✅ Preview generated:", preview);
      return { 
        success: true, 
        message: "Preview generated", 
        data: preview 
      };
    } catch (error: any) {
      console.error("❌ Error previewing leave:", error?.response?.data ?? error.message);
      return {
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || "Failed to preview leave",
        data: { 
          totalDays: 0, 
          availableBalance: 0, 
          remainingAfter: 0 
        },
      };
    }
  },

  /**
   * ✅ FIXED: Apply for a leave
   * Endpoint: POST /api/employees/{employeeId}/leaves
   * Body: { leaveType, startDate, endDate, ... }
   */
  async applyLeave(
    employeeId: number,
    payload: {
      leaveType: string;
      startDate: string;
      endDate: string;
      dateReported?: string;
      leaveCode?: string;
      leaveStatus?: string;
      leaveBalance?: number;
    }
  ) {
    try {
      const response = await apiClient.post(
        `/employees/${employeeId}/leaves`,
        payload
      );

      console.log("✅ Leave applied successfully:", response.data);
      return { 
        success: true, 
        message: "Leave applied successfully", 
        data: response.data 
      };
    } catch (error: any) {
      console.error("❌ Error applying leave:", error?.response?.data ?? error.message);
      return {
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || "Failed to apply leave",
        data: null,
      };
    }
  },

  /**
   * ✅ FIXED: Fetch all leave records for an employee
   * Endpoint: GET /api/employees/{employeeId}/leaves
   */
  async fetchLeaveHistory(employeeId: number) {
    try {
      const response = await apiClient.get(
        `/employees/${employeeId}/leaves`
      );

      // Normalize response to array
      const history = normalizeHistoryResponse(response.data);

      console.log("✅ Leave history fetched:", history);
      return { 
        success: true, 
        message: "Leave history fetched", 
        data: history 
      };
    } catch (error: any) {
      console.error("❌ Error fetching leave history:", error?.response?.data ?? error.message);
      return {
        success: false,
        message: error.response?.data?.error || error.response?.data?.message || "Failed to fetch leave history",
        data: [],
      };
    }
  },

  /**
   * Alias for fetchLeaveHistory (backward compatibility)
   */
  async fetchLeaves(employeeId: number) {
    return this.fetchLeaveHistory(employeeId);
  },
};

/* ═══════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════ */

/**
 * ✅ Normalize preview response from various API response shapes
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
    totalDays: pickNumber(
      "totalDays",
      "total_days",
      "total",
      "days",
      "daysRequested",
      "days_requested"
    ),
    availableBalance: pickNumber(
      "availableBalance",
      "available_balance",
      "available",
      "balance",
      "currentBalance",
      "current_balance",
      "remainingLeaves",
      "remaining_leaves"
    ),
    remainingAfter: pickNumber(
      "remainingAfter",
      "remaining_after",
      "remaining",
      "balanceAfter",
      "balance_after",
      "remaining_balance",
      "remainingBalance",
      "remaining_leaves"
    ),
  };
}

/**
 * ✅ Normalize leave history response from various API response shapes
 */
function normalizeHistoryResponse(data: any): LeaveHistoryItem[] {
  if (!data) return [];

  let items: any[] = [];

  // Direct array
  if (Array.isArray(data)) {
    items = data;
  }
  // { leaves: [...] }  ← GET /employees/{id}/leaves controller response
  else if (Array.isArray(data.leaves)) {
    items = data.leaves;
  }
  // { history: [...] }  ← GET /employees/{id}/leaves/history controller response
  else if (Array.isArray(data.history)) {
    items = data.history;
  }
  // { data: [...] }
  else if (Array.isArray(data.data)) {
    items = data.data;
  }
  // Spring Page: { content: [...] }
  else if (Array.isArray(data.content)) {
    items = data.content;
  }

  // Normalize each item and calculate totalDays from dates when not provided
  return items.map((item: any) => {
    const startDate = item.startDate || item.start_date || "";
    const endDate   = item.endDate   || item.end_date   || "";

    const calculatedDays =
      startDate && endDate
        ? Math.max(
            Math.floor(
              (new Date(endDate).getTime() - new Date(startDate).getTime()) / 86_400_000
            ) + 1,
            1
          )
        : 0;

    return {
      leaveCode:    item.leaveCode    || item.leave_code    || "—",
      leaveType:    item.leaveType    || item.leave_type    || "—",
      startDate,
      endDate,
      dateReported: item.dateReported || item.date_reported || "",
      totalDays:    item.totalDays != null ? Number(item.totalDays) : calculatedDays,
      leaveStatus:  item.leaveStatus  || item.leave_status  || "Pending",
      leaveBalance: item.leaveBalance ?? item.leave_balance ?? "",
    };
  });
}