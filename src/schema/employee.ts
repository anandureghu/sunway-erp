import { z } from "zod";

export const createEmployeeSchema = z.object({
  employeeNo: z.string().optional().nullable(),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNo: z.string().optional().nullable(),
  email: z.string().email("Invalid email"),
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  departmentId: z.string().optional(),
  role: z.string(), // Dynamic role - will be fetched from company roles
});
