import { Route, Routes } from "react-router-dom";
import "./App.css";
import AuthLayout from "./components/layout/auth-layout";
import AppLayout from "./components/layout/app-layout";
import LoginPage from "./pages/auth/login-page";
import RegisterPage from "./pages/auth/register-page";
import NotFound from "./pages/not-found";
import DashboardPage from "./pages/Dashboard";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route path="" element={<DashboardPage />} />
        </Route>

        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* Fallback Global 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
