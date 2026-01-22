import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";

type Prefix = "" | "Mr." | "Mrs." | "Ms." | "Miss" | "Dr.";

type EmpProfile = {
  employeeNo: string;
  prefix: Prefix;
  firstName: string;
  lastName: string;
  photoUrl?: string;
  joinDate: string;
  dateOfBirth: string;
  gender: "Male" | "Female" | "Other" | "";
  maritalStatus?: "Single" | "Married" | "Divorced" | "Widowed" | "";
  status?: string;
};

const NEW_EMP: EmpProfile = {
  employeeNo: "",
  prefix: "",
  firstName: "",
  lastName: "",
  joinDate: "",
  dateOfBirth: "",
  gender: "",
  maritalStatus: "",
  status: "Active",
};

export default function EmployeeProfileForm() {
  const { id } = useParams<{ id: string }>();
  const isNew = !id;

  const [editing, setEditing] = useState<boolean>(isNew);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [saved, setSaved] = useState<EmpProfile>(NEW_EMP);
  const [draft, setDraft] = useState<EmpProfile>(NEW_EMP);

  const set = useCallback(
    <K extends keyof EmpProfile>(k: K, v: EmpProfile[K]) =>
      setDraft((d) => ({ ...d, [k]: v })),
    []
  );

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!id) return;
      try {
        const emp = await import("@/service/hr.service").then((m) => m.hrService.getEmployee(id));
        if (!mounted) return;
        if (emp) {
          const fromBackendStatus = (s?: string | null) => {
            if (!s) return NEW_EMP.status;
            const up = String(s).toUpperCase();
            if (up === "ACTIVE") return "Active";
            if (up === "INACTIVE") return "Inactive";
            if (up === "ON_LEAVE") return "On Leave";
            return String(s);
          };
          const merged = { ...NEW_EMP, ...emp, status: fromBackendStatus((emp as any).status) } as EmpProfile;
          setSaved(merged);
          setDraft(merged);
          setEditing(false);
        }
      } catch (err) {
        console.error("Failed to load employee:", err);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  const persistChanges = useCallback(
    async (updated: EmpProfile) => {
      const toBackendStatus = (s?: string | null) => {
        if (!s) return null;
        const low = String(s).toLowerCase();
        if (low === "active") return "ACTIVE";
        if (low === "inactive") return "INACTIVE";
        if (low === "on leave" || low === "on_leave" || low === "on-leave") return "ON_LEAVE";
        return String(s).toUpperCase();
      };

      const statusVal = toBackendStatus(updated.status ?? null);

      const payload: any = {
        employeeNo: updated.employeeNo,
        firstName: updated.firstName,
        lastName: updated.lastName,

        gender: updated.gender || null,
        prefix: updated.prefix || null,
        maritalStatus: updated.maritalStatus || null,

        dateOfBirth: updated.dateOfBirth || null,
        joinDate: updated.joinDate || null,
      };

      if (statusVal != null) payload.status = statusVal;

      try {
        const { hrService } = await import("@/service/hr.service");
        let createdResult: any = null;
        if (id) {
          await hrService.updateEmployee(Number(id), payload);
          toast.success("Employee profile updated successfully!");
        } else {
          createdResult = await hrService.createEmployee(payload);
          toast.success("Employee created successfully!");
        }
        return createdResult;
      } catch (err) {
        console.error("Failed to persist employee changes to server:", err);
        toast.error("Failed to save employee profile. Please try again.");
        throw err;
      }
    },
    [id]
  );

  const handleSave = useCallback(async () => {
    try {
      const created = await persistChanges(draft);
      setSaved(draft);
      setEditing(false);
      // if created and returned id, you might want to navigate or set state
      if (created && created.id) {
        // set id-based behaviors can be added here
      }
    } catch {
      // errors are handled inside persistChanges via toast
    }
  }, [draft]);

  const handleCancel = useCallback(() => {
    setDraft(saved);
    setEditing(false);
  }, [saved]);


  // Listen for shell-level edit/save/cancel events so the top Edit/Update button controls this form
  useEffect(() => {
    const onEdit = () => {
      setDraft(saved);
      setEditing(true);
    };
    const onSave = () => {
      void handleSave();
    };
    const onCancel = () => {
      handleCancel();
    };

    document.addEventListener("profile:edit", onEdit);
    document.addEventListener("profile:save", onSave);
    document.addEventListener("profile:cancel", onCancel);

    return () => {
      document.removeEventListener("profile:edit", onEdit);
      document.removeEventListener("profile:save", onSave);
      document.removeEventListener("profile:cancel", onCancel);
    };
  }, [saved, handleSave, handleCancel]);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      const { hrService } = await import("@/service/hr.service");
      if (id) {
        return hrService.uploadImage(Number(id), file);
      }
      // fallback to dataURL for preview when no id yet
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    } catch (err) {
      console.error("Failed to upload image:", err);
      // fallback
      return await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200">
          {/* Modern Header with Gradient */}
          <div className="relative bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-transparent"></div>
              <div className="relative flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">Employee Profile</h1>
                <p className="text-blue-100">Manage personal and employment information</p>
              </div>
              {/* Edit/Update control moved to the Profile shell; form listens for shell events */}
            </div>
          </div>

          <div className="p-8 space-y-8">
            {/* Avatar Section - Enhanced */}
            <div className="relative bg-gradient-to-br from-slate-50 via-white to-blue-50 rounded-2xl p-8 border-2 border-blue-100 shadow-sm">
              <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="relative group">
                  <div className={`h-32 w-32 rounded-2xl overflow-hidden flex items-center justify-center text-white text-3xl font-bold shadow-xl ring-4 ring-white ${draft.photoUrl ? "bg-transparent" : "bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600"}`}>
                    {draft.photoUrl ? (
                      <img src={draft.photoUrl} alt={`${draft.firstName} ${draft.lastName}`} className="h-full w-full object-cover" />
                    ) : (
                      <span>{`${(draft.firstName?.[0] ?? "?")}${(draft.lastName?.[0] ?? "")}`.toUpperCase()}</span>
                    )}
                  </div>
                  {editing && (
                    <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                      <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 text-center md:text-left">
                  <div className="text-2xl font-bold text-slate-800 mb-1">
                    {`${draft.prefix ? `${draft.prefix} ` : ""}${draft.firstName} ${draft.lastName}`.trim()}
                  </div>
                  <div className="text-sm text-slate-500 mb-3">Employee #{draft.employeeNo}</div>

                  <div
                    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wide shadow-sm ${
                      (draft.status ?? "Active").toLowerCase().includes("active")
                        ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                        : (draft.status ?? "").toLowerCase().includes("leave")
                        ? "bg-amber-100 text-amber-700 border border-amber-200"
                        : "bg-red-100 text-red-700 border border-red-200"
                    }`}
                  >
                    <span className={`h-2 w-2 rounded-full ${
                      (draft.status ?? "Active").toLowerCase().includes("active")
                        ? "bg-emerald-500"
                        : (draft.status ?? "").toLowerCase().includes("leave")
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`} />
                    <span>{draft.status ?? "Active"}</span>
                  </div>
                </div>

                <div className={`flex flex-col gap-3 ${editing ? "" : "opacity-50 pointer-events-none"}`}>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                    Upload Photo
                  </button>

                  {draft.photoUrl && (
                    <button
                      type="button"
                      onClick={() => set("photoUrl", "")}
                      className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all duration-200 flex items-center gap-2"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Remove
                    </button>
                  )}

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const url = await uploadImage(file);
                        set("photoUrl", url);
                      }
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Personal Information - Enhanced */}
            <div className="rounded-2xl p-8 border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm">
              <div className="mb-6 flex items-center gap-3 pb-4 border-b-2 border-blue-100">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <h2 className="text-xl font-bold text-slate-800">Personal Information</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                    </svg>
                    Employee No
                  </label>
                  <input value={draft.employeeNo} disabled readOnly className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm bg-slate-100 font-semibold" />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    Gender
                  </label>
                  <select
                    disabled={!editing}
                    className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={draft.gender}
                    onChange={(e) => set("gender", e.target.value as EmpProfile["gender"])}
                  >
                    <option value="" hidden>Select…</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Status
                  </label>
                  <select
                    disabled={!editing}
                    className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all font-semibold"
                    value={draft.status ?? "Active"}
                    onChange={(e) => set("status", e.target.value as EmpProfile["status"])}
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                    </svg>
                    Prefix
                  </label>
                  <select
                    disabled={!editing}
                    className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={draft.prefix}
                    onChange={(e) => set("prefix", e.target.value as EmpProfile["prefix"])}
                  >
                    <option value="">Select…</option>
                    <option value="Mr.">Mr.</option>
                    <option value="Mrs.">Mrs.</option>
                    <option value="Ms.">Ms.</option>
                    <option value="Miss">Miss</option>
                    <option value="Dr.">Dr.</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    First Name
                  </label>
                  <input
                    value={draft.firstName}
                    disabled={!editing}
                    onChange={(e) => set("firstName", e.target.value)}
                    placeholder="Enter first name"
                    className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Last Name
                  </label>
                  <input
                    value={draft.lastName}
                    disabled={!editing}
                    onChange={(e) => set("lastName", e.target.value)}
                    placeholder="Enter last name"
                    className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={draft.dateOfBirth}
                    disabled={!editing}
                    onChange={(e) => set("dateOfBirth", e.target.value)}
                    className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Marital Status
                  </label>
                  <select
                    disabled={!editing}
                    className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                    value={draft.maritalStatus ?? ""}
                    onChange={(e) => set("maritalStatus", e.target.value as EmpProfile["maritalStatus"])}
                  >
                    <option value="" hidden>Select…</option>
                    <option value="Single">Single</option>
                    <option value="Married">Married</option>
                    <option value="Divorced">Divorced</option>
                    <option value="Widowed">Widowed</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wide text-slate-600 flex items-center gap-2">
                    <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    Join Date
                  </label>
                  <input
                    type="date"
                    value={draft.joinDate}
                    disabled={!editing}
                    onChange={(e) => set("joinDate", e.target.value)}
                    className="h-10 w-full rounded-lg border-2 border-slate-200 px-3 text-sm disabled:bg-slate-100 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}