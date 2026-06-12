import { z } from "zod";
import { OPTIONAL_EMAIL } from "@/schema/email";

export const CUSTOMER_SCHEMA = z.object({
  customerName: z
    .string()
    .min(2, { message: "Customer name must be at least 2 characters long" }),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  currencyCode: z.string().optional(),
  creditLimit: z
    .number()
    .min(0, { message: "Credit limit must be a positive number" })
    .optional(),
  isActive: z.boolean().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  country: z.string().optional(),
  phoneNo: z.string().optional(),
  email: OPTIONAL_EMAIL.optional(),
  contactPersonName: z.string().optional(),
  websiteUrl: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Invalid URL",
    })
    .optional(),
  customerType: z.string().optional(),
});

export type CustomerFormData = z.infer<typeof CUSTOMER_SCHEMA>;
