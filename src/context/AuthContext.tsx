import React, { createContext, useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { jwtDecode } from "jwt-decode";
import { apiClient } from "@/service/apiClient";
import type { Employee, Role } from "@/types/hr";

type DecodedToken = {
  userId: number;
  role: Role;
  username: string;
  sub: string;
  iss: string;
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

  const [user, setUser] = useState<Employee | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(
    localStorage.getItem("accessToken")
  );
  const [refreshToken, setRefreshToken] = useState<string | null>(
    localStorage.getItem("refreshToken")
  );

  /** Initialize session on app start */
  useEffect(() => {
    if (accessToken) {
      apiClient.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${accessToken}`;

      try {
        const decoded: DecodedToken = jwtDecode(accessToken);
        setUser({
          id: decoded.userId.toString(),
          username: decoded.username,
          role: decoded.role as Role,
        });
        apiClient.get("/users/" + decoded.userId).then((response) => {
          setUser(response.data);
        });
      } catch (e) {
        console.warn("Invalid token, logging out: ", e);
        logout();
      }
    }
  }, []);

  console.log(user);

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
      const decoded: DecodedToken = jwtDecode(accessToken);
      setUser({
        id: decoded.userId.toString(),
        username: decoded.username,
        role: decoded.role as Role,
      });
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
