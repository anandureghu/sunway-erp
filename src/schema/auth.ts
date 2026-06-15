import { z } from "zod";
import { REQUIRED_EMAIL } from "@/schema/email";

export const LOGIN_SCHEMA = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const REGISTER_SCHEMA = z
  .object({
    username: z.string().min(1, "Username is required"),
    email: REQUIRED_EMAIL,
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm your password"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export const CHANGE_PASSWORD_SCHEMA = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
      "Password must be 8+ characters with uppercase, lowercase, number, and special char (@$!%*?&)").min(8, "New password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Confirm new password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "New passwords do not match",
    path: ["confirmPassword"],
  });


