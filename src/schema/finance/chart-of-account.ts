import { COA } from "@/types/coa";
import { z } from "zod";

const COA_KEYS = COA.map((c) => c.key) as [string, ...string[]];

export const COA_SCHEMA = z
  .object({
    accountCode: z.string(),

    accountName: z
      .string()
      .min(2, "Account name is required")
      .max(100, "Account name too long"),

    description: z.string().optional(),

    type: z.enum(COA_KEYS),

    parentId: z.number().nullable().optional(),

    accountNo: z.string(),
    interCompanyNumber: z
      .string()
      .regex(/^\d{3}$/, "Account No must be exactly 3 digits"),

    departmentId: z.number().nullable().optional(),

    projectCode: z
      .string()
      .transform((v) => (v === "" ? undefined : v))
      .refine((v) => !v || /^\d{4}$/.test(v), {
        message: "Project Code must be exactly 4 digits",
      })
      .optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "BUDGET") {
      const validBudget = /^BUD\d{4}$|^\d{4}$/.test(data.accountNo);

      if (!validBudget) {
        ctx.addIssue({
          path: ["accountNo"],
          code: "custom",
          message: "Budget account must be BUDYYYY or YYYY",
        });
      }
    } else {
      const validNormal = /^\d{6}$/.test(data.accountNo);

      if (!validNormal) {
        ctx.addIssue({
          path: ["accountNo"],
          code: "custom",
          message: "Account No must be exactly 6 digits",
        });
      }
    }
  });

export type COAFormData = z.infer<typeof COA_SCHEMA>;
