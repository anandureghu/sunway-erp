import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Lock, User } from "lucide-react";
import { GradientButton } from "@/components/gradient-button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LOGIN_SCHEMA } from "@/schema/auth";
import type { LoginFormData } from "@/types/auth";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { CompanyPickerDialog } from "@/components/company-picker-dialog";
import { useAuthLogin } from "@/hooks/use-auth-login";
import { setPendingLogin } from "@/lib/pending-login";
import { getApiErrorMessage } from "@/lib/api-error-message";
import {
  ACTIVE_COMPANY_KEY,
  type JwtLoginResponse,
} from "@/types/auth-company";

const REMEMBER_KEY = "sunway.login.remember";
const USERNAME_KEY = "sunway.login.username";

const inputShell =
  "pl-10 h-11 rounded-lg border-violet-200/80 bg-white shadow-sm focus-visible:border-violet-400 focus-visible:ring-violet-400/30";

export default function LoginPage() {
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LOGIN_SCHEMA),
    defaultValues: { username: "", password: "" },
  });

  const navigate = useNavigate();
  const { pickerOpen, pendingCompanies, handleCompanyPick, completeLogin } =
    useAuthLogin();

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(USERNAME_KEY);
      const remembered = localStorage.getItem(REMEMBER_KEY) === "1";
      if (savedUser) setValue("username", savedUser);
      setRemember(remembered);
    } catch {
      /* ignore */
    }
  }, [setValue]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const preferredCompanyId = localStorage.getItem(ACTIVE_COMPANY_KEY);
      const response = await apiClient.post<JwtLoginResponse>("/auth/login", {
        loginId: data.username,
        password: data.password,
        preferredCompanyId: preferredCompanyId
          ? Number(preferredCompanyId)
          : undefined,
      });
      const responseData = response.data;

      try {
        if (remember) {
          localStorage.setItem(REMEMBER_KEY, "1");
          localStorage.setItem(USERNAME_KEY, data.username);
        } else {
          localStorage.removeItem(REMEMBER_KEY);
          localStorage.removeItem(USERNAME_KEY);
        }
      } catch {
        /* ignore */
      }

      if (responseData.requiresTwoFactor ) {
        if (!responseData.preAuthToken) {
          toast.error("Login failed: missing pre-auth token from server.");
          return;
        }
        const email = responseData.email?.trim();
        if (!email) {
          toast.error("Unable to determine your email for verification.");
          return;
        }

        setPendingLogin({
          flow: "login",
          preAuthToken: responseData.preAuthToken,
          email,
          maskedEmail: responseData.maskedEmail ?? "",
          data: responseData,
        });
        navigate("/auth/verify-otp");
        return;
      }

      const accessToken = responseData.accessToken;
      const refreshToken = responseData.refreshToken ?? "";

      if (!accessToken) {
        console.error("Login response missing token:", response.data);
        toast.error("Login failed: invalid token from server.");
        return;
      }

      completeLogin(accessToken, refreshToken, responseData);
    } catch (error: unknown) {
      console.error("Login failed:", error);
      toast.error(getApiErrorMessage(error, "Login failed. Please try again."));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <CompanyPickerDialog
        open={pickerOpen}
        companies={pendingCompanies}
        onSelect={handleCompanyPick}
      />

      <div
        className={cn(
          "w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20",
        )}
      >
        <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 px-8 py-10 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
            <Building2 className="h-8 w-8 text-white" strokeWidth={1.5} />
          </div>
          <p className="text-sm font-medium text-white/90">Welcome to</p>
          <h1 className="font-display mt-1 text-2xl font-bold leading-tight text-white sm:text-[1.65rem]">
            Sunway ERP &amp; E-COM System
          </h1>
        </div>

        <div className="px-8 pb-8 pt-7">
          <p className="text-sm text-muted-foreground">
            Please enter your username and password:
          </p>
          <h2 className="font-display mt-1 text-xl font-bold text-purple-700">
            Sunway ERP
          </h2>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-5">
            <div className="space-y-2">
              <Label
                htmlFor="username"
                className="text-sm font-semibold text-gray-700"
              >
                Username:
              </Label>
              <div className="relative">
                <User
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="username"
                  autoComplete="username"
                  placeholder="Enter your username"
                  className={inputShell}
                  {...register("username")}
                />
              </div>
              {errors.username && (
                <p className="text-sm text-red-600">{errors.username.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label
                htmlFor="password"
                className="text-sm font-semibold text-gray-700"
              >
                Password:
              </Label>
              <div className="relative">
                <Lock
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-amber-600"
                  aria-hidden
                />
                <Input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className={inputShell}
                  {...register("password")}
                />
              </div>
              {errors.password && (
                <p className="text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-0.5">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <label
                  htmlFor="remember"
                  className="cursor-pointer text-sm text-gray-700 leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  Remember me
                </label>
              </div>
              <Link
                to="/auth/forgot-password"
                className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <GradientButton
              type="submit"
              loading={loading}
              className="mt-2 w-full"
            >
              Sign In
            </GradientButton>
          </form>
        </div>
      </div>
    </>
  );
}
