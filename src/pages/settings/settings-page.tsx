import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft, 
  Settings, 
  Building2, 
  Shield, 
  Plus, 
  Edit2, 
  Trash2, 
  ChevronRight,
  Save,
  Check
} from "lucide-react";
import { roleService } from "@/service/roleService";
import CompanyDetailPage from "../hr/company-detail-page";
import { useAuth } from "@/context/AuthContext";

// ─── Types ──────────────────────────────────────────────────────────────────
type SettingsTab = "company" | "roles";

interface Role {
  id?: number;
  name: string;
  description?: string;
  active?: boolean;
  custom?: boolean;
}

interface RoleFormData {
  name: string;
  description: string;
  active: boolean;
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const inputStyle = {
  width: "100%",
  padding: "10px 12px",
  border: "1.5px solid #e2e8f0",
  borderRadius: "8px",
  fontSize: "14px",
  color: "#0f172a",
  outline: "none",
  boxSizing: "border-box" as const,
  transition: "border-color .15s, box-shadow .15s",
};

// ─── Modal Component ───────────────────────────────────────────────────────
function Modal({ 
  title, 
  onClose, 
  children,
  size = "md" 
}: { 
  title: string; 
  onClose: () => void; 
  children: React.ReactNode;
  size?: "md" | "lg" | "xl";
}) {
  const sizeClasses = {
    md: "max-w-lg",
    lg: "max-w-2xl", 
    xl: "max-w-4xl"
  };

  return (
    <div 
      className="fixed inset-0 bg-slate-900/50 z-50 flex items-center justify-center backdrop-blur-sm animate-in fade-in duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={`bg-white rounded-2xl w-full ${sizeClasses[size]} shadow-2xl overflow-hidden m-4 animate-in zoom-in-95 duration-200`}>
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
          <span className="font-bold text-slate-800 text-lg">{title}</span>
          <button 
            onClick={onClose} 
            className="bg-none border-none cursor-pointer text-2xl text-slate-400 leading-none hover:text-slate-600 hover:bg-slate-100 rounded-lg p-1 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="p-6 max-h-[70vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

// ─── Badge Component ───────────────────────────────────────────────────────
function RoleBadge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
      active 
        ? "bg-emerald-50 text-emerald-700 border border-emerald-200" 
        : "bg-slate-100 text-slate-500 border border-slate-200"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-500" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Toggle Component ───────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!checked)} 
      className={`w-11 h-6.5 rounded-full border-none cursor-pointer relative transition-all duration-200 ${checked ? "bg-blue-500" : "bg-slate-200"}`}
    >
      <span 
        className={`absolute top-0.5 ${checked ? "left-5.5" : "left-0.5"} w-5 h-5 rounded-full bg-white transition-all duration-200 shadow-md flex items-center justify-center`}
      >
        {checked && <Check className="w-3 h-3 text-blue-500" />}
      </span>
    </button>
  );
}

// ─── Primary Button ─────────────────────────────────────────────────────────
function PrimaryBtn({ children, onClick, danger, disabled }: { 
  children: React.ReactNode; 
  onClick?: () => void; 
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button 
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2.5 rounded-lg border-none cursor-pointer text-white font-semibold text-sm transition-all hover:opacity-85 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed ${
        danger ? "bg-red-500 hover:bg-red-600" : "bg-blue-500 hover:bg-blue-600"
      }`}
    >
      {children}
    </button>
  );
}

// ─── Ghost Button ─────────────────────────────────────────────────────────
function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button 
      onClick={onClick} 
      className="px-4 py-2.5 rounded-lg border border-slate-200 cursor-pointer bg-white text-slate-600 font-semibold text-sm hover:bg-slate-50 active:scale-95 transition-all"
    >
      {children}
    </button>
  );
}

// ─── Role Card ─────────────────────────────────────────────────────────────
function RoleCard({ 
  role, 
  onEdit, 
  onDelete 
}: { 
  role: Role; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 p-5 hover:shadow-lg hover:border-blue-200 transition-all duration-200 group">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-slate-800 text-lg">{role.name}</h3>
            <p className="text-sm text-slate-500">{role.description || "No description"}</p>
          </div>
        </div>
        <RoleBadge active={role.active ?? true} />
      </div>
      
      <div className="flex items-center justify-end pt-4 border-t border-slate-100">
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button 
            onClick={onEdit}
            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-sm font-semibold hover:bg-blue-100 transition-colors flex items-center gap-1.5"
          >
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </button>
          <button 
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg bg-red-50 text-red-600 text-sm font-semibold hover:bg-red-100 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Roles Tab Content ────────────────────────────────────────────────────
function RolesTab({ companyId }: { companyId: string }) {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<null | "add" | { edit: Role }>(null);
  const [deleteRole, setDeleteRole] = useState<Role | null>(null);
  const [form, setForm] = useState<RoleFormData>({
    name: "",
    description: "",
    active: true
  });
  const [saving, setSaving] = useState(false);

  // Fetch roles from API using roleService
  const fetchRoles = async () => {
    try {
      setLoading(true);
      const res = await roleService.getRoles(Number(companyId));
      setRoles(res || []);
    } catch (err) {
      console.error("Failed to fetch roles:", err);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoles();
  }, [companyId]);

  const openAdd = () => {
    setForm({
      name: "",
      description: "",
      active: true
    });
    setModal("add");
  };

  const openEdit = (role: Role) => {
    setForm({
      name: role.name,
      description: role.description || "",
      active: role.active ?? true
    });
    setModal({ edit: role });
  };

  const saveRole = async () => {
    if (!form.name.trim()) {
      toast.error("Role name is required");
      return;
    }

    setSaving(true);
    try {
      const payload = {
        name: form.name,
        description: form.description,
        active: form.active,
        companyId: Number(companyId)
      };

      if (modal === "add") {
        await roleService.createRole(payload);
        toast.success("Role created successfully!");
      } else if (modal && 'edit' in modal) {
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

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-xl font-bold text-slate-800 m-0">Company Roles</h2>
          <p className="text-sm text-slate-500 m-0 mt-1">Create and manage roles for your company</p>
        </div>
        <PrimaryBtn onClick={openAdd}>
          <Plus className="w-4 h-4 mr-1.5" />
          Create Role
        </PrimaryBtn>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      ) : roles.length === 0 ? (
        <div className="bg-white rounded-xl border-2 border-dashed border-slate-200 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No roles created yet</h3>
          <p className="text-sm text-slate-500 mb-4">Create your first role to get started</p>
          <PrimaryBtn onClick={openAdd}>
            <Plus className="w-4 h-4 mr-1.5" />
            Create First Role
          </PrimaryBtn>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => (
            <RoleCard 
              key={role.id} 
              role={role} 
              onEdit={() => openEdit(role)}
              onDelete={() => setDeleteRole(role)}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Modal */}
      {(modal === "add" || modal?.edit) && (
        <Modal 
          title={modal === "add" ? "Create New Role" : "Edit Role"} 
          onClose={() => setModal(null)}
          size="md"
        >
          <div className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Role Name *
              </label>
              <input 
                style={inputStyle} 
                value={form.name} 
                onChange={e => setForm(p => ({...p, name: e.target.value}))} 
                placeholder="e.g., HR Manager, Finance Team Lead"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Description
              </label>
              <textarea 
                style={{...inputStyle, minHeight: "80px", resize: "vertical"}} 
                value={form.description} 
                onChange={e => setForm(p => ({...p, description: e.target.value}))} 
                placeholder="Brief description of this role"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">
                Status
              </label>
              <div className="flex items-center gap-3">
                <Toggle 
                  checked={form.active} 
                  onChange={v => setForm(p => ({...p, active: v}))} 
                />
                <span className="text-sm text-slate-600 font-medium">
                  {form.active ? "Active" : "Inactive"}
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400">
              💡 Note: Permissions for each module can be configured in <span className="text-blue-600 font-medium">HR Settings → Permissions</span>.
            </p>

            <div className="flex gap-3 justify-end pt-2">
              <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
              <PrimaryBtn onClick={saveRole} disabled={saving}>
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-1.5" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-1.5" />
                    {modal === "add" ? "Create Role" : "Save Changes"}
                  </>
                )}
              </PrimaryBtn>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation */}
      {deleteRole && (
        <Modal title="Delete Role" onClose={() => setDeleteRole(null)}>
          <div className="text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">Delete "{deleteRole.name}"?</h3>
            <p className="text-sm text-slate-500 mb-6">
              This will permanently remove this role. Employees with this role will need to be reassigned.
            </p>
            <div className="flex gap-3 justify-center">
              <GhostBtn onClick={() => setDeleteRole(null)}>Cancel</GhostBtn>
              <PrimaryBtn danger onClick={handleDelete}>Delete Role</PrimaryBtn>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────
export default function SettingsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { company } = useAuth();
  const [tab, setTab] = useState<SettingsTab>("company");

  const companyId = id || company?.id?.toString() || "";

  const tabs = [
    { id: "company" as const, label: "Company", icon: Building2 },
    { id: "roles" as const, label: "Roles", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-6 md:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="py-5 flex items-center gap-3 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 m-0">Settings</h1>
                <p className="text-xs text-slate-500 m-0">Manage your company settings and configurations</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0 -mb-px">
            {tabs.map(t => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)} 
                className={`px-5 py-3 border-none bg-none cursor-pointer text-sm font-semibold flex items-center gap-2 transition-all ${
                  tab === t.id 
                    ? "text-blue-600 border-b-2 border-blue-600 bg-blue-50/50" 
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
                {tab === t.id && (
                  <ChevronRight className="w-3 h-3 ml-auto" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-6 md:px-8 py-7">
        {tab === "company" && <CompanyDetailPage />}
        {tab === "roles" && <RolesTab companyId={companyId} />}
      </div>
    </div>
  );
}

