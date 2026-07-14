import { useAuth } from "@/context/AuthContext";
import { HomeCheckInWidget } from "@/modules/hr/leaves/components/home-check-in-widget";
import { HomeTasksPanel } from "./home/home-tasks-panel";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { HomeModuleLauncher } from "./home/home-module-launcher";

export default function HomePage() {
  const { user } = useAuth();
  const employeeId = user?.employeeId ? Number(user.employeeId) : null;
  const employeeName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="space-y-8 p-6">

      <section>

        {employeeId ? (
          <HomeCheckInWidget
            employeeId={employeeId}
            employeeName={employeeName || undefined}
          />
        ) : (
          <Card className="border-dashed">
            <CardHeader>
              <CardTitle className="text-base">Check-in unavailable</CardTitle>
              <CardDescription>
                Your user account is not linked to an employee record. Contact HR
                or an administrator to enable attendance tracking.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              You can still use the modules below to access your work areas.
            </CardContent>
          </Card>
        )}
      </section>

      <section>
        <HomeTasksPanel />
      </section>

      <section className="space-y-4">
        {/* <div>
          <h2 className="text-lg font-semibold text-slate-900">Your modules</h2>
          <p className="text-sm text-muted-foreground">
            Open any module you have access to across HR, inventory, sales, and
            finance.
          </p>
        </div> */}
        <HomeModuleLauncher />
      </section>
    </div>
  );
}
