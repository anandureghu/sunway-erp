import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus, Search, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { jobCodeService } from "@/service/jobCodeService";
import { fetchHrPolicies } from "@/service/companyService";
import { useAuth } from "@/context/AuthContext";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { usePagination } from "@/components/table-pagination";
import { type JobCode } from "./shared";
import { JobCodesTable } from "./job-codes-table";
import {
  JobCodeFormDialog,
  JobCodeViewDialog,
  JobCodeDeleteDialog,
} from "./job-code-dialogs";

export function JobCodesTab({
  jobs,
  setJobs,
}: {
  jobs: JobCode[];
  setJobs: React.Dispatch<React.SetStateAction<JobCode[]>>;
}) {
  const { user } = useAuth();
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState<Partial<JobCode>>({});
  const [del, setDel] = useState<JobCode | null>(null);
  const [view, setView] = useState<JobCode | null>(null);
  const [q, setQ] = useState("");
  const [, setLoading] = useState(true);
  const [departments, setDepartments] = useState<{ id: number; name: string }[]>(
    [],
  );
  const [divisions, setDivisions] = useState<{ id: number; name: string }[]>([]);
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

  const filtered = jobs.filter(
    (j) =>
      j.code.toLowerCase().includes(q.toLowerCase()) ||
      j.title.toLowerCase().includes(q.toLowerCase()),
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
  }, [q, setPageIndex]);

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
    });
    setModal(true);
  };

  const openEdit = (r: JobCode) => {
    setForm({ ...r });
    setModal(true);
  };

  const save = async () => {
    if (!form.code || !form.title) return;

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

  const handleDecision = async (jc: JobCode, approve: boolean) => {
    try {
      const updated = approve
        ? await jobCodeService.approve(jc.id)
        : await jobCodeService.reject(jc.id);
      setJobs((prev) => prev.map((j) => (j.id === jc.id ? updated : j)));
      toast.success(approve ? "Job code approved" : "Job code rejected");
    } catch (error) {
      const detail =
        (error as any)?.response?.data?.message ??
        (error as any)?.response?.data?.error;
      toast.error(detail || "Failed to update approval");
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
        onApprove={(jc) => handleDecision(jc, true)}
        onReject={(jc) => handleDecision(jc, false)}
      />

      <JobCodeFormDialog
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
      />

      <JobCodeDeleteDialog
        del={del}
        onClose={() => setDel(null)}
        onConfirm={handleDelete}
      />
    </div>
  );
}
