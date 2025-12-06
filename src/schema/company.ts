import { z } from "zod";

export const COMPANY_SCHEMA = z.object({
  companyName: z
    .string()
    .min(2, { message: "Company name must be at least 2 characters long" }),

  crNo: z
    .number()
    .min(1, { message: "Company number must be a positive number" })
    .optional(),

  noOfEmployees: z
    .number()
    .min(1, { message: "Number of employees must be a positive number" })
    .optional(),

  computerCard: z.string().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  phoneNo: z.string().optional(),

  hrEnabled: z.boolean().optional(),
  financeEnabled: z.boolean().optional(),
  inventoryEnabled: z.boolean().optional(),
});

export type CompanyFormData = z.infer<typeof COMPANY_SCHEMA>;
