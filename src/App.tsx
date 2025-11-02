import { Route, Routes } from "react-router-dom";
import "./App.css";
import AuthLayout from "./components/layout/auth-layout";
import AppLayout from "./components/layout/app-layout";
import LoginPage from "./pages/auth/login-page";
import RegisterPage from "./pages/auth/register-page";
import NotFound from "./pages/not-found";
import DashboardPage from "./pages/dashboard";
import AccountsReceivablePage from "./pages/finance/accounts-receivable-page";
import ManageStocks from "./pages/inventory/manage-stocks";

function App() {
  return (
    <>
      <Routes>
        {/* 🌐 Main App Layout */}
        <Route path="/" element={<AppLayout />}>
          <Route path="" element={<DashboardPage />} />

          {/* 💰 Finance Module */}
          <Route path="finance">
            <Route path="receivable" element={<AccountsReceivablePage />} />
          </Route>

          {/* 🛒 Inventory Module */}
          <Route path="inventory">
            <Route path="stocks" element={<ManageStocks />} />
          </Route>
        </Route>

        {/* 🔐 Auth Routes */}
        <Route path="/auth" element={<AuthLayout />}>
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
        </Route>

        {/* 🚫 Fallback Global 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
