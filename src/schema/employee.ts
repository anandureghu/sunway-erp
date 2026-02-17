import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeNo: z.string().optional().nullable(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNo: z.string().min(7, "Phone must be at least 7 digits"),
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  departmentId: z.string().optional(),
  role: z.enum(["ADMIN", "HR", "USER", "SUPER_ADMIN", "FINANCE_MANAGER", "ACCOUNTANT", "AP_AR_CLERK", "CONTROLLER", "AUDITOR_EXTERNAL"]),
});
