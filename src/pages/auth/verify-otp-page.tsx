import { useEffect, useState } from "react";
import { Building2, Mail, ShieldCheck } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { GradientButton } from "@/components/gradient-button";
import { OtpInput } from "@/components/auth/otp-input";
import { CompanyPickerDialog } from "@/components/company-picker-dialog";
import { useAuthLogin } from "@/hooks/use-auth-login";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  clearPendingAuth,
  getPendingAuth,
  isOtpSent,
  isPendingForgotPassword,
  isPendingLogin,
  markForgotPasswordOtpVerified,
  type PendingAuth,
} from "@/lib/pending-login";
import { cn } from "@/lib/utils";
import {
  PASSWORD_RESET_OTP_PURPOSE,
  sendInitialLoginOtp,
  sendLoginOtp,
  sendOtp,
  verifyLoginOtp,
  verifyOtp,
} from "@/service/authService";
import { toast } from "sonner";

const RESEND_SECONDS = 60;

export default function VerifyOtpPage() {
  const { isAuthenticated } = useAuth();
  const pending = getPendingAuth();
  const email = pending?.email?.trim() ?? "";

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!pending || !email) {
    return <Navigate to="/auth/login" replace />;
  }

  return <VerifyOtpForm pending={pending} />;
}

function VerifyOtpForm({ pending }: { pending: PendingAuth }) {
  const email = pending.email;
  const isLoginFlow = isPendingLogin(pending);
  const isForgotFlow = isPendingForgotPassword(pending);
  const navigate = useNavigate();
  const { pickerOpen, pendingCompanies, handleCompanyPick, completeLogin } =
    useAuthLogin();

  const [code, setCode] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!isLoginFlow) return;

    let cancelled = false;

    (async () => {
      const alreadySent = isOtpSent(pending.preAuthToken);
      try {
        await sendInitialLoginOtp(pending.preAuthToken, email);
        if (cancelled) return;
        if (!alreadySent) {
          toast.success("Verification code sent to your email.");
        }
      } catch (e: unknown) {
        if (cancelled) return;
        toast.error(getApiErrorMessage(e, "Failed to send OTP."));
        clearPendingAuth();
        navigate("/auth/login", { replace: true });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [email, isLoginFlow, navigate, pending]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setInterval(() => {
      setResendIn((s) => Math.max(0, s - 1));
    }, 1000);
    return () => window.clearInterval(timer);
  }, [resendIn]);

  const handleResend = async () => {
    if (resendIn > 0 || sending) return;

    setSending(true);
    setError("");
    try {
      if (isLoginFlow) {
        await sendLoginOtp(pending.preAuthToken, email);
      } else {
        await sendOtp(email, PASSWORD_RESET_OTP_PURPOSE);
      }
      toast.success("A new verification code has been sent.");
      setResendIn(RESEND_SECONDS);
      setCode("");
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Failed to resend verification code.");
      setError(msg);
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  const handleVerify = async () => {
    if (code.length !== 6) {
      setError("Please enter the 6-digit verification code.");
      return;
    }

    setVerifying(true);
    setError("");
    try {
      if (isLoginFlow) {
        const res = await verifyLoginOtp(pending.preAuthToken, email, code);
        const responseData = res.data;
        const accessToken = responseData.accessToken;
        const refreshToken = responseData.refreshToken ?? "";

        if (!accessToken) {
          throw new Error("Verification succeeded but no access token was returned.");
        }

        clearPendingAuth();
        completeLogin(accessToken, refreshToken, {
          ...pending.data,
          ...responseData,
          companies: responseData.companies ?? pending.data.companies,
          requiresCompanySelection:
            responseData.requiresCompanySelection ??
            pending.data.requiresCompanySelection,
        });
        return;
      }

      await verifyOtp(email, code, PASSWORD_RESET_OTP_PURPOSE);
      markForgotPasswordOtpVerified();
      toast.success("Email verified. Set your new password.");
      navigate("/auth/forgot-password/reset", { replace: true });
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Verification failed. Please try again.");
      setError(msg);
      toast.error(msg);
    } finally {
      setVerifying(false);
    }
  };

  const handleBack = () => {
    clearPendingAuth();
    navigate(isForgotFlow ? "/auth/forgot-password" : "/auth/login");
  };

  const displayEmail =
    isLoginFlow && pending.maskedEmail ? pending.maskedEmail : email;

  return (
    <>
      {isLoginFlow ? (
        <CompanyPickerDialog
          open={pickerOpen}
          companies={pendingCompanies}
          onSelect={handleCompanyPick}
        />
      ) : null}

      <div
        className={cn(
          "w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20",
        )}
      >
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
            <ShieldCheck className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-white/90">
            {isForgotFlow ? "Password recovery" : "Secure sign-in"}
          </p>
          <h1 className="font-display mt-1 text-2xl font-bold leading-tight text-white sm:text-[1.65rem]">
            Verify your identity
          </h1>
        </div>

        <div className="px-8 pb-8 pt-7">
          <div className="flex items-start gap-3 rounded-lg border border-violet-100 bg-violet-50/60 px-4 py-3">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-violet-600" aria-hidden />
            <p className="text-sm text-gray-700">
              Enter the 6-digit code sent to{" "}
              <span className="font-semibold text-purple-700">{displayEmail}</span>
            </p>
          </div>

          <div className="mt-6 space-y-5">
            <OtpInput
              value={code}
              onChange={(value) => {
                setCode(value);
                if (error) setError("");
              }}
              disabled={verifying}
            />

            {error ? (
              <p className="text-center text-sm text-red-600" role="alert">
                {error}
              </p>
            ) : null}

            <GradientButton
              type="button"
              loading={verifying}
              disabled={code.length !== 6}
              onClick={handleVerify}
              className="w-full"
            >
              Verify & Continue
            </GradientButton>

            <div className="text-center text-sm text-muted-foreground">
              {resendIn > 0 ? (
                <p>Resend code in {resendIn}s</p>
              ) : (
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={sending}
                  className="font-medium text-violet-600 hover:text-violet-700 hover:underline disabled:opacity-50"
                >
                  {sending ? "Sending..." : "Resend code"}
                </button>
              )}
            </div>

            <div className="flex items-center justify-center gap-2 border-t border-gray-100 pt-4">
              <Building2 className="h-4 w-4 text-muted-foreground" aria-hidden />
              <button
                type="button"
                onClick={handleBack}
                className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline"
              >
                {isForgotFlow ? "Back" : "Back to sign in"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
