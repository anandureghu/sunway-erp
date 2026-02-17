import { useState, useCallback, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { FormRow, FormField } from "@/modules/hr/components/form-components";
import { User, Upload, Camera, Calendar, Briefcase } from "lucide-react";

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
  const [imageHover, setImageHover] = useState(false);
  const [, setPendingFile] = useState<File | null>(null);


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
          const merged = { ...NEW_EMP, ...emp, photoUrl: (emp as any).imageUrl, status: fromBackendStatus((emp as any).status) } as EmpProfile;
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
        imageUrl: updated.photoUrl || null,
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
  }, [draft, persistChanges]);

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

  const uploadImage = async (file: File, employeeId?: number): Promise<string> => {
    try {
      const { hrService } = await import("@/service/hr.service");
      if (employeeId) {
        return hrService.uploadImage(employeeId, file);
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

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case "Active":
        return "bg-emerald-100 text-emerald-700 border-emerald-200";
      case "On Leave":
        return "bg-amber-100 text-amber-700 border-amber-200";
      case "Inactive":
        return "bg-slate-100 text-slate-700 border-slate-200";
      default:
        return "bg-slate-100 text-slate-700 border-slate-200";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card with Photo */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-blue-600 h-24"></div>
        <div className="px-8 pb-8">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-12">
            {/* Profile Photo */}
            <div className="relative">
              <div
                className={`relative w-28 h-28 rounded-xl border-4 border-white shadow-md bg-slate-100 overflow-hidden transition-all duration-200 ${
                  imageHover ? "shadow-lg" : ""
                }`}
                onMouseEnter={() => setImageHover(true)}
                onMouseLeave={() => setImageHover(false)}
              >
                {draft.photoUrl ? (
                  <img
                    src={draft.photoUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="h-12 w-12 text-slate-400" />
                  </div>
                )}
                
                {/* Hover Overlay */}
                <div
                  className={`absolute inset-0 bg-slate-900/60 flex items-center justify-center transition-opacity duration-200 cursor-pointer ${
                    imageHover ? "opacity-100" : "opacity-0"
                  }`}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-6 w-6 text-white" />
                </div>
              </div>
              
              {/* Upload Button Badge */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-lg shadow-md transition-all duration-200"
              >
                <Upload className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Employee Info */}
            <div className="flex-1">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-slate-800">
                    {draft.prefix && `${draft.prefix} `}
                    {draft.firstName || "New"} {draft.lastName || "Employee"}
                  </h2>
                  <p className="text-slate-600 mt-1 text-sm">
                    {draft.employeeNo || "Employee Number Not Assigned"}
                  </p>
                </div>
                
                {/* Status Badge */}
                <div className={`px-3 py-1.5 rounded-lg border font-medium text-sm ${getStatusBadge(draft.status)}`}>
                  {draft.status || "Active"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Personal Information Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <User className="h-5 w-5 text-slate-600" />
            Personal Information
          </h3>
          <p className="text-sm text-slate-500 mt-1">Basic employee details and identification</p>
        </div>

        <div className="p-6">
          <FormRow columns={3}>
            <FormField label="Employee No">
              <div className="relative">
                <Input
                  disabled
                  value={draft.employeeNo}
                  readOnly
                  className="pl-10 bg-slate-50 font-mono"
                />
                <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              </div>
            </FormField>

            <FormField label="Prefix">
              <select
                disabled={!editing}
                value={draft.prefix}
                onChange={(e) => set("prefix", e.target.value as Prefix)}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
              >
                <option value="">Select prefix</option>
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Miss">Miss</option>
                <option value="Dr.">Dr.</option>
              </select>
            </FormField>

            <FormField label="First Name" required>
              <Input
                disabled={!editing}
                value={draft.firstName}
                onChange={(e) => set("firstName", e.target.value)}
                placeholder="Enter first name"
                required
                className="focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
              />
            </FormField>

            <FormField label="Last Name" required>
              <Input
                disabled={!editing}
                value={draft.lastName}
                onChange={(e) => set("lastName", e.target.value)}
                placeholder="Enter last name"
                required
                className="focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
              />
            </FormField>

            <FormField label="Date of Birth">
              <div className="relative">
                <Input
                  type="date"
                  disabled={!editing}
                  value={draft.dateOfBirth}
                  onChange={(e) => set("dateOfBirth", e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </FormField>

            <FormField label="Gender">
              <select
                disabled={!editing}
                value={draft.gender}
                onChange={(e) => set("gender", e.target.value as EmpProfile["gender"])}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
              >
                <option value="">Select gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </FormField>

            <FormField label="Marital Status">
              <select
                disabled={!editing}
                value={draft.maritalStatus ?? ""}
                onChange={(e) => set("maritalStatus", e.target.value as EmpProfile["maritalStatus"])}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
              >
                <option value="">Select status</option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Divorced">Divorced</option>
                <option value="Widowed">Widowed</option>
              </select>
            </FormField>

            <FormField label="Join Date">
              <div className="relative">
                <Input
                  type="date"
                  disabled={!editing}
                  value={draft.joinDate}
                  onChange={(e) => set("joinDate", e.target.value)}
                  className="pl-10 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
                />
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              </div>
            </FormField>

            <FormField label="Employment Status">
              <select
                disabled={!editing}
                value={draft.status ?? "Active"}
                onChange={(e) => set("status", e.target.value as EmpProfile["status"])}
                className="h-10 w-full rounded-lg border border-slate-200 px-3 text-sm bg-white disabled:bg-slate-50 disabled:text-slate-500 focus:ring-2 focus:ring-slate-400 focus:border-transparent transition-all"
              >
                <option value="Active">Active</option>
                <option value="On Leave">On Leave</option>
                <option value="Inactive">Inactive</option>
              </select>
            </FormField>
          </FormRow>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file) {
            if (id) {
              // Existing employee: upload immediately
              const url = await uploadImage(file, Number(id));
              set("photoUrl", url);
              setSaved(prev => ({ ...prev, photoUrl: url })); // Update saved state too
              toast.success("Photo uploaded successfully!");
            } else {
              // New employee: store file for later upload
              setPendingFile(file);
              const url = await uploadImage(file); // dataURL for preview
              set("photoUrl", url);
              toast.success("Photo selected successfully!");
            }
          }
        }}
      />
    </div>
  );
}