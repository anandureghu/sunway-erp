import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import type { CompanySummary, JwtLoginResponse } from "@/types/auth-company";

export function useAuthLogin() {
  const navigate = useNavigate();
  const { login, switchCompany } = useAuth();
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pendingCompanies, setPendingCompanies] = useState<CompanySummary[]>([]);

  const finishLogin = (
    accessToken: string,
    refreshToken: string,
    data: JwtLoginResponse,
  ) => {
    login(accessToken, refreshToken, {
      companies: data.companies,
      requiresCompanySelection: data.requiresCompanySelection,
    });

    if (data.forcePasswordReset) {
      navigate("/auth/reset-password");
      return;
    }

    toast.success("Login successful!");
    navigate("/dashboard");
  };

  const completeLogin = (
    accessToken: string,
    refreshToken: string,
    data: JwtLoginResponse,
  ) => {
    if (
      data.requiresCompanySelection &&
      data.companies &&
      data.companies.length > 1
    ) {
      login(accessToken, refreshToken, { companies: data.companies });
      setPendingCompanies(data.companies);
      setPickerOpen(true);
      return;
    }

    finishLogin(accessToken, refreshToken, data);
  };

  const handleCompanyPick = async (companyId: number) => {
    setPickerOpen(false);
    await switchCompany(companyId);
    navigate("/dashboard");
    toast.success("Login successful!");
  };

  return {
    pickerOpen,
    pendingCompanies,
    handleCompanyPick,
    completeLogin,
  };
}
