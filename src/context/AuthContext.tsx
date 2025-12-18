import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { apiClient } from "@/service/apiClient";
import type { Employee, Role } from "@/types/hr";
import { useAppDispatch } from "@/store/store";
import { setAdminView } from "@/store/uiSlice";

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
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [user, setUser] = useState<Employee | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refreshToken")
  );

  const applyUserFromToken = (token: string) => {
    const decoded: DecodedToken = jwtDecode(token);
    const role =
      (decoded.role as Role) === "ADMIN" ||
      (decoded.role as Role) === "SUPER_ADMIN" ||
      (decoded.role as Role) === "USER"
        ? (decoded.role as Role)
        : "USER";

    setUser({
      id: decoded.userId != null ? String(decoded.userId) : undefined,
      username: decoded.username || decoded.sub,
      role,
    });

    // Only fetch /users/{id} if token actually contains a userId.
    if (decoded.userId != null) {
      apiClient
        .get("/users/" + decoded.userId)
        .then((response) => setUser(response.data))
        .catch((e) => {
          // Don't hard-logout on profile fetch failure; token may still be valid.
          console.warn("Failed to load user profile:", e?.response?.status || e);
        });
    }
  };

  /** Initialize session on app start */
  useEffect(() => {
    if (accessToken) {
      apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;

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
        const timeout = setTimeout(() => {
          refreshAccessToken();
        }, expiryTime - now - 5000); // refresh 5s before expiry

        return () => clearTimeout(timeout);
      }
    } catch (error) {
      console.error("Invalid access token:", error);
      logout();
    }
  }, [accessToken]);

  /** Login handler */
  const login = (accessToken: string, refreshToken: string) => {
    setAccessToken(accessToken);
    setRefreshToken(refreshToken);
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);

    // ✅ Set token to Axios default header
    apiClient.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${accessToken}`;

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
        apiClient.defaults.headers.common[
          "Authorization"
        ] = `Bearer ${newAccessToken}`;
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
        isAuthenticated: !!accessToken,
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
