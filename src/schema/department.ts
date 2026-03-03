import { z } from "zod";

export const DEPARTMENT_SCHEMA = z.object({
  departmentCode: z
    .string()
    .length(4, { message: "Department code must be exactly 4 characters" }),
  departmentName: z.string().min(2, "Department name is required"),
  managerId: z.number().optional(),
  companyId: z.number({ message: "Company is required" }),
  description: z.string().optional(),
});

export type DepartmentFormData = z.infer<typeof DEPARTMENT_SCHEMA>;
