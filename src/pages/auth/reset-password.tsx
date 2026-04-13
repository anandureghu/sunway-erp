import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import {
  Eye, EyeOff, Lock, Shield, KeyRound,
  CheckCircle2, XCircle, ShieldAlert,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ── password strength helpers ─────────────────────────────────────────────────
const getPasswordStrength = (password: string) => {
  if (!password) return { label: "", color: "", pct: 0 };
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;
  if (score <= 2) return { label: "Weak",   color: "bg-red-500",   pct: 25 };
  if (score <= 3) return { label: "Fair",   color: "bg-amber-500", pct: 50 };
  if (score <= 4) return { label: "Good",   color: "bg-blue-500",  pct: 75 };
  return              { label: "Strong", color: "bg-green-500", pct: 100 };
};

const PwdRule = ({ met, text }: { met: boolean; text: string }) => (
  <li className={cn("flex items-center gap-1.5 text-xs transition-colors",
    met ? "text-green-600" : "text-slate-400")}>
    {met
      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-green-500" />
      : <XCircle      className="h-3.5 w-3.5 shrink-0 text-slate-300" />}
    {text}
  </li>
);

// ─────────────────────────────────────────────────────────────────────────────
export default function ResetPasswordPage() {
  const [oldPassword,     setOldPassword]     = useState("");
  const [newPassword,     setNewPassword]     = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld,     setShowOld]     = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const strength = useMemo(() => getPasswordStrength(newPassword), [newPassword]);

  const handleSubmit = async () => {
    if (!oldPassword || !newPassword) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      await apiClient.put("/auth/change-password", { oldPassword, newPassword });
      toast.success("Password updated successfully");
      navigate("/dashboard");
    } catch (err: any) {
      const msg =
        err?.response?.data?.message || err?.message || "Failed to change password";
      toast.error(String(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[460px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20">
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 px-8 py-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
          <ShieldAlert className="h-7 w-7 text-white" strokeWidth={1.5} />
        </div>
        <h1 className="font-display text-2xl font-bold text-white">Set New Password</h1>
        <p className="mt-1 text-sm text-white/80">
          Your account requires a password update before continuing.
        </p>
      </div>

      {/* Form */}
      <div className="px-8 pb-8 pt-6 space-y-4">

        {/* Current / Old password */}
        <div className="space-y-1.5">
          <Label htmlFor="oldPassword" className="text-sm font-semibold text-gray-700">
            Current Password
          </Label>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="oldPassword"
              type={showOld ? "text" : "password"}
              placeholder="Enter your current password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="h-10 pl-9 pr-10 rounded-lg border-violet-200/80 bg-white focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowOld(v => !v)}
            >
              {showOld ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <Separator />

        {/* New password */}
        <div className="space-y-1.5">
          <Label htmlFor="newPassword" className="text-sm font-semibold text-gray-700">
            New Password
          </Label>
          <div className="relative">
            <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="newPassword"
              type={showNew ? "text" : "password"}
              placeholder="Create a strong new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-10 pl-9 pr-10 rounded-lg border-violet-200/80 bg-white focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowNew(v => !v)}
            >
              {showNew ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Strength bar */}
          {newPassword && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Password strength</span>
                <span className={cn("text-xs font-semibold", {
                  "text-red-500":   strength.label === "Weak",
                  "text-amber-500": strength.label === "Fair",
                  "text-blue-500":  strength.label === "Good",
                  "text-green-600": strength.label === "Strong",
                })}>
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
          )}
        </div>

        {/* Confirm password */}
        <div className="space-y-1.5">
          <Label htmlFor="confirmPassword" className="text-sm font-semibold text-gray-700">
            Confirm New Password
          </Label>
          <div className="relative">
            <Shield className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="confirmPassword"
              type={showConfirm ? "text" : "password"}
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-10 pl-9 pr-10 rounded-lg border-violet-200/80 bg-white focus-visible:border-violet-400 focus-visible:ring-violet-400/30"
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              onClick={() => setShowConfirm(v => !v)}
            >
              {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {/* Match indicator */}
          {confirmPassword && newPassword && (
            <p className={cn("flex items-center gap-1 text-xs", {
              "text-green-600": confirmPassword === newPassword,
              "text-red-500":   confirmPassword !== newPassword,
            })}>
              {confirmPassword === newPassword
                ? <><CheckCircle2 className="h-3.5 w-3.5" /> Passwords match</>
                : <><XCircle      className="h-3.5 w-3.5" /> Passwords do not match</>}
            </p>
          )}
        </div>

        {/* Requirements */}
        {newPassword && (
          <div className="rounded-lg border border-violet-100 bg-violet-50/60 p-3">
            <ul className="space-y-1.5">
              <PwdRule met={newPassword.length >= 8}       text="At least 8 characters" />
              <PwdRule met={/[A-Z]/.test(newPassword)}     text="One uppercase letter (A–Z)" />
              <PwdRule met={/[a-z]/.test(newPassword)}     text="One lowercase letter (a–z)" />
              <PwdRule met={/[0-9]/.test(newPassword)}     text="One number (0–9)" />
              <PwdRule met={/[@$!%*?&]/.test(newPassword)} text="One special character (@$!%*?&)" />
            </ul>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={loading}
          className="mt-2 h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-base font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700 hover:shadow-lg"
        >
          {loading ? (
            <>
              <span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              Updating…
            </>
          ) : (
            <>
              <KeyRound className="mr-1.5 h-4 w-4" />
              Update Password
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
