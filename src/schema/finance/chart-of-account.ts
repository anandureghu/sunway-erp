import { COA } from "@/types/coa";
import { z } from "zod";

const COA_KEYS = COA.map((c) => c.key) as [string, ...string[]];

export const COA_SCHEMA = z.object({
  accountCode: z.string().length(19),

  accountName: z
    .string()
    .min(2, "Account name is required")
    .max(100, "Account name too long"),

  description: z.string().optional(),

  type: z.enum(COA_KEYS),

  parentId: z.number().nullable().optional(),

  openingBalance: z
    .string()
    .regex(/^-?\d+(\.\d{1,2})?$/, "Invalid amount format")
    .optional(),

  accountNo: z.string().regex(/^\d{6}$/, "Account No must be exactly 6 digits"),

  interCompanyNumber: z
    .string()
    .regex(/^\d{3}$/, "Account No must be exactly 3 digits"),

  departmentId: z.number().nullable().optional(),

  projectCode: z
    .string()
    .regex(/^\d{4}$/, "Account No must be exactly 4 digits"),
});

export type COAFormData = z.infer<typeof COA_SCHEMA>;
