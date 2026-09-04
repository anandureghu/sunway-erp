import { COA } from "@/types/coa";
import { z } from "zod";

const COA_KEYS = COA.map((c) => c.key) as [string, ...string[]];

/** API often returns null; Zod string fields reject null unless preprocessed. */
const optionalString = z.preprocess(
  (v) => (v == null ? "" : v),
  z.string().optional(),
);

const requiredString = z.preprocess(
  (v) => (v == null ? "" : v),
  z.string(),
);

export const COA_SCHEMA = z
  .object({
    accountCode: requiredString,

    accountName: z
      .string()
      .min(2, "Account name is required")
      .max(100, "Account name too long"),

    description: optionalString,

    type: z.enum(COA_KEYS),

    parentId: z.number().nullable().optional(),

    accountNo: requiredString,
    interCompanyNumber: z.preprocess(
      (v) => (v == null ? "" : v),
      z.string().regex(/^\d{3}$/, "Inter company no must be exactly 3 digits"),
    ),

    departmentId: z.number().nullable().optional(),

    projectCode: z.preprocess(
      (v) => (v == null || v === "" ? undefined : v),
      z
        .string()
        .refine((v) => !v || /^\d{4}$/.test(v), {
          message: "Project Code must be exactly 4 digits",
        })
        .optional(),
    ),
  })
  .superRefine((data, ctx) => {
    if (data.type === "BUDGET") {
      const validBudget = /^BUD\d{4}(-\d+)?$|^\d{4}$/.test(data.accountNo);

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

/** Normalize list-row / API nulls into form-safe values before reset. */
export function normalizeCoaFormDefaults(
  coa: Partial<COAFormData> & {
    departmentCode?: string | null;
    departmentName?: string | null;
  },
): COAFormData & { departmentCode?: string; departmentName?: string } {
  return {
    accountCode: coa.accountCode ?? "",
    accountName: coa.accountName ?? "",
    description: coa.description ?? "",
    type: (coa.type as COAFormData["type"]) ?? "ASSET",
    parentId: coa.parentId ?? null,
    accountNo: coa.accountNo ?? "",
    interCompanyNumber: coa.interCompanyNumber ?? "",
    departmentId: coa.departmentId ?? null,
    projectCode: coa.projectCode || undefined,
    departmentCode: coa.departmentCode ?? undefined,
    departmentName: coa.departmentName ?? undefined,
  };
}
