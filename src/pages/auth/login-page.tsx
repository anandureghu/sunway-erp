import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Link, useNavigate } from "react-router-dom";
import { Building2, Lock, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { LOGIN_SCHEMA } from "@/schema/auth";
import type { LoginFormData } from "@/types/auth";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

const REMEMBER_KEY = "sunway.login.remember";
const USERNAME_KEY = "sunway.login.username";

const inputShell =
  "pl-10 h-11 rounded-lg border-violet-200/80 bg-white shadow-sm focus-visible:border-violet-400 focus-visible:ring-violet-400/30";

export default function LoginPage() {
  const [remember, setRemember] = useState(false);

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
  const { login } = useAuth();

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
    try {
      const response = await apiClient.post("/auth/login", {
        loginId: data.username,
        password: data.password,
      });
      const responseData = response.data;

      const accessToken =
        typeof responseData === "string"
          ? responseData
          : responseData.token ??
            responseData.accessToken ??
            responseData.access_token ??
            responseData?.access?.token ??
            responseData?.access?.accessToken;

      if (!accessToken) {
        console.error("Login response missing token string:", response.data);
        toast.error("Login failed: invalid token from server.");
        return;
      }

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

      login(
        accessToken,
        (responseData.refreshToken as string) ??
          (responseData.refresh_token as string) ??
          ""
      );

      const forcePasswordReset =
        responseData.forcePasswordReset ?? responseData.force_password ?? false;

      if (forcePasswordReset) {
        navigate("/auth/reset-password");
      } else {
        toast.success("Login successful!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      if (error.response) {
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          `Server error: ${error.response.status}`;
        toast.error(errorMessage);
      } else if (error.request) {
        toast.error("Unable to reach server. Please check your connection.");
      } else {
        toast.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <div
      className={cn(
        "w-full max-w-[420px] overflow-hidden rounded-2xl bg-white shadow-2xl shadow-black/20",
      )}
    >
      {/* Header */}
      <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 px-8 py-10 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-white/20 backdrop-blur-sm ring-1 ring-white/30">
          <Building2 className="h-8 w-8 text-white" strokeWidth={1.5} />
        </div>
        <p className="text-sm font-medium text-white/90">Welcome to</p>
        <h1 className="font-display mt-1 text-2xl font-bold leading-tight text-white sm:text-[1.65rem]">
          Sunway ERP &amp; E-COM System
        </h1>
      </div>

      {/* Form */}
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
              to="/auth/reset-password"
              className="text-sm font-medium text-violet-600 hover:text-violet-700 hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            className="mt-2 h-11 w-full rounded-lg bg-gradient-to-r from-violet-600 to-blue-600 text-base font-semibold text-white shadow-md transition hover:from-violet-700 hover:to-blue-700 hover:shadow-lg"
          >
            Sign In
          </Button>
        </form>
      </div>
    </div>
  );
}
