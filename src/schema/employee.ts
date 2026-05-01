import { z } from "zod";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  departmentId: z.string().optional(),
  role: z.string(), // Dynamic role - will be fetched from company roles
  CompanyRole: z.string().optional().nullable(),
});
