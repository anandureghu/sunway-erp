import { Outlet } from "react-router-dom";

const AuthLayout = () => {
  return (
    <div>
      <div className="bg-primary flex justify-between w-full items-center mb-4">
        <img
          src="/assets/text-logo.svg"
          alt="sunway"
          width={120}
          className="mb-3"
        />
        <h1 className="text-white">Welcome to Sunway ERP and E-COM system</h1>
        <div></div>
      </div>
      <div className="w-full h-5 bg-primary mb-4"></div>
      <div className="border border-gray-400 px-2">
        please enter your username and password:
      </div>
      <div className="flex justify-start">
        {/* Left Panel */}
        <div className="hidden md:flex items-center justify-center border border-gray-400 border-t-0 p-6">
          <div className="text-center font-display">
            <img
              src="/assets/logo-dark.svg"
              alt="sunway"
              width={70}
              className="mx-auto mb-3"
            />
            <h1 className="text-2xl text-primary drop-shadow-md">Sunway ERP</h1>
            {/* <p className="mt-2 text-primary/50 text-2xl">
            Smart organizational management platform
          </p> */}
          </div>
        </div>

        {/* Outlet for login/register */}
        <div className="flex items-center justify-center p-6 border border-gray-400">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
