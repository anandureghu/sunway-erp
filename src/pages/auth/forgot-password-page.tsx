import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Mail } from "lucide-react";
import { GradientButton } from "@/components/gradient-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getApiErrorMessage } from "@/lib/api-error-message";
import { setPendingAuth } from "@/lib/pending-login";
import { requestForgotPassword } from "@/service/authService";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const inputShell =
  "pl-10 h-11 rounded-lg border-violet-200/80 bg-white shadow-sm focus-visible:border-violet-400 focus-visible:ring-violet-400/30";

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) {
      setError("Please enter your email address.");
      return;
    }
    if (!trimmed.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const res = await requestForgotPassword(trimmed);
      toast.success(
        res.data.message ||
          "If that account exists, a verification code has been sent to your email.",
      );
      setPendingAuth({ flow: "forgot-password", email: trimmed });
      navigate("/auth/verify-otp");
    } catch (e: unknown) {
      const msg = getApiErrorMessage(e, "Failed to send verification code.");
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20",
      )}
    >
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 px-8 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
          <Building2 className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-white/90">Account recovery</p>
        <h1 className="font-display mt-1 text-2xl font-bold leading-tight text-white sm:text-[1.65rem]">
          Forgot password?
        </h1>
      </div>

      <div className="px-8 pb-8 pt-7">
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a verification code to reset
          your password.
        </p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-semibold text-gray-700">
              Email:
            </Label>
            <div className="relative">
              <Mail
                className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="Enter your email"
                className={inputShell}
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (error) setError("");
                }}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </div>

          <GradientButton type="submit" loading={loading} className="w-full">
            Confirm
          </GradientButton>

          <p className="text-center text-sm text-muted-foreground">
            <Link
              to="/auth/login"
              className="font-medium text-violet-600 hover:text-violet-700 hover:underline"
            >
              Back to sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
