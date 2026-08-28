export interface HrDashboardKpis {
  totalEmployees: number;
  activeEmployees: number;
  employeesOnLeave: number;
  newJoinersThisMonth: number;
  resignationsThisMonth: number;
  qidExpiring30d: number;
  contractsExpiring30d: number;
  probationEndingSoon: number;
}

export interface HrPendingApprovals {
  leaveRequests: number;
  overtimeRequests: number;
  employeeTransfers: number;
  employeeRegistrations: number;
  contractRenewals: number;
}

export interface HrComplianceAlerts {
  qidExpiring30d: number;
  passportExpiring30d: number;
  vaccinationExpiring30d: number;
  contractsExpiring30d: number;
  probationEndingSoon: number;
}

export interface HrWorkforceStatusToday {
  present: number;
  onLeave: number;
  absent: number;
  total: number;
}

export interface HrEmployeesByDepartment {
  departmentId: number;
  departmentName: string;
  employeeCount: number;
  percent: number;
}

export interface HrLeaveSummaryThisMonth {
  totalRequests: number;
  approved: number;
  pending: number;
  rejected: number;
  onLeaveToday: number;
}

export interface HrLeaveTrendPoint {
  yearMonth: string;
  count: number;
}

export interface HrUpcomingEvent {
  type: string;
  employeeId: number;
  employeeName: string;
  eventDate: string;
  daysLeft: number;
}

export interface HrRecentActivity {
  id?: string | number;
  description: string;
  employeeName: string;
  occurredAt: string;
}

export interface HrDocumentsExpiring {
  qidExpiring: number;
  passportExpiring: number;
  visaExpiring: number;
  contractsExpiring: number;
  otherDocsExpiring: number;
}

export interface HrDashboard {
  kpis: HrDashboardKpis;
  pendingApprovals: HrPendingApprovals;
  complianceAlerts: HrComplianceAlerts;
  workforceStatusToday: HrWorkforceStatusToday;
  employeesByDepartment: HrEmployeesByDepartment[];
  leaveSummaryThisMonth: HrLeaveSummaryThisMonth;
  leaveTrendLast12Months: HrLeaveTrendPoint[];
  upcomingHrEvents: HrUpcomingEvent[];
  recentHrActivities: HrRecentActivity[];
  documentsExpiring: HrDocumentsExpiring;
  generatedAt: string;
}
