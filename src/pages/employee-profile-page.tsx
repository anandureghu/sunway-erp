import { useState, useEffect } from "react";
import { apiClient } from "@/service/apiClient";
import { Link, useNavigate, useParams } from "react-router-dom";
import { hrService } from "@/service/hr.service";
import { toast } from "sonner";
import { DependentsForm } from "@/modules/hr/dependents/DependentsForm";
import { User } from "lucide-react";
import type { Employee, EmployeeStatus } from "../types/hr";
import { useAuth } from "@/context/AuthContext";
import roleService from "@/service/roleService";
import { permissionService } from "@/service/permissionService";
import type { RoleOption } from "@/types/role";

export default function EmployeeProfilePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser, permissions } = useAuth();
  const [effectivePermissions, setEffectivePermissions] = useState<Record<string, Record<string, boolean>> | null>(permissions ?? null);

  const [emp, setEmp] = useState<Employee | null>(null);
  const [editing, setEditing] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);
  const [, setRoleOptions] = useState<RoleOption[]>([]);

  // Check if current user is admin
  const isAdmin = currentUser?.role === "ADMIN" || currentUser?.role === "SUPER_ADMIN";

  // Default roles as fallback

  // Fetch roles from API
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        // Get company ID from the employee or current user
        const companyId = emp?.companyId || currentUser?.companyId;
        if (companyId) {
          const roles = await roleService.getRoles(Number(companyId));
          if (roles && roles.length > 0) {
            const options = roles
              .filter((r) => r.active !== false)
              .map((r) => ({ label: r.name, value: r.name }));
            setRoleOptions(options);
          }
        }
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };
    fetchRoles();
  }, [emp?.companyId, currentUser?.companyId]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const e = await hrService.getEmployee(id);
        if (mounted) setEmp(e ?? null);
      } catch (err: any) {
        console.error(
          "EmployeeProfilePage -> failed to load employee:",
          err?.response?.data ?? err,
        );
        toast.error(
          err?.response?.data?.message ||
            err?.message ||
            "Failed to load employee",
        );
        if (mounted) setEmp(null);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [id]);

  // Enforce view permissions: if user lacks viewAll and viewOwn (for this record), deny access
  useEffect(() => {
    if (!emp) return;

    // Admin bypass
    if (permissions === null) {
      setAccessDenied(false);
      return;
    }

    const moduleKey = "employee_profile";
    const caps = permissions ? (permissions as any)[moduleKey] : null;
    const hasViewAll = caps?.view_all ?? false;
    const hasViewOwn = caps?.view_own ?? false;

    const allowed = hasViewAll || (hasViewOwn && String(emp.id) === String(currentUser?.id));

    setAccessDenied(!allowed);
  }, [emp, permissions, currentUser]);

  // Ensure we have current user's permissions — fallback to direct fetch when context permissions are empty/object
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!permissions || Object.keys(permissions).length === 0) {
          const perms = await permissionService.getMyPermissions();
          const caps = permissionService.toFrontendCaps(perms);
          if (mounted) setEffectivePermissions(caps);
        } else {
          setEffectivePermissions(permissions);
        }
      } catch (e) {
        console.warn('Failed to fetch fallback permissions:', e);
        if (mounted) setEffectivePermissions(permissions ?? {});
      }
    })();

    return () => {
      mounted = false;
    };
  }, [permissions]);

  type FormState = {
    employeeNo: string;
    firstName: string;
    lastName: string;

    gender: string;
    prefix: string;
    status: EmployeeStatus | string;
    maritalStatus: string;

    dateOfBirth: string;
    joinDate: string;

    phoneNo: string;
    altPhone: string;
    email: string;

    // personal information
    birthplace: string;
    hometown: string;
    nationality: string;
    religion: string;
    identification: string;

    departmentId?: string;
    notes: string;
    role: string;
  };

  const getInitialFormState = (): FormState => ({
    employeeNo: "",
    firstName: "",
    lastName: "",

    gender: "",
    prefix: "",
    status: "Active",
    maritalStatus: "",

    dateOfBirth: "",
    joinDate: "",

    phoneNo: "",
    altPhone: "",
    email: "",

    // personal information
    birthplace: "",
    hometown: "",
    nationality: "",
    religion: "",
    identification: "",

    departmentId: undefined,
    notes: "",
    role: "",
  });

  const [form, setForm] = useState<FormState>(getInitialFormState);

  // Load employee data
  useEffect(() => {
    if (!emp) return;

    setForm({
      employeeNo: emp.employeeNo ?? "",
      firstName: emp.firstName ?? "",
      lastName: emp.lastName ?? "",

      gender: emp.gender ?? "",
      prefix: emp.prefix ?? "",
      status: emp.status ?? "Active",
      maritalStatus: emp.maritalStatus ?? "",

      dateOfBirth: emp.dateOfBirth ?? "",
      joinDate: emp.joinDate ?? "",

      phoneNo: emp.phoneNo ?? "",
      altPhone: emp.altPhone ?? "",
      email: emp.email ?? "",

      // personal information
      birthplace: emp.birthplace ?? "",
      hometown: emp.hometown ?? "",
      nationality: emp.nationality ?? "",
      religion: emp.religion ?? "",
      identification: emp.identification ?? "",

      departmentId: emp.departmentId ?? undefined,
      notes: emp.notes ?? "",
      role: emp.role ?? "",
    });
  }, [emp]);

  // Load contact info
  useEffect(() => {
    const employeeId = id ? Number(id) : undefined;
    if (!employeeId) return;
    apiClient.get(`/employees/${employeeId}/contact-info`).then((res) => {
      setForm((f) => ({
        ...f,
        email: res.data.email ?? "",
        phone: res.data.phone ?? "",
        altPhone: res.data.altPhone ?? "",
        notes: res.data.notes ?? "",
      }));
    });
  }, [id]);

  if (!emp) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          Employee not found.
        </div>
        <Link
          to="/hr/employees"
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-gray-50"
        >
          ← Back to Search
        </Link>
      </div>
    );
  }

  if (accessDenied) {
    return (
      <div className="space-y-4">
        <div className="rounded-md border border-red-200 bg-red-50 p-4 text-red-700">
          Access denied. You do not have permission to view this employee.
        </div>
        <Link
          to="/hr/employees"
          className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-gray-50"
        >
          ← Back to Employees
        </Link>
      </div>
    );
  }

  const onChange =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const raw = e.target.value;
      if (key === "departmentId") {
        setForm((s) => ({ ...s, departmentId: raw === "" ? undefined : raw }));
      } else {
        setForm((s) => ({ ...s, [key]: raw }) as any);
      }
    };

  const onSave = async () => {
    // Check edit permission
    const moduleKey = "employee_profile";
    const caps = permissions ? (permissions as any)[moduleKey] : null;
    const canEdit = permissions === null || (caps?.edit ?? false);

    if (!canEdit) {
      toast.error("You don't have permission to edit this employee.");
      setEditing(false);
      return;
    }

    try {
      // Only admin can update the role field
      const payload: any = {
        employeeNo: form.employeeNo,
        firstName: form.firstName,
        lastName: form.lastName,

        gender: form.gender || null,
        prefix: form.prefix || null,
        status: form.status || null,
        maritalStatus: form.maritalStatus || null,

        dateOfBirth: form.dateOfBirth || null,
        joinDate: form.joinDate || null,

        // personal information
        birthplace: form.birthplace || null,
        hometown: form.hometown || null,
        nationality: form.nationality || null,
        religion: form.religion || null,
        identification: form.identification || null,
      };

      // Only include role in payload if current user is admin
      if (isAdmin && form.role) {
        payload.role = form.role;
      }
      const idNum = emp?.id ? Number(emp.id) : undefined;
      if (!idNum) {
        toast.error("Invalid employee id");
        return;
      }

      toast.info("Saving employee...");
      const updated = await hrService.updateEmployee(idNum, payload as any);

      try {
        const fresh = await hrService.getEmployee(idNum);
        if (fresh) {
          setEmp(fresh as Employee);
          setForm({
            employeeNo: fresh.employeeNo ?? "",
            firstName: fresh.firstName ?? "",
            lastName: fresh.lastName ?? "",

            gender: fresh.gender ?? "",
            prefix: fresh.prefix ?? "",
            status: fresh.status ?? "Active",
            maritalStatus: fresh.maritalStatus ?? "",

            dateOfBirth: fresh.dateOfBirth ?? "",
            joinDate: fresh.joinDate ?? "",

            phoneNo: fresh.phoneNo ?? "",
            altPhone: fresh.altPhone ?? "",
            email: fresh.email ?? "",

            // personal information
            birthplace: fresh.birthplace ?? "",
            hometown: fresh.hometown ?? "",
            nationality: fresh.nationality ?? "",
            religion: fresh.religion ?? "",
            identification: fresh.identification ?? "",

            departmentId: fresh.departmentId ?? undefined,
            notes: fresh.notes ?? "",
            role: fresh.role ?? "",
          });
        } else {
          setEmp(updated as Employee);
        }
      } catch (e) {
        console.warn(
          "Failed to refetch employee after update, falling back to API response",
          e,
        );
        setEmp(updated as Employee);
      }

      toast.success("Employee updated");
      try {
        window.dispatchEvent(
          new CustomEvent("employee:updated", { detail: updated }),
        );
      } catch (e) {
        console.warn("Could not dispatch employee:updated event", e);
      }
    } catch (err: any) {
      console.error(
        "EmployeeProfilePage -> update failed:",
        err?.response?.data ?? err,
      );
      toast.error(
        err?.response?.data?.message ||
          err?.message ||
          "Failed to update employee",
      );

      alert("Failed to update employee");
    } finally {
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setForm({
      employeeNo: emp.employeeNo ?? "",
      firstName: emp.firstName ?? "",
      lastName: emp.lastName ?? "",

      gender: emp.gender ?? "",
      prefix: emp.prefix ?? "",
      status: emp.status ?? "Active",
      maritalStatus: emp.maritalStatus ?? "",

      dateOfBirth: emp.dateOfBirth ?? "",
      joinDate: emp.joinDate ?? "",

      phoneNo: emp.phoneNo ?? "",
      altPhone: emp.altPhone ?? "",
      email: emp.email ?? "",

      // personal information
      birthplace: emp.birthplace ?? "",
      hometown: emp.hometown ?? "",
      nationality: emp.nationality ?? "",
      religion: emp.religion ?? "",
      identification: emp.identification ?? "",

      departmentId: emp.departmentId ?? undefined,
      notes: emp.notes ?? "",
      role: emp.role ?? "",
    });
    setEditing(false);
  };

  const moduleKey = "employee_profile";
  const caps = effectivePermissions ? (effectivePermissions as any)[moduleKey] : null;
  const canEdit = effectivePermissions === null || (caps?.edit ?? false);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border">
        <div className="flex items-center justify-between rounded-t-lg bg-blue-600 px-5 py-3 text-white">
          <div className="flex flex-wrap items-center gap-2 text-lg font-semibold">
            <span className="inline-flex h-6 w-6 items-center justify-center rounded bg-white text-blue-600">
              👤
            </span>
            <span>
              Employee Profile — {emp.firstName} {emp.lastName}{" "}
              <span className="opacity-90">({emp.employeeNo})</span>
            </span>
            <span className="ml-2 inline-flex items-center rounded-full bg-white/90 px-2 py-0.5 text-xs font-medium text-blue-700">
              {form.status}
            </span>
          </div>

          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleCancel}
                  className="h-9 rounded-md bg-white px-3 text-sm font-medium text-blue-700 hover:bg-white/90"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={onSave}
                  className="h-9 rounded-md bg-white px-3 text-sm font-medium text-blue-700 hover:bg-white/90"
                >
                  Save
                </button>
              </>
            ) : (
              canEdit ? (
                <button
                  onClick={() => setEditing(true)}
                  className="h-9 rounded-md bg-white px-3 text-sm font-medium text-blue-700 hover:bg-white/90"
                >
                  Edit / Update
                </button>
              ) : null
            )}
          </div>
        </div>

        <div className="rounded-b-lg bg-white p-5">
          <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 mb-6">
            <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              Personal Information
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              Basic employee details and contact information
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Field label="Employee No">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.employeeNo as string}
                onChange={onChange("employeeNo")}
                disabled={!editing}
              />
            </Field>

            <Field label="Status">
              <select
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.status as string}
                onChange={onChange("status")}
                disabled={!editing}
              >
                <option>Active</option>
                <option>Inactive</option>
                <option>On Leave</option>
              </select>
            </Field>

            <Field label="First Name">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.firstName as string}
                onChange={onChange("firstName")}
                disabled={!editing}
              />
            </Field>

            <Field label="Last Name">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.lastName as string}
                onChange={onChange("lastName")}
                disabled={!editing}
              />
            </Field>

            <Field label="Gender">
              <select
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.gender ?? ""}
                onChange={onChange("gender")}
                disabled={!editing}
              >
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
            </Field>

            <Field label="Prefix">
              <select
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.prefix ?? ""}
                onChange={onChange("prefix")}
                disabled={!editing}
              >
                <option value="">Select</option>
                <option value="Mr.">Mr.</option>
                <option value="Ms.">Ms.</option>
              </select>
            </Field>

            <Field label="Marital Status">
              <select
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.maritalStatus ?? ""}
                onChange={onChange("maritalStatus")}
                disabled={!editing}
              >
                <option value="">Select</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
              </select>
            </Field>

            <Field label="Date of Birth">
              <input
                type="date"
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.dateOfBirth ?? ""}
                onChange={onChange("dateOfBirth")}
                disabled={!editing}
              />
            </Field>

            <Field label="Join Date">
              <input
                type="date"
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.joinDate ?? ""}
                onChange={onChange("joinDate")}
                disabled={!editing}
              />
            </Field>

            <Field label="Birthplace">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.birthplace}
                onChange={onChange("birthplace")}
                disabled={!editing}
                placeholder="Enter birthplace"
              />
            </Field>

            <Field label="Hometown">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.hometown}
                onChange={onChange("hometown")}
                disabled={!editing}
                placeholder="Enter hometown"
              />
            </Field>

            <Field label="Nationality">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.nationality}
                onChange={onChange("nationality")}
                disabled={!editing}
                placeholder="Enter nationality"
              />
            </Field>

            <Field label="Religion">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.religion}
                onChange={onChange("religion")}
                disabled={!editing}
                placeholder="Enter religion"
              />
            </Field>

            <Field label="Identification">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.identification}
                onChange={onChange("identification")}
                disabled={!editing}
                placeholder="Enter ID number"
              />
            </Field>

            <Field label="Department ID">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={String(form.departmentId ?? "")}
                onChange={onChange("departmentId")}
                disabled={!editing}
              />
            </Field>

            <Field label="Role">
              {isAdmin ? (
                <select
                  className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                  value={form.role || ""}
                  onChange={onChange("role")}
                  disabled={!editing}
                >
                  <option value="">Select Role</option>
                  <option value="ADMIN">Admin</option>
                  <option value="HR">HR</option>
                  <option value="USER">User</option>
                  <option value="FINANCE_MANAGER">Finance Manager</option>
                  <option value="ACCOUNTANT">Accountant</option>
                  <option value="CASHIER">Cashier</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              ) : (
                <input
                  className="h-9 w-full rounded-md border px-3 text-sm bg-gray-50"
                  value={form.role || "N/A"}
                  disabled
                />
              )}
            </Field>

            <Field label="Notes" className="lg:col-span-2">
              <input
                className="h-9 w-full rounded-md border px-3 text-sm outline-none focus:ring-2 focus:ring-blue-600"
                value={form.notes as string}
                onChange={onChange("notes")}
                disabled={!editing}
              />
            </Field>
          </div>

          <div className="col-span-1 md:col-span-2 mt-6">
            {id && !isNaN(Number(id)) && <DependentsForm />}
          </div>

          <div className="mt-6">
            <button
              onClick={() => navigate("/hr/employees")}
              className="inline-flex h-9 items-center rounded-md border px-3 text-sm hover:bg-gray-50"
              type="button"
            >
              ← Back to Search
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`grid grid-cols-[140px_1fr] items-center gap-3 ${className || ""}`}>
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
    </div>
  );
}
