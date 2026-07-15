export const EXPENSE_CATEGORIES = [
  { value: "RENT", label: "Rent" },
  { value: "EMPLOYEE_REIMBURSEMENT", label: "Employee Reimbursement" },
  { value: "VENDOR_REIMBURSEMENT", label: "Vendor Reimbursement" },
  { value: "UTILITIES", label: "Utilities" },
  { value: "OTHER", label: "Other" },
] as const;

export function formatExpenseCategoryLabel(category?: string | null): string {
  if (!category) return "—";
  const code = category.trim().toUpperCase();
  const found = EXPENSE_CATEGORIES.find((c) => c.value === code);
  if (found) return found.label;
  return category.replace(/_/g, " ");
}
