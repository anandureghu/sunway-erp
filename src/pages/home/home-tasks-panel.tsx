import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { leaveService } from "@/service/leaveService";
import { loanService } from "@/service/loanService";
import { canApproveModule } from "@/lib/module-permissions";
import { canView } from "@/service/companyService";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Bell,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Inbox,
  Loader2,
  User,
  Wallet,
} from "lucide-react";
import { cn } from "@/lib/utils";

type TaskItem = {
  id: string;
  title: string;
  description: string;
  href: string;
  count?: number;
  tone: "amber" | "blue" | "emerald" | "slate";
  icon: typeof Bell;
};

export function HomeTasksPanel() {
  const { user, permissions } = useAuth();
  const [loading, setLoading] = useState(true);
  const [leavePending, setLeavePending] = useState(0);
  const [loanPending, setLoanPending] = useState(0);
  const [canApproveLeaves, setCanApproveLeaves] = useState(false);

  const employeeId = user?.employeeId ? Number(user.employeeId) : null;
  const employeeName = [user?.firstName, user?.lastName]
    .filter(Boolean)
    .join(" ");

  const canApproveLoans = canApproveModule(permissions, "LOANS");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const tasks: Promise<void>[] = [];

        tasks.push(
          leaveService.fetchCanApprove().then((ok) => {
            if (!mounted) return;
            setCanApproveLeaves(ok);
            if (ok) {
              return leaveService.fetchPendingApprovals().then((res) => {
                if (!mounted) return;
                setLeavePending(Array.isArray(res.data) ? res.data.length : 0);
              });
            }
            setLeavePending(0);
          }),
        );

        if (canApproveLoans) {
          tasks.push(
            loanService.fetchPendingApprovals().then((res) => {
              if (!mounted) return;
              setLoanPending(Array.isArray(res.data) ? res.data.length : 0);
            }),
          );
        } else {
          setLoanPending(0);
        }

        await Promise.all(tasks);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    void load();
    return () => {
      mounted = false;
    };
  }, [canApproveLoans]);

  const quickLinks = useMemo(() => {
    if (!employeeId) return [];
    const links: TaskItem[] = [];

    links.push({
      id: "profile",
      title: "My profile",
      description: "View and update your employee profile",
      href: `/hr/employees/${employeeId}/profile`,
      tone: "blue",
      icon: User,
    });

    if (canView(permissions, "LEAVES")) {
      links.push({
        id: "timesheet",
        title: "My timesheet",
        description: "View attendance history and shift details",
        href: `/hr/employees/${employeeId}/leaves/timesheet`,
        tone: "emerald",
        icon: Clock,
      });
      links.push({
        id: "leaves",
        title: "My leaves",
        description: "Request leave and track balances",
        href: `/hr/employees/${employeeId}/leaves`,
        tone: "slate",
        icon: Calendar,
      });
    }

    return links;
  }, [employeeId, permissions]);

  const approvalTasks = useMemo(() => {
    const tasks: TaskItem[] = [];

    if (canApproveLeaves && leavePending > 0) {
      tasks.push({
        id: "leave-approvals",
        title: "Leave approvals",
        description: `${leavePending} request${leavePending === 1 ? "" : "s"} waiting for your review`,
        href: "/hr/settings?tab=leave-approvals",
        count: leavePending,
        tone: "amber",
        icon: Bell,
      });
    }

    if (canApproveLoans && loanPending > 0) {
      tasks.push({
        id: "loan-approvals",
        title: "Loan approvals",
        description: `${loanPending} loan${loanPending === 1 ? "" : "s"} waiting for your decision`,
        href: "/hr/settings?tab=loan-approvals",
        count: loanPending,
        tone: "amber",
        icon: Wallet,
      });
    }

    return tasks;
  }, [canApproveLeaves, canApproveLoans, leavePending, loanPending]);

  const allTasks = [...approvalTasks];
  const hasTasks = allTasks.length > 0;

  const toneStyles = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    blue: "border-blue-200 bg-blue-50 text-blue-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    slate: "border-slate-200 bg-slate-50 text-slate-700",
  };

  return (
    <Card className="border-slate-200 shadow-sm">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600 shadow-sm">
            <Inbox className="h-5 w-5 text-white" />
          </div>
          <div>
            <CardTitle className="text-lg">Tasks & quick links</CardTitle>
            <CardDescription>
              {employeeName
                ? `What needs your attention, ${employeeName.split(" ")[0]}`
                : "What needs your attention today"}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-500" />
          </div>
        ) : !hasTasks ? (
          <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-6 py-10 text-center">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <p className="text-sm font-medium text-slate-700">
              You&apos;re all caught up
            </p>
            <p className="text-xs text-slate-500">
              No pending approvals or quick links right now.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {allTasks.map((task) => {
              const Icon = task.icon;
              return (
                <Link
                  key={task.id}
                  to={task.href}
                  className={cn(
                    "group flex items-center gap-3 rounded-xl border px-4 py-3 transition-all hover:shadow-sm",
                    toneStyles[task.tone],
                  )}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/70">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-sm font-semibold">{task.title}</span>
                      {task.count != null && task.count > 0 && (
                        <span className="rounded-full bg-white/80 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                          {task.count}
                        </span>
                      )}
                    </span>
                    <span className="block truncate text-xs opacity-80">
                      {task.description}
                    </span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 opacity-50 transition-transform group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
