import { Link, Outlet } from "react-router-dom";
import { useEmployeeSelection } from "@/context/employee-selection";

export default function EmployeeShell() {
  const { selected } = useEmployeeSelection();

  // If no employee is selected
  if (!selected) {
    return (
      <div className="p-6">
        <h2 className="text-xl font-semibold mb-2">Select an employee</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Go back to the Employee Overview and pick an employee to view their details.
        </p>
        <Link
          to="/hr/employees"
          className="inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90"
        >
          Back to Search
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6">

      {/* Only Back to Search button (header removed) */}
      <div className="mb-4 flex items-center justify-end">
        <Link
          to="/hr/employees"
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-muted"
        >
          Back to Search
        </Link>
      </div>

      {/* Render page content */}
      <Outlet />
    </div>
  );
}
