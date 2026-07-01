import { apiClient } from "@/service/apiClient";
import type { JwtLoginResponse } from "@/types/auth-company";
import { isOtpSent, markOtpSent } from "@/lib/pending-login";

export const LOGIN_OTP_PURPOSE = "LOGIN_2FA" as const;
export const PASSWORD_RESET_OTP_PURPOSE = "PASSWORD_RESET" as const;

const inflightOtpSends = new Map<string, Promise<void>>();

function preAuthConfig(preAuthToken: string) {
  return { headers: { Authorization: `Bearer ${preAuthToken}` } };
}

export function sendOtp(
  email: string,
  purpose: string,
  preAuthToken?: string,
) {
  return apiClient.post(
    "/auth/otp/send",
    { email, purpose },
    preAuthToken ? preAuthConfig(preAuthToken) : undefined,
  );
}

export function verifyOtp(
  email: string,
  code: string,
  purpose: string,
  preAuthToken?: string,
) {
  return apiClient.post(
    "/auth/otp/verify",
    {
      email,
      purpose,
      code,
      ...(preAuthToken ? { preAuthToken } : {}),
    },
    preAuthToken ? preAuthConfig(preAuthToken) : undefined,
  );
}

export function sendLoginOtp(preAuthToken: string, email: string) {
  return sendOtp(email, LOGIN_OTP_PURPOSE, preAuthToken);
}

/** Sends OTP once per login session (dedupes React Strict Mode double-mount). */
export function sendInitialLoginOtp(preAuthToken: string, email: string) {
  if (isOtpSent(preAuthToken)) {
    return Promise.resolve();
  }

  const inflight = inflightOtpSends.get(preAuthToken);
  if (inflight) return inflight;

  const request = sendLoginOtp(preAuthToken, email)
    .then(() => {
      markOtpSent(preAuthToken);
    })
    .finally(() => {
      inflightOtpSends.delete(preAuthToken);
    });

  inflightOtpSends.set(preAuthToken, request);
  return request;
}

export function verifyLoginOtp(preAuthToken: string, email: string, code: string) {
  return verifyOtp(email, code, LOGIN_OTP_PURPOSE, preAuthToken) as ReturnType<
    typeof apiClient.post<JwtLoginResponse>
  >;
}

export function requestForgotPassword(email: string) {
  return apiClient.post<{ message: string }>("/auth/forgot-password", { email });
}

export function resetPassword(payload: {
  email: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return apiClient.post<{ message: string }>("/auth/reset-password", payload);
}
