import { Search, Trash2, Edit, KeyRound, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TablePagination } from "@/components/table-pagination";
import { PERMISSION_PAGE_SIZES } from "@/lib/permission-ui";
import {
  type Role,
  type Permission,
  CAPS,
  TOTAL_CAPS,
  ROLE_STYLES,
  AVATAR_COLORS,
} from "./shared";

const capCount = (rec: Permission) =>
  Object.values(rec.caps ?? {}).reduce(
    (acc, m) =>
      acc + CAPS.filter((c) => (m as Record<string, boolean>)[c.key]).length,
    0,
  );

/** Company-roles management table. */
export function RolesTable({
  roles,
  perms,
  onEditRole,
  onRemovePerms,
  onDeleteRole,
}: {
  roles: Role[];
  perms: Permission[];
  onEditRole: (r: Role) => void;
  onRemovePerms: (r: Role) => void;
  onDeleteRole: (r: Role) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-slate-50">
          <TableRow>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Role Name
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Type
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Description
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Permission Rules
            </TableHead>
            <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
              Actions
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((r, i) => (
            <TableRow
              key={r.id}
              className={`border-b border-slate-100 transition-colors hover:bg-slate-50/60 ${i % 2 === 0 ? "bg-white" : "bg-slate-50/40"}`}
            >
              <TableCell>
                <Badge
                  className={`${ROLE_STYLES[r.name]?.bg || "bg-gray-100"} ${ROLE_STYLES[r.name]?.color || "text-gray-700"} border ${ROLE_STYLES[r.name]?.border || "border-gray-200"}`}
                >
                  {r.name}
                  {r.custom && <span className="ml-1 text-[10px]">CUSTOM</span>}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge
                  variant="outline"
                  className={
                    r.custom
                      ? "border-purple-300 text-purple-700"
                      : "border-slate-300 text-slate-600"
                  }
                >
                  {r.custom ? "Custom" : "System"}
                </Badge>
              </TableCell>
              <TableCell className="text-slate-500">
                {r.description || "—"}
              </TableCell>
              <TableCell className="text-slate-500">
                {perms.filter((p) => p.roleId === r.id && !p.staffId).length}{" "}
                rule(s)
              </TableCell>
              <TableCell className="text-right">
                {r.custom ? (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEditRole(r)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemovePerms(r)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      title="Remove all permissions for this role"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDeleteRole(r)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onRemovePerms(r)}
                      className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      title="Remove all permissions for this role"
                    >
                      <KeyRound className="h-4 w-4" />
                    </Button>
                    <span className="text-sm text-slate-400 italic">
                      System role
                    </span>
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))}
          {roles.length === 0 && (
            <TableRow>
              <TableCell
                colSpan={5}
                className="text-center py-12 text-slate-500"
              >
                No company roles found
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}

/** Permission-rules view: summary cards, filters, and the rules table. */
export function PermissionRulesView({
  perms,
  roles,
  q,
  setQ,
  filterRole,
  setFilterRole,
  displayed,
  pagedPerms,
  pageIndex,
  pageSize,
  pageCount,
  total,
  onPageChange,
  onPageSizeChange,
  onEditPerm,
  onDeletePerm,
  onToggleActive,
}: {
  perms: Permission[];
  roles: Role[];
  q: string;
  setQ: (v: string) => void;
  filterRole: string;
  setFilterRole: (v: string) => void;
  displayed: Permission[];
  pagedPerms: Permission[];
  pageIndex: number;
  pageSize: number;
  pageCount: number;
  total: number;
  onPageChange: (i: number) => void;
  onPageSizeChange: (s: number) => void;
  onEditPerm: (p: Permission) => void;
  onDeletePerm: (p: Permission) => void;
  onToggleActive: (p: Permission) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Rules", val: perms.length, color: "text-blue-600" },
          {
            label: "Active",
            val: perms.filter((p) => p.active).length,
            color: "text-green-600",
          },
          {
            label: "By Employee",
            val: perms.filter((p) => p.staffId).length,
            color: "text-purple-600",
          },
          {
            label: "By Role",
            val: perms.filter((p) => !p.staffId).length,
            color: "text-yellow-600",
          },
        ].map((s) => (
          <Card key={s.label} className="bg-white border-slate-200">
            <CardContent className="p-4">
              <p className={`text-2xl font-bold ${s.color}`}>{s.val}</p>
              <p className="text-xs text-slate-500 font-medium">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-wrap gap-2">
          {["All", ...roles.map((r) => r.name)].map((r) => (
            <Button
              key={r}
              variant={filterRole === r ? "default" : "outline"}
              size="sm"
              onClick={() => setFilterRole(r)}
              className={
                filterRole === r ? "bg-indigo-600 hover:bg-indigo-700" : ""
              }
            >
              {r}
            </Button>
          ))}
        </div>
        <div className="ml-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search staff or role..."
            className="pl-9 w-56"
          />
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Staff Name
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Role
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Scope
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Email
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Phone
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Access
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Status
              </TableHead>
              <TableHead className="text-[10px] font-bold uppercase tracking-wider text-slate-500 text-right">
                Options
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayed.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-12">
                  <div className="flex flex-col items-center gap-2">
                    <KeyRound className="h-12 w-12 text-slate-300" />
                    <p className="text-slate-500 font-medium">
                      No permission rules yet
                    </p>
                    <p className="text-slate-400 text-sm">
                      Click 'Add' to grant an employee or role access
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              pagedPerms.map((p) => {
                const cnt = capCount(p);
                const pct = Math.round((cnt / TOTAL_CAPS) * 100);
                return (
                  <TableRow
                    key={p.id}
                    className={`hover:bg-slate-50/50 ${!p.active && "opacity-50"}`}
                  >
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {p.staffName ? (
                          <Avatar>
                            <div
                              className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold ${AVATAR_COLORS[p.staffName.charCodeAt(0) % AVATAR_COLORS.length]}`}
                            >
                              {p.staffName
                                .split(" ")
                                .map((w) => w[0])
                                .slice(0, 2)
                                .join("")
                                .toUpperCase()}
                            </div>
                          </Avatar>
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                            <Users className="h-4 w-4 text-slate-400" />
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-slate-900">
                            {p.staffName || (
                              <span className="italic text-slate-400">
                                All {p.role}s
                              </span>
                            )}
                          </p>
                          {p.staffName && (
                            <p className="text-xs text-slate-400">
                              Individual override
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={`${ROLE_STYLES[p.role]?.bg || "bg-gray-100"} ${ROLE_STYLES[p.role]?.color || "text-gray-700"} border ${ROLE_STYLES[p.role]?.border || "border-gray-200"}`}
                      >
                        {p.role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={
                          p.staffId
                            ? "border-purple-300 text-purple-700"
                            : "border-green-300 text-green-700"
                        }
                      >
                        {p.staffId ? "Individual" : "Role-wide"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-sm">
                      {p.email || "—"}
                    </TableCell>
                    <TableCell className="text-slate-500 font-mono text-sm">
                      {p.phone || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${pct > 70 ? "bg-green-500" : pct > 30 ? "bg-blue-500" : "bg-slate-400"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500">
                          {cnt}/{TOTAL_CAPS}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.active}
                          onCheckedChange={() => onToggleActive(p)}
                        />
                        <span
                          className={`text-sm font-medium ${p.active ? "text-green-600" : "text-slate-400"}`}
                        >
                          {p.active ? "On" : "Off"}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditPerm(p)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDeletePerm(p)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>

        {displayed.length > 0 && (
          <div className="border-t border-slate-100 px-2">
            <TablePagination
              total={total}
              pageIndex={pageIndex}
              pageSize={pageSize}
              pageCount={pageCount}
              onPageChange={onPageChange}
              onPageSizeChange={onPageSizeChange}
              pageSizeOptions={PERMISSION_PAGE_SIZES}
            />
          </div>
        )}
      </div>
    </>
  );
}
