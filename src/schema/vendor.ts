import { z } from "zod";

export const VENDOR_SCHEMA = z.object({
  vendorName: z
    .string()
    .min(2, { message: "Vendor name must be at least 2 characters long" }),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  currencyCode: z.string().optional(),
  creditLimit: z
    .number()
    .min(0, { message: "Credit limit must be a positive number" })
    .optional(),
  active: z.boolean().optional().default(true),
  street: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phoneNo: z.string().optional(),
  email: z
    .string()
    .refine((val) => !val || z.string().email().safeParse(val).success, {
      message: "Invalid email address",
    })
    .optional(),
  contactPersonName: z.string().optional(),
  fax: z.string().optional(),
  websiteUrl: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Invalid URL",
    })
    .optional(),
  is1099Vendor: z.boolean().optional().default(false),
});

export type VendorFormData = z.infer<typeof VENDOR_SCHEMA>;

