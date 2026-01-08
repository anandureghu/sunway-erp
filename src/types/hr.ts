export type EmployeeStatus = "Active" | "Inactive" | "On Leave";
export type Gender = "Male" | "Female" | "Other";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";

export interface Employee {
  id?: string;
  employeeNo?: string;
  firstName?: string;
  lastName?: string;
  status?: EmployeeStatus;
  department?: string;
  designation?: string;
  dateOfBirth?: string; // yyyy-mm-dd
  gender?: Gender;
  joinDate?: string; // yyyy-mm-dd
  nationality?: string;
  nationalId?: string;
  maritalStatus?: MaritalStatus;

  phoneNo?: string;
  companyId?: string;
  user?: string;
  createdAt?: string;
  updatedAt?: string;
  departmentId?: string;
  email?: string;
  username?: string;
  role?: Role;
  companyName?: string;
}

export type Role = "ADMIN" | "SUPER_ADMIN" | "USER";

export interface CurrentJob {
  jobCode: string;
  departmentCode: string;
  departmentName: string;
  jobTitle: string;
  jobLevel: string;
  grade: string;
  startDate: string; // yyyy-mm-dd
  effectiveFrom: string; // yyyy-mm-dd
  expectedEndDate?: string; // yyyy-mm-dd
}

export type LeaveStatus = "Pending" | "Approved" | "Rejected";
export type LeaveType =
  | "Annual Leave"
  | "Sick Leave"
  | "Emergency Leave"
  | "Unpaid Leave";

export interface LeaveRecord {
  leaveCode: string;
  leaveType: LeaveType;
  startDate: string; // yyyy-mm-dd
  endDate: string; // yyyy-mm-dd
  dateReported: string; // yyyy-mm-dd
  leaveBalance: string;
  leaveStatus: LeaveStatus;
  totalDays: number;
}

export interface Salary {
  basicSalary: string;
  transportationType: "ALLOWANCE" | "COMPANY_PROVIDED";
  transportationAllowance: string;
  travelType: "ALLOWANCE" | "COMPANY_PROVIDED";
  travelAllowance: string;
  otherAllowance: string;
  totalAllowance: string;
  housingType: "ALLOWANCE" | "COMPANY_PROVIDED";
  housingAllowance: string;
  payPeriodStart: string; // yyyy-mm-dd
  payPeriodEnd: string; // yyyy-mm-dd
  numberOfDaysWorked: string;
  payPerDay: string;
  overtime: string;
  compensationStatus: "Active" | "Inactive";
  effectiveFrom: string; // yyyy-mm-dd
  effectiveTo: string; // yyyy-mm-dd
}

export interface Loan {
  loanCode: string;
  loanAmount: string;
  notes: string;
  loanType: string;
  loanPeriod: string;
  startDate: string; // yyyy-mm-dd
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
  dateGiven: string; // yyyy-mm-dd
  returnDate: string; // yyyy-mm-dd
  description: string;
}

export interface Dependent {
  id: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dob?: string; // yyyy-mm-dd
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
  reviewDate?: string; // yyyy-mm-dd
  nextReviewDate?: string; // yyyy-mm-dd
  status?: "Draft" | "Submitted" | "Reviewed" | "Completed";
}

export interface User {
  id: number;
  fullName: string;
  email: string;
  username: string;
  password: string;
  role: Role;
  createdAt: string; // ISO-8601 string from Instant
}

export interface EmployeeResponse {
  id: number;
  employeeNo: string;
  firstName: string;
  lastName: string;
  gender?: string;
  prefix?: string;
  status: string;
  maritalStatus?: string;
  dateOfBirth?: string;
  joinDate?: string;
  phoneNo?: string;
  altPhone?: string;
  email: string;
  companyId: number;
  companyName: string;
  departmentId?: number;
  departmentName?: string;
  userId: number;
  username: string;
  role: string;
  forcePasswordReset?: boolean;
  imageUrl?: string;
}
