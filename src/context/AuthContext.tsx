import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { apiClient } from "@/service/apiClient";
import type { Employee, Role } from "@/types/hr";
import { useAppDispatch } from "@/store/store";
import { setAdminView } from "@/store/uiSlice";
import type { Company } from "@/types/company";
import { toast } from "sonner";
import permissionService from "@/service/permissionService";
import type { AccountingPeriod } from "@/types/accounting-period";
import type { AxiosResponse } from "axios";

// JWT shape differs between environments/backends.
// Keep this type permissive and guard at runtime.
type DecodedToken = {
  userId?: number;
  role?: Role | string;
  username?: string;
  sub?: string;
  iss?: string;
  exp: number;
};

type AuthContextType = {
  user: Employee | null;
  accessToken: string | null;
  refreshToken: string | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  company: Company | null;
  permissions: Record<string, Record<string, boolean>> | null;
  permissionsLoading: boolean;
  accountPeriodOpen: boolean;
  fetchAccountPeriodStatus: () => void;
  openPeriod?: AccountingPeriod | null;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [user, setUser] = useState<Employee | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [accountPeriodOpen, setAccountPeriodOpen] = useState<boolean>(false);
  const [openPeriod, setOpenPeriod] = useState<AccountingPeriod | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken"),
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refreshToken"),
  );
  const [permissions, setPermissions] = useState<Record<
    string,
    Record<string, boolean>
  > | null>(null);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  // Fetch permissions based on user role
  const fetchPermissions = async (role: string) => {
    try {
      setPermissionsLoading(true);

      // ADMIN/SUPER_ADMIN skip DB fetch — canAccess returns true for null
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        setPermissions(null);
        return;
      }

      // Prefer role-wide permissions (companyRole) — fall back to my-permissions
      // `role` here is expected to be the companyRole (e.g., "Manager") when
      // available; permissionService.getByRole will normalize the name.
      let perms = [] as any[];
      try {
        perms = await permissionService.getByRole(role as string);
      } catch (err) {
        // If role-wide fetch fails, try per-user permissions as a fallback
        console.warn("getByRole failed, falling back to getMyPermissions:", err);
        perms = await permissionService.getMyPermissions();
      }

      const caps = permissionService.toFrontendCaps(perms as any[]);
      setPermissions(caps);
    } catch (err) {
      console.error("Failed to fetch permissions:", err);
      setPermissions({}); // empty object, not null - so canAccess returns false
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchCompany = async (id: string) => {
    try {
      const res = await apiClient.get(`/companies/${id}`);
      setCompany(res.data);
    } catch (err) {
      console.error("fetchCompany:", err);
      toast.error("Failed to load company");
    }
  };

  const fetchAccountPeriodStatus = async () => {
    try {
      apiClient
        .get(`/accounting-periods/open-status`)
        .then(({ data }: AxiosResponse<AccountingPeriod>) => {
          setAccountPeriodOpen(data != null);
          setOpenPeriod(data);
        });
    } catch (err) {
      console.error("account period status:", err);
    }
  };

  const applyUserFromToken = (token: string) => {
    const decoded: DecodedToken = jwtDecode(token);
    // Normalize role string from token to avoid case-mismatch issues
    const rawRole = String(decoded.role ?? "USER").toUpperCase();
    const role =
      rawRole === "ADMIN" || rawRole === "SUPER_ADMIN" || rawRole === "USER"
        ? (rawRole as Role)
        : ("USER" as Role);

    setUser({
      userId: decoded.userId != null ? String(decoded.userId) : undefined,
      username: decoded.username || decoded.sub,
      role,
    });

    // If token contains a userId, fetch the full user profile first so we can
    // use `companyRole` for permission decisions. Otherwise fall back to the
    // security role from token.
    if (decoded.userId != null) {
      apiClient
        .get("/users/" + decoded.userId)
        .then((response) => {
          const profile = response.data;
          // Keep security role but prefer companyRole for permissions
          setUser({
            ...profile,
            id: String(decoded.userId),
            role,
          });

          if (profile.companyId) {
            fetchCompany(profile.companyId);
          }

          // Use companyRole when available for permission resolution
          const effectiveRole = profile.companyRole ?? role;
          fetchPermissions(effectiveRole);
        })
        .catch((e) => {
          console.warn("Failed to load user profile:", e?.response?.status || e);
          // fallback to token role if profile fetch fails
          fetchPermissions(role);
        });
    } else {
      // No userId in token — fall back to token role
      fetchPermissions(role);
    }
  };

  /** Initialize session on app start */
  useEffect(() => {
    if (accessToken) {
      apiClient.defaults.headers.common["Authorization"] =
        `Bearer ${accessToken}`;

      try {
        applyUserFromToken(accessToken);
      } catch (e) {
        console.warn("Invalid token, logging out: ", e);
        logout();
      }
    }
  }, []);

  /** Handle auto-refresh logic */
  useEffect(() => {
    if (!accessToken) return;

    try {
      const decoded: DecodedToken = jwtDecode(accessToken);
      const expiryTime = decoded.exp * 1000;
      const now = Date.now();

      if (expiryTime <= now) {
        refreshAccessToken();
      } else {
        const timeout = setTimeout(
          () => {
            refreshAccessToken();
          },
          expiryTime - now - 5000,
        ); // refresh 5s before expiry

        return () => clearTimeout(timeout);
      }
    } catch (error) {
      console.error("Invalid access token:", error);
      logout();
    }
  }, [accessToken]);

  // Catch global unauthorized events fired by apiClient when refresh fails.
  useEffect(() => {
    const handleUnauthorized = () => {
      toast.error("Session expired. Please login again.");
      dispatch(setAdminView(false));
      setUser(null);
      setPermissions(null);
      setAccessToken(null);
      setRefreshToken(null);
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      delete apiClient.defaults.headers.common["Authorization"];
      navigate("/auth/login");
    };
    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("auth:unauthorized", handleUnauthorized);
    };
  }, [dispatch, navigate]);

  /** Login handler */
  const login = (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // ✅ Set token to Axios default header
    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${accessToken}`;

    try {
      applyUserFromToken(accessToken);
    } catch (err) {
      console.error("Token decode failed", err);
    }
  };

  /** Refresh token handler */
  const refreshAccessToken = async () => {
    if (!refreshToken) {
      logout();
      return;
    }

    try {
      const response = await apiClient.post("/auth/refresh", { refreshToken });
      const { accessToken: newAccessToken } = response.data;

      if (newAccessToken) {
        setAccessToken(newAccessToken);
        localStorage.setItem("accessToken", newAccessToken);

        // ✅ Update Axios default header here too
        apiClient.defaults.headers.common["Authorization"] =
          `Bearer ${newAccessToken}`;
      } else {
        logout();
      }
    } catch (error) {
      console.error("Token refresh failed:", error);
      logout();
    }
  };

  /** Logout handler */
  const logout = () => {
    dispatch(setAdminView(false));
    setUser(null);
    setPermissions(null);
    setAccessToken(null);
    setRefreshToken(null);
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");

    // ❌ Remove header on logout
    delete apiClient.defaults.headers.common["Authorization"];

    navigate("/auth/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        refreshToken,
        login,
        logout,
        company,
        isAuthenticated: !!accessToken,
        permissions,
        permissionsLoading,
        accountPeriodOpen,
        fetchAccountPeriodStatus,
        openPeriod,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
};
