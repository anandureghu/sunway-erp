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
import { fetchCompany } from "@/service/companyService";

type DecodedToken = {
  userId?: number;
  role?: Role | string;
  username?: string;
  sub?: string;
  iss?: string;
  exp: number;
  companyRoleId?: number;
  companyRole?: string;
  employeeId?: number;
  companyId?: number;
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

  // ✅ NEW: Helper function to convert backend permission format to frontend
  const convertPermissionsToFrontendFormat = (
    backendPermissions: any[]
  ): Record<string, Record<string, boolean>> => {
    const result: Record<string, Record<string, boolean>> = {};

    console.debug(
      "🔄 Converting permissions from backend format:",
      backendPermissions
    );

    for (const perm of backendPermissions) {
      // Get module name and normalize it
      const moduleName = perm.module || perm.moduleName || "";
      const normalizedModule = String(moduleName)
        .toUpperCase()
        .replace(/\s+/g, "_")
        .replace(/[^A-Z0-9_]/g, "")
        .replace(/^_|_$/g, "");

      if (!normalizedModule) {
        console.warn("⚠️ Skipping permission with no module name:", perm);
        continue;
      }

      // Backend sends camelCase (viewOwn, viewAll, createPermission, etc.)
      // Convert to snake_case for frontend
      result[normalizedModule] = {
        view_own: Boolean(perm.viewOwn || false),
        view_all: Boolean(perm.viewAll || false),
        create: Boolean(perm.createPermission || false),
        edit: Boolean(perm.editPermission || false),
        delete: Boolean(perm.deletePermission || false),
        approve: Boolean(perm.approve || false),
      };

      console.debug(`✅ Converted ${normalizedModule}:`, result[normalizedModule]);
    }

    console.debug("✅ Final converted permissions:", result);
    return result;
  };

  // Fetch permissions based on user role
  const fetchPermissions = async (role: string, companyRoleId?: number) => {
    try {
      setPermissionsLoading(true);
      console.debug("🔐 Starting permission fetch for role:", role, "companyRoleId:", companyRoleId);

      // ADMIN/SUPER_ADMIN skip DB fetch — canAccess returns true for null
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        console.debug("✅ Admin user detected - granting full permissions");
        setPermissions(null); // null = admin, full access
        setPermissionsLoading(false);
        return;
      }

      // For non-admin users, try to get their own permissions
      let perms = [] as any[];

      // Try getMyPermissions() FIRST - this is the most reliable
      try {
        console.debug("📡 Calling getMyPermissions()...");
        perms = await permissionService.getMyPermissions();

        console.debug("📊 getMyPermissions response:", {
          isArray: Array.isArray(perms),
          length: perms?.length || 0,
          data: perms,
        });

        if (perms && Array.isArray(perms) && perms.length > 0) {
          console.debug(
            "✅ getMyPermissions() succeeded, received permissions:",
            perms
          );
          const convertedPerms = convertPermissionsToFrontendFormat(perms);
          setPermissions(convertedPerms);
          setPermissionsLoading(false);
          return;
        } else {
          console.warn("⚠️ getMyPermissions() returned empty array or null");
          console.error("🔍 DEBUG: Check if:", {
            userHasCompanyRoleId: (user as any)?.companyRoleId,
            userHasEmployeeId: (user as any)?.employeeId,
            userRole: (user as any)?.role,
            backendEndpoint: "/role-permissions/my-permissions",
            suggestion: "User may not have permissions assigned in backend"
          });
        }
      } catch (err) {
        console.warn("❌ getMyPermissions() failed:", err);
        // Fall through to try other methods
      }

      // Fallback: Try getCompanyRolePermissions with companyRoleId
      if (companyRoleId && companyRoleId > 0) {
        try {
          console.debug(
            `📡 Calling getCompanyRolePermissions(${companyRoleId})...`
          );
          const companyPerms = await permissionService.getCompanyRolePermissions(
            companyRoleId
          );

          if (
            companyPerms &&
            Array.isArray(companyPerms) &&
            companyPerms.length > 0
          ) {
            console.debug(
              "✅ getCompanyRolePermissions() succeeded:",
              companyPerms
            );
            const convertedPerms =
              convertPermissionsToFrontendFormat(companyPerms);
            setPermissions(convertedPerms);
            setPermissionsLoading(false);
            return;
          }
        } catch (err) {
          console.warn(
            "❌ getCompanyRolePermissions failed for companyRoleId:",
            companyRoleId,
            err
          );
        }
      }

      // Last resort: Try getByRole (only works for ADMIN/SUPER_ADMIN)
      // Skip for non-admin users since the endpoint is restricted
      if (role === "ADMIN" || role === "SUPER_ADMIN") {
        try {
          console.debug(`📡 Calling getByRole(${role})...`);
          const rolePerms = await permissionService.getByRole(role as string);

          if (rolePerms && Array.isArray(rolePerms) && rolePerms.length > 0) {
            console.debug("✅ getByRole() succeeded:", rolePerms);
            const convertedPerms = convertPermissionsToFrontendFormat(rolePerms);
            setPermissions(convertedPerms);
            setPermissionsLoading(false);
            return;
          }
        } catch (err) {
          console.warn(
            "❌ getByRole failed for role:",
            role,
            err
          );
        }
      } else {
        console.debug(
          "⏭️ Skipping getByRole for non-admin user (role: " + role + ") - endpoint is restricted"
        );
      }

      // If we got here, no permissions were found
      console.warn("⚠️ No permissions found - user has no module access");
      console.error("🔍 DEBUG - Permission fetch details:", {
        role,
        companyRoleId,
        userId: (user as any)?.userId,
        message: "getMyPermissions() may have failed or user has no assigned permissions"
      });
      setPermissions({}); // Empty object = no permissions
    } catch (err) {
      console.error("❌ Unexpected error in fetchPermissions:", err);
      setPermissions({}); // Fail safely with empty permissions
    } finally {
      setPermissionsLoading(false);
    }
  };

  const fetchAccountPeriodStatus = async () => {
    try {
      const { data }: AxiosResponse<AccountingPeriod | null> = await apiClient.get(
        `/accounting-periods/open-status`
      );
      setAccountPeriodOpen(data != null);
      setOpenPeriod(data ?? null);
    } catch (err) {
      console.error("Failed to fetch account period status:", err);
      setAccountPeriodOpen(false);
      setOpenPeriod(null);
    }
  };

  const applyUserFromToken = (token: string) => {
    const decoded: DecodedToken = jwtDecode(token);
    const rawRole = String(decoded.role ?? "USER").toUpperCase();
    const role =
      rawRole === "ADMIN" || rawRole === "SUPER_ADMIN" || rawRole === "USER"
        ? (rawRole as Role)
        : ("USER" as Role);

    // 🔍 DEBUG: Log JWT contents
    console.debug("🔐 JWT Decoded:", {
      userId: decoded.userId,
      username: decoded.username,
      role: decoded.role,
      companyRoleId: decoded.companyRoleId,
      companyRole: decoded.companyRole,
      employeeId: decoded.employeeId,
      companyId: decoded.companyId,
    });

    setUser({
      userId: decoded.userId != null ? String(decoded.userId) : undefined,
      id: decoded.userId != null ? String(decoded.userId) : undefined,
      username: decoded.username || decoded.sub,
      role,
      companyRoleId: decoded.companyRoleId,
      companyRole: decoded.companyRole,
    });

    if (decoded.userId != null) {
      apiClient
        .get("/users/" + decoded.userId)
        .then((response) => {
          const profile = response.data;

          setUser({
            ...profile,
            id: String(decoded.userId),
            role,
            companyRoleId: decoded.companyRoleId,
            companyRole: decoded.companyRole,
          });

          const companyId = profile.companyId || decoded.companyId;

          if (companyId) {
            fetchCompany(companyId).then((data) => {
              setCompany(data);
            });
          }

          // Prefer companyRoleId for permission resolution (new backend)
          if (decoded.companyRoleId != null) {
            fetchPermissions(
              decoded.companyRole || role,
              decoded.companyRoleId
            );
          } else {
            const effectiveRole = profile.companyRole ?? role;
            fetchPermissions(effectiveRole);
          }
        })
        .catch((e) => {
          console.warn("Failed to load user profile:", e?.response?.status || e);
          if (decoded.companyRoleId != null) {
            fetchPermissions(
              decoded.companyRole || role,
              decoded.companyRoleId
            );
          } else {
            fetchPermissions(role);
          }
        });
    } else {
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
        );

        return () => clearTimeout(timeout);
      }
    } catch (error) {
      console.error("Invalid access token:", error);
      logout();
    }
  }, [accessToken]);

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

  const login = (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    apiClient.defaults.headers.common["Authorization"] =
      `Bearer ${accessToken}`;

    try {
      applyUserFromToken(accessToken);
      fetchAccountPeriodStatus();
    } catch (err) {
      console.error("Token decode failed", err);
    }
  };

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

  const logout = () => {
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