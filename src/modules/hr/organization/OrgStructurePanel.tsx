import { useEffect, useMemo, useState } from "react";
import {
  Loader2,
  Search,
  Building2,
  Users,
  Network,
  ChevronDown,
  Crown,
  GitBranch,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { cn, initialsFrom } from "@/lib/utils";
import { SecondaryPageHeader } from "@/components/SecondaryPageHeader";
import { fetchDepartments } from "@/service/departmentService";
import { fetchDivisions } from "@/service/divisionService";
import { hrService } from "@/service/hr.service";
import type { Department } from "@/types/department";
import type { DivisionResponseDTO } from "@/types/division";
import type { Employee } from "@/types/hr";

// ── helpers ───────────────────────────────────────────────────────────────────
const empName = (e: Employee) =>
  [e.firstName, e.lastName].filter(Boolean).join(" ").trim() ||
  e.employeeNo ||
  "—";

const STATUS_DOT: Record<string, string> = {
  ACTIVE: "bg-emerald-500",
  ON_LEAVE: "bg-amber-400",
  UNDER_PROBATION: "bg-sky-400",
  INACTIVE: "bg-slate-300",
  RESIGNED: "bg-rose-400",
  TERMINATED: "bg-rose-500",
  RETIRED: "bg-violet-400",
};

// Pure-CSS connectors for the top-down org chart (scoped under .org-tree).
const TREE_CSS = `
.org-tree { min-width: max-content; }
.org-tree ul {
  position: relative; display: flex; justify-content: center;
  padding-top: 22px; margin: 0; list-style: none;
}
.org-tree li {
  position: relative; display: flex; flex-direction: column; align-items: center;
  padding: 22px 12px 0; list-style: none;
}
.org-tree li::before, .org-tree li::after {
  content: ''; position: absolute; top: 0; right: 50%;
  border-top: 2px solid var(--org-line, #e2e8f0); width: 50%; height: 22px;
}
.org-tree li::after { right: auto; left: 50%; border-left: 2px solid var(--org-line, #e2e8f0); }
.org-tree li:only-child::before, .org-tree li:only-child::after { display: none; }
.org-tree li:only-child { padding-top: 22px; }
.org-tree li:first-child::before, .org-tree li:last-child::after { border: 0 none; }
.org-tree li:last-child::before { border-right: 2px solid var(--org-line, #e2e8f0); border-radius: 0 6px 0 0; }
.org-tree li:first-child::after { border-radius: 6px 0 0 0; }
.org-tree ul ul::before {
  content: ''; position: absolute; top: 0; left: 50%;
  border-left: 2px solid var(--org-line, #e2e8f0); width: 0; height: 22px;
}
.org-tree > ul { padding-top: 0; }
.org-tree > ul > li { padding-top: 0; }
.org-tree > ul > li::before, .org-tree > ul > li::after { display: none; }
`;

/** Avatar chip with initials or photo. */
function Avatar({
  name,
  imageUrl,
  size = "md",
  ring,
}: {
  name: string;
  imageUrl?: string;
  size?: "sm" | "md";
  ring?: string;
}) {
  const dim = size === "sm" ? "h-8 w-8 text-[10px]" : "h-10 w-10 text-xs";
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-violet-500 to-blue-600 font-bold text-white shadow-sm",
        dim,
        ring,
      )}
    >
      {imageUrl ? (
        <img src={imageUrl} alt="" className="h-full w-full object-cover" />
      ) : (
        initialsFrom(name)
      )}
    </div>
  );
}

// ── node data ───────────────────────────────────────────────────────────────────
type DeptNode = {
  department: Department;
  divisions: DivisionResponseDTO[];
  members: Employee[];
  head: Employee | null;
  headName: string | null;
};

// ── the tree boxes ──────────────────────────────────────────────────────────────
function EmployeeBox({ e, isHead }: { e: Employee; isHead?: boolean }) {
  return (
    <div
      className={cn(
        "flex w-[170px] items-center gap-2 rounded-xl border bg-white px-2.5 py-2 shadow-sm",
        isHead ? "border-amber-200 ring-1 ring-amber-100" : "border-slate-200",
      )}
    >
      <Avatar
        name={empName(e)}
        imageUrl={e.imageUrl}
        size="sm"
        ring={isHead ? "ring-2 ring-amber-300" : undefined}
      />
      <div className="min-w-0 flex-1 text-left">
        <div className="flex items-center gap-1">
          <p className="truncate text-xs font-semibold text-slate-800">
            {empName(e)}
          </p>
          {isHead && <Crown className="h-3 w-3 shrink-0 text-amber-500" />}
        </div>
        <p className="truncate text-[10px] text-slate-400">
          {e.designation || e.companyRole || e.employeeNo || "—"}
        </p>
      </div>
      <span
        className={cn(
          "h-2 w-2 shrink-0 rounded-full",
          STATUS_DOT[String(e.status ?? "").toUpperCase()] ?? "bg-slate-300",
        )}
        title={String(e.status ?? "")}
      />
    </div>
  );
}

function DivisionBox({ d }: { d: DivisionResponseDTO }) {
  const lead = [d.managerFirstName, d.managerLastName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return (
    <div className="w-[170px] rounded-xl border border-sky-200 bg-sky-50/70 px-3 py-2 text-center shadow-sm">
      <div className="mx-auto mb-1 flex h-7 w-7 items-center justify-center rounded-lg bg-sky-100 text-sky-600">
        <GitBranch className="h-3.5 w-3.5" />
      </div>
      <p className="truncate text-xs font-semibold text-slate-800">{d.name}</p>
      <p className="truncate text-[10px] text-slate-400">
        {lead ? `Lead: ${lead}` : "No lead"}
      </p>
    </div>
  );
}

function DeptBox({
  node,
  expanded,
  onToggle,
}: {
  node: DeptNode;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { department, divisions, members, headName } = node;
  const hasChildren = divisions.length + members.length > 0;
  return (
    <div className="w-[210px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 px-3 py-2 text-white">
        <Building2 className="h-4 w-4 shrink-0" />
        <p className="truncate text-sm font-bold">{department.departmentName}</p>
      </div>
      <div className="px-3 py-2.5 text-center">
        <p className="truncate text-xs text-slate-600">
          {headName ? (
            <>
              <Crown className="mr-1 inline h-3 w-3 text-amber-500" />
              <span className="font-medium">{headName}</span>
            </>
          ) : (
            <span className="text-slate-400">No department head</span>
          )}
        </p>
        <div className="mt-1.5 flex items-center justify-center gap-2 text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-0.5 font-semibold text-violet-700">
            <Users className="h-3 w-3" /> {members.length}
          </span>
          {divisions.length > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 font-semibold text-sky-700">
              <GitBranch className="h-3 w-3" /> {divisions.length}
            </span>
          )}
        </div>
        {hasChildren && (
          <button
            type="button"
            onClick={onToggle}
            className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
          >
            {expanded ? "Hide team" : "Show team"}
            <ChevronDown
              className={cn(
                "h-3 w-3 transition-transform",
                expanded && "rotate-180",
              )}
            />
          </button>
        )}
      </div>
    </div>
  );
}

// ── main panel ──────────────────────────────────────────────────────────────────
export default function OrgStructurePanel() {
  const { company, user } = useAuth();
  const companyId =
    company?.id != null
      ? Number(company.id)
      : user?.companyId != null
        ? Number(user.companyId)
        : null;
  const companyName = company?.companyName ?? "Your Company";

  const [departments, setDepartments] = useState<Department[]>([]);
  const [divisions, setDivisions] = useState<DivisionResponseDTO[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [openIds, setOpenIds] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (companyId == null) return;
    let mounted = true;
    setLoading(true);
    Promise.all([
      fetchDepartments(companyId),
      fetchDivisions(companyId),
      hrService.listEmployees(),
    ])
      .then(([depts, divs, emps]) => {
        if (!mounted) return;
        setDepartments((depts as Department[]) ?? []);
        setDivisions((divs as DivisionResponseDTO[]) ?? []);
        setEmployees(Array.isArray(emps) ? emps : []);
      })
      .catch((err) => {
        console.error("OrgStructure load failed", err);
        if (mounted) toast.error("Failed to load organization structure");
      })
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [companyId]);

  const nodes = useMemo<DeptNode[]>(() => {
    return departments
      .map((dept) => {
        const members = employees.filter(
          (e) => Number(e.departmentId) === dept.id,
        );
        const head =
          (dept.managerId != null &&
            members.find((m) => Number(m.id) === dept.managerId)) ||
          null;
        const headName =
          [dept.managerFirstName, dept.managerLastName]
            .filter(Boolean)
            .join(" ")
            .trim() || (head ? empName(head) : null);
        return {
          department: dept,
          divisions: divisions.filter((d) => d.departmentId === dept.id),
          members,
          head,
          headName,
        };
      })
      .sort((a, b) =>
        a.department.departmentName.localeCompare(b.department.departmentName),
      );
  }, [departments, divisions, employees]);

  const unassigned = useMemo(() => {
    const assigned = new Set(
      employees
        .filter((e) => departments.some((d) => Number(e.departmentId) === d.id))
        .map((e) => e.id),
    );
    return employees.filter((e) => !assigned.has(e.id));
  }, [employees, departments]);

  const q = search.trim().toLowerCase();
  const visibleNodes = useMemo(() => {
    if (!q) return nodes;
    return nodes.filter(
      (n) =>
        n.department.departmentName.toLowerCase().includes(q) ||
        (n.department.departmentCode ?? "").toLowerCase().includes(q) ||
        (n.headName ?? "").toLowerCase().includes(q) ||
        n.members.some(
          (m) =>
            empName(m).toLowerCase().includes(q) ||
            (m.designation ?? "").toLowerCase().includes(q) ||
            (m.employeeNo ?? "").toLowerCase().includes(q),
        ),
    );
  }, [nodes, q]);

  const toggle = (id: number) =>
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allOpen = nodes.length > 0 && openIds.size >= nodes.length;
  const toggleAll = () =>
    setOpenIds(allOpen ? new Set() : new Set(nodes.map((n) => n.department.id)));

  useEffect(() => {
    if (q) setOpenIds(new Set(visibleNodes.map((n) => n.department.id)));
     
  }, [q]);

  return (
    <div className="space-y-5">
      <SecondaryPageHeader
        title="Organization Structure"
        description="Company hierarchy — departments, divisions, heads and their teams"
        icon={<Network className="h-5 w-5" />}
        actions={
          nodes.length > 0 ? (
            <button
              type="button"
              onClick={toggleAll}
              className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          ) : undefined
        }
      />

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : (
        <>
          <div className="relative max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search department, head or employee…"
              className="h-10 w-full rounded-xl border border-slate-200 pl-9 pr-3 text-sm focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-200"
            />
          </div>

          {/* top-down org chart tree (scrolls horizontally when wide) */}
          <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/40 p-6">
            <style>{TREE_CSS}</style>
            {nodes.length === 0 ? (
              <p className="py-10 text-center text-sm text-slate-400">
                No departments yet. Add departments to build your org structure.
              </p>
            ) : (
              <div className="org-tree mx-auto">
                <ul>
                  <li>
                    {/* company root */}
                    <div className="flex w-[240px] items-center gap-3 rounded-2xl bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3 text-white shadow">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15">
                        <Building2 className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <p className="truncate text-sm font-bold">
                          {companyName}
                        </p>
                        <p className="text-[11px] text-white/80">
                          {employees.length} employees · {departments.length}{" "}
                          depts · {divisions.length} divisions
                        </p>
                      </div>
                    </div>

                    {/* departments */}
                    <ul>
                      {visibleNodes.map((node) => {
                        const expanded = openIds.has(node.department.id);
                        const ordered = [...node.members].sort((a, b) => {
                          if (node.head) {
                            if (a.id === node.head.id) return -1;
                            if (b.id === node.head.id) return 1;
                          }
                          return empName(a).localeCompare(empName(b));
                        });
                        return (
                          <li key={node.department.id}>
                            <DeptBox
                              node={node}
                              expanded={expanded}
                              onToggle={() => toggle(node.department.id)}
                            />
                            {expanded &&
                              node.divisions.length + node.members.length >
                                0 && (
                                <ul>
                                  {node.divisions.map((d) => (
                                    <li key={`div-${d.id}`}>
                                      <DivisionBox d={d} />
                                    </li>
                                  ))}
                                  {ordered.map((e) => (
                                    <li key={`emp-${e.id}`}>
                                      <EmployeeBox
                                        e={e}
                                        isHead={node.head?.id === e.id}
                                      />
                                    </li>
                                  ))}
                                </ul>
                              )}
                          </li>
                        );
                      })}

                      {/* unassigned employees as a sibling branch */}
                      {!q && unassigned.length > 0 && (
                        <li key="unassigned">
                          <div className="w-[210px] rounded-2xl border border-dashed border-slate-300 bg-white px-3 py-2.5 text-center shadow-sm">
                            <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-400">
                              <UserRound className="h-4 w-4" />
                            </div>
                            <p className="text-sm font-semibold text-slate-700">
                              Unassigned
                            </p>
                            <p className="text-[11px] text-slate-400">
                              {unassigned.length} without a department
                            </p>
                            <button
                              type="button"
                              onClick={() => toggle(-1)}
                              className="mt-2 inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-50"
                            >
                              {openIds.has(-1) ? "Hide" : "Show"}
                              <ChevronDown
                                className={cn(
                                  "h-3 w-3 transition-transform",
                                  openIds.has(-1) && "rotate-180",
                                )}
                              />
                            </button>
                          </div>
                          {openIds.has(-1) && (
                            <ul>
                              {unassigned.map((e) => (
                                <li key={`un-${e.id}`}>
                                  <EmployeeBox e={e} />
                                </li>
                              ))}
                            </ul>
                          )}
                        </li>
                      )}
                    </ul>
                  </li>
                </ul>
              </div>
            )}
            {q && visibleNodes.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">
                No matches for your search.
              </p>
            )}
          </div>
        </>
      )}
    </div>
  );
}
