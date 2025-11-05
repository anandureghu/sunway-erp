export type EmployeeStatus = "Active" | "Inactive" | "On Leave";
export type Gender = "Male" | "Female" | "Other";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";

export interface Employee {
  id: string;
  employeeNo: string;
  firstName: string;
  lastName: string;
  status: EmployeeStatus;
  department?: string;
  designation?: string;
  dateOfBirth?: string;  // yyyy-mm-dd
  gender?: Gender;
  joinDate?: string;     // yyyy-mm-dd
  nationality?: string;
  nationalId?: string;
  maritalStatus?: MaritalStatus;
}

export interface CurrentJob {
  jobCode: string;
  departmentCode: string;
  departmentName: string;
  jobTitle: string;
  jobLevel: string;
  grade: string;
  startDate: string;      // yyyy-mm-dd
  effectiveFrom: string;  // yyyy-mm-dd
  expectedEndDate?: string; // yyyy-mm-dd
}

export type LeaveStatus = "Pending" | "Approved" | "Rejected";
export type LeaveType = "Annual Leave" | "Sick Leave" | "Emergency Leave" | "Unpaid Leave";

export interface LeaveRecord {
  leaveCode: string;
  leaveType: LeaveType;
  startDate: string;     // yyyy-mm-dd
  endDate: string;       // yyyy-mm-dd
  dateReported: string;  // yyyy-mm-dd
  leaveBalance: string;
  leaveStatus: LeaveStatus;
  totalDays: number;
}

export interface Salary {
  basicSalary: string;
  transportation: "Yes" | "No";
  transportationAllowance: string;
  travelAllowance: string;
  otherAllowance: string;
  totalAllowance: string;
  compensationStatus: "Active" | "Inactive";
  effectiveFrom: string;  // yyyy-mm-dd
  effectiveTo: string;    // yyyy-mm-dd
}

export interface Loan {
  loanCode: string;
  loanAmount: string;
  notes: string;
  loanType: string;
  loanPeriod: string;
  startDate: string;      // yyyy-mm-dd
  monthlyDeductions: string;
  loanStatus: string;
  balance: string;
  grossPay: string;
  deductionAmount: string;
  netPay: string;
}

export interface CompanyProperty {
  itemCode: string;
  itemName: string;
  itemStatus: string;
  dateGiven: string;     // yyyy-mm-dd
  returnDate: string;    // yyyy-mm-dd
  description: string;
}

export interface Dependent {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dob?: string;          // yyyy-mm-dd
  gender?: Gender;
  nationalId?: string;
  nationality?: string;
  maritalStatus?: MaritalStatus;
  relationship?: "Spouse" | "Son" | "Daughter" | "Father" | "Mother" | "Other";
}

export interface Appraisal {
  jobCode: string;
  employeeComments: string;
  managerComments: string;
  rating?: number;
  reviewDate?: string;   // yyyy-mm-dd
  nextReviewDate?: string; // yyyy-mm-dd
  status?: "Draft" | "Submitted" | "Reviewed" | "Completed";
}
