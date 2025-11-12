import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

export const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? children : <Navigate to="/auth/login" />;
};
