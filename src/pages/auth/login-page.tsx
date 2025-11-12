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

      const { accessToken, refreshToken } = response.data;

      login(accessToken, refreshToken);
      toast.success("Login successful!");
      navigate("/");
    } catch (error) {
      toast.error("Login failed. Please check your credentials.");
      console.error("Login failed:", error);
    }
  };

  return (
    <Card className="w-full max-w-md shadow-none border-none">
      <CardContent className="p-6">
        <img
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
        </p>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Input placeholder="Username" {...register("username")} />
            {errors.username && (
              <p className="text-red-500 text-sm mt-1">
                {errors.username.message}
              </p>
            )}
          </div>

          <div>
            <Input
              type="password"
              placeholder="Password"
              {...register("password")}
            />
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

        <div className="mt-6">
          <Button
            variant="outline"
            className="w-full flex items-center justify-center gap-2"
            onClick={() => navigate("/")}
          >
            Skip Auth & Go to Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
