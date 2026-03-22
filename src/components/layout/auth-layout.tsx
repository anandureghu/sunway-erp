import { Outlet } from "react-router-dom";

/**
 * Full-viewport auth shell: purple–blue gradient behind centered content (login, reset password, etc.).
 */
const AuthLayout = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 p-4 sm:p-6">
      <Outlet />
    </div>
  );
};

export default AuthLayout;
