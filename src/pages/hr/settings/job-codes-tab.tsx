import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Plus, Search, Briefcase, Hourglass } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jobCodeService } from "@/service/jobCodeService";
import { fetchHrPolicies } from "@/service/companyService";
import { useAuth } from "@/context/AuthContext";
import { canApproveModule, canEditModule } from "@/lib/module-permissions";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { usePagination } from "@/components/table-pagination";
import { type JobCode, type JobCodeStatus, JOB_CODE_STATUS_META } from "./shared";
import { JobCodesTable, type HoldAction } from "./job-codes-table";
import {
  JobCodeFormDialog,
  JobCodeViewDialog,
  JobCodeDeleteDialog,
  JobCodeHoldDecisionDialog,
} from "./job-code-dialogs";
import { ImportJobCodesCsvDialog } from "./import-job-codes-csv-dialog";

export function JobCodesTab({
  jobs,
  setJobs,
}: {
  jobs: JobCode[];
  setJobs: React.Dispatch<React.SetStateAction<JobCode[]>>;
}) {
  const { user, permissions } = useAuth();
  const navigate = useNavigate();
  const canApproveHolds =
    canApproveModule(permissions, "HR_SETTINGS") ||
    canApproveModule(permissions, "HRS_JOB_CODES");
  const canEditHolds = canEditModule(permissions, "HR_SETTINGS");
  const [holdTarget, setHoldTarget] = useState<{ jc: JobCode; action: HoldAction } | null>(
    null,
  );
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<JobCode>>({});
  const [del, setDel] = useState<JobCode | null>(null);
  const [view, setView] = useState<JobCode | null>(null);
  const [q, setQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<JobCodeStatus | "ALL">("ALL");
  const [, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [divisions, setDivisions] = useState<
    { id: number; name: string; departmentId?: number | null }[]
  >([]);
  const F = (p: Partial<JobCode>) => setForm((v) => ({ ...v, ...p }));

  useEffect(() => {
    fetchJobCodes();
  }, []);

  // Departments + divisions populate the job-code dialog dropdowns.
  useEffect(() => {
    if (!user?.companyId) return;
    void (async () => {
      try {
        const [{ fetchDepartments }, { fetchDivisions }] = await Promise.all([
          import("@/service/departmentService"),
          import("@/service/divisionService"),
        ]);
        const cid = Number(user.companyId);
        const [deps, divs] = await Promise.all([
          fetchDepartments(cid),
          fetchDivisions(cid),
        ]);
        setDepartments(
          (Array.isArray(deps) ? deps : []).map((d: any) => ({
            id: d.id,
            name: d.departmentName ?? d.name ?? `#${d.id}`,
          })),
        );
        setDivisions(
          (Array.isArray(divs) ? divs : []).map((d: any) => ({
            id: d.id,
            name: d.name ?? `#${d.id}`,
            // Carry the owning department so the dialog can show only that
            // department's divisions when a department is selected.
            departmentId: d.departmentId ?? null,
          })),
        );
      } catch {
        /* dropdowns just stay empty */
      }
    })();
  }, [user?.companyId]);

  const fetchJobCodes = async () => {
    try {
      setLoading(true);
      const res = await jobCodeService.getAll();
      setJobs(res);
    } catch (error) {
      console.error("Error loading job codes:", error);
      toast.error("Failed to load job codes");
    } finally {
      setLoading(false);
    }
  };

  const statusCounts = jobs.reduce<Record<JobCodeStatus, number>>(
    (acc, j) => {
      acc[(j.status ?? "VACANT") as JobCodeStatus] += 1;
      return acc;
    },
    { VACANT: 0, OCCUPIED: 0, ON_HOLD: 0 },
  );

  const awaitingApproval = jobs.filter(
    (j) => j.status === "ON_HOLD" && (j.holdReason ?? "PENDING_APPROVAL") === "PENDING_APPROVAL",
  ).length;

  // Editing a hold that awaits approval can't close it — only Approve / Reject can.
  const pendingLocked =
    !!form.id &&
    jobs.some(
      (j) =>
        j.id === form.id &&
        j.status === "ON_HOLD" &&
        (j.holdReason ?? "PENDING_APPROVAL") === "PENDING_APPROVAL",
    );

  const filtered = jobs.filter(
    (j) =>
      (statusFilter === "ALL" || (j.status ?? "VACANT") === statusFilter) &&
      (j.code.toLowerCase().includes(q.toLowerCase()) ||
        j.title.toLowerCase().includes(q.toLowerCase())),
  );

  const {
    pageItems,
    pageIndex,
    setPageIndex,
    pageSize,
    setPageSize,
    pageCount,
    total,
  } = usePagination(filtered, 10);

  // Jump back to the first page whenever the search query changes.
  useEffect(() => {
    setPageIndex(0);
  }, [q, statusFilter, setPageIndex]);

  const openAdd = async () => {
    let minSalary: number | null = 1000;
    if (user?.companyId) {
      try {
        const policies = await fetchHrPolicies(user.companyId);
        minSalary = Number(policies.minimumMonthlyWage ?? 1000);
      } catch {
        /* keep default 1000 */
      }
    }
    setForm({
      code: "",
      title: "",
      level: "Mid",
      salaryGrade: "G3",
      minSalary,
      maxSalary: null,
      active: true,
      status: "VACANT",
      holdComment: null,
      holdReason: null,
    });
    setModal(true);
  };

  const openEdit = (r: JobCode) => {
    setForm({ ...r });
    setModal(true);
  };

  const save = async () => {
    if (!form.code || !form.title) return;
    if (form.status === "ON_HOLD" && !form.holdReason) {
      toast.error("Choose why the position is on hold");
      return;
    }
    if (form.status === "ON_HOLD" && !form.holdComment?.trim()) {
      toast.error("Add a comment explaining why the position is on hold");
      return;
    }

    const minSalary = form.minSalary ?? null;
    const maxSalary = form.maxSalary ?? null;
    if (
      minSalary != null &&
      maxSalary != null &&
      Number(minSalary) > Number(maxSalary)
    ) {
      toast.error("Min salary cannot exceed max salary");
      return;
    }

    setLoading(true);
    try {
      const payload = {
        code: form.code,
        title: form.title,
        level: form.level || "Mid",
        salaryGrade: form.salaryGrade || "G3",
        minSalary,
        maxSalary,
        active: form.active ?? true,
        // OCCUPIED is automatic — the server keeps it; only Vacant / On Hold are chosen.
        status: form.status === "OCCUPIED" ? null : (form.status ?? "VACANT"),
        holdComment: form.status === "ON_HOLD" ? form.holdComment?.trim() || null : null,
        holdReason: form.status === "ON_HOLD" ? (form.holdReason ?? null) : null,
        departmentId: form.departmentId ?? null,
        divisionId: form.divisionId ?? null,
        employmentCategory: form.employmentCategory ?? null,
        employmentType: form.employmentType ?? null,
        workLocation: form.workLocation ?? null,
        workCity: form.workCity ?? null,
        workCountry: form.workCountry ?? null,
      };

      if (form.id) {
        const updated = await jobCodeService.update(form.id, payload);
        setJobs((prev) => prev.map((j) => (j.id === form.id ? updated : j)));
        toast.success("Job code updated");
      } else {
        const created = await jobCodeService.create(payload);
        setJobs((prev) => [...prev, created]);
        toast.success("Job code created");
      }
      setModal(false);
    } catch (error) {
      console.error("Error saving job code:", error);
      const detail =
        (error as any)?.response?.data?.message ??
        (error as any)?.response?.data?.error;
      toast.error(detail || "Failed to save job code");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (jc: JobCode) => {
    try {
      await jobCodeService.delete(jc.id);
      setJobs((prev) => prev.filter((j) => j.id !== jc.id));
      toast.success("Job code deleted");
    } catch (error) {
      console.error("Error deleting job code:", error);
      const detail =
        (error as any)?.response?.data?.message ??
        (error as any)?.response?.data?.error;
      toast.error(detail || "Failed to delete job code");
    } finally {
      setDel(null);
    }
  };

  const decideHold = async (note: string) => {
    if (!holdTarget) return;
    const { jc, action } = holdTarget;
    try {
      const updated = await jobCodeService.decideHold(jc.id, action, note);
      setJobs((prev) => prev.map((j) => (j.id === jc.id ? updated : j)));
      toast.success(
        action === "approve"
          ? `${jc.code} approved — the position is now vacant and can be assigned`
          : action === "reject"
            ? `${jc.code} rejected — the job code has been deactivated`
            : `${jc.code} released — the position is now vacant`,
      );
      setHoldTarget(null);
    } catch (error) {
      const detail =
        (error as any)?.response?.data?.message ??
        (error as any)?.response?.data?.error;
      toast.error(detail || "Could not update the hold");
    }
  };

  return (
    <div className="space-y-6">
      <SecondaryPageHeader
        title="Job Codes"
        description="Manage job codes"
        icon={<Briefcase className="h-5 w-5" />}
        actions={
          <>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search..."
                className="pl-9 w-48"
              />
            </div>
            <ImportJobCodesCsvDialog onImported={fetchJobCodes} />
            <Button
              onClick={openAdd}
              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Job Code
            </Button>
          </>
        }
      />

      {awaitingApproval > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-orange-200 bg-orange-50/70 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-100 text-orange-600">
              <Hourglass className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                {awaitingApproval} position{awaitingApproval === 1 ? "" : "s"} awaiting approval
              </p>
              <p className="text-xs text-slate-500">
                {canApproveHolds
                  ? "Review them in HR Operations → Position approvals — approve to open the position, or reject to deactivate the job code."
                  : "An HR approver needs to approve or reject these holds in HR Operations → Position approvals."}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="border-orange-300 bg-white text-orange-700 hover:bg-orange-100"
            onClick={() => {
              if (!canApproveHolds) {
                setStatusFilter("ON_HOLD");
                return;
              }
              navigate("/hr/operations?tab=position-approvals");
            }}
          >
            {canApproveHolds ? "Go to Position approvals" : "Show on-hold codes"}
          </Button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        {(["ALL", "VACANT", "OCCUPIED", "ON_HOLD"] as const).map((s) => {
          const active = statusFilter === s;
          const count = s === "ALL" ? jobs.length : statusCounts[s];
          return (
            <button
              key={s}
              type="button"
              onClick={() => setStatusFilter(s)}
              className={`inline-flex h-8 items-center gap-2 rounded-full border px-3 text-xs font-semibold transition ${
                active
                  ? "border-blue-600 bg-blue-600 text-white shadow-sm"
                  : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
              }`}
            >
              {s !== "ALL" && (
                <span
                  className={`h-1.5 w-1.5 rounded-full ${active ? "bg-white" : JOB_CODE_STATUS_META[s].dot}`}
                />
              )}
              {s === "ALL" ? "All" : JOB_CODE_STATUS_META[s].label}
              <span
                className={`rounded-full px-1.5 text-[10px] tabular-nums ${active ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      <JobCodesTable
        rows={pageItems}
        filteredCount={filtered.length}
        total={total}
        q={q}
        pageIndex={pageIndex}
        pageSize={pageSize}
        pageCount={pageCount}
        onPageChange={setPageIndex}
        onPageSizeChange={setPageSize}
        onView={setView}
        onEdit={openEdit}
        onDelete={setDel}
        onHoldAction={(jc, action) => setHoldTarget({ jc, action })}
        canApproveHolds={canApproveHolds}
        canEditHolds={canEditHolds}
      />

      <JobCodeFormDialog
        pendingLocked={pendingLocked}
        open={modal}
        onOpenChange={setModal}
        form={form}
        onField={F}
        onSave={save}
        onClose={() => setModal(false)}
        existingCodes={jobs.map((j) => j.code)}
        departments={departments}
        divisions={divisions}
      />

      <JobCodeViewDialog
        view={view}
        onClose={() => setView(null)}
        onEdit={openEdit}
        onHoldAction={(jc, action) => {
          setView(null);
          setHoldTarget({ jc, action });
        }}
        canApproveHolds={canApproveHolds}
        canEditHolds={canEditHolds}
      />

      <JobCodeHoldDecisionDialog
        target={holdTarget}
        onClose={() => setHoldTarget(null)}
        onConfirm={decideHold}
      />

      <JobCodeDeleteDialog
        del={del}
        onClose={() => setDel(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
