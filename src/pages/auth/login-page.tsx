import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { LOGIN_SCHEMA } from "@/schema/auth";
import type { LoginFormData } from "@/types/auth";
import { apiClient } from "@/service/apiClient";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Label } from "@/components/ui/label";

export default function LoginPage() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(LOGIN_SCHEMA),
  });

  const navigate = useNavigate();
  const { login } = useAuth();

  const onSubmit = async (data: LoginFormData) => {
    try {
      const response = await apiClient.post("/auth/login", {
        loginId: data.username,
        password: data.password,
      });
      const responseData = response.data;

      // Normalize token across possible server shapes:
      // - { token: '...' }
      // - { accessToken: '...' }
      // - { access_token: '...' }
      // - response.data is the raw token string
      const accessToken =
        typeof responseData === "string"
          ? responseData
          : responseData.token ?? responseData.accessToken ?? responseData.access_token ?? responseData?.access?.token ?? responseData?.access?.accessToken;

      if (!accessToken) {
        console.error("Login response missing token string:", response.data);
        toast.error("Login failed: invalid token from server.");
        return;
      }

      // store tokens via auth context (refreshToken may be optional)
      login(
        accessToken,
        (responseData.refreshToken as string) ?? (responseData.refresh_token as string) ?? ""
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
      // Enhanced error logging
      console.error("Login failed:", error);
      
      if (error.response) {
        // Server responded with error status
        console.error("Response status:", error.response.status);
        console.error("Response data:", error.response.data);
        console.error("Response headers:", error.response.headers);
        
        const errorMessage = error.response.data?.message || 
                            error.response.data?.error || 
                            `Server error: ${error.response.status}`;
        toast.error(errorMessage);
      } else if (error.request) {
        // Request was made but no response received
        console.error("No response received:", error.request);
        toast.error("Unable to reach server. Please check your connection.");
      } else {
        // Error setting up the request
        console.error("Error setting up request:", error.message);
        toast.error("Login failed. Please try again.");
      }
    }
  };

  return (
    <Card className="w-full max-w-md shadow-none border-none">
      <CardContent className="p-6">
        {/* <img
          src="/assets/logo-dark.svg"
          alt="sunway"
          width={70}
          className="mx-auto mb-3"
        />
        <h2 className="text-2xl font-semibold text-center mb-4">
          Login to Sunway
        </h2>
        <p className="text-center text-sm text-gray-500 mb-6">
          Welcome back! Please login to continue.
        </p> */}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <div className="flex items-center gap-3">
              <Label htmlFor="username" className="mb-1 block">
                Username:
              </Label>
              <Input placeholder="Username" {...register("username")} />
            </div>
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <div className="flex items-center gap-3">
              <Label htmlFor="password" className="mb-1 block">
                Password:
              </Label>
              <Input
                type="password"
                placeholder="Password"
                {...register("password")}
              />
            </div>

            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {errors.password.message}
              </p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            Login
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
