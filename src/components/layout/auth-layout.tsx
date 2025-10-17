import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div className="h-screen flex p-[20px]">
      {/* Left Panel */}
      <div
        className="hidden md:flex w-1/2 items-center justify-center rounded-lg bg-cover"
        style={{
          backgroundImage:
            "url(https://images.pexels.com/photos/10461968/pexels-photo-10461968.jpeg)",
        }}
      >
        <div className="text-center font-display">
          <h1 className="text-5xl text-white drop-shadow-md">
            Sunway ERP System
          </h1>
          <p className="mt-2 text-white/90 text-2xl">
            Smart organizational management platform
          </p>
        </div>
      </div>

      {/* Outlet for login/register */}
      <div className="w-full md:w-1/2 flex items-center justify-center p-6">
        <Outlet />
      </div>
    </div>
  );
};

export default AuthLayout;
