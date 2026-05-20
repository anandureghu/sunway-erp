import { z } from "zod";

export const DIVISION_SCHEMA = z.object({
  code: z
    .string()
    .min(2, { message: "Division code is required" })
    .max(10, { message: "Division code must be 10 characters or fewer" }),
  name: z.string().min(2, "Division name is required"),
  managerId: z.number().optional(),
  companyId: z.number({ message: "Company is required" }),
  description: z.string().optional(),
});

export type DivisionFormData = z.infer<typeof DIVISION_SCHEMA>;
