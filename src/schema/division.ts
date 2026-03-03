import { z } from "zod";

export const DIVISION_SCHEMA = z.object({
  code: z
    .string()
    .length(3, { message: "Division code must be exactly 3 characters" }),
  name: z.string().min(2, "Division name is required"),
  managerId: z.number().optional(),
  departmentId: z.number().optional(),
  companyId: z.number({ message: "Company is required" }),
  description: z.string().optional(),
});

export type DivisionFormData = z.infer<typeof DIVISION_SCHEMA>;
