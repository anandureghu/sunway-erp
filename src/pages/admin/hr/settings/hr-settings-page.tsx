import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Settings,
  CalendarDays,
  Building2,
  Shield,
  Loader2,
  Edit2,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { roleService } from "@/service/roleService";
import {
  leavePolicyService,
  type LeaveTypeResponse,
} from "@/service/leavePolicyService";
import {
  fetchDepartments,
  createDepartment,
  updateDepartment,
  deleteDepartment,
} from "@/service/departmentService";
import { useAuth } from "@/context/AuthContext";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ active }: { active: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
        active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
      }`}
    >
      <span
        className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-600" : "bg-slate-400"}`}
      />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 bg-slate-900/45 z-50 flex items-center justify-center backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <span className="font-bold text-slate-800">{title}</span>
          <button
            onClick={onClose}
            className="bg-none border-none cursor-pointer text-2xl text-slate-400 leading-none hover:text-slate-600"
          >
            ×
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  hint,
}: {
  label: string;
  children: React.ReactNode;
  hint?: string;
}) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
        {label}
      </label>
      {children}
      {hint && <p className="text-xs text-slate-400 mt-1">{hint}</p>}
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "9px 12px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color .15s",
  background: "#fafafa",
};

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className={`w-10 h-6 rounded-full border-none cursor-pointer relative transition-colors ${checked ? "bg-blue-500" : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 ${checked ? "left-5" : "left-0.5"} w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm`}
      />
    </button>
  );
}

function PrimaryBtn({
  children,
  onClick,
  danger,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`px-4 py-2 rounded-lg border-none cursor-pointer text-white font-semibold text-sm transition-opacity hover:opacity-85 ${danger ? "bg-red-500" : "bg-blue-500"} ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
    >
      {children}
    </button>
  );
}

function GhostBtn({
  children,
  onClick,
}: {
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="px-4 py-2 rounded-lg border border-slate-200 cursor-pointer bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50"
    >
      {children}
    </button>
  );
}

// ─── Types ──────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
interface LeaveType extends LeaveTypeResponse {}
interface DeptType {
  id?: number;
  code: string;
  name: string;
  head?: string;
  costCenter?: string;
  active?: boolean;
}

// ─── LEAVES TAB ──────────────────────────────────────────────────────────────
function LeavesTab() {
  const { company } = useAuth();
  const [leaves, setLeaves] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | { edit: LeaveType }>(null);
  const [form, setForm] = useState<Partial<LeaveType>>({});
  const [del, setDel] = useState<LeaveType | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchLeaveTypes = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const res = await leavePolicyService.getLeaveTypes(company.id);
      setLeaves(res.data || []);
    } catch (err) {
      console.error("Failed to fetch leave types:", err);
      toast.error("Failed to fetch leave types");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, [company?.id]);

  const openAdd = () => {
    setForm({
      code: "",
      name: "",
      days: 1,
      paid: true,
      carryOver: false,
      maxCarry: 0,
    });
    setModal("add");
  };
  const openEdit = (item: LeaveType) => {
    setForm({ ...item });
    setModal({ edit: item });
  };

  const save = async () => {
    if (!form.code || !form.name || !company?.id) return;
    setSaving(true);
    try {
      const formData = form as LeaveType;
      if (modal === "add") {
        await leavePolicyService.createLeaveType(company.id, formData);
        toast.success("Leave type created successfully!");
      } else if (modal && "edit" in modal && formData.id) {
        await leavePolicyService.updateLeaveType(
          company.id,
          formData.id,
          formData,
        );
        toast.success("Leave type updated successfully!");
      }
      setModal(null);
      fetchLeaveTypes();
    } catch (err) {
      console.error("Failed to save leave type:", err);
      toast.error("Failed to save leave type");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!del?.id || !company?.id) return;
    try {
      await leavePolicyService.deleteLeaveType(company.id, del.id);
      toast.success("Leave type deleted successfully!");
      setDel(null);
      fetchLeaveTypes();
    } catch (err) {
      console.error("Failed to delete leave type:", err);
      toast.error("Failed to delete leave type");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-500">Loading leave types...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Leave Types</h2>
          <p className="text-sm text-slate-500 m-0 mt-1">
            Configure leave entitlements for employees
          </p>
        </div>
        <PrimaryBtn onClick={openAdd}>+ Add Leave Type</PrimaryBtn>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {[
                "Code",
                "Leave Type",
                "Days/Year",
                "Paid",
                "Carry Over",
                "Max Carry",
                "Actions",
              ].map((h) => (
                <th
                  key={h}
                  className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaves.map((l, i) => (
              <tr
                key={l.id}
                className={
                  i < leaves.length - 1 ? "border-b border-slate-100" : ""
                }
              >
                <td className="px-4 py-3.5">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-blue-500">
                    {l.code}
                  </span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800 text-sm">
                  {l.name}
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">
                  {l.days} days
                </td>
                <td className="px-4 py-3.5">
                  <Badge active={l.paid} />
                </td>
                <td className="px-4 py-3.5">
                  <Badge active={l.carryOver} />
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">
                  {l.carryOver ? `${l.maxCarry} days` : "—"}
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(l)}
                      className="px-3 py-1.5 border border-slate-200 rounded-md bg-white cursor-pointer text-xs font-semibold text-slate-600 hover:bg-slate-50"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDel(l)}
                      className="px-3 py-1.5 border border-red-200 rounded-md bg-white cursor-pointer text-xs font-semibold text-red-500 hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {leaves.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className="px-10 py-10 text-center text-slate-400 text-sm"
                >
                  No leave types found. Add your first leave type.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal?.edit) && (
        <Modal
          title={modal === "add" ? "Add Leave Type" : "Edit Leave Type"}
          onClose={() => setModal(null)}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Leave Code">
              <input
                style={inputStyle}
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                placeholder="AL"
                maxLength={6}
              />
            </Field>
            <Field label="Days per Year">
              <input
                type="number"
                style={inputStyle}
                value={form.days}
                min={1}
                onChange={(e) =>
                  setForm((p) => ({ ...p, days: Number(e.target.value) }))
                }
              />
            </Field>
          </div>
          <Field label="Leave Type Name">
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Annual Leave"
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Paid Leave">
              <div className="flex items-center gap-2.5 pt-1">
                <Toggle
                  checked={!!form.paid}
                  onChange={(v) => setForm((p) => ({ ...p, paid: v }))}
                />
                <span className="text-sm text-slate-600">
                  {form.paid ? "Yes" : "No"}
                </span>
              </div>
            </Field>
            <Field label="Allow Carry Over">
              <div className="flex items-center gap-2.5 pt-1">
                <Toggle
                  checked={!!form.carryOver}
                  onChange={(v) =>
                    setForm((p) => ({
                      ...p,
                      carryOver: v,
                      maxCarry: v ? p.maxCarry : 0,
                    }))
                  }
                />
                <span className="text-sm text-slate-600">
                  {form.carryOver ? "Yes" : "No"}
                </span>
              </div>
            </Field>
          </div>
          {form.carryOver && (
            <Field label="Max Carry Over Days">
              <input
                type="number"
                style={inputStyle}
                value={form.maxCarry}
                min={0}
                onChange={(e) =>
                  setForm((p) => ({ ...p, maxCarry: Number(e.target.value) }))
                }
              />
            </Field>
          )}
          <div className="flex gap-2.5 justify-end mt-2">
            <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </PrimaryBtn>
          </div>
        </Modal>
      )}

      {del && (
        <Modal title="Delete Leave Type" onClose={() => setDel(null)}>
          <p className="text-slate-600 mb-5">
            Are you sure you want to delete <strong>{del.name}</strong>? This
            cannot be undone.
          </p>
          <div className="flex gap-2.5 justify-end">
            <GhostBtn onClick={() => setDel(null)}>Cancel</GhostBtn>
            <PrimaryBtn danger onClick={handleDelete}>
              Delete
            </PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ROLES TAB ───────────────────────────────────────────────────────────────
interface Role {
  id?: number;
  name: string;
  description?: string;
  active?: boolean;
  custom?: boolean;
}

function RolesTab() {
  const navigate = useNavigate();
  const { company } = useAuth();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | { edit: Role }>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [form, setForm] = useState<Role>({
    name: "",
    description: "",
    active: true,
  });
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    if (!company?.id) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await roleService.getRoles(company.id);
      setRoles(res || []);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      toast.error("Failed to fetch roles");
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [company?.id]);

  const openAdd = () => {
    setForm({ name: "", description: "", active: true });
    setModal("add");
  };

  const openEdit = (role: Role) => {
    setForm({
      name: role.name,
      description: role.description || "",
      active: role.active ?? true,
    });
    setModal({ edit: role });
  };

  const saveRole = async () => {
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }
    if (!company?.id) {
      toast.error("Company not found");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
        companyId: company.id,
      };

      if (modal === "add") {
        await roleService.createRole(payload);
        toast.success("Role created successfully!");
      } else if (modal && "edit" in modal) {
        await roleService.updateRole({ id: modal.edit.id!, ...payload });
        toast.success("Role updated successfully!");
      }

      setModal(null);
      fetchRoles();
    } catch (err: unknown) {
      console.error("Failed to save role:", err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to save role");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteRole?.id) return;

    try {
      await roleService.deleteRole(deleteRole.id);
      toast.success("Role deleted successfully!");
      setDeleteRole(null);
      fetchRoles();
    } catch (err: unknown) {
      console.error("Failed to delete role:", err);
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error?.response?.data?.message || "Failed to delete role");
    }
  };

  const handleCustomizeLeave = (role: Role) => {
    navigate(
      `/hr/settings/leave-customization?role=${encodeURIComponent(role.name)}`,
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-500">Loading roles...</span>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">
            Company Roles
          </h2>
          <p className="text-sm text-slate-500 m-0 mt-1">
            {roles.length} role{roles.length !== 1 ? "s" : ""} configured.
            Create roles to manage permissions and leave balances.
          </p>
        </div>
        <PrimaryBtn onClick={openAdd}>+ Create Role</PrimaryBtn>
      </div>

      {roles.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            No roles created yet
          </h3>
          <p className="text-sm text-slate-500 mb-4">
            Create your first role to get started
          </p>
          <PrimaryBtn onClick={openAdd}>+ Create First Role</PrimaryBtn>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((role) => (
            <div
              key={role.id}
              className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-200 group"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                    <Shield className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">
                      {role.name}
                    </h3>
                    <p className="text-sm text-slate-500">
                      {role.description || "No description"}
                    </p>
                  </div>
                </div>
                <Badge active={role.active ?? true} />
              </div>

              <div className="flex items-center justify-end pt-4 border-t border-slate-100 gap-2">
                <button
                  onClick={() => handleCustomizeLeave(role)}
                  className="flex-1 px-3 py-2 rounded-lg bg-emerald-50 text-emerald-600 text-sm font-semibold hover:bg-emerald-100 transition-colors flex items-center justify-center gap-1"
                >
                  Customize Leave
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => openEdit(role)}
                  className="px-3 py-2 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeleteRole(role)}
                  className="px-3 py-2 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {(modal === "add" || modal?.edit) && (
        <Modal
          title={modal === "add" ? "Create New Role" : "Edit Role"}
          onClose={() => setModal(null)}
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Role Name *
              </label>
              <input
                style={inputStyle}
                value={form.name}
                onChange={(e) =>
                  setForm((p) => ({ ...p, name: e.target.value }))
                }
                placeholder="e.g., HR Manager, Finance Team Lead"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <textarea
                style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Brief description of this role"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                Status
              </label>
              <div className="flex items-center gap-3">
                <Toggle
                  checked={form.active ?? true}
                  onChange={(v) => setForm((p) => ({ ...p, active: v }))}
                />
                <span className="text-sm text-slate-600 font-medium">
                  {form.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={saveRole} disabled={saving}>
                {saving
                  ? "Saving..."
                  : modal === "add"
                    ? "Create Role"
                    : "Save Changes"}
              </PrimaryBtn>
            </div>
          </div>
        </Modal>
      )}

      {deleteRole && (
        <Modal title="Delete Role" onClose={() => setDeleteRole(null)}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              Delete "{deleteRole.name}"?
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently remove this role. Employees with this role
              will need to be reassigned.
            </p>
            <div className="flex gap-3 justify-center">
              <GhostBtn onClick={() => setDeleteRole(null)}>Cancel</GhostBtn>
              <PrimaryBtn danger onClick={handleDelete}>
                Delete Role
              </PrimaryBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DEPARTMENTS TAB ─────────────────────────────────────────────────────────
function DepartmentsTab() {
  const { company } = useAuth();
  const [depts, setDepts] = useState<DeptType[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | { edit: DeptType }>(null);
  const [form, setForm] = useState<Partial<DeptType>>({});
  const [del, setDel] = useState<DeptType | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchDepartmentsData = async () => {
    if (!company?.id) return;
    try {
      setLoading(true);
      const res = await fetchDepartments(company.id);
      setDepts(res || []);
    } catch (err) {
      console.error("Failed to fetch departments:", err);
      toast.error("Failed to fetch departments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartmentsData();
  }, [company?.id]);

  const openAdd = () => {
    setForm({ code: "", name: "", head: "", costCenter: "", active: true });
    setModal("add");
  };
  const openEdit = (item: DeptType) => {
    setForm({ ...item });
    setModal({ edit: item });
  };

  const save = async () => {
    if (!form.code || !form.name || !company?.id) return;
    setSaving(true);
    try {
      const formData = form as DeptType;
      if (modal === "add") {
        await createDepartment(company.id, formData);
        toast.success("Department created successfully!");
      } else if (modal && "edit" in modal && formData.id) {
        await updateDepartment(company.id, formData.id, formData);
        toast.success("Department updated successfully!");
      }
      setModal(null);
      fetchDepartmentsData();
    } catch (err) {
      console.error("Failed to save department:", err);
      toast.error("Failed to save department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!del?.id || !company?.id) return;
    try {
      await deleteDepartment(company.id, del.id);
      toast.success("Department deleted successfully!");
      setDel(null);
      fetchDepartmentsData();
    } catch (err) {
      console.error("Failed to delete department:", err);
      toast.error("Failed to delete department");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        <span className="ml-3 text-slate-500">Loading departments...</span>
      </div>
    );
  }

  const active = depts.filter((d) => d.active).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">
            Department Codes
          </h2>
          <p className="text-sm text-slate-500 m-0 mt-1">
            {active} active of {depts.length} departments
          </p>
        </div>
        <PrimaryBtn onClick={openAdd}>+ Add Department</PrimaryBtn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {depts.map((d) => (
          <div
            key={d.id}
            className={`bg-white rounded-xl border-2 border-slate-200 p-5 relative ${d.active ? "" : "opacity-60"}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm font-mono">
                  {d.code?.slice(0, 3)}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">
                    {d.name}
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{d.code}</div>
                </div>
              </div>
              <Badge active={d.active ?? false} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-xs font-bold text-slate-400 uppercase">
                  Head
                </div>
                <div className="text-sm font-semibold text-slate-700 mt-0.5">
                  {d.head || "—"}
                </div>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-xs font-bold text-slate-400 uppercase">
                  Cost Center
                </div>
                <div className="text-sm font-semibold text-slate-700 mt-0.5 font-mono">
                  {d.costCenter || "—"}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => openEdit(d)}
                className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-white cursor-pointer text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Edit
              </button>
              <button
                onClick={() => setDel(d)}
                className="flex-1 px-3 py-2 border border-red-200 rounded-lg bg-white cursor-pointer text-sm font-semibold text-red-500 hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {depts.length === 0 && (
          <div className="col-span-full text-center py-10 text-slate-400">
            No departments found. Add your first department.
          </div>
        )}
      </div>

      {(modal === "add" || modal?.edit) && (
        <Modal
          title={modal === "add" ? "Add Department" : "Edit Department"}
          onClose={() => setModal(null)}
        >
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department Code">
              <input
                style={inputStyle}
                value={form.code}
                onChange={(e) =>
                  setForm((p) => ({ ...p, code: e.target.value.toUpperCase() }))
                }
                placeholder="IT"
                maxLength={8}
              />
            </Field>
            <Field label="Cost Center">
              <input
                style={inputStyle}
                value={form.costCenter}
                onChange={(e) =>
                  setForm((p) => ({ ...p, costCenter: e.target.value }))
                }
                placeholder="CC-001"
              />
            </Field>
          </div>
          <Field label="Department Name">
            <input
              style={inputStyle}
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              placeholder="Information Technology"
            />
          </Field>
          <Field label="Department Head">
            <input
              style={inputStyle}
              value={form.head}
              onChange={(e) => setForm((p) => ({ ...p, head: e.target.value }))}
              placeholder="Full name"
            />
          </Field>
          <Field label="Status">
            <div className="flex items-center gap-2.5 pt-1">
              <Toggle
                checked={form.active ?? true}
                onChange={(v) => setForm((p) => ({ ...p, active: v }))}
              />
              <span className="text-sm text-slate-600">
                {form.active ? "Active" : "Inactive"}
              </span>
            </div>
          </Field>
          <div className="flex gap-2.5 justify-end mt-2">
            <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </PrimaryBtn>
          </div>
        </Modal>
      )}

      {del && (
        <Modal title="Delete Department" onClose={() => setDel(null)}>
          <p className="text-slate-600 mb-5">
            Delete <strong>{del.name}</strong>? All associated job codes must be
            reassigned first.
          </p>
          <div className="flex gap-2.5 justify-end">
            <GhostBtn onClick={() => setDel(null)}>Cancel</GhostBtn>
            <PrimaryBtn danger onClick={handleDelete}>
              Delete
            </PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id: "leaves", label: "Leave Types", icon: CalendarDays },
  { id: "roles", label: "Roles", icon: Shield },
  { id: "depts", label: "Departments", icon: Building2 },
];

export default function HRSettingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("leaves");

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <div className="bg-white border-b border-slate-200 px-8">
        <div className="max-w-5xl mx-auto">
          <div className="py-5 flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" /> Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 m-0">
                  HR Settings
                </h1>
                <p className="text-xs text-slate-500 m-0">
                  Manage leave types, roles, and departments
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-0">
            {TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`px-5 py-2.5 border-none bg-none cursor-pointer text-sm font-semibold flex items-center gap-1.5 transition-colors ${tab === t.id ? "text-blue-500 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-700"}`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>
      <div className="max-w-5xl mx-auto px-8 py-7">
        {tab === "leaves" && <LeavesTab />}
        {tab === "roles" && <RolesTab />}
        {tab === "depts" && <DepartmentsTab />}
      </div>
    </div>
  );
}
