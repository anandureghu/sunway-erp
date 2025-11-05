import type { Employee, LeaveRecord, Salary, Loan } from '@/types/hr';

type ValidationErrors<T> = Partial<Record<keyof T, string>>;

/**
 * Validates a date string in yyyy-mm-dd format
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  return !isNaN(date.getTime());
}

/**
 * Validates a positive number string
 */
export function isValidAmount(amount: string): boolean {
  const num = parseFloat(amount);
  return !isNaN(num) && num >= 0;
}

/**
 * Validates employee data
 */
export function validateEmployee(data: Partial<Employee>): ValidationErrors<Employee> {
  const errors: ValidationErrors<Employee> = {};

  if (!data.employeeNo?.trim()) {
    errors.employeeNo = 'Employee number is required';
  }
  
  if (!data.firstName?.trim()) {
    errors.firstName = 'First name is required';
  }
  
  if (!data.lastName?.trim()) {
    errors.lastName = 'Last name is required';
  }

  if (data.dateOfBirth && !isValidDate(data.dateOfBirth)) {
    errors.dateOfBirth = 'Invalid date format. Use yyyy-mm-dd';
  }

  if (data.joinDate && !isValidDate(data.joinDate)) {
    errors.joinDate = 'Invalid date format. Use yyyy-mm-dd';
  }

  return errors;
}

/**
 * Validates leave record data
 */
export function validateLeaveRecord(data: Partial<LeaveRecord>): ValidationErrors<LeaveRecord> {
  const errors: ValidationErrors<LeaveRecord> = {};

  if (!data.leaveCode?.trim()) {
    errors.leaveCode = 'Leave code is required';
  }

  if (!data.startDate || !isValidDate(data.startDate)) {
    errors.startDate = 'Valid start date is required (yyyy-mm-dd)';
  }

  if (!data.endDate || !isValidDate(data.endDate)) {
    errors.endDate = 'Valid end date is required (yyyy-mm-dd)';
  }

  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    if (end < start) {
      errors.endDate = 'End date must be after start date';
    }
  }

  return errors;
}

/**
 * Validates salary data
 */
export function validateSalary(data: Partial<Salary>): ValidationErrors<Salary> {
  const errors: ValidationErrors<Salary> = {};

  if (!isValidAmount(data.basicSalary || '')) {
    errors.basicSalary = 'Basic salary must be a valid amount';
  }

  if (data.effectiveFrom && !isValidDate(data.effectiveFrom)) {
    errors.effectiveFrom = 'Invalid effective from date';
  }

  if (data.effectiveTo && !isValidDate(data.effectiveTo)) {
    errors.effectiveTo = 'Invalid effective to date';
  }

  return errors;
}

/**
 * Validates loan data
 */
export function validateLoan(data: Partial<Loan>): ValidationErrors<Loan> {
  const errors: ValidationErrors<Loan> = {};

  if (!data.loanCode?.trim()) {
    errors.loanCode = 'Loan code is required';
  }

  if (!isValidAmount(data.loanAmount || '')) {
    errors.loanAmount = 'Loan amount must be a valid amount';
  }

  if (!data.startDate || !isValidDate(data.startDate)) {
    errors.startDate = 'Valid start date is required';
  }

  if (!isValidAmount(data.monthlyDeductions || '')) {
    errors.monthlyDeductions = 'Monthly deduction must be a valid amount';
  }

  return errors;
}