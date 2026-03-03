import { z } from "zod";

export const ACCOUNTING_PERIOD_CREATE_SCHEMA = z
  .object({
    periodName: z
      .string()
      .min(3, "Period name must be at least 3 characters")
      .max(20, "Period name must be less than 20 characters"),

    startDate: z
      .string({
        error: "Start date is required",
      })
      .min(1, "Start date is required"),

    endDate: z
      .string({
        error: "End date is required",
      })
      .min(1, "End date is required"),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "End date must be after start date",
    path: ["endDate"],
  });

export type AccountingPeriodFormData = z.infer<
  typeof ACCOUNTING_PERIOD_CREATE_SCHEMA
>;
