import { z } from "zod";
import { OPTIONAL_EMAIL } from "@/schema/email";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  phoneNo: z.string().optional().nullable(),
  email: OPTIONAL_EMAIL.optional().or(z.literal("")), // Auto-generated on backend
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().optional().nullable(), // Password is auto-generated on backend
  role: z.string().optional().or(z.literal("")),
});
