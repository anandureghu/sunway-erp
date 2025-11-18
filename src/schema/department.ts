import { z } from "zod";

export const DEPARTMENT_SCHEMA = z.object({
  departmentCode: z
    .string()
    .min(2, "Department code is required")
    .max(10, "Too long"),
  departmentName: z.string().min(2, "Department name is required"),
  managerId: z.number().optional(),
  companyId: z.number({ message: "Company is required" }),
});

export type DepartmentFormData = z.infer<typeof DEPARTMENT_SCHEMA>;
