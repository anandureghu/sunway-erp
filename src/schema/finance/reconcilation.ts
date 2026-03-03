// src/schema/finance/reconciliation.ts
import { z } from "zod";

export const RECON_SCHEMA = z.object({
  accountId: z.number(),

  amount: z.string().regex(/^-?\d+(\.\d{1,2})?$/, "Invalid amount format"),

  resource: z.string().optional(),
  reason: z.string().optional(),
});

export type ReconciliationFormData = z.infer<typeof RECON_SCHEMA>;
