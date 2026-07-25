import { Link } from "react-router-dom";

export function DashboardViewAllLink({ to }: { to: string }) {
  return (
    <Link
      to={to}
      className="text-xs font-medium text-blue-600 hover:text-blue-700 hover:underline"
    >
      View All →
    </Link>
  );
}
