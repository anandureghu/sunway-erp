import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, CalendarDays, Briefcase, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

// ─── Seed Data ────────────────────────────────────────────────────────────────
const INITIAL_LEAVES = [
  { id: 1, code: "AL", name: "Annual Leave", days: 14, paid: true, carryOver: true, maxCarry: 5 },
  { id: 2, code: "SL", name: "Sick Leave", days: 14, paid: true, carryOver: false, maxCarry: 0 },
  { id: 3, code: "ML", name: "Maternity Leave", days: 60, paid: true, carryOver: false, maxCarry: 0 },
  { id: 4, code: "PL", name: "Paternity Leave", days: 7, paid: true, carryOver: false, maxCarry: 0 },
  { id: 5, code: "UL", name: "Unpaid Leave", days: 30, paid: false, carryOver: false, maxCarry: 0 },
];

const INITIAL_JOBS = [
  { id: 1, code: "MGR-001", title: "Manager", level: "Mid", department: "General", active: true },
  { id: 2, code: "ENG-001", title: "Software Engineer", level: "Junior", department: "IT", active: true },
  { id: 3, code: "ENG-002", title: "Senior Engineer", level: "Senior", department: "IT", active: true },
  { id: 4, code: "HR-001", title: "HR Executive", level: "Junior", department: "HR", active: true },
  { id: 5, code: "FIN-001", title: "Finance Analyst", level: "Mid", department: "Finance", active: false },
];

const INITIAL_DEPTS = [
  { id: 1, code: "HR", name: "Human Resources", head: "Sarah Lim", costCenter: "CC-001", active: true },
  { id: 2, code: "IT", name: "Information Technology", head: "James Tan", costCenter: "CC-002", active: true },
  { id: 3, code: "FIN", name: "Finance", head: "Mary Wong", costCenter: "CC-003", active: true },
  { id: 4, code: "OPS", name: "Operations", head: "David Lee", costCenter: "CC-004", active: true },
  { id: 5, code: "MKT", name: "Marketing", head: "—", costCenter: "CC-005", active: false },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function Badge({ active }: { active: boolean }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
      active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
    }`}>
      <span className={`w-1.5 h-1.5 rounded-full ${active ? "bg-green-600" : "bg-slate-400"}`} />
      {active ? "Active" : "Inactive"}
    </span>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div 
      className="fixed inset-0 bg-slate-900/45 z-50 flex items-center justify-center backdrop-blur-sm" 
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
          <span className="font-bold text-slate-800">{title}</span>
          <button onClick={onClose} className="bg-none border-none cursor-pointer text-2xl text-slate-400 leading-none hover:text-slate-600">×</button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-4">
      <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">{label}</label>
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
  background: "#fafafa"
};

const selectStyle = { ...inputStyle, appearance: "none" as const, cursor: "pointer" as const };

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button 
      onClick={() => onChange(!checked)} 
      className={`w-10 h-6 rounded-full border-none cursor-pointer relative transition-colors ${checked ? "bg-blue-500" : "bg-slate-200"}`}
    >
      <span className={`absolute top-0.5 ${checked ? "left-5" : "left-0.5"} w-4.5 h-4.5 rounded-full bg-white transition-all shadow-sm`} />
    </button>
  );
}

function PrimaryBtn({ children, onClick, danger }: { children: React.ReactNode; onClick?: () => void; danger?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      className={`px-4 py-2 rounded-lg border-none cursor-pointer text-white font-semibold text-sm transition-opacity hover:opacity-85 ${danger ? "bg-red-500" : "bg-blue-500"}`}
    >
      {children}
    </button>
  );
}

function GhostBtn({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
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
type LeaveType = typeof INITIAL_LEAVES[0];
type JobType = typeof INITIAL_JOBS[0];
type DeptType = typeof INITIAL_DEPTS[0];

// ─── LEAVES TAB ──────────────────────────────────────────────────────────────
function LeavesTab() {
  const [leaves, setLeaves] = useState(INITIAL_LEAVES);
  const [modal, setModal] = useState<null | "add" | { edit: LeaveType }>(null);
  const [form, setForm] = useState<Partial<LeaveType>>({});
  const [del, setDel] = useState<LeaveType | null>(null);

  const openAdd = () => { 
    setForm({ code:"", name:"", days:1, paid:true, carryOver:false, maxCarry:0 }); 
    setModal("add"); 
  };
  const openEdit = (item: LeaveType) => { 
    setForm({...item}); 
    setModal({ edit: item }); 
  };
  const save = () => {
    if (!form.code || !form.name) return;
    const formData = form as LeaveType;
    if (modal === "add") {
      setLeaves(prev => [...prev, { ...formData, id: Date.now(), days: +formData.days, maxCarry: +formData.maxCarry }]);
    } else if (modal && 'edit' in modal) {
      setLeaves(prev => prev.map(l => l.id === formData.id ? { ...formData, days: +formData.days, maxCarry: +formData.maxCarry } : l));
    }
    setModal(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Leave Types</h2>
          <p className="text-sm text-slate-500 m-0 mt-1">Configure leave entitlements for employees</p>
        </div>
        <PrimaryBtn onClick={openAdd}>+ Add Leave Type</PrimaryBtn>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {["Code","Leave Type","Days/Year","Paid","Carry Over","Max Carry","Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {leaves.map((l, i) => (
              <tr key={l.id} className={i < leaves.length-1 ? "border-b border-slate-100" : ""}>
                <td className="px-4 py-3.5">
                  <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-xs font-bold text-blue-500">{l.code}</span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800 text-sm">{l.name}</td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{l.days} days</td>
                <td className="px-4 py-3.5"><Badge active={l.paid} /></td>
                <td className="px-4 py-3.5"><Badge active={l.carryOver} /></td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{l.carryOver ? `${l.maxCarry} days` : "—"}</td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(l)} className="px-3 py-1.5 border border-slate-200 rounded-md bg-white cursor-pointer text-xs font-semibold text-slate-600 hover:bg-slate-50">Edit</button>
                    <button onClick={() => setDel(l)} className="px-3 py-1.5 border border-red-200 rounded-md bg-white cursor-pointer text-xs font-semibold text-red-500 hover:bg-red-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal?.edit) && (
        <Modal title={modal === "add" ? "Add Leave Type" : "Edit Leave Type"} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Leave Code">
              <input 
                style={inputStyle} 
                value={form.code} 
                onChange={e => setForm(p=>({...p, code:e.target.value.toUpperCase()}))} 
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
                onChange={e => setForm(p=>({...p, days: Number(e.target.value)}))} 
              />
            </Field>
          </div>
          <Field label="Leave Type Name">
            <input 
              style={inputStyle} 
              value={form.name} 
              onChange={e => setForm(p=>({...p, name:e.target.value}))} 
              placeholder="Annual Leave" 
            />
          </Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Paid Leave">
              <div className="flex items-center gap-2.5 pt-1">
                <Toggle checked={!!form.paid} onChange={v => setForm(p=>({...p, paid:v}))} />
                <span className="text-sm text-slate-600">{form.paid ? "Yes" : "No"}</span>
              </div>
            </Field>
            <Field label="Allow Carry Over">
              <div className="flex items-center gap-2.5 pt-1">
                <Toggle checked={!!form.carryOver} onChange={v => setForm(p=>({...p, carryOver:v, maxCarry: v ? p.maxCarry : 0}))} />
                <span className="text-sm text-slate-600">{form.carryOver ? "Yes" : "No"}</span>
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
                onChange={e => setForm(p=>({...p, maxCarry: Number(e.target.value)}))} 
              />
            </Field>
          )}
          <div className="flex gap-2.5 justify-end mt-2">
            <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={save}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}

      {del && (
        <Modal title="Delete Leave Type" onClose={() => setDel(null)}>
          <p className="text-slate-600 mb-5">Are you sure you want to delete <strong>{del.name}</strong>? This cannot be undone.</p>
          <div className="flex gap-2.5 justify-end">
            <GhostBtn onClick={() => setDel(null)}>Cancel</GhostBtn>
            <PrimaryBtn danger onClick={() => { setLeaves(p => p.filter(l => l.id !== del.id)); setDel(null); }}>Delete</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── JOB CODES TAB ───────────────────────────────────────────────────────────
const LEVELS = ["Intern","Junior","Mid","Senior","Lead","Manager","Director","C-Level"];

function JobCodesTab() {
  const [jobs, setJobs] = useState(INITIAL_JOBS);
  const [modal, setModal] = useState<null | "add" | { edit: JobType }>(null);
  const [form, setForm] = useState<Partial<JobType>>({});
  const [del, setDel] = useState<JobType | null>(null);
  const [search, setSearch] = useState("");

  const filtered = jobs.filter(j => 
    j.code.toLowerCase().includes(search.toLowerCase()) || 
    j.title.toLowerCase().includes(search.toLowerCase())
  );
  
  const openAdd = () => { 
    setForm({ code:"", title:"", level:"Mid", department:"", active:true }); 
    setModal("add"); 
  };
  const openEdit = (item: JobType) => { 
    setForm({...item}); 
    setModal({ edit: item }); 
  };
  const save = () => {
    if (!form.code || !form.title) return;
    const formData = form as JobType;
    if (modal === "add") {
      setJobs(prev => [...prev, { ...formData, id: Date.now() }]);
    } else if (modal && 'edit' in modal) {
      setJobs(prev => prev.map(j => j.id === formData.id ? {...formData} : j));
    }
    setModal(null);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Job Codes</h2>
          <p className="text-sm text-slate-500 m-0 mt-1">Manage job positions and classification codes</p>
        </div>
        <div className="flex gap-2.5">
          <input 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            placeholder="Search jobs..." 
            className="w-48 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:border-blue-400"
          />
          <PrimaryBtn onClick={openAdd}>+ Add Job Code</PrimaryBtn>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-slate-50">
              {["Job Code","Job Title","Level","Department","Status","Actions"].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((j, i) => (
              <tr key={j.id} className={i < filtered.length-1 ? "border-b border-slate-100" : ""}>
                <td className="px-4 py-3.5">
                  <span className="font-mono bg-blue-50 px-2 py-0.5 rounded text-xs font-bold text-blue-600">{j.code}</span>
                </td>
                <td className="px-4 py-3.5 font-medium text-slate-800 text-sm">{j.title}</td>
                <td className="px-4 py-3.5">
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-green-50 text-green-700 font-semibold">{j.level}</span>
                </td>
                <td className="px-4 py-3.5 text-sm text-slate-600">{j.department}</td>
                <td className="px-4 py-3.5"><Badge active={j.active} /></td>
                <td className="px-4 py-3.5">
                  <div className="flex gap-2">
                    <button onClick={() => openEdit(j)} className="px-3 py-1.5 border border-slate-200 rounded-md bg-white cursor-pointer text-xs font-semibold text-slate-600 hover:bg-slate-50">Edit</button>
                    <button onClick={() => setDel(j)} className="px-3 py-1.5 border border-red-200 rounded-md bg-white cursor-pointer text-xs font-semibold text-red-500 hover:bg-red-50">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-10 py-10 text-center text-slate-400 text-sm">No job codes found</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {(modal === "add" || modal?.edit) && (
        <Modal title={modal === "add" ? "Add Job Code" : "Edit Job Code"} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Job Code">
              <input 
                style={inputStyle} 
                value={form.code} 
                onChange={e => setForm(p=>({...p, code:e.target.value.toUpperCase()}))} 
                placeholder="ENG-001" 
              />
            </Field>
            <Field label="Job Level">
              <select 
                style={selectStyle} 
                value={form.level} 
                onChange={e => setForm(p=>({...p, level:e.target.value}))}
              >
                {LEVELS.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Job Title">
            <input 
              style={inputStyle} 
              value={form.title} 
              onChange={e => setForm(p=>({...p, title:e.target.value}))} 
              placeholder="Software Engineer" 
            />
          </Field>
          <Field label="Department">
            <input 
              style={inputStyle} 
              value={form.department} 
              onChange={e => setForm(p=>({...p, department:e.target.value}))} 
              placeholder="IT" 
            />
          </Field>
          <Field label="Status">
            <div className="flex items-center gap-2.5 pt-1">
              <Toggle checked={!!form.active} onChange={v => setForm(p=>({...p, active:v}))} />
              <span className="text-sm text-slate-600">{form.active ? "Active" : "Inactive"}</span>
            </div>
          </Field>
          <div className="flex gap-2.5 justify-end mt-2">
            <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={save}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}

      {del && (
        <Modal title="Delete Job Code" onClose={() => setDel(null)}>
          <p className="text-slate-600 mb-5">Delete job code <strong>{del.code} — {del.title}</strong>?</p>
          <div className="flex gap-2.5 justify-end">
            <GhostBtn onClick={() => setDel(null)}>Cancel</GhostBtn>
            <PrimaryBtn danger onClick={() => { setJobs(p => p.filter(j => j.id !== del.id)); setDel(null); }}>Delete</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── DEPARTMENTS TAB ─────────────────────────────────────────────────────────
function DepartmentsTab() {
  const [depts, setDepts] = useState(INITIAL_DEPTS);
  const [modal, setModal] = useState<null | "add" | { edit: DeptType }>(null);
  const [form, setForm] = useState<Partial<DeptType>>({});
  const [del, setDel] = useState<DeptType | null>(null);

  const openAdd = () => { 
    setForm({ code:"", name:"", head:"", costCenter:"", active:true }); 
    setModal("add"); 
  };
  const openEdit = (item: DeptType) => { 
    setForm({...item}); 
    setModal({ edit: item }); 
  };
  const save = () => {
    if (!form.code || !form.name) return;
    const formData = form as DeptType;
    if (modal === "add") {
      setDepts(prev => [...prev, { ...formData, id: Date.now() }]);
    } else if (modal && 'edit' in modal) {
      setDepts(prev => prev.map(d => d.id === formData.id ? {...formData} : d));
    }
    setModal(null);
  };

  const active = depts.filter(d => d.active).length;

  return (
    <div>
      <div className="flex justify-between items-center mb-5">
        <div>
          <h2 className="text-lg font-bold text-slate-800 m-0">Department Codes</h2>
          <p className="text-sm text-slate-500 m-0 mt-1">{active} active of {depts.length} departments</p>
        </div>
        <PrimaryBtn onClick={openAdd}>+ Add Department</PrimaryBtn>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {depts.map(d => (
          <div 
            key={d.id} 
            className={`bg-white rounded-xl border-2 border-slate-200 p-5 relative ${d.active ? "" : "opacity-60"}`}
          >
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center text-white font-extrabold text-sm font-mono">
                  {d.code.slice(0,3)}
                </div>
                <div>
                  <div className="font-bold text-slate-800 text-sm">{d.name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">{d.code}</div>
                </div>
              </div>
              <Badge active={d.active} />
            </div>
            <div className="grid grid-cols-2 gap-2 mb-3.5">
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Head</div>
                <div className="text-sm font-semibold text-slate-700 mt-0.5">{d.head || "—"}</div>
              </div>
              <div className="bg-slate-50 rounded-lg px-3 py-2">
                <div className="text-xs font-bold text-slate-400 uppercase">Cost Center</div>
                <div className="text-sm font-semibold text-slate-700 mt-0.5 font-mono">{d.costCenter || "—"}</div>
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
      </div>

      {(modal === "add" || modal?.edit) && (
        <Modal title={modal === "add" ? "Add Department" : "Edit Department"} onClose={() => setModal(null)}>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Department Code">
              <input 
                style={inputStyle} 
                value={form.code} 
                onChange={e => setForm(p=>({...p, code:e.target.value.toUpperCase()}))} 
                placeholder="IT" 
                maxLength={8} 
              />
            </Field>
            <Field label="Cost Center">
              <input 
                style={inputStyle} 
                value={form.costCenter} 
                onChange={e => setForm(p=>({...p, costCenter:e.target.value}))} 
                placeholder="CC-001" 
              />
            </Field>
          </div>
          <Field label="Department Name">
            <input 
              style={inputStyle} 
              value={form.name} 
              onChange={e => setForm(p=>({...p, name:e.target.value}))} 
              placeholder="Information Technology" 
            />
          </Field>
          <Field label="Department Head">
            <input 
              style={inputStyle} 
              value={form.head} 
              onChange={e => setForm(p=>({...p, head:e.target.value}))} 
              placeholder="Full name" 
            />
          </Field>
          <Field label="Status">
            <div className="flex items-center gap-2.5 pt-1">
              <Toggle checked={form.active ?? true} onChange={v => setForm(p=>({...p, active:v}))} />
              <span className="text-sm text-slate-600">{form.active ? "Active" : "Inactive"}</span>
            </div>
          </Field>
          <div className="flex gap-2.5 justify-end mt-2">
            <GhostBtn onClick={() => setModal(null)}>Cancel</GhostBtn>
            <PrimaryBtn onClick={save}>Save</PrimaryBtn>
          </div>
        </Modal>
      )}

      {del && (
        <Modal title="Delete Department" onClose={() => setDel(null)}>
          <p className="text-slate-600 mb-5">Delete <strong>{del.name}</strong>? All associated job codes must be reassigned first.</p>
          <div className="flex gap-2.5 justify-end">
            <GhostBtn onClick={() => setDel(null)}>Cancel</GhostBtn>
            <PrimaryBtn danger onClick={() => { setDepts(p => p.filter(d => d.id !== del.id)); setDel(null); }}>Delete</PrimaryBtn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── ROOT ─────────────────────────────────────────────────────────────────────
const TABS = [
  { id:"leaves", label:"Leave Types", icon: CalendarDays },
  { id:"jobs",   label:"Job Codes",   icon: Briefcase },
  { id:"depts",  label:"Departments", icon: Building2 },
];

export default function HRSettingsPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState("leaves");

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      {/* Page Header */}
      <div className="bg-white border-b border-slate-200 px-8">
        <div className="max-w-5xl mx-auto">
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
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                <Settings className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-800 m-0">HR Settings</h1>
                <p className="text-xs text-slate-500 m-0">Manage leave types, job codes, and departments</p>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-0">
            {TABS.map(t => (
              <button 
                key={t.id} 
                onClick={() => setTab(t.id)} 
                className={`px-5 py-2.5 border-none bg-none cursor-pointer text-sm font-semibold flex items-center gap-1.5 transition-colors ${
                  tab === t.id ? "text-blue-500 border-b-2 border-blue-500" : "text-slate-500 hover:text-slate-700"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-8 py-7">
        {tab === "leaves" && <LeavesTab />}
        {tab === "jobs"   && <JobCodesTab />}
        {tab === "depts"  && <DepartmentsTab />}
      </div>
    </div>
  );
}
