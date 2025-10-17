import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="h-screen flex flex-col items-center justify-center text-center px-4">
      <img
        src="/assets/404.svg"
        alt="Not Found"
        className="max-w-xs mb-6"
        onError={(e) => (e.currentTarget.style.display = "none")}
      />
      <h1 className="text-5xl font-bold text-blue-600 mb-3">404</h1>
      <h2 className="text-2xl font-semibold mb-2">Page Not Found</h2>
      <p className="text-gray-500 mb-6 max-w-md">
        The page you’re looking for doesn’t exist or has been moved.
      </p>

      <Button asChild>
        <Link to="/">Go Back Home</Link>
      </Button>
    </div>
  );
}
