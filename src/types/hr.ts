export type EmployeeStatus = "Active" | "Inactive" | "On Leave";
export type Gender = "Male" | "Female" | "Other";
export type MaritalStatus = "Single" | "Married" | "Divorced" | "Widowed";

export interface Employee {
  userId: any;
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

  // personal information fields
  birthplace?: string;
  hometown?: string;
  religion?: string;
  identification?: string;

  // additional profile fields
  prefix?: string;
  altPhone?: string;
  notes?: string;

  phoneNo?: string;
  companyId?: string;
  user?: string;
  createdAt?: string;
  updatedAt?: string;
  departmentId?: string;
  email?: string;
  username?: string;
  role?: Role;  // Security role (for permissions) - e.g., "ADMIN", "HR", "USER"
  companyRole?: string;  // Company role name (for display) - e.g., "HR Manager", "Finance Lead"
  companyRoleId?: number | null; // Company role ID (PK reference to CompanyRole table) - new from backend
  companyName?: string;
  imageUrl?: string;
}

// Role type - will be dynamically fetched from API
export type Role = string;

// Default roles for backward compatibility (will be replaced by API fetched roles)
export const ROLES = [
  { key: "ADMIN", label: "Admin" },
  { key: "HR", label: "Human Resources" },
  { key: "USER", label: "User" },
  { key: "SUPER_ADMIN", label: "Super Admin" },
  { key: "FINANCE_MANAGER", label: "Finance Manager" },
  { key: "ACCOUNTANT", label: "Accountant" },
  { key: "CASHIER", label: "Cashier" },
  { key: "AP_AR_CLERK", label: "AP/AR Clerk" },
  { key: "CONTROLLER", label: "Controller" },
  { key: "AUDITOR_EXTERNAL", label: "External Auditor" },
] as const;

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
  workLocation: string;
  workCity: string;
  workCountry: string;
}

export type ContractType = "PERMANENT" | "TEMPORARY" | "INTERN" | "CONSULTANT";
export type ContractStatus = "ACTIVE" | "EXPIRED" | "TERMINATED" | "DRAFT";

export interface EmployeeContract {
  id?: number;
  contractType: ContractType;
  contractStartDate: string; // yyyy-mm-dd
  contractEndDate: string; // yyyy-mm-dd
  contractPeriodMonths: number;
  noticePeriodDays: number;
  contractStatus: ContractStatus;
  salary: string;
  departmentId?: number;
  jobCodeId?: number;
  termsAndConditions?: string;
  attachmentUrl?: string;
}

export type LeaveStatus = "Pending" | "Approved" | "Rejected";
export type LeaveType =
  | "Annual Leave"
  | "Sick Leave"
  | "Emergency Leave"
  | "Unpaid Leave"
  | "Maternity Leave";

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

export interface LeavePolicy {
  role: Role;
  leaveType: LeaveType;
  daysAllowed: number;
  paid?: boolean;
  genderRestricted?: boolean;
  allowedGender?: string | null;
  defaultDays?: number;
  includeWeekends?: boolean;
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
  phoneNo?: string;
  address?: string;
  address2?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Legacy Appraisal interface - kept for backward compatibility
// Use the new Appraisal interface below for performance goals
export interface LegacyAppraisal {
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

/* =======================
   PERFORMANCE GOALS TYPES
======================= */

// Rating scale for performance
export interface RatingScale {
  score: number;
  label: string;
  color: string;
  bg: string;
  description: string;
}

export const PERFORMANCE_RATINGS: RatingScale[] = [
  { score: 5, label: "Exceptional", color: "#059669", bg: "#d1fae5", description: "Consistently exceeds all expectations with outstanding results." },
  { score: 4, label: "Exceeds Expectations", color: "#0284c7", bg: "#e0f2fe", description: "Regularly surpasses goals and competency requirements." },
  { score: 3, label: "Meets Expectations", color: "#7c3aed", bg: "#ede9fe", description: "Fully meets all goals and competency standards." },
  { score: 2, label: "Needs Improvement", color: "#d97706", bg: "#fef3c7", description: "Partially meets goals. Development actions required." },
  { score: 1, label: "Unsatisfactory", color: "#dc2626", bg: "#fee2e2", description: "Fails to meet minimum requirements. PIP triggered." },
];

// Performance Goal - defined by HR for each role
export interface PerformanceGoal {
  id?: number;
  role: string;           // Job role (e.g., "Software Engineer", "Product Manager")
  kpi: string;            // KPI name
  description: string;    // Success criteria
  weight: number;         // Weight percentage (should sum to 100)
  targetDate?: string;    // Optional target date (yyyy-mm-dd)
  active: boolean;         // Whether goal is active
  companyId?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Appraisal phases
export interface AppraisalPhase {
  id: string;
  label: string;
  timeline: string;
  icon: string;
  status: "completed" | "active" | "upcoming";
}

export const APPRAISAL_PHASES: AppraisalPhase[] = [
  { id: "goal-setting", label: "Goal Setting", timeline: "Jan 1 – Jan 31", icon: "🎯", status: "completed" },
  { id: "mid-year", label: "Mid-Year Review", timeline: "Jun 1 – Jun 30", icon: "📊", status: "completed" },
  { id: "self-assessment", label: "Self-Assessment", timeline: "Nov 1 – Nov 15", icon: "📝", status: "active" },
  { id: "manager-review", label: "Manager Review", timeline: "Nov 15 – Dec 5", icon: "👤", status: "upcoming" },
  { id: "review-meeting", label: "Review Meeting", timeline: "Dec 15 – Dec 31", icon: "🤝", status: "upcoming" },
];

// Employee Goal - assigned to an employee for an appraisal cycle
export interface EmployeeGoal {
  id?: number;
  appraisalId?: number;
  goalId: number;
  kpi: string;
  description: string;
  weight: number;
  targetDate?: string;
  selfRating?: number | null;
  managerRating?: number | null;
  selfComment?: string;
  managerComment?: string;
}

// Appraisal record for an employee
export type AppraisalStatus = "draft" | "DRAFT" | "self-assessment" | "SELF_SUBMITTED" | "manager-review" | "MANAGER_REVIEWED" | "completed" | "LOCKED";

export interface Appraisal {
  id?: number;
  employeeId: number;
  year: number;
  status: AppraisalStatus;
  overallScore?: number | null;
  overallSelfRating?: number | null;
  overallManagerRating?: number | null;
  selfComment?: string;
  managerComment?: string;
  employeeComments?: string;
  managerComments?: string;
  employeeAcknowledge?: "agree" | "disagree" | null;
  employeeRebuttal?: string;
  signedDate?: string;
  createdAt?: string;
  updatedAt?: string;
  goals?: EmployeeGoal[];
}

// Role to Goals mapping for quick lookup
export interface RoleGoals {
  role: string;
  goals: PerformanceGoal[];
}

// Default goals by role (for initial setup)
export const DEFAULT_GOALS_BY_ROLE: Record<string, string[]> = {
  "Software Engineer": [
    "Code Quality & Reviews",
    "System Architecture",
    "Bug Resolution Rate",
    "CI/CD Pipeline",
    "Documentation"
  ],
  "Product Manager": [
    "Product Roadmap Delivery",
    "Stakeholder Management",
    "OKR Achievement",
    "User Research",
    "Sprint Velocity"
  ],
  "UX Designer": [
    "Design System Adherence",
    "User Testing Coverage",
    "Prototype Delivery",
    "Accessibility Compliance",
    "Cross-team Collaboration"
  ],
  "Data Analyst": [
    "Reporting Accuracy",
    "Dashboard Adoption",
    "Data Pipeline Health",
    "Insight Generation",
    "Stakeholder Presentations"
  ],
  "DevOps Engineer": [
    "System Uptime SLA",
    "Deployment Frequency",
    "MTTR Reduction",
    "Security Compliance",
    "Infrastructure Cost Optimization"
  ],
  "HR Manager": [
    "Talent Acquisition",
    "Employee Engagement",
    "Training & Development",
    "Performance Management",
    "HR Compliance"
  ],
  "Finance Analyst": [
    "Financial Reporting",
    "Budget Management",
    "Forecasting Accuracy",
    "Process Optimization",
    "Audit Compliance"
  ],
  "Marketing Manager": [
    "Campaign Performance",
    "Lead Generation",
    "Brand Awareness",
    "Content Strategy",
    "Digital Marketing ROI"
  ]
};

// ─── PAYSIP TYPES ──────────────────────────────────────────────

export interface Currency {
  currencyCode: string;
}

export interface EarningItem {
  label: string;
  amount: number;
}

export interface DeductionItem {
  label: string;
  amount: number;
}

export interface BankDetails {
  bankName: string;
  bankShortName?: string;
  bankBranch: string;
  accountNo: string;
}

export interface PayslipData {
  employee: Employee & {
    currency: Currency;
    dateOfJoining: string;
    employeeCode: string;
    payGrade?: string;
    totalDays?: number;
    workingDays?: number;
    leaveTaken?: number;
  };
  payroll: {
    grossPay: number;
    totalDeductions: number;
    netPayable: number;
    payrollCode: string;
    payPeriodStart: string;
    payDate: string;
  };
  bankDetails: BankDetails;
  earnings: EarningItem[];
  deductions: DeductionItem[];
}

