import { z } from "zod";
import { OPTIONAL_EMAIL } from "@/schema/email";
import { OPTIONAL_PHONE } from "@/schema/phone";

export const VENDOR_SCHEMA = z.object({
  vendorName: z
    .string()
    .min(2, "Vendor name must be at least 2 characters long"),
  taxId: z.string().optional(),
  paymentTerms: z.string().optional(),
  currencyCode: z.string().optional(),
  creditLimit: z
    .number()
    .min(0, "Credit limit must be a positive number")
    .optional(),
  active: z.boolean().optional(),
  street: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  phoneNo: OPTIONAL_PHONE.optional(),
  email: OPTIONAL_EMAIL.optional(),
  contactPersonName: z.string().optional(),
  fax: z.string().optional(),
  websiteUrl: z
    .string()
    .refine((val) => !val || z.string().url().safeParse(val).success, {
      message: "Invalid URL",
    })
    .optional(),
  is1099Vendor: z.boolean().optional(),
  remarks: z.string().optional(),
});

export type VendorFormData = z.infer<typeof VENDOR_SCHEMA>;
