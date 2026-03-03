// src/schema/finance/journal-entry.ts
import { z } from "zod";

export const JE_SCHEMA = z.object({
  creditAccountId: z.number(),
  debitAccountId: z.number(),

  amount: z.string().regex(/^\d+(\.\d{1,2})?$/, "Invalid amount format"),

  source: z.string().optional(),
  description: z.string().optional(),
});

export type JEFormData = z.infer<typeof JE_SCHEMA>;
