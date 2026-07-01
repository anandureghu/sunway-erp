import { useMemo, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import {
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Lock,
  Shield,
  XCircle,
} from "lucide-react";
import { GradientButton } from "@/components/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  clearPendingAuth,
  getPendingAuth,
  isPendingForgotPassword,
} from "@/lib/pending-login";
import { resetPassword } from "@/service/authService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const getPasswordStrength = (password: string) => {
  if (!password) return { label: "", color: "", pct: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;
  if (score <= 2) return { label: "Weak", color: "bg-red-500", pct: 25 };
  if (score <= 3) return { label: "Fair", color: "bg-amber-500", pct: 50 };
  if (score <= 4) return { label: "Good", color: "bg-blue-500", pct: 75 };
  return { label: "Strong", color: "bg-green-500", pct: 100 };
};

const PwdRule = ({ met, text }: { met: boolean; text: string }) => (
  <li
    className={cn(
      "flex items-center gap-1.5 text-xs transition-colors",
      met ? "text-green-600" : "text-slate-400",
    )}
  >
    {met ? (
      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
    ) : (
      <XCircle className="h-3.5 w-3.5 shrink-0 text-slate-300" />
    )}
    {text}
  </li>
);

export default function ForgotPasswordResetPage() {
  const { isAuthenticated } = useAuth();
  const pending = getPendingAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  if (
    !pending ||
    !isPendingForgotPassword(pending) ||
    !pending.otpVerified ||
    !pending.email
  ) {
    return <Navigate to="/auth/login" replace />;
  }

  return <ForgotPasswordResetForm email={pending.email} />;
}

function ForgotPasswordResetForm({ email }: { email: string }) {
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || !confirmPassword) {
      setError("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await resetPassword({
        email,
        newPassword,
        confirmPassword,
      });
      clearPendingAuth();
      toast.success(res.data.message || "Password updated. Please log in.");
      navigate("/auth/login", { replace: true });
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Failed to reset password.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20">
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 px-8 py-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
          <KeyRound className="h-7 w-7 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">
          Set new password
        </h1>
        <p className="mt-1 text-sm text-white/80">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 px-8 pb-8 pt-6">
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
            New password
          </Label>
          <div className="relative">
            <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="newPassword"
              type={showNew ? "text" : "password"}
              placeholder="Create a strong new password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (error) setError("");
              }}
              className="h-10 rounded-lg border-violet-200/80 bg-white pl-9 pr-10 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowNew((v) => !v)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {newPassword ? (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Password strength</span>
                <span
                  className={cn("text-xs font-semibold", {
                    "text-red-500": strength.label === "Weak",
                    "text-amber-500": strength.label === "Fair",
                    "text-blue-500": strength.label === "Good",
                    "text-green-600": strength.label === "Strong",
                  })}
                >
                  {strength.label}
                </span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-gray-100">
                <div
                  className={cn("h-full rounded-full transition-all duration-300", strength.color)}
                  style={{ width: `${strength.pct}%` }}
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
            Confirm new password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (error) setError("");
              }}
              className="h-10 rounded-lg border-violet-200/80 bg-white pl-9 pr-10 focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              onClick={() => setShowConfirm((v) => !v)}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {confirmPassword && newPassword ? (
            <p
              className={cn("flex items-center gap-1 text-xs", {
                "text-green-600": confirmPassword === newPassword,
                "text-red-500": confirmPassword !== newPassword,
              })}
            >
              {confirmPassword === newPassword ? (
                <>
                  <CheckCircle2 className="h-3.5 w-3.5" /> Passwords match
                </>
              ) : (
                <>
                  <XCircle className="h-3.5 w-3.5" /> Passwords do not match
                </>
              )}
            </p>
          ) : null}
        </div>

        {newPassword ? (
          <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3">
            <ul className="space-y-1.5">
              <PwdRule met={newPassword.length >= 8} text="At least 8 characters" />
              <PwdRule met={/[A-Z]/.test(newPassword)} text="One uppercase letter (A–Z)" />
              <PwdRule met={/[a-z]/.test(newPassword)} text="One lowercase letter (a–z)" />
              <PwdRule met={/[0-9]/.test(newPassword)} text="One number (0–9)" />
              <PwdRule met={/[@$!%*?&]/.test(newPassword)} text="One special character (@$!%*?&)" />
            </ul>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <GradientButton type="submit" loading={loading} className="mt-2 w-full">
          Change password
        </GradientButton>

        <p className="text-center text-sm text-muted-foreground">
          <Link
            to="/auth/login"
            className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
            onClick={() => clearPendingAuth()}
          >
            Back to sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
