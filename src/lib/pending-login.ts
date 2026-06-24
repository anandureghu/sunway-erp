import type { JwtLoginResponse } from "@/types/auth-company";

export type PendingLoginFlow = {
  flow: "login";
  preAuthToken: string;
  email: string;
  maskedEmail: string;
  data: JwtLoginResponse;
};

export type PendingForgotPasswordFlow = {
  flow: "forgot-password";
  email: string;
  otpVerified?: boolean;
};

export type PendingAuth = PendingLoginFlow | PendingForgotPasswordFlow;

/** In-memory only — cleared on refresh; not available for direct URL visits. */
let pendingAuth: PendingAuth | null = null;
const otpSentFor = new Set<string>();

export function setPendingAuth(pending: PendingAuth) {
  pendingAuth = pending;
}

/** @deprecated use setPendingAuth */
export function setPendingLogin(pending: PendingLoginFlow) {
  setPendingAuth(pending);
}

export function getPendingAuth(): PendingAuth | null {
  return pendingAuth;
}

/** @deprecated use getPendingAuth */
export function getPendingLogin(): PendingLoginFlow | null {
  const pending = pendingAuth;
  return pending?.flow === "login" ? pending : null;
}

export function clearPendingAuth() {
  if (pendingAuth?.flow === "login") {
    otpSentFor.delete(pendingAuth.preAuthToken);
  }
  pendingAuth = null;
}

/** @deprecated use clearPendingAuth */
export function clearPendingLogin() {
  clearPendingAuth();
}

export function isOtpSent(key: string) {
  return otpSentFor.has(key);
}

export function markOtpSent(key: string) {
  otpSentFor.add(key);
}

export function markForgotPasswordOtpVerified() {
  if (pendingAuth?.flow === "forgot-password") {
    pendingAuth = { ...pendingAuth, otpVerified: true };
  }
}

export function isPendingLogin(pending: PendingAuth): pending is PendingLoginFlow {
  return pending.flow === "login";
}

export function isPendingForgotPassword(
  pending: PendingAuth,
): pending is PendingForgotPasswordFlow {
  return pending.flow === "forgot-password";
}
