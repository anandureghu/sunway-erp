import { useMemo, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { EMPLOYEES } from "./employees.mock";
import type { Employee } from "../types/hr";

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const emp = useMemo(() => EMPLOYEES.find((e) => e.id === id), [id]);
  const [editing, setEditing] = useState(false);

  const [form, setForm] = useState<Partial<Employee>>(() => ({
    employeeNo: emp?.employeeNo ?? "",
    firstName: emp?.firstName ?? "",
    lastName: emp?.lastName ?? "",
    status: emp?.status ?? "Active",
    department: emp?.department ?? "",
    designation: emp?.designation ?? "",
  }));

  if (!emp) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">Employee not found.</div>
        <Link to="/hr/employees" className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-gray-50">← Back to Search</Link>
      </div>
    );
  }

  const onChange =
    (key: keyof Employee) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((s: Partial<Employee>) => ({ ...s, [key]: e.target.value }));   // ← typed `s`

  const onSave = () => {
    // TODO: call API
    console.log("Saving employee", { id: emp.id, ...form });
    setEditing(false);
  };

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="flex items-center justify-between rounded-t-lg bg-blue-600 px-5 py-3 text-white">
          <div className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-white text-blue-600">👤</span>
            <span>Employee Profile — {emp.firstName} {emp.lastName} <span className="opacity-90">({emp.employeeNo})</span></span>
            <span className="ml-2 inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-blue-700">{form.status}</span>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  onClick={() => {
                    setForm({
                      employeeNo: emp.employeeNo,
                      firstName: emp.firstName,
                      lastName: emp.lastName,
                      status: emp.status,
                      department: emp.department ?? "",
                      designation: emp.designation ?? "",
                    });
                    setEditing(false);
                  }}
                  className="h-9 rounded-md bg-white px-3 text-sm font-medium text-blue-700 hover:bg-white/90"
                >Cancel</button>
                <button onClick={onSave} className="h-9 rounded-md bg-white px-3 text-sm font-medium text-blue-700 hover:bg-white/90">Save</button>
              </>
            ) : (
              <button onClick={() => setEditing(true)} className="h-9 rounded-md bg-white px-3 text-sm font-medium text-blue-700 hover:bg-white/90">Edit / Update</button>
            )}
          </div>
        </div>

        <div className="rounded-b-lg bg-white p-5">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <Field label="Employee No">
              <input className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600" value={form.employeeNo as string} onChange={onChange("employeeNo")} disabled={!editing} />
            </Field>

            <Field label="Status">
              <select className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600" value={form.status as string} onChange={onChange("status")} disabled={!editing}>
                <option>Active</option><option>Inactive</option><option>On Leave</option>
              </select>
            </Field>

            <Field label="First Name">
              <input className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600" value={form.firstName as string} onChange={onChange("firstName")} disabled={!editing} />
            </Field>

            <Field label="Last Name">
              <input className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600" value={form.lastName as string} onChange={onChange("lastName")} disabled={!editing} />
            </Field>

            <Field label="Department">
              <input className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600" value={form.department as string} onChange={onChange("department")} disabled={!editing} />
            </Field>

            <Field label="Designation">
              <input className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600" value={form.designation as string} onChange={onChange("designation")} disabled={!editing} />
            </Field>
          </div>

          <div className="mt-6">
            <button onClick={() => navigate("/hr/employees")} className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-gray-50" type="button">← Back to Search</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[140px_1fr] items-center gap-3">
      <div className="text-sm text-gray-700">{label}:</div>
      {children}
    </div>
  );
}
