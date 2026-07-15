import { z } from "zod";
import { OPTIONAL_EMAIL } from "@/schema/email";
import { OPTIONAL_PHONE } from "@/schema/phone";

export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  middleName: z.string().optional().or(z.literal("")),
  lastName: z.string().min(1, "Last name is required"),
  phoneNo: OPTIONAL_PHONE.optional().nullable(),
  email: OPTIONAL_EMAIL.optional().or(z.literal("")), // Auto-generated on backend
  // Not enforced with a min-length: in edit mode the username field is
  // read-only (the update endpoint can't persist username changes), so a
  // stricter check here could block Save on pre-existing records with a
  // short/empty username. In create mode it's auto-derived from the name.
  username: z.string().optional().or(z.literal("")),
  password: z.string().optional().nullable(), // Password is auto-generated on backend
  role: z.string().optional().or(z.literal("")),
});
