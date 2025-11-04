import type { LOGIN_SCHEMA, REGISTER_SCHEMA } from "@/schema/auth";
import type z from "zod";

export type RegisterFormData = z.infer<typeof REGISTER_SCHEMA>;
export type LoginFormData = z.infer<typeof LOGIN_SCHEMA>;
